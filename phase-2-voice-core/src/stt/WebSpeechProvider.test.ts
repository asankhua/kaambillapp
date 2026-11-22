import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WebSpeechProvider, type SpeechRecognitionLike } from "./WebSpeechProvider";

class FakeRecognition implements SpeechRecognitionLike {
  static last: FakeRecognition;
  lang = "";
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;
  onresult: SpeechRecognitionLike["onresult"] = null;
  onerror: SpeechRecognitionLike["onerror"] = null;
  onend: SpeechRecognitionLike["onend"] = null;
  started = false;
  stopped = false;
  constructor() {
    FakeRecognition.last = this;
  }
  start() {
    this.started = true;
  }
  stop() {
    this.stopped = true;
  }
  abort() {
    this.stopped = true;
  }
  emit(parts: [string, boolean, number?][]) {
    const results = parts.map(([t, isFinal, c]) =>
      Object.assign([{ transcript: t, confidence: c ?? 0.9 }], { isFinal }),
    );
    this.onresult?.({ results: Object.assign(results, { length: results.length }) } as never);
  }
}

const cb = () => ({ onPartial: vi.fn(), onFinal: vi.fn(), onError: vi.fn() });

describe("WebSpeechProvider", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("configures hi-IN continuous interim recognition", () => {
    new WebSpeechProvider(4000, FakeRecognition).start("hi-IN", cb());
    expect(FakeRecognition.last).toMatchObject({
      lang: "hi-IN",
      continuous: true,
      interimResults: true,
      started: true,
    });
  });

  it("allows pauses between items: ends only after 4 s without new words", () => {
    const c = cb();
    new WebSpeechProvider(4000, FakeRecognition).start("hi-IN", c);
    FakeRecognition.last.emit([["Verma ji ke ghar", false]]);
    expect(c.onPartial).toHaveBeenLastCalledWith("Verma ji ke ghar");
    vi.advanceTimersByTime(3000); // a thinking pause, like between "2 MCB" and "15 meter wire"
    FakeRecognition.last.emit([["Verma ji ke ghar 2 MCB", true, 0.8]]); // still talking: timer resets
    vi.advanceTimersByTime(3900);
    expect(c.onFinal).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(c.onFinal).toHaveBeenCalledWith({
      text: "Verma ji ke ghar 2 MCB",
      source: "stt",
      sttConfidence: 0.8,
    });
  });

  it("when the browser stops by itself after a pause, it restarts and keeps the words (was: closed after 3–4 words)", () => {
    const c = cb();
    new WebSpeechProvider(4000, FakeRecognition).start("hi-IN", c);
    const first = FakeRecognition.last;
    first.emit([["Verma ji ke ghar 2 Havells MCB", true, 0.9]]);
    first.onerror?.({ error: "no-speech" }); // Chrome reports the pause…
    first.onend?.(); // …and ends the session by itself
    expect(c.onFinal).not.toHaveBeenCalled();
    const second = FakeRecognition.last;
    expect(second).not.toBe(first);
    expect(second.started).toBe(true);
    second.emit([["15 meter Finolex wire aur 500 labour", true, 0.7]]);
    expect(c.onPartial).toHaveBeenLastCalledWith(
      "Verma ji ke ghar 2 Havells MCB 15 meter Finolex wire aur 500 labour",
    );
    vi.advanceTimersByTime(4000);
    expect(c.onFinal).toHaveBeenCalledWith({
      text: "Verma ji ke ghar 2 Havells MCB 15 meter Finolex wire aur 500 labour",
      source: "stt",
      sttConfidence: 0.8,
    });
  });

  it("rebuilds the transcript from all results (Android re-sends earlier ones) and ignores 0 confidence", () => {
    const c = cb();
    new WebSpeechProvider(4000, FakeRecognition).start("hi-IN", c);
    FakeRecognition.last.emit([
      ["2 MCB", true, 0],
      ["15 meter wire", false],
    ]);
    FakeRecognition.last.emit([
      ["2 MCB", true, 0],
      ["15 meter wire", true, 0],
    ]);
    vi.advanceTimersByTime(4000);
    expect(c.onFinal).toHaveBeenCalledWith({ text: "2 MCB 15 meter wire", source: "stt" });
  });

  it("waits up to 10 s for the first word, then reports no_speech; mic blocked is reported at once", () => {
    const c1 = cb();
    new WebSpeechProvider(4000, FakeRecognition).start("hi-IN", c1);
    FakeRecognition.last.onerror?.({ error: "not-allowed" });
    expect(c1.onError).toHaveBeenCalledWith("mic_blocked");

    const c2 = cb();
    new WebSpeechProvider(4000, FakeRecognition).start("hi-IN", c2);
    FakeRecognition.last.onend?.(); // browser gave up early: we keep listening
    vi.advanceTimersByTime(9000);
    expect(c2.onError).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1100);
    expect(c2.onError).toHaveBeenCalledWith("no_speech");
  });

  it("a turn never runs longer than the cap", () => {
    const c = cb();
    new WebSpeechProvider(4000, FakeRecognition, 10_000, 30_000).start("hi-IN", c);
    for (let t = 0; t < 40; t++) {
      FakeRecognition.last.emit([[`item ${t}`, false]]);
      vi.advanceTimersByTime(1000);
    }
    expect(c.onFinal).toHaveBeenCalledTimes(1);
  });

  it("reports unsupported when the browser has no Web Speech", () => {
    const c = cb();
    const p = new WebSpeechProvider(1500, undefined);
    expect(p.isSupported()).toBe(false);
    p.start("hi-IN", c);
    expect(c.onError).toHaveBeenCalledWith("unsupported");
  });

  it("stop() aborts without emitting", () => {
    const c = cb();
    const p = new WebSpeechProvider(1500, FakeRecognition);
    p.start("hi-IN", c);
    FakeRecognition.last.emit([["2 MCB", false]]);
    p.stop();
    vi.advanceTimersByTime(3000);
    expect(c.onFinal).not.toHaveBeenCalled();
    expect(FakeRecognition.last.stopped).toBe(true);
  });
});
