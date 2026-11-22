import type Groq from "groq-sdk";
import {
  APIConnectionError,
  APIConnectionTimeoutError,
  BadRequestError,
  InternalServerError,
  RateLimitError,
} from "groq-sdk";
import { z } from "zod";

/**
 * Domain-agnostic structured extraction on Groq (strict JSON schema). KaamBill's /api/extract
 * and any new-domain endpoint use this; a new brief only supplies a Zod schema + prompts.
 *  - main model, ONE retry on the fallback model for 429 / timeout / 5xx
 *  - Groq 400 `json_validate_failed` → retry once, then `unknown()`
 *  - truncated / invalid / schema-mismatched output → `unknown()` (never throws for model output)
 */
export type ChatClient = Pick<Groq, "chat">;

export interface StructuredOptions {
  model: string;
  fallbackModel: string;
  reasoningEffort: "low" | "medium" | "high";
  maxTokens: number;
  timeoutMs: number;
}

export interface StructuredResult<T> {
  value: T;
  model: string;
  usedFallback: boolean;
  latencyMs: number;
  usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null;
  failure?: "truncated" | "invalid_json" | "schema_mismatch" | "empty";
}

/** JSON Schema for Groq strict mode from a Zod schema (use z.strictObject + nullable, never optional). */
export function toGroqJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const { $schema: _ignored, ...rest } = z.toJSONSchema(schema) as Record<string, unknown>;
  return rest;
}

/** Seconds Groq asks us to wait after a 429, parsed from its message ("try again in 12.3s"). */
export function retryAfterSeconds(err: unknown): number | null {
  if (!(err instanceof RateLimitError)) return null;
  const header = err.headers?.get?.("retry-after");
  if (header && !Number.isNaN(Number(header))) return Math.ceil(Number(header));
  const m = /try again in ([\d.]+)s/i.exec(err.message);
  return m ? Math.ceil(Number(m[1])) : null;
}

export function isJsonValidateFailed(err: unknown): boolean {
  if (!(err instanceof BadRequestError)) return false;
  const body = err.error as { error?: { code?: string } } | undefined;
  return (
    body?.error?.code === "json_validate_failed" ||
    /json_validate_failed|does not match the expected schema/i.test(err.message)
  );
}

function isRetryable(err: unknown): boolean {
  return (
    err instanceof RateLimitError ||
    err instanceof APIConnectionTimeoutError ||
    err instanceof APIConnectionError ||
    err instanceof InternalServerError
  );
}

/** One structured-extraction request (schema + prompts), independent of the model provider. */
export interface StructuredArgs<S extends z.ZodType> {
  name: string;
  schema: S;
  jsonSchema?: Record<string, unknown>;
  systemPrompt: string;
  userMessage: string;
  /** The "couldn't understand" value returned on bad model output. */
  unknown: () => z.infer<S>;
  /** Optional post-parse clean-up (e.g. clamp confidences). */
  post?: (v: z.infer<S>) => z.infer<S>;
}

/**
 * The LLM provider interface (architecture.md §5.2): anything that can turn prompts into a
 * schema-valid value. GroqProvider is the only implementation; another provider = one new class.
 */
export interface LlmProvider {
  readonly id: string;
  structured<S extends z.ZodType>(args: StructuredArgs<S>): Promise<StructuredResult<z.infer<S>>>;
}

/** Groq implementation: strict json_schema, fallback model, json_validate_failed retry. */
export class GroqProvider implements LlmProvider {
  readonly id = "groq";
  constructor(
    private readonly client: ChatClient,
    private readonly opts: StructuredOptions,
  ) {}
  structured<S extends z.ZodType>(args: StructuredArgs<S>) {
    return structuredCall(this.client, args, this.opts);
  }
}

export async function structuredCall<S extends z.ZodType>(
  client: ChatClient,
  args: StructuredArgs<S>,
  opts: StructuredOptions,
): Promise<StructuredResult<z.infer<S>>> {
  const started = Date.now();
  const jsonSchema = args.jsonSchema ?? toGroqJsonSchema(args.schema);
  const call = (model: string) =>
    client.chat.completions.create(
      {
        model,
        messages: [
          { role: "system" as const, content: args.systemPrompt },
          { role: "user" as const, content: args.userMessage },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: args.name, strict: true, schema: jsonSchema },
        },
        reasoning_effort: opts.reasoningEffort,
        include_reasoning: false,
        temperature: 0,
        max_completion_tokens: opts.maxTokens,
      },
      { timeout: opts.timeoutMs },
    );

  let model = opts.model;
  let usedFallback = false;
  let res: Awaited<ReturnType<typeof call>>;
  try {
    res = await call(model);
  } catch (err) {
    const schemaFail = isJsonValidateFailed(err);
    if (!schemaFail && (!isRetryable(err) || opts.fallbackModel === opts.model)) throw err;
    if (opts.fallbackModel !== opts.model) {
      model = opts.fallbackModel;
      usedFallback = true;
    }
    try {
      res = await call(model);
    } catch (err2) {
      if (isJsonValidateFailed(err2))
        return {
          value: args.unknown(),
          model,
          usedFallback,
          latencyMs: Date.now() - started,
          usage: null,
          failure: "schema_mismatch",
        };
      throw err2;
    }
  }

  const base = { model, usedFallback, latencyMs: Date.now() - started, usage: res.usage ?? null };
  const choice = res.choices[0];
  if (!choice?.message.content) return { ...base, value: args.unknown(), failure: "empty" };
  if (choice.finish_reason === "length")
    return { ...base, value: args.unknown(), failure: "truncated" };
  let json: unknown;
  try {
    json = JSON.parse(choice.message.content);
  } catch {
    return { ...base, value: args.unknown(), failure: "invalid_json" };
  }
  const parsed = args.schema.safeParse(json);
  if (!parsed.success) return { ...base, value: args.unknown(), failure: "schema_mismatch" };
  return { ...base, value: args.post ? args.post(parsed.data) : parsed.data };
}
