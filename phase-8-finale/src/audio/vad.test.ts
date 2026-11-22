import { describe, expect, it } from "vitest";
import { EnergyVad, rmsOf } from "./vad";

const run = (vad: EnergyVad, frames: [number, number][]) =>
  frames.map(([rms, t]) => vad.feed(rms, t)).filter(Boolean);
const quiet = (from: number, to: number, rms = 0.005): [number, number][] =>
  Array.from({ length: (to - from) / 50 }, (_, i) => [rms, from + i * 50]);

describe("EnergyVad", () => {
  it("speech_start, then speech_end after 1.5 s of quiet", () => {
    const v = new EnergyVad();
    const ev = run(v, [...quiet(0, 500), ...quiet(500, 2500, 0.1), ...quiet(2500, 4200)]);
    expect(ev).toEqual(["speech_start", "speech_end"]);
  });
  it("a short pause mid-sentence (< 1.5 s) does not end the turn", () => {
    const v = new EnergyVad();
    const ev = run(v, [
      ...quiet(0, 500),
      ...quiet(500, 1500, 0.1),
      ...quiet(1500, 2500),
      ...quiet(2500, 3000, 0.1),
      ...quiet(3000, 4700),
    ]);
    expect(ev).toEqual(["speech_start", "speech_end"]);
  });
  it("adapts to a noisy room (fan at 0.05): speech must be ~3× louder", () => {
    const v = new EnergyVad();
    const ev = run(v, [
      ...quiet(0, 500, 0.05),
      ...quiet(500, 1500, 0.08),
      ...quiet(1500, 2500, 0.2),
    ]);
    expect(ev).toEqual(["speech_start"]);
  });
  it("no_speech after the timeout if nobody talks", () => {
    const v = new EnergyVad({ noSpeechTimeoutMs: 2000 });
    expect(run(v, quiet(0, 2500))).toEqual(["no_speech"]);
  });
  it("rmsOf: silence 0, full-scale ~1", () => {
    expect(rmsOf(new Uint8Array(64).fill(128))).toBe(0);
    expect(rmsOf(Uint8Array.from({ length: 64 }, (_, i) => (i % 2 ? 0 : 255)))).toBeGreaterThan(
      0.95,
    );
  });
});
