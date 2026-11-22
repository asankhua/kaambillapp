import type { Turn } from "@kaambill/shared";
import type { VoiceErrorKind } from "../machine/types";

/**
 * Swappable speech-to-text for the MIC button (architecture.md §5.1).
 * Wispr Flow is NOT a provider: it types into the text box (§5.1.1).
 */
export interface SttCallbacks {
  onPartial(text: string): void;
  onFinal(turn: Turn): void;
  onError(kind: VoiceErrorKind): void;
}

export interface SttProvider {
  readonly id: string;
  isSupported(): boolean;
  start(lang: string, cb: SttCallbacks): void;
  stop(): void;
  /** Rate-card brand names, for engines that accept hints (Whisper initial_prompt). No-op for Web Speech. */
  setHints?(words: string[]): void;
}

export class NotImplementedProvider implements SttProvider {
  constructor(readonly id: string) {}
  isSupported() {
    return false;
  }
  start(_lang: string, cb: SttCallbacks) {
    cb.onError("unsupported");
  }
  stop() {}
}

/** Phase 8, ONLY if Web Speech + Groq Whisper miss the Hinglish/Hindi accuracy target. */
export const SarvamProvider = () => new NotImplementedProvider("sarvam");
