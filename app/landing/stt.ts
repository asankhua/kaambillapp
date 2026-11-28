/**
 * Voice input for the live app on the landing page: Wispr Flow (default) or the browser mic (optional).
 *
 * Wispr Flow is not something the app can call (it has no API). It is a dictation app that types into
 * whatever text box has focus, so it is the default: the app opens with its typing box focused
 * (`?box=text`). The optional browser mic (Web Speech) starts with the box closed (`?box=mic`).
 * The choice is passed to the embedded iframe and to the "Open full screen" link, and remembered in
 * localStorage (`kb.stt`, also read by the app when it is opened without a parameter). Values stored by
 * older versions ("sarvam", "groq-whisper") fall back to the default, Wispr Flow.
 */

export const STT_STORAGE_KEY = "kb.stt";
export const STT_ENGINES = ["wispr", "webspeech"] as const;
export type SttEngine = (typeof STT_ENGINES)[number];
export const DEFAULT_ENGINE: SttEngine = "wispr";

function appUrl(engine: SttEngine): string {
  return engine === "webspeech" ? "/app/?box=mic" : "/app/?box=text";
}

function readStored(): SttEngine {
  try {
    const v = localStorage.getItem(STT_STORAGE_KEY);
    return (STT_ENGINES as readonly string[]).includes(v ?? "") ? (v as SttEngine) : DEFAULT_ENGINE;
  } catch {
    return DEFAULT_ENGINE;
  }
}

function writeStored(engine: SttEngine) {
  try {
    localStorage.setItem(STT_STORAGE_KEY, engine);
  } catch {
    /* private mode: the choice still applies for this visit */
  }
}

/** Point the live app (iframe and full-screen link) at the chosen input. */
function applyEngine(engine: SttEngine) {
  const url = appUrl(engine);
  const frame = document.querySelector<HTMLIFrameElement>(".phone-screen");
  // Only reload the app when the choice actually changes; a reload restarts the app.
  if (frame && frame.getAttribute("src") !== url) frame.src = url;
  const full = document.getElementById("open-full") as HTMLAnchorElement | null;
  if (full) full.href = url;
  const select = document.getElementById("stt-select") as HTMLSelectElement | null;
  if (select) select.value = engine;
}

export function initSttPicker() {
  const select = document.getElementById("stt-select") as HTMLSelectElement | null;
  if (!select) return;
  applyEngine(readStored());
  select.addEventListener("change", () => {
    const engine = (STT_ENGINES as readonly string[]).includes(select.value)
      ? (select.value as SttEngine)
      : DEFAULT_ENGINE;
    writeStored(engine);
    applyEngine(engine);
  });
}
