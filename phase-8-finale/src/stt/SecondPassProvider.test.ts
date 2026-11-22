import { describe, expect, it, vi } from "vitest";
import type { SttCallbacks, SttProvider } from "../../../phase-2-voice-core/src/stt/SttProvider";
import { SecondPassProvider, type ClipRecorder } from "./SecondPassProvider";

/** Fake primary engine: lets the test fire its final result. */
function primary() {
  let cb: SttCallbacks | null = null;
  const p: SttProvider & { final: (text: string, conf?: number) => void } = {
    id: "webspeech",
    isSupported: () => true,
    stop: vi.fn(),
    setHints: vi.fn(),
    start: (_l, c) => {
      cb = c;
    },
    final: (text, conf) =>
      cb!.onFinal({ text, source: "stt", ...(conf !== undefined ? { sttConfidence: conf } : {}) }),
  };
  return p;
}
const recorder = (blob: Blob | null = new Blob(["audio"]), fail = false): ClipRecorder => ({
  start: fail ? () => Promise.reject(new Error("mic busy")) : () => Promise.resolve(),
  stop: vi.fn(async () => blob),
  cancel: vi.fn(),
});
const flush = () => new Promise((r) => setTimeout(r, 0));
const callbacks = () => ({ onPartial: vi.fn(), onFinal: vi.fn(), onError: vi.fn() });

describe("Whisper second pass (architecture.md §5.1.3)", () => {
  it("confident Web Speech result: no upload, used as is", async () => {
    const p = primary();
    const upload = vi.fn();
    const cb = callbacks();
    const sp = new SecondPassProvider(p, () => recorder(), upload, 0.85);
    sp.start("hi-IN", cb);
    await flush();
    p.final("2 Havells MCB", 0.93);
    await flush();
    expect(upload).not.toHaveBeenCalled();
    expect(cb.onFinal).toHaveBeenCalledWith({
      text: "2 Havells MCB",
      source: "stt",
      sttConfidence: 0.93,
    });
  });

  it("unsure result: the clip goes to Whisper, and Whisper wins when more confident", async () => {
    const p = primary();
    const cb = callbacks();
    const upload = vi.fn(async () => ({ text: "15 meter Finolex wire", confidence: 0.9 }));
    const sp = new SecondPassProvider(p, () => recorder(), upload, 0.85);
    sp.setHints(["Finolex wire"]);
    sp.start("hi-IN", cb);
    await flush();
    p.final("15 meter phenol x wire", 0.6);
    await flush();
    await flush();
    expect(upload).toHaveBeenCalledWith(expect.any(Blob), "hi-IN", ["Finolex wire"]);
    expect(cb.onFinal).toHaveBeenCalledWith({
      text: "15 meter Finolex wire",
      source: "stt",
      sttConfidence: 0.9,
    });
  });

  it("Whisper less confident or failing: keep the Web Speech result", async () => {
    for (const upload of [
      vi.fn(async () => ({ text: "x", confidence: 0.4 })),
      vi.fn(async () => ({ error: "network" as const })),
    ]) {
      const p = primary();
      const cb = callbacks();
      const sp = new SecondPassProvider(p, () => recorder(), upload, 0.85);
      sp.start("hi-IN", cb);
      await flush();
      p.final("15 meter wire", 0.7);
      await flush();
      await flush();
      expect(cb.onFinal).toHaveBeenCalledWith({
        text: "15 meter wire",
        source: "stt",
        sttConfidence: 0.7,
      });
    }
  });

  it("unknown confidence (Android reports 0) is treated as unsure", async () => {
    const p = primary();
    const cb = callbacks();
    const upload = vi.fn(async () => ({ text: "2 MCB", confidence: 0.8 }));
    const sp = new SecondPassProvider(p, () => recorder(), upload, 0.85);
    sp.start("hi-IN", cb);
    await flush();
    p.final("2 MCB");
    await flush();
    await flush();
    expect(upload).toHaveBeenCalled();
  });

  it("mic contention (recording can't start): Web Speech result used, no upload", async () => {
    const p = primary();
    const upload = vi.fn();
    const cb = callbacks();
    const sp = new SecondPassProvider(p, () => recorder(null, true), upload, 0.85);
    sp.start("hi-IN", cb);
    await flush();
    p.final("2 MCB", 0.5);
    await flush();
    expect(upload).not.toHaveBeenCalled();
    expect(cb.onFinal).toHaveBeenCalledWith({ text: "2 MCB", source: "stt", sttConfidence: 0.5 });
  });
});
