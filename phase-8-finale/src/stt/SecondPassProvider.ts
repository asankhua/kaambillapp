import type { Turn } from "@kaambill/shared";
import type { SttCallbacks, SttProvider } from "../../../phase-2-voice-core/src/stt/SttProvider";
import { uploadClip } from "./GroqWhisperProvider";

/**
 * Whisper SECOND PASS (architecture.md §5.1.3): the primary engine (browser Web Speech) gives the
 * live transcript; the same audio is recorded alongside. Only when the primary result's confidence is
 * below the threshold (0.85, or unknown) is the clip sent to Groq Whisper, and the result with the
 * higher confidence is kept. If recording can't run next to Web Speech (mic contention on some
 * Android phones), the primary result is used unchanged.
 */
export interface ClipRecorder {
  start(): Promise<void>;
  /** Stop and return the clip (null if nothing was recorded). */
  stop(): Promise<Blob | null>;
  cancel(): void;
}

export type Uploader = (
  audio: Blob,
  lang: string,
  hints: string[],
) => ReturnType<typeof uploadClip>;

export class SecondPassProvider implements SttProvider {
  readonly id: string;
  private hints: string[] = [];
  private recorder: ClipRecorder | null = null;
  private generation = 0;

  constructor(
    private readonly primary: SttProvider,
    private readonly makeRecorder: () => ClipRecorder = () => new MediaClipRecorder(),
    private readonly upload: Uploader = (a, l, h) =>
      uploadClip(`${import.meta.env?.VITE_API_BASE_URL ?? "/api"}/stt`, a, l, h),
    private readonly threshold = Number(import.meta.env?.VITE_CONF_HIGH ?? 0.85),
  ) {
    this.id = `${primary.id}+whisper`;
  }

  isSupported() {
    return this.primary.isSupported();
  }

  setHints(words: string[]) {
    this.hints = words;
    this.primary.setHints?.(words);
  }

  start(lang: string, cb: SttCallbacks) {
    const gen = ++this.generation;
    const rec = this.makeRecorder();
    this.recorder = rec;
    let recording = false;
    void rec
      .start()
      .then(() => (recording = true))
      .catch(() => (recording = false)); // contention → no second pass
    this.primary.start(lang, {
      onPartial: cb.onPartial,
      onError: (k) => {
        rec.cancel();
        cb.onError(k);
      },
      onFinal: (turn) => void this.decide(gen, turn, rec, recording, lang, cb),
    });
  }

  private async decide(
    gen: number,
    turn: Turn,
    rec: ClipRecorder,
    recording: boolean,
    lang: string,
    cb: SttCallbacks,
  ) {
    const confident = turn.sttConfidence !== undefined && turn.sttConfidence >= this.threshold;
    if (confident || !recording) {
      rec.cancel();
      return cb.onFinal(turn);
    }
    const clip = await rec.stop();
    if (!clip || gen !== this.generation) return cb.onFinal(turn);
    const r = await this.upload(clip, lang, this.hints);
    if (gen !== this.generation) return; // a newer turn started meanwhile
    if ("error" in r) return cb.onFinal(turn);
    const whisperConf = r.confidence ?? 0;
    const better = whisperConf > (turn.sttConfidence ?? 0);
    cb.onFinal(better ? { text: r.text, source: "stt", sttConfidence: whisperConf } : turn);
  }

  stop() {
    this.generation++;
    this.recorder?.cancel();
    this.recorder = null;
    this.primary.stop();
  }
}

/** MediaRecorder-backed recorder for the second pass. */
export class MediaClipRecorder implements ClipRecorder {
  private stream: MediaStream | null = null;
  private rec: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { noiseSuppression: true, echoCancellation: true },
    });
    const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((m) =>
      MediaRecorder.isTypeSupported?.(m),
    );
    this.rec = new MediaRecorder(this.stream, mime ? { mimeType: mime } : undefined);
    this.rec.ondataavailable = (e) => e.data.size && this.chunks.push(e.data);
    this.rec.start(250);
  }

  stop(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const rec = this.rec;
      if (!rec || rec.state !== "recording") {
        this.release();
        return resolve(null);
      }
      rec.onstop = () => {
        const blob = this.chunks.length
          ? new Blob(this.chunks, { type: rec.mimeType || "audio/webm" })
          : null;
        this.release();
        resolve(blob);
      };
      rec.stop();
    });
  }

  cancel() {
    if (this.rec?.state === "recording") this.rec.stop();
    this.release();
  }

  private release() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.rec = null;
    this.chunks = [];
  }
}
