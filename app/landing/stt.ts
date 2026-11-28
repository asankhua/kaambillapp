/**
 * Speech engine for the live app on the landing page: browser Web Speech (default), Groq Whisper or Sarvam AI.
 *
 * The app reads its engine from the `?stt=` URL parameter (phase-8-finale/src/stt/selectSttProvider.ts),
 * so the choice is passed to the embedded iframe and to the "Open full screen" link. It is also stored
 * in localStorage (`kb.stt`) so the next visit keeps it. The param is always sent, so an env default
 * (VITE_STT_PROVIDER) never overrides what the dropdown shows.
 */

export const STT_STORAGE_KEY = "kb.stt";
export const STT_ENGINES = ["webspeech", "groq-whisper", "sarvam", "wispr"] as const;
export type SttEngine = (typeof STT_ENGINES)[number];

/**
 * Wispr Flow is not an engine the app can call (it has no API). It is a desktop dictation app that types
 * into whatever text box has focus, so "wispr" opens the app's text box on load and the mic stays as usual.
 */
function appUrl(engine: SttEngine): string {
  return engine === "wispr" ? "/app/?stt=webspeech&box=text" : `/app/?stt=${engine}`;
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

/** Point the live app (iframe and full-screen link) at the chosen engine. */
function applyEngine(engine: SttEngine) {
  const url = appUrl(engine);
  const frame = document.querySelector<HTMLIFrameElement>(".phone-screen");
  // Only reload the app when the engine actually changes; a reload restarts the app.
  if (frame && frame.getAttribute("src") !== url) frame.src = url;
  const full = document.getElementById("open-full") as HTMLAnchorElement | null;
  if (full) full.href = url;
  const select = document.getElementById("stt-select") as HTMLSelectElement | null;
  if (select) select.value = engine;
}

export function initSttPicker() {
  const select = document.getElementById("stt-select") as HTMLSelectElement | null;
  if (!select) return;
  const start = readStored();
  applyEngine(start);
  select.addEventListener("change", () => {
    const engine = (STT_ENGINES as readonly string[]).includes(select.value)
      ? (select.value as SttEngine)
      : "webspeech";
    writeStored(engine);
    applyEngine(engine);
  });
}
