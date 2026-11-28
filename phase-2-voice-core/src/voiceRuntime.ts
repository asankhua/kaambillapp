import { createConversationMachine, type ConversationEvent } from "./machine/conversation.machine";
import type { DomainAdapter } from "./machine/types";
import type { SttProvider } from "./stt/SttProvider";
import { WebSpeechProvider } from "./stt/WebSpeechProvider";

/**
 * Wires speech-to-text (input only; there is no spoken output) to the conversation machine outside React (no refs during render).
 * The UI calls `bind(actor.send)` once the actor exists; STT callbacks then feed events in.
 */
export function createVoiceRuntime<TDraft, TOutput>(
  adapter: DomainAdapter<TDraft, TOutput>,
  stt: SttProvider = new WebSpeechProvider(),
  lang: string = import.meta.env.VITE_STT_LANG ?? "hi-IN",
) {
  let send: (e: ConversationEvent) => void = () => {};
  let currentLang = lang;
  const machine = createConversationMachine({
    adapter,
    startListening: () =>
      stt.start(currentLang, {
        onPartial: (text) => send({ type: "STT_PARTIAL", text }),
        onFinal: (turn) => send({ type: "STT_FINAL", turn }),
        onError: (kind) => send({ type: "STT_ERROR", kind }),
      }),
    stopListening: () => stt.stop(),
  });
  return {
    machine,
    bind(fn: (e: ConversationEvent) => void) {
      send = fn;
    },
    sttSupported: stt.isSupported(),
    /** Recognition language for the mic, "hi-IN" or "en-IN" (TopBar language menu). */
    setLang: (l: string) => {
      currentLang = l;
    },
    sttId: stt.id,
    /** Rate-card names as spelling hints for engines that support them. */
    setHints: (words: string[]) => stt.setHints?.(words),
  };
}
