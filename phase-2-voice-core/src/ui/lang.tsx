import { createContext, useContext } from "react";
import type { Lang } from "@kaambill/shared/types";

/**
 * The app's language (top-bar menu): Hinglish (default), Hindi (Devanagari) or English. It drives
 * three things at once: every piece of screen text, the mic's speech-recognition language, and the
 * language of the app's messages (questions, read-back). KaamBill supports only these three.
 */
export type UiLangId = "hinglish" | "hindi" | "english";

export const UI_LANG_IDS: readonly UiLangId[] = ["hinglish", "hindi", "english"];
/** Speech-recognition language per UI language (Hinglish is recognised as hi-IN). */
export const STT_LANG: Record<UiLangId, string> = {
  hinglish: "hi-IN",
  hindi: "hi-IN",
  english: "en-IN",
};
/** Language of the app's messages (phase-4 i18n) per UI language. */
export const REPLY_LANG: Record<UiLangId, Lang> = {
  hinglish: "hi-Latn",
  hindi: "hi",
  english: "en-IN",
};
/** BCP-47 tag for <html lang>. */
export const HTML_LANG: Record<UiLangId, string> = {
  hinglish: "hi-Latn",
  hindi: "hi",
  english: "en-IN",
};

export const LANG_STORAGE_KEY = "kb.lang";
export function storedUiLang(): UiLangId {
  const v = typeof localStorage === "undefined" ? null : localStorage.getItem(LANG_STORAGE_KEY);
  return (UI_LANG_IDS as readonly string[]).includes(v ?? "") ? (v as UiLangId) : "hinglish";
}

export const UiLangContext = createContext<{ lang: UiLangId; setLang: (l: UiLangId) => void }>({
  lang: "hinglish",
  setLang: () => {},
});

/** Current UI language and a setter (persists the choice). */
export const useUiLang = () => useContext(UiLangContext);

/**
 * Pick this component's strings for the current language. Each component keeps its own
 * dictionary next to its code:
 *   const T = { hinglish: { title: "Mere Bills" }, hindi: { title: "मेरे बिल" }, english: { title: "My bills" } };
 *   const t = useT(T);  →  t.title
 * The Hinglish object defines the shape; the other two must match it (TypeScript checks this).
 */
export function useT<S>(dict: Record<UiLangId, S>): S {
  return dict[useContext(UiLangContext).lang];
}
