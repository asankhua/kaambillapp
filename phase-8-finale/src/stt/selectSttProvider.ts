import type { SttProvider } from "../../../phase-2-voice-core/src/stt/SttProvider";
import { SarvamProvider } from "../../../phase-2-voice-core/src/stt/SttProvider";
import { WebSpeechProvider } from "../../../phase-2-voice-core/src/stt/WebSpeechProvider";
import { GroqWhisperProvider } from "./GroqWhisperProvider";
import { SecondPassProvider } from "./SecondPassProvider";

export type SttProviderId = "webspeech" | "webspeech+whisper" | "groq-whisper" | "sarvam";

/**
 * Pick the mic's speech engine (architecture.md §5.1). VITE_STT_PROVIDER, overridable on stage
 * with `?stt=…`:
 *   webspeech          browser Web Speech (default, live transcript)
 *   webspeech+whisper  Web Speech + Groq Whisper SECOND PASS for unsure turns (§5.1.3)
 *   groq-whisper       Groq Whisper only (record → upload)
 * Falls back to browser Web Speech if the chosen engine isn't supported.
 */
export function selectSttProvider(
  id: string | undefined = (typeof location !== "undefined"
    ? new URLSearchParams(location.search).get("stt")
    : null) ?? import.meta.env?.VITE_STT_PROVIDER,
): SttProvider {
  const web = new WebSpeechProvider();
  const recordingOk = typeof MediaRecorder !== "undefined";
  const chosen =
    id === "groq-whisper"
      ? new GroqWhisperProvider()
      : id === "webspeech+whisper" && recordingOk
        ? new SecondPassProvider(web)
        : id === "sarvam"
          ? SarvamProvider()
          : web;
  return chosen.isSupported() ? chosen : web;
}
