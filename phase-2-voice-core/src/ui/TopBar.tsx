import { useState } from "react";
import { useT, type UiLangId } from "./lang";
import { Icon } from "../../../phase-1-ui-ux-design/src/Icon";

export interface UiLanguage {
  id: UiLangId;
  label: string;
  /** Speech-recognition language for the mic. */
  stt: string;
}
export const UI_LANGUAGES: UiLanguage[] = [
  { id: "hinglish", label: "Hinglish", stt: "hi-IN" },
  { id: "hindi", label: "हिंदी", stt: "hi-IN" },
  { id: "english", label: "English", stt: "en-IN" },
];

const T = {
  hinglish: {
    tagline: "Karigar Billing Assistant",
    voice: "Voice",
    lang: (l: string) => `Bhasha: ${l}`,
    menu: "Bhasha chunein",
    rates: "Rates",
    rateCard: "Rate Card",
  },
  hindi: {
    tagline: "कारीगर बिलिंग सहायक",
    voice: "Voice",
    lang: (l: string) => `भाषा: ${l}`,
    menu: "भाषा चुनें",
    rates: "रेट",
    rateCard: "रेट कार्ड",
  },
  english: {
    tagline: "Worker Billing Assistant",
    voice: "Voice",
    lang: (l: string) => `Language: ${l}`,
    menu: "Choose language",
    rates: "Rates",
    rateCard: "Rate Card",
  },
};

/** Ported from the Stitch header (design/<screen>/code.html), architecture.md §7.1. */
export function TopBar({
  language = UI_LANGUAGES[0]!,
  onLanguage,
  onRateCard,
}: {
  language?: UiLanguage;
  onLanguage?: (l: UiLanguage) => void;
  onRateCard?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const t = useT(T);

  return (
    <header className="fixed top-0 z-50 w-full pt-safe bg-canvas/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="flex h-20 items-center justify-between gap-2 px-margin">
        <div className="flex min-w-0 items-center gap-space-xs">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary-container text-on-primary shadow-[0_2px_6px_rgba(11,122,75,0.25)]">
            <Icon name="handyman" className="text-[24px]" />
          </div>
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center gap-1">
              <span className="font-headline-md text-headline-md leading-none tracking-tight text-primary-container">
                KaamBill
              </span>
              <span className="hidden rounded-full bg-primary-fixed px-1.5 py-0.5 font-caption text-[10px] font-bold uppercase leading-tight tracking-wider text-on-primary-fixed min-[380px]:inline">
                {t.voice}
              </span>
            </div>
            <span className="hidden whitespace-nowrap font-caption text-[11px] leading-tight text-on-surface-variant min-[380px]:block">
              {t.tagline}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <div className="relative">
            <button
              type="button"
              aria-label={t.lang(language.label)}
              aria-haspopup="menu"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
              className="flex min-h-[48px] items-center gap-0.5 rounded-xl bg-surface-container-lowest px-2 py-2 font-label-md text-label-md text-on-surface shadow-[0_1px_4px_rgba(0,0,0,0.05)] active:scale-95"
            >
              <Icon name="translate" className="text-[20px] text-primary-container" />
              <span className="ml-0.5">{language.label}</span>
              <Icon name="arrow_drop_down" className="text-[18px] text-on-surface-variant" />
            </button>
            {open && (
              <ul
                role="menu"
                aria-label={t.menu}
                className="absolute right-0 top-14 z-50 w-44 overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-xl"
              >
                {UI_LANGUAGES.map((l) => (
                  <li key={l.id} role="none">
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={l.id === language.id}
                      onClick={() => {
                        onLanguage?.(l);
                        setOpen(false);
                      }}
                      className={`flex min-h-[48px] w-full items-center justify-between px-4 text-left text-body-lg ${l.id === language.id ? "bg-primary-tint font-semibold text-primary-container" : "text-on-surface"}`}
                    >
                      {l.label}{" "}
                      {l.id === language.id && <Icon name="check" className="text-[18px]" />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Stitch: "Rate Card" chip. Text shows only when there is room; the accessible name stays "Rates" (in Hinglish). */}
          <button
            type="button"
            onClick={onRateCard}
            aria-label={t.rates}
            className="flex min-h-[48px] min-w-[44px] items-center justify-center gap-1 rounded-xl bg-surface-container-lowest px-2 py-2 font-label-md text-label-md text-primary-container shadow-[0_1px_4px_rgba(0,0,0,0.05)] active:scale-95"
          >
            <Icon name="receipt_long" className="text-[20px]" />
            <span className="hidden min-[440px]:inline">{t.rateCard}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
