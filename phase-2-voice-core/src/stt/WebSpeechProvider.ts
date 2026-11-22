import type { SttCallbacks, SttProvider } from "./SttProvider";

/** Minimal typing of the Web Speech API (not in TS's DOM lib everywhere). */
interface RecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface RecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  [i: number]: RecognitionAlternative;
}
interface RecognitionEvent {
  readonly results: { readonly length: number; [i: number]: RecognitionResult };
}
interface RecognitionErrorEvent {
  readonly error: string;
}
export interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => SpeechRecognitionLike;

function getCtor(): RecognitionCtor | undefined {
  const w = globalThis as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

const ERROR_MAP: Record<string, "mic_blocked" | "no_speech" | "network" | "unknown"> = {
  "not-allowed": "mic_blocked",
  "service-not-allowed": "mic_blocked",
  "audio-capture": "mic_blocked",
  "no-speech": "no_speech",
  network: "network",
};

/** Pause allowed between words before the turn ends (workers pause between items). */
export const DEFAULT_SILENCE_MS = 4000;
/** How long to wait for the FIRST word after the mic is tapped. */
export const DEFAULT_FIRST_WORD_MS = 10_000;
/** Hard cap for one turn. */
export const DEFAULT_MAX_TURN_MS = 90_000;

/**
 * Browser Web Speech (default, no key). Note (architecture.md §8): in Chrome, audio goes to Google.
 *
 * Gives the worker time to speak a whole job (fixed 21 Nov: the mic used to close after 3–4 words):
 *  - the turn ends only after `silenceMs` (default 4 s, VITE_VAD_SILENCE_MS) with no new words, or when
 *    the worker taps "Ruk jaiye";
 *  - browsers (Chrome on Android especially) stop recognition by themselves after a short pause; we
 *    then RESTART it and keep the words heard so far, instead of ending the turn;
 *  - before the first word we wait up to `firstWordMs` (10 s); a turn never runs longer than `maxTurnMs`.
 */
export class WebSpeechProvider implements SttProvider {
  readonly id = "webspeech";
  private rec: SpeechRecognitionLike | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private capTimer: ReturnType<typeof setTimeout> | null = null;
  /** Words from browser sessions that already ended (we restarted after them). */
  private committed = "";
  private committedConf: number[] = [];
  private transcript = "";
  private confidences: number[] = [];
  private finished = false;

  constructor(
    private readonly silenceMs = Number(import.meta.env?.VITE_VAD_SILENCE_MS ?? DEFAULT_SILENCE_MS),
    private readonly ctor: RecognitionCtor | undefined = getCtor(),
    private readonly firstWordMs = DEFAULT_FIRST_WORD_MS,
    private readonly maxTurnMs = DEFAULT_MAX_TURN_MS,
  ) {}

  isSupported() {
    return !!this.ctor;
  }

  start(lang: string, cb: SttCallbacks) {
    if (!this.ctor) return cb.onError("unsupported");
    this.stop();
    this.committed = "";
    this.committedConf = [];
    this.transcript = "";
    this.confidences = [];
    this.finished = false;
    const ctor = this.ctor;

    const fullText = () => [this.committed, this.transcript].filter(Boolean).join(" ").trim();
    const finish = () => {
      if (this.finished) return;
      this.finished = true;
      this.clearTimer();
      this.clearCap();
      const text = fullText();
      const conf = [...this.committedConf, ...this.confidences].filter((c) => c > 0); // Android often reports 0 = unknown
      const r = this.rec;
      this.rec = null;
      if (r) {
        r.onresult = r.onerror = r.onend = null;
        try {
          r.stop();
        } catch {
          /* already stopped */
        }
      }
      if (text)
        cb.onFinal({
          text,
          source: "stt",
          ...(conf.length ? { sttConfidence: conf.reduce((a, b) => a + b, 0) / conf.length } : {}),
        });
      else cb.onError("no_speech");
    };
    const armSilence = (ms: number) => {
      this.clearTimer();
      this.timer = setTimeout(finish, ms);
    };

    const startSession = () => {
      const rec = new ctor();
      rec.lang = lang;
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.onresult = (e) => {
        // Rebuild this session's text from all its results (Android Chrome re-sends earlier ones).
        let text = "";
        const confs: number[] = [];
        for (let i = 0; i < e.results.length; i++) {
          const alt = e.results[i]![0]!;
          text += (text ? " " : "") + alt.transcript.trim();
          if (e.results[i]!.isFinal) confs.push(alt.confidence);
        }
        this.transcript = text;
        this.confidences = confs;
        cb.onPartial(fullText());
        armSilence(this.silenceMs); // still talking: the pause timer starts again
      };
      rec.onerror = (e) => {
        if (e.error === "aborted" || e.error === "no-speech") return; // a pause, not the end: onend restarts
        if (e.error === "network" && fullText()) return finish();
        this.finished = true;
        this.clearTimer();
        this.clearCap();
        cb.onError(ERROR_MAP[e.error] ?? "unknown");
      };
      rec.onend = () => {
        if (this.finished || this.rec !== rec) return;
        // The browser stopped by itself (it does after a short pause). Keep the words, listen again.
        this.committed = fullText();
        this.committedConf.push(...this.confidences);
        this.transcript = "";
        this.confidences = [];
        try {
          startSession();
        } catch {
          finish();
        }
      };
      this.rec = rec;
      rec.start();
    };

    startSession();
    armSilence(this.firstWordMs); // wait longer for the first word
    this.capTimer = setTimeout(finish, this.maxTurnMs);
  }

  stop() {
    this.clearTimer();
    this.clearCap();
    if (this.rec) {
      this.finished = true;
      const r = this.rec;
      this.rec = null;
      r.onresult = r.onerror = r.onend = null;
      try {
        r.abort();
      } catch {
        /* ignore */
      }
    }
  }

  private clearCap() {
    if (this.capTimer) clearTimeout(this.capTimer);
    this.capTimer = null;
  }

  private clearTimer() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }
}
