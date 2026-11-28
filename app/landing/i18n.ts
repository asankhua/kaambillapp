/**
 * Landing-page language: English (default), हिंदी or Hinglish.
 *
 * The English copy stays in index.html. On a language change we swap in the matching entry from
 * translations.ts (keyed by the English HTML). The choice is stored under the same localStorage key
 * as the embedded KaamBill app (`kb.lang`), so the page and the live app stay in the same language
 * in both directions: the browser fires a `storage` event in the other frame when one side changes it.
 */
import { TRANSLATIONS, type LandingLang } from "./translations";

export type { LandingLang };

/** Same key and values as the app (phase-2-voice-core/src/ui/lang.tsx). */
export const LANG_STORAGE_KEY = "kb.lang";
export const LANGS: readonly LandingLang[] = ["english", "hindi", "hinglish"];
const HTML_LANG: Record<LandingLang, string> = {
  english: "en-IN",
  hindi: "hi",
  hinglish: "hi-Latn",
};

const UI: Record<string, Record<LandingLang, string>> = {
  copy: { english: "Copy", hindi: "कॉपी", hinglish: "Copy" },
  copied: { english: "Copied ✓", hindi: "कॉपी हो गया ✓", hinglish: "Copy ho gaya ✓" },
  press: {
    english: "Press Ctrl/⌘+C",
    hindi: "Ctrl/⌘+C दबाएँ",
    hinglish: "Ctrl/⌘+C dabayein",
  },
  switchLabel: { english: "Language", hindi: "भाषा", hinglish: "Language" },
};

/** Text that lives in attributes or <head>, not in the body walk. */
const ATTRS: { find: () => Element | null; attr: string; tr: Record<LandingLang, string> }[] = [
  {
    find: () => document.documentElement,
    attr: "data-title",
    tr: {
      english: "",
      hindi: "KaamBill: बोलकर बिल बनाइए | भारत के कारीगरों के लिए वॉइस बिलिंग",
      hinglish: "KaamBill: Bol ke bill banaiye | India ke karigaron ke liye voice billing",
    },
  },
  {
    find: () => document.querySelector('meta[name="description"]'),
    attr: "content",
    tr: {
      english: "",
      hindi:
        "KaamBill 15 सेकंड में हिंग्लिश, हिंदी या अंग्रेज़ी में बोले गए काम को आइटम-वार बिल और UPI पेमेंट QR में बदल देता है, जिसे WhatsApp पर भेजा जा सकता है। भारत के इलेक्ट्रीशियन, प्लंबर, AC टेक्नीशियन और मरम्मत कारीगरों के लिए बना।",
      hinglish:
        "KaamBill 15 second mein Hinglish, Hindi ya English mein bole gaye kaam ko item-wise bill aur UPI payment QR mein badal deta hai, jise WhatsApp par bheja ja sakta hai. India ke electrician, plumber, AC technician aur repair karigaron ke liye bana.",
    },
  },
  {
    // One screen recording per language (recorded in the app with that language selected).
    find: () => document.querySelector(".phone-gif"),
    attr: "src",
    tr: {
      english: "",
      hindi: "/kaambill-demo-hindi.gif",
      hinglish: "/kaambill-demo-hinglish.gif",
    },
  },
  {
    find: () => document.querySelector(".phone-gif"),
    attr: "alt",
    tr: {
      english: "",
      hindi:
        "KaamBill की स्क्रीन रिकॉर्डिंग: हिंदी में एक काम टाइप किया जाता है, आइटम-वार बिल जाँचा जाता है, पेमेंट की जानकारी भरी जाती है और बिल WhatsApp पर भेजने के लिए तैयार हो जाता है।",
      hinglish:
        "KaamBill ki screen recording: Hinglish mein ek kaam type kiya jaata hai, item-wise bill check hota hai, payment details bhari jaati hain aur bill WhatsApp par bhejne ke liye ready ho jaata hai.",
    },
  },
];

const SKIP = new Set(["SCRIPT", "STYLE", "IFRAME", "NOSCRIPT"]);
const collapse = (s: string) => s.replace(/\s+/g, " ").trim();

interface Unit {
  el: Element;
  /** The element's original (English) markup, restored when switching back. */
  html: string;
  tr: { hindi: string; hinglish: string };
}
const units: Unit[] = [];
const attrEnglish = new Map<number, string>();
let current: LandingLang = "english";

/** Every element that directly holds text is one unit; its whole inner markup is the key. */
function collect(el: Element) {
  if (SKIP.has(el.tagName) || el.classList.contains("material-symbols-outlined")) return;
  const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim());
  if (hasText) {
    const tr = TRANSLATIONS[collapse(el.innerHTML)];
    if (tr) units.push({ el, html: el.innerHTML, tr });
    return;
  }
  for (const child of el.children) collect(child);
}

function readStored(): LandingLang | null {
  try {
    const v = localStorage.getItem(LANG_STORAGE_KEY);
    return (LANGS as readonly string[]).includes(v ?? "") ? (v as LandingLang) : null;
  } catch {
    return null;
  }
}

function writeStored(lang: LandingLang) {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    /* private mode: the page still switches, it just won't persist */
  }
}

/** A short UI string (button labels) in the current language. */
export function label(id: "copy" | "copied" | "press"): string {
  return UI[id]![current];
}
export const currentLang = () => current;

function apply(lang: LandingLang) {
  current = lang;
  for (const u of units) u.el.innerHTML = lang === "english" ? u.html : u.tr[lang];
  ATTRS.forEach((a, i) => {
    const el = a.find();
    if (!el) return;
    const isTitle = a.attr === "data-title";
    if (!attrEnglish.has(i)) {
      attrEnglish.set(i, isTitle ? document.title : (el.getAttribute(a.attr) ?? ""));
    }
    const value = lang === "english" ? attrEnglish.get(i)! : a.tr[lang];
    if (isTitle) document.title = value;
    else el.setAttribute(a.attr, value);
  });
  document.documentElement.lang = HTML_LANG[lang];
  const select = document.querySelector<HTMLSelectElement>("#lang-select");
  if (select) {
    select.value = lang;
    select.setAttribute("aria-label", UI.switchLabel![lang]);
  }
}

export function setLang(lang: LandingLang) {
  if (lang === current) return;
  apply(lang);
  writeStored(lang);
}

export function initI18n() {
  collect(document.body);
  // First visit: English, and tell the embedded app so both start in the same language.
  const stored = readStored();
  const start = stored ?? "english";
  if (!stored) writeStored(start);
  apply(start);

  document
    .querySelector<HTMLSelectElement>("#lang-select")
    ?.addEventListener("change", (e) =>
      setLang((e.target as HTMLSelectElement).value as LandingLang),
    );
  // The app (in the iframe) changed its language: follow it.
  window.addEventListener("storage", (e) => {
    if (e.key !== LANG_STORAGE_KEY) return;
    const next = readStored();
    if (next && next !== current) apply(next);
  });
}
