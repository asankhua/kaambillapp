import { z } from "zod";
import {
  GroqProvider,
  toGroqJsonSchema,
  type ChatClient,
  type LlmProvider,
  type StructuredOptions,
} from "./structured.js";
import {
  clampExtraction,
  ExtractionSchema,
  unknownExtraction,
  type Extraction,
} from "../../phase-0-setup/src/index.js";
import { EXTRACT_SYSTEM_PROMPT } from "./prompts/extract.system.js";

/** Request body for POST /api/extract (architecture.md §13.2). Caps = abuse protection (§13.4). */
export const ExtractRequestSchema = z.strictObject({
  turn: z.strictObject({
    text: z.string().min(1).max(1000),
    source: z.enum(["stt", "text"]),
    sttConfidence: z.number().min(0).max(1).optional(),
    lang: z.string().max(10).optional(),
  }),
  history: z
    .array(z.strictObject({ text: z.string().max(1000), source: z.enum(["stt", "text"]) }))
    .max(4)
    .default([]),
  catalog: z
    .array(
      z.strictObject({ name: z.string().max(80), aliases: z.array(z.string().max(80)).max(12) }),
    )
    .max(300)
    .default([]),
  draftSummary: z.string().max(2000).nullable().optional(),
  pendingQuestion: z.string().max(300).nullable().optional(),
});
export type ExtractRequest = z.infer<typeof ExtractRequestSchema>;

/** JSON Schema sent to Groq strict mode (generated from the shared Zod schema). */
export const EXTRACTION_JSON_SCHEMA = toGroqJsonSchema(ExtractionSchema);

/** Mask 10-digit Indian phone numbers before logging or sending (privacy, architecture.md §8). */
export function maskPhones(text: string): string {
  return text.replace(/(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/g, "[phone]");
}

/** Per-request context goes in the user message; the system prompt stays fixed. */
export function buildUserMessage(req: ExtractRequest): string {
  const lines: string[] = [];
  if (req.catalog.length) {
    lines.push("Rate card item names (for recognising items; prices are NOT given to you):");
    // Name + first 3 aliases keeps the request small (Groq free tier: 8k tokens/min/model).
    lines.push(
      req.catalog
        .map(
          (c) => `- ${c.name}${c.aliases.length ? ` (${c.aliases.slice(0, 3).join(", ")})` : ""}`,
        )
        .join("\n"),
    );
  }
  if (req.draftSummary) lines.push(`Current draft bill: ${maskPhones(req.draftSummary)}`);
  if (req.history.length)
    lines.push(`Earlier turns:\n${req.history.map((h) => `- "${maskPhones(h.text)}"`).join("\n")}`);
  if (req.pendingQuestion) lines.push(`Pending question the app asked: "${req.pendingQuestion}"`);
  lines.push(`Input: "${maskPhones(req.turn.text)}"`);
  return lines.join("\n\n");
}

export { isJsonValidateFailed, retryAfterSeconds, type ChatClient } from "./structured.js";
export type { StructuredOptions as ExtractOptions } from "./structured.js";

export interface ExtractResult {
  extraction: Extraction;
  model: string;
  usedFallback: boolean;
  latencyMs: number;
  usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null;
  failure?: "truncated" | "invalid_json" | "schema_mismatch" | "empty";
}

/** KaamBill extraction through any LlmProvider (architecture.md §5.2). */
export async function extract(llm: LlmProvider, req: ExtractRequest): Promise<ExtractResult> {
  const lang = (req.turn.lang as Extraction["language"] | undefined) ?? "hi-Latn";
  const { value, ...rest } = await llm.structured({
    name: "extraction",
    schema: ExtractionSchema,
    jsonSchema: EXTRACTION_JSON_SCHEMA,
    systemPrompt: EXTRACT_SYSTEM_PROMPT,
    userMessage: buildUserMessage(req),
    unknown: () => unknownExtraction(lang),
    post: clampExtraction,
  });
  return { extraction: value, ...rest };
}

/** Convenience: extraction on Groq (used by the eval runner and scripts). */
export const extractWithGroq = (client: ChatClient, req: ExtractRequest, opts: StructuredOptions) =>
  extract(new GroqProvider(client, opts), req);
