import Groq from "groq-sdk";
import type { z } from "zod";
import { getEnv, hasGroqKey, type ServerEnv } from "../../phase-0-setup/server/env.js";
import { allowRequest } from "./rate-limit.js";
import {
  GroqProvider,
  retryAfterSeconds,
  type ChatClient,
  type LlmProvider,
  type StructuredOptions,
} from "./structured.js";

/**
 * Builds a protected POST endpoint around a structured-extraction function
 * (origin allowlist, rate limit, Zod-validated request, 429 passthrough, CORS; architecture.md §13.4).
 * KaamBill: api/extract.ts. A new domain: one more file with its own request schema + run().
 */
/** Shared protection for every endpoint: origin allowlist + rate limit (architecture.md §13.4). */
export async function guard(
  request: Request,
  env: ServerEnv,
): Promise<{ origin: string | null } | { reject: Response }> {
  const origin = request.headers.get("origin");
  const isProd = process.env.VERCEL_ENV === "production";
  if (origin ? !isAllowedOrigin(origin, request, env) : isProd)
    return { reject: jsonResponse({ error: "origin_not_allowed" }, 403) };
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const redis = env.UPSTASH_REDIS_REST_URL
    ? { url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN ?? "" }
    : undefined;
  if (!(await allowRequest(ip, env.RATE_LIMIT_PER_MIN, redis)))
    return { reject: jsonResponse({ error: "rate_limited" }, 429, origin) };
  return { origin };
}

/**
 * An origin is allowed when it is on the allowlist, or when it is this server itself (same origin: the
 * page and the API come from the same host and port, e.g. `docker compose up` on http://localhost:3000
 * or any machine's address). A page on another site always has a different Origin, so it stays blocked.
 */
export function isAllowedOrigin(origin: string, request: Request, env: ServerEnv): boolean {
  if (env.ALLOWED_ORIGINS.includes(origin)) return true;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return !!host && new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function jsonResponse(body: unknown, status = 200, origin?: string | null): Response {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
  }
  return new Response(JSON.stringify(body), { status, headers });
}

export function createStructuredHandler<R extends z.ZodType>(def: {
  name: string;
  requestSchema: R;
  /** `llm` is the provider-neutral way in (architecture.md §5.2); `client`/`opts` remain for low-level use. */
  run: (
    req: z.infer<R>,
    client: ChatClient,
    opts: StructuredOptions,
    env: ServerEnv,
    llm: LlmProvider,
  ) => Promise<{ body: unknown; log?: Record<string, unknown> }>;
}) {
  let client: Groq | undefined;
  const json = jsonResponse;

  async function POST(request: Request): Promise<Response> {
    const env = getEnv();
    const g = await guard(request, env);
    if ("reject" in g) return g.reject;
    const { origin } = g;
    // No key: the app still runs; this answer makes it show a "key not set" message.
    if (!hasGroqKey(env)) return json({ error: "key_not_set" }, 503, origin);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json({ error: "invalid_json" }, 400, origin);
    }
    const parsed = def.requestSchema.safeParse(body);
    if (!parsed.success)
      return json(
        { error: "invalid_request", issues: parsed.error.issues.map((i) => i.path.join(".")) },
        400,
        origin,
      );

    client ??= new Groq({
      apiKey: env.GROQ_API_KEY,
      maxRetries: 0,
      timeout: env.EXTRACT_TIMEOUT_MS,
    });
    const opts: StructuredOptions = {
      model: env.LLM_MODEL,
      fallbackModel: env.LLM_FALLBACK_MODEL,
      reasoningEffort: env.LLM_REASONING_EFFORT,
      maxTokens: env.LLM_MAX_TOKENS,
      timeoutMs: env.EXTRACT_TIMEOUT_MS,
    };
    try {
      const { body: out, log } = await def.run(
        parsed.data,
        client,
        opts,
        env,
        new GroqProvider(client, opts),
      );
      console.log(JSON.stringify({ evt: def.name, ...log }));
      return json(out, 200, origin);
    } catch (err) {
      console.error(
        JSON.stringify({
          evt: `${def.name}_error`,
          error: err instanceof Error ? err.name : "unknown",
        }),
      );
      const retryAfter = retryAfterSeconds(err);
      if (retryAfter !== null) return json({ error: "llm_rate_limited", retryAfter }, 429, origin);
      return json({ error: "upstream_unavailable" }, 502, origin);
    }
  }

  function OPTIONS(request: Request): Response {
    const origin = request.headers.get("origin");
    if (!origin || !isAllowedOrigin(origin, request, getEnv()))
      return new Response(null, { status: 403 });
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "600",
        Vary: "Origin",
      },
    });
  }
  return { POST, OPTIONS };
}
