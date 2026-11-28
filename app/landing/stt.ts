/**
 * Voice input for the live app on the landing page: the browser mic (Web Speech, default) or Wispr Flow.
 *
 * Wispr Flow is not something the app can call (it has no API). It is a desktop dictation app that types
 * into whatever text box has focus, so choosing it opens the app's typing box on load (`?box=text`).
 * The choice is passed to the embedded iframe and to the "Open full screen" link, and remembered in
 * localStorage (`kb.stt`). Values stored by older versions ("sarvam", "groq-whisper") fall back to the mic.
 */

export const STT_STORAGE_KEY = "kb.stt";
export const STT_ENGINES = ["webspeech", "wispr"] as const;
export type SttEngine = (typeof STT_ENGINES)[number];

function appUrl(engine: SttEngine): string {
  return engine === "wispr" ? "/app/?box=text" : "/app/";
}

function readStored(): SttEngine {
  try {
    const v = localStorage.getItem(STT_STORAGE_KEY);
    return (STT_ENGINES as readonly string[]).includes(v ?? "") ? (v as SttEngine) : "webspeech";
  } catch {
    return "webspeech";
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
      : "webspeech";
    writeStored(engine);
    applyEngine(engine);
  });
}
