import { DEFAULT_SILENCE_MS } from "../../../phase-2-voice-core/src/stt/WebSpeechProvider";
import type { SttCallbacks, SttProvider } from "../../../phase-2-voice-core/src/stt/SttProvider";
import { EnergyVad, rmsOf } from "../audio/vad";
import type { VoiceErrorKind } from "../../../phase-2-voice-core/src/machine/types";

/** POST one clip to /api/stt (Groq Whisper). Shared by the Whisper engine and the second pass. */
export async function uploadClip(
  endpoint: string,
  audio: Blob,
  lang: string,
  hints: string[],
  fetchImpl: typeof fetch = fetch,
): Promise<{ text: string; confidence: number | null } | { error: VoiceErrorKind }> {
  try {
    const form = new FormData();
    form.append("audio", audio, "turn.webm");
    form.append("lang", lang);
    form.append("hints", hints.join(","));
    const res = await fetchImpl(endpoint, { method: "POST", body: form });
    if (res.status === 429) return { error: "rate_limited" };
    if (!res.ok) return { error: "network" };
    const data = (await res.json()) as {
      text: string;
      confidence: number | null;
      noSpeech: boolean;
    };
    if (data.noSpeech || !data.text) return { error: "no_speech" };
    return { text: data.text, confidence: data.confidence };
  } catch {
    return {
      error: typeof navigator !== "undefined" && navigator.onLine === false ? "offline" : "network",
    };
  }
}

/**
 * Groq Whisper via /api/stt (Phase 8). Records with MediaRecorder, ends on 1.5 s of silence
 * (EnergyVad), uploads once, returns ONE final turn. No live partials (Whisper is batch):
 * the dock shows "Sun raha hoon…" and a level meter instead.
 * Audio goes to our server → Groq; it is not stored (architecture.md §8).
 */
export class GroqWhisperProvider implements SttProvider {
  readonly id = "groq-whisper";
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private ctx: AudioContext | null = null;
  private raf = 0;
  private stopped = false;
  private hints: string[] = [];

  constructor(
    private readonly endpoint = `${import.meta.env?.VITE_API_BASE_URL ?? "/api"}/stt`,
    private readonly silenceMs = Number(import.meta.env?.VITE_VAD_SILENCE_MS ?? DEFAULT_SILENCE_MS), // 4 s pause between items
  ) {}

  isSupported() {
    return typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
  }

  setHints(words: string[]) {
    this.hints = words;
  }

  start(lang: string, cb: SttCallbacks) {
    this.stop();
    this.stopped = false;
    void this.run(lang, cb);
  }

  private async run(lang: string, cb: SttCallbacks) {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { noiseSuppression: true, echoCancellation: true, autoGainControl: true },
      });
    } catch (err) {
      return cb.onError(
        err instanceof DOMException &&
          (err.name === "NotAllowedError" || err.name === "SecurityError")
          ? "mic_blocked"
          : "unsupported",
      );
    }
    if (this.stopped) return this.release();
    const chunks: Blob[] = [];
    const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((m) =>
      MediaRecorder.isTypeSupported?.(m),
    );
    const rec = new MediaRecorder(this.stream, mime ? { mimeType: mime } : undefined);
    this.recorder = rec;
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    let heard = false;
    rec.onstop = async () => {
      this.release();
      if (!heard || chunks.length === 0) return cb.onError("no_speech");
      cb.onPartial("…");
      const r = await uploadClip(
        this.endpoint,
        new Blob(chunks, { type: rec.mimeType || "audio/webm" }),
        lang,
        this.hints,
      );
      if ("error" in r) return cb.onError(r.error);
      cb.onFinal({
        text: r.text,
        source: "stt",
        ...(r.confidence !== null ? { sttConfidence: r.confidence } : {}),
      });
    };

    // Level meter + end of speech
    this.ctx = new AudioContext();
    const analyser = this.ctx.createAnalyser();
    analyser.fftSize = 1024;
    this.ctx.createMediaStreamSource(this.stream).connect(analyser);
    const frame = new Uint8Array(analyser.fftSize);
    const vad = new EnergyVad({ silenceMs: this.silenceMs });
    rec.start(250);
    const tick = () => {
      if (this.stopped || rec.state !== "recording") return;
      analyser.getByteTimeDomainData(frame);
      const ev = vad.feed(rmsOf(frame), performance.now());
      if (ev === "speech_start") heard = true;
      if (ev === "speech_end" || ev === "no_speech" || ev === "max_length") return rec.stop();
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  /** Stop listening. If speech was recorded it is still sent (like "Ruk jaiye" with words). */
  stop() {
    this.stopped = true;
    cancelAnimationFrame(this.raf);
    if (this.recorder?.state === "recording") this.recorder.stop();
    else this.release();
    this.recorder = null;
  }

  private release() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    void this.ctx?.close().catch(() => {});
    this.ctx = null;
  }
}
