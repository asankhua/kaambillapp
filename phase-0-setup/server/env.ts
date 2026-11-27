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

/** `VAR=` (empty) in a .env file means "not set": fall back to the default. */
const blankToUndefined = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), schema);

/** Cloud speech-to-text backends behind POST /api/stt. */
export const VOICE_PROVIDERS = ["groq", "sarvam"] as const;
export type VoiceProvider = (typeof VOICE_PROVIDERS)[number];

const EnvSchema = z
  .object({
    GROQ_API_KEY: z
      .string()
      .min(20, "GROQ_API_KEY is missing or too short (get one at console.groq.com/keys)"),
    LLM_MODEL: z.string().default("openai/gpt-oss-120b"),
    LLM_FALLBACK_MODEL: z.string().default("openai/gpt-oss-20b"),
    LLM_REASONING_EFFORT: z.enum(["low", "medium", "high"]).default("low"),
    LLM_MAX_TOKENS: z.coerce.number().int().positive().default(640),
    EXTRACT_TIMEOUT_MS: z.coerce.number().int().positive().default(6000),
    ALLOWED_ORIGINS: csv.default(["http://localhost:5173"]),
    RATE_LIMIT_PER_MIN: z.coerce.number().int().positive().default(30),
    UPSTASH_REDIS_REST_URL: z.string().url().optional().or(z.literal("")),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
    GROQ_STT_MODEL: z.string().default("whisper-large-v3-turbo"),
    // Speech-to-text backend for /api/stt when the request doesn't name one (and for the Whisper second pass).
    VOICE_PROVIDER: blankToUndefined(z.enum(VOICE_PROVIDERS).default("groq")),
    SARVAM_API_KEY: blankToUndefined(z.string().min(10, "SARVAM_API_KEY is too short").optional()),
    SARVAM_STT_MODEL: blankToUndefined(z.string().default("saaras:v4")),
    // codemix keeps English words (brands, units) in English and Hindi in Devanagari.
    SARVAM_STT_MODE: blankToUndefined(
      z.enum(["transcribe", "translate", "verbatim", "translit", "codemix"]).default("codemix"),
    ),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  })
  .refine((e) => e.VOICE_PROVIDER !== "sarvam" || !!e.SARVAM_API_KEY, {
    path: ["SARVAM_API_KEY"],
    message: "SARVAM_API_KEY is required when VOICE_PROVIDER=sarvam",
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

/** Safe summary for logs / health checks: which settings are present, never the secrets. */
export function describeEnv(env: ServerEnv) {
  return {
    groqKey: env.GROQ_API_KEY ? "set" : "missing",
    llmModel: env.LLM_MODEL,
    llmFallbackModel: env.LLM_FALLBACK_MODEL,
    reasoningEffort: env.LLM_REASONING_EFFORT,
    allowedOrigins: env.ALLOWED_ORIGINS,
    rateLimitPerMin: env.RATE_LIMIT_PER_MIN,
    redisRateLimit: env.UPSTASH_REDIS_REST_URL ? "on" : "off (in-memory)",
    voiceProvider: env.VOICE_PROVIDER,
    sarvam: env.SARVAM_API_KEY ? "set" : "not used",
    sarvamModel: env.SARVAM_STT_MODEL,
    sarvamMode: env.SARVAM_STT_MODE,
  };
}
