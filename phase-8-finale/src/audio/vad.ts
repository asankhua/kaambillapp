/**
 * Energy-based end-of-speech detector for recorded audio (used by GroqWhisperProvider).
 * Learns the noise floor in the first frames, marks speech when RMS rises well above it,
 * and ends after `silenceMs` of quiet AFTER speech (architecture.md §5.1, 1.5 s).
 */
export interface VadOptions {
  silenceMs?: number;
  /** Absolute minimum RMS that counts as speech (0..1). */
  minSpeechRms?: number;
  /** Speech = RMS > noiseFloor × this. */
  ratio?: number;
  /** Give up if nobody speaks for this long. */
  noSpeechTimeoutMs?: number;
  maxMs?: number;
}

export type VadEvent = "speech_start" | "speech_end" | "no_speech" | "max_length" | null;

export class EnergyVad {
  private floor = 0;
  private frames = 0;
  private speaking = false;
  private heardSpeech = false;
  private lastLoud = 0;
  private started = -1;
  private ended = false;
  private readonly o: Required<VadOptions>;

  constructor(opts: VadOptions = {}) {
    this.o = {
      silenceMs: 1500,
      minSpeechRms: 0.02,
      ratio: 3,
      noSpeechTimeoutMs: 6000,
      maxMs: 30_000,
      ...opts,
    };
  }

  /** Feed one frame's RMS level at time `t` (ms). Returns an event when something changes. */
  feed(rms: number, t: number): VadEvent {
    if (this.started < 0) this.started = t;
    this.frames++;
    if (this.frames <= 10) {
      this.floor = this.floor + (rms - this.floor) / this.frames; // learn the noise floor
      return null;
    }
    const loud = rms > Math.max(this.o.minSpeechRms, this.floor * this.o.ratio);
    if (!loud && !this.speaking) this.floor = this.floor * 0.98 + rms * 0.02; // slow adapt to the room
    if (this.ended) return null;
    if (t - this.started > this.o.maxMs) return this.end("max_length");
    if (loud) {
      this.lastLoud = t;
      if (!this.speaking) {
        this.speaking = true;
        this.heardSpeech = true;
        return "speech_start";
      }
      return null;
    }
    if (this.speaking && t - this.lastLoud > this.o.silenceMs) {
      this.speaking = false;
      return this.end("speech_end");
    }
    if (!this.heardSpeech && t - this.started > this.o.noSpeechTimeoutMs)
      return this.end("no_speech");
    return null;
  }

  /** Terminal events fire once. */
  private end(e: "speech_end" | "no_speech" | "max_length"): VadEvent {
    this.ended = true;
    return e;
  }

  get noiseFloor() {
    return this.floor;
  }
}

/** RMS of a time-domain frame from an AnalyserNode (values 0..255 centred at 128). */
export function rmsOf(frame: Uint8Array): number {
  let sum = 0;
  for (const v of frame) {
    const x = (v - 128) / 128;
    sum += x * x;
  }
  return Math.sqrt(sum / frame.length);
}
