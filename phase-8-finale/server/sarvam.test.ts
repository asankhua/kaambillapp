import { describe, expect, it, vi } from "vitest";
import { keyterms, SARVAM_STT_URL, SarvamError, transcribeSarvam } from "./sarvam.js";

const base = {
  apiKey: "sk_test_key_123",
  model: "saaras:v4",
  mode: "codemix",
  lang: "hi-IN" as const,
  hints: ["Havells MCB", "Finolex wire"],
  timeoutMs: 1000,
};

const reply = (body: unknown, status = 200) =>
  vi.fn(async (_url: string | URL | Request, _init?: RequestInit) =>
    Response.json(body, { status }),
  );

describe("Sarvam speech-to-text wrapper", () => {
  it("posts the clip with the key header, model, mode, language and key terms", async () => {
    const fetchImpl = reply({ transcript: " 2 Havells MCB, 500 labour ", language_code: "hi-IN" });
    const r = await transcribeSarvam(new Blob(["x"], { type: "audio/webm" }), {
      ...base,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(r).toEqual({ text: "2 Havells MCB, 500 labour", noSpeech: false });

    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe(SARVAM_STT_URL);
    expect(init?.method).toBe("POST");
    expect(init?.headers).toEqual({ "api-subscription-key": "sk_test_key_123" });
    const form = init?.body as FormData;
    expect(form.get("model")).toBe("saaras:v4");
    expect(form.get("mode")).toBe("codemix");
    expect(form.get("language_code")).toBe("hi-IN");
    expect(JSON.parse(String(form.get("keyterms")))).toEqual(["Havells MCB", "Finolex wire"]);
    expect((form.get("file") as File).name).toBe("turn.webm");
  });

  it("maps English to en-IN and skips key terms for models that don't support them", async () => {
    const fetchImpl = reply({ transcript: "two MCB" });
    await transcribeSarvam(new Blob(["x"], { type: "audio/mp4" }), {
      ...base,
      model: "saaras:v3",
      lang: "en-IN",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const form = fetchImpl.mock.calls[0]![1]?.body as FormData;
    expect(form.get("language_code")).toBe("en-IN");
    expect(form.has("keyterms")).toBe(false);
    expect((form.get("file") as File).name).toBe("turn.m4a");
  });

  it("sends the file type without codec parameters (Sarvam rejects audio/webm;codecs=opus)", async () => {
    const fetchImpl = reply({ transcript: "ok" });
    await transcribeSarvam(new Blob(["x"], { type: "audio/webm;codecs=opus" }), {
      ...base,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    const form = fetchImpl.mock.calls[0]![1]?.body as FormData;
    expect((form.get("file") as File).type).toBe("audio/webm");
    expect((form.get("file") as File).name).toBe("turn.webm");
  });

  it("treats an empty transcript as no speech", async () => {
    const r = await transcribeSarvam(new Blob(["x"]), {
      ...base,
      fetchImpl: reply({ transcript: "  " }) as unknown as typeof fetch,
    });
    expect(r).toEqual({ text: "", noSpeech: true });
  });

  it("throws SarvamError with the status and code on failure (never the key)", async () => {
    const fetchImpl = reply(
      { error: { code: "rate_limit_exceeded_error", message: "slow down" } },
      429,
    );
    const err = await transcribeSarvam(new Blob(["x"]), {
      ...base,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(SarvamError);
    expect((err as SarvamError).status).toBe(429);
    expect((err as SarvamError).message).toContain("rate_limit_exceeded_error");
    expect((err as SarvamError).message).not.toContain(base.apiKey);
  });

  it("limits key terms to 50 unique entries of at most 64 characters", () => {
    const many = Array.from({ length: 80 }, (_, i) => `item ${i}`);
    expect(keyterms(many)).toHaveLength(50);
    expect(keyterms(["a", "a", " b ", ""])).toEqual(["a", "b"]);
    expect(keyterms(["x".repeat(100)])[0]).toHaveLength(64);
  });
});
