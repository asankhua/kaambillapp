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
});
