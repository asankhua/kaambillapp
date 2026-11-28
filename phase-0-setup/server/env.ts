import { z } from "zod";

/**
 * Server-side environment, validated once at startup (architecture.md §13.3).
 * Secrets live only here: never in a VITE_* variable.
 */
const csv = z.string().transform((s) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean),
);

const EnvSchema = z.object({
  // Optional on purpose: the app must start and show its screens without any secret key. Without a
  // key, bill extraction answers "key_not_set" and the app shows a "key not set" message.
  GROQ_API_KEY: z
    .string()
    .default("")
    .transform((v) => v.trim()),
  LLM_MODEL: z.string().default("openai/gpt-oss-120b"),
  LLM_FALLBACK_MODEL: z.string().default("openai/gpt-oss-20b"),
  LLM_REASONING_EFFORT: z.enum(["low", "medium", "high"]).default("low"),
  LLM_MAX_TOKENS: z.coerce.number().int().positive().default(640),
  EXTRACT_TIMEOUT_MS: z.coerce.number().int().positive().default(6000),
  ALLOWED_ORIGINS: csv.default(["http://localhost:5173"]),
  RATE_LIMIT_PER_MIN: z.coerce.number().int().positive().default(30),
  UPSTASH_REDIS_REST_URL: z.string().url().optional().or(z.literal("")),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type ServerEnv = z.infer<typeof EnvSchema>;

let cached: ServerEnv | undefined;

/** Returns the validated env, or throws a readable error naming the bad variables (never their values). */
export function getEnv(source: NodeJS.ProcessEnv = process.env): ServerEnv {
  if (cached && source === process.env) return cached;
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    const problems = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid server environment:\n${problems}\nSee .env.example and architecture.md §13.`,
    );
  }
  if (source === process.env) cached = parsed.data;
  return parsed.data;
}

/** True when a Groq key is configured (a shorter value is treated as a leftover placeholder). */
export function hasGroqKey(env: Pick<ServerEnv, "GROQ_API_KEY">): boolean {
  return env.GROQ_API_KEY.length >= 20;
}

/** Safe summary for logs / health checks: which settings are present, never the secrets. */
export function describeEnv(env: ServerEnv) {
  return {
    groqKey: hasGroqKey(env) ? "set" : "not set (bill extraction shows a 'key not set' message)",
    llmModel: env.LLM_MODEL,
    llmFallbackModel: env.LLM_FALLBACK_MODEL,
    reasoningEffort: env.LLM_REASONING_EFFORT,
    allowedOrigins: env.ALLOWED_ORIGINS,
    rateLimitPerMin: env.RATE_LIMIT_PER_MIN,
    redisRateLimit: env.UPSTASH_REDIS_REST_URL ? "on" : "off (in-memory)",
  };
}
