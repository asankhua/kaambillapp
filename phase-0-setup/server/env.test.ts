import { describe, expect, it } from "vitest";
import { describeEnv, getEnv } from "./env.js";

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

  it("fails clearly without GROQ_API_KEY, naming the variable only", () => {
    expect(() => getEnv({})).toThrow(/GROQ_API_KEY/);
  });

  it("never exposes the secret in describeEnv", () => {
    const summary = JSON.stringify(describeEnv(getEnv(base)));
    expect(summary).not.toContain(base.GROQ_API_KEY);
  });

  it("defaults the voice provider to groq and treats blank values as unset", () => {
    expect(getEnv(base).VOICE_PROVIDER).toBe("groq");
    const env = getEnv({ ...base, VOICE_PROVIDER: "", SARVAM_API_KEY: "", SARVAM_STT_MODEL: "" });
    expect(env).toMatchObject({
      VOICE_PROVIDER: "groq",
      SARVAM_API_KEY: undefined,
      SARVAM_STT_MODEL: "saaras:v4",
      SARVAM_STT_MODE: "codemix",
    });
  });

  it("accepts VOICE_PROVIDER=sarvam only with SARVAM_API_KEY", () => {
    const key = "sk_" + "y".repeat(20);
    expect(getEnv({ ...base, VOICE_PROVIDER: "sarvam", SARVAM_API_KEY: key }).VOICE_PROVIDER).toBe(
      "sarvam",
    );
    expect(() => getEnv({ ...base, VOICE_PROVIDER: "sarvam" })).toThrow(/SARVAM_API_KEY/);
    expect(() => getEnv({ ...base, VOICE_PROVIDER: "whisper" })).toThrow(/VOICE_PROVIDER/);
  });

  it("never exposes the Sarvam key in describeEnv", () => {
    const key = "sk_" + "z".repeat(20);
    const summary = JSON.stringify(describeEnv(getEnv({ ...base, SARVAM_API_KEY: key })));
    expect(summary).not.toContain(key);
    expect(summary).toContain('"sarvam":"set"');
  });
});
