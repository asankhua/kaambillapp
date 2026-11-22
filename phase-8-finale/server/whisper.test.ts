import { describe, expect, it, vi } from "vitest";
import { confidenceFromSegments, transcribe, type AudioClient } from "./whisper.js";

describe("Groq Whisper wrapper", () => {
  it("sends model, Whisper language code, brand hints as prompt, verbose_json", async () => {
    const create = vi.fn(async (_body: Record<string, unknown>) => ({
      text: " 2 Havells MCB ",
      segments: [{ avg_logprob: -0.1, no_speech_prob: 0.01 }],
    }));
    const r = await transcribe(
      { audio: { transcriptions: { create } } } as unknown as AudioClient,
      new Blob(["x"], { type: "audio/webm" }),
      {
        model: "whisper-large-v3-turbo",
        lang: "en-IN",
        hints: ["Havells MCB", "Finolex wire"],
        timeoutMs: 1000,
      },
    );
    expect(r).toMatchObject({ text: "2 Havells MCB", noSpeech: false });
    expect(r.confidence).toBeCloseTo(0.9, 1);
    expect(create.mock.calls[0]![0]).toMatchObject({
      model: "whisper-large-v3-turbo",
      language: "en",
      prompt: "Havells MCB, Finolex wire",
      response_format: "verbose_json",
      temperature: 0,
    });
  });
  it("treats silence as no speech", async () => {
    const create = vi.fn(async () => ({
      text: "Thank you.",
      segments: [{ avg_logprob: -1.5, no_speech_prob: 0.9 }],
    }));
    const r = await transcribe(
      { audio: { transcriptions: { create } } } as unknown as AudioClient,
      new Blob(["x"]),
      { model: "m", lang: "hi-IN", hints: [], timeoutMs: 1 },
    );
    expect(r).toMatchObject({ text: "", noSpeech: true });
  });
  it("confidence from avg_logprob", () => {
    expect(confidenceFromSegments([{ avg_logprob: 0 }, { avg_logprob: Math.log(0.5) }])).toBe(0.75);
    expect(confidenceFromSegments([])).toBeUndefined();
  });
});
