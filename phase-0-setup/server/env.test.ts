import { describe, expect, it } from "vitest";
import { describeEnv, getEnv, hasGroqKey } from "./env.js";

const base = { GROQ_API_KEY: "gsk_" + "x".repeat(40) };

describe("server env", () => {
  it("applies defaults from .env.example", () => {
    const env = getEnv(base);
    expect(env.LLM_MODEL).toBe("openai/gpt-oss-120b");
    expect(env.LLM_FALLBACK_MODEL).toBe("openai/gpt-oss-20b");
    expect(env.RATE_LIMIT_PER_MIN).toBe(30);
  });

  it("splits ALLOWED_ORIGINS", () => {
    const env = getEnv({
      ...base,
      ALLOWED_ORIGINS: "http://localhost:5173, https://kaambill.vercel.app",
    });
    expect(env.ALLOWED_ORIGINS).toEqual(["http://localhost:5173", "https://kaambill.vercel.app"]);
  });

  it("starts without GROQ_API_KEY and reports it as not set (the app must run with no secret keys)", () => {
    const env = getEnv({});
    expect(hasGroqKey(env)).toBe(false);
    expect(JSON.stringify(describeEnv(env))).toMatch(/not set/);
    expect(hasGroqKey(getEnv({ GROQ_API_KEY: "your_key_here" }))).toBe(false); // a leftover placeholder
    expect(hasGroqKey(getEnv(base))).toBe(true);
  });

  it("still rejects a malformed setting, naming the variable only", () => {
    expect(() => getEnv({ LLM_REASONING_EFFORT: "extreme" })).toThrow(/LLM_REASONING_EFFORT/);
  });

  it("never exposes the secret in describeEnv", () => {
    const summary = JSON.stringify(describeEnv(getEnv(base)));
    expect(summary).not.toContain(base.GROQ_API_KEY);
  });

  it("ignores variables for removed speech engines left over in an old .env", () => {
    const env = getEnv({
      ...base,
      VOICE_PROVIDER: "sarvam",
      SARVAM_API_KEY: "sk_" + "y".repeat(20),
      GROQ_STT_MODEL: "whisper-large-v3-turbo",
    });
    expect(env.LLM_MODEL).toBe("openai/gpt-oss-120b");
    expect(JSON.stringify(describeEnv(env))).not.toMatch(/sarvam|voiceProvider/i);
  });
});
