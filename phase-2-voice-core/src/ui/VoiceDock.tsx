import { Icon } from "../../../phase-1-ui-ux-design/src/Icon";
import { useT, useUiLang, type UiLangId } from "./lang";
import { UI_LANGUAGES } from "./TopBar";

export type DockMode =
  "idle" | "listening" | "processing" | "asking" | "awaitApproval" | "disabled";

const T: Record<
  UiLangId,
  {
    status: Record<DockMode, string>;
    live: string;
    speak: string;
    autoCalc: string;
    recognition: string;
    micListening: string;
    micIdle: string;
    stop: string;
    cancel: string;
  }
> = {
  hinglish: {
    status: {
      idle: "Tap karke boliye",
      listening: "Sun raha hoon...",
      processing: "Rate check kar raha hoon...",
      asking: "Jawab boliye",
      awaitApproval: "'Haan' ka intezaar...",
      disabled: "Mic band hai",
    },
    live: "Live",
    speak: "Boliye…",
    autoCalc: "Ruk ruk ke boliye · ho jaye to Ruk jaiye",
    recognition: "Awaaz pehchaan chalu",
    micListening: "Sun raha hoon, rokne ke liye dabaiye",
    micIdle: "Bolne ke liye dabaiye",
    stop: "Ruk jaiye (Stop)",
    cancel: "Radd karein",
  },
  hindi: {
    status: {
      idle: "टैप करके बोलिए",
      listening: "सुन रहा हूँ...",
      processing: "रेट चेक कर रहा हूँ...",
      asking: "जवाब बोलिए",
      awaitApproval: "'हाँ' का इंतज़ार...",
      disabled: "माइक बंद है",
    },
    live: "लाइव",
    speak: "बोलिए…",
    autoCalc: "रुक-रुक के बोलिए · हो जाए तो रुकिए",
    recognition: "आवाज़ पहचान चालू",
    micListening: "सुन रहा हूँ, रोकने के लिए दबाइए",
    micIdle: "बोलने के लिए दबाइए",
    stop: "रुकिए (Stop)",
    cancel: "रद्द करें",
  },
  english: {
    status: {
      idle: "Tap and speak",
      listening: "Listening...",
      processing: "Checking rates...",
      asking: "Say your answer",
      awaitApproval: "Waiting for 'Yes'...",
      disabled: "Mic is off",
    },
    live: "Live",
    speak: "Speak…",
    autoCalc: "Pauses are fine · tap Stop when done",
    recognition: "Voice recognition on",
    micListening: "Listening, tap to stop",
    micIdle: "Tap to speak",
    stop: "Stop",
    cancel: "Cancel",
  },
};

/**
 * Bottom voice dock: status, live transcript, mic with halo (green idle → blue pulsing while listening).
 * Ported from kaambill_bol_ke_bill_banaiye (idle) and kaambill_sun_raha_hoon_listening_state.
 * Rule F3: no "Wispr" label here (the mic is browser speech). No audio output: nothing here speaks.
 */
export function VoiceDock({
  mode,
  partial,
  langLabel,
  onMic,
  onStop,
  onCancel,
}: {
  mode: DockMode;
  partial?: string;
  /** Language the mic listens in, shown in the transcript card footer (defaults to the current UI language). */
  langLabel?: string;
  onMic: () => void;
  onStop?: () => void;
  onCancel?: () => void;
}) {
  const t = useT(T);
  const { lang } = useUiLang();
  const footerLang = langLabel ?? UI_LANGUAGES.find((l) => l.id === lang)?.label ?? "Hinglish";
  const listening = mode === "listening";
  const idle = mode === "idle";
  return (
    <div className="flex flex-col items-center px-margin pt-2">
      {listening && (
        <div
          className="relative mb-3 flex w-full max-w-md flex-col gap-2 overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-3.5 shadow-xl"
          aria-live="polite"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-secondary" />
              </span>
              <span className="font-label-md text-label-md font-bold text-secondary">
                {t.status.listening}
              </span>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-surface-container px-2 py-0.5">
              <Icon name="graphic_eq" className="text-[14px] text-secondary" />
              <span className="font-caption text-caption font-semibold text-secondary">
                {t.live}
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2 pt-0.5">
            <div className="flex shrink-0 items-center gap-0.5 pt-1" aria-hidden="true">
              {["h-3.5", "h-6", "h-4", "h-7", "h-2"].map((h, i) => (
                <span
                  key={i}
                  className={`w-1 ${h} animate-pulse rounded-full bg-secondary`}
                  style={{ animationDelay: `${i * 120}ms` }}
                />
              ))}
            </div>
            <p className="min-h-[28px] flex-1 font-headline-md text-[20px] font-bold leading-snug text-on-surface">
              {partial ? (
                `“${partial}…”`
              ) : (
                <span className="animate-pulse font-medium text-on-surface-variant/60">
                  {t.speak}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-surface-container pt-1 font-caption text-[11px] text-on-surface-variant">
            <span className="flex min-w-0 items-center gap-1">
              <Icon name="bolt" className="shrink-0 text-[13px] text-primary-container" />
              <span className="truncate">{t.autoCalc}</span>
            </span>
            <span className="shrink-0 font-bold text-secondary">{footerLang}</span>
          </div>
        </div>
      )}

      {!listening && (
        <div
          className="flex w-full max-w-md items-center justify-between gap-2 py-1"
          aria-live="polite"
        >
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${mode === "disabled" ? "bg-error" : "bg-primary-container"} ${idle ? "animate-pulse" : ""}`}
            />
            <span className="truncate font-body-md text-body-md font-semibold text-on-surface">
              {t.status[mode]}
            </span>
          </div>
          {mode !== "disabled" && (
            <span className="shrink-0 font-caption text-caption font-semibold text-secondary">
              {t.recognition}
            </span>
          )}
        </div>
      )}

      <div className="relative my-1 flex items-center justify-center">
        {listening && (
          <>
            <div className="pointer-events-none absolute h-28 w-28 animate-ping rounded-full bg-secondary/15" />
            <div className="animate-pulse-ring absolute h-[92px] w-[92px] rounded-full bg-secondary/25" />
          </>
        )}
        {(idle || mode === "asking") && (
          <div className="animate-pulse-ring pointer-events-none absolute h-[96px] w-[96px] rounded-full bg-primary-container/20" />
        )}
        {mode === "awaitApproval" && (
          <div className="absolute h-[96px] w-[96px] rounded-full bg-primary-container/20" />
        )}
        <button
          type="button"
          onClick={onMic}
          disabled={mode === "processing" || mode === "disabled"}
          aria-label={listening ? t.micListening : t.micIdle}
          className={`relative z-10 flex items-center justify-center overflow-hidden rounded-full text-white transition-all active:scale-95 disabled:opacity-50 ${
            listening
              ? "h-[72px] w-[72px] bg-secondary shadow-[0_8px_24px_rgba(0,81,213,0.4)]"
              : "h-[76px] w-[76px] bg-primary-container shadow-[0_8px_24px_rgba(11,122,75,0.35)] active:bg-primary"
          }`}
        >
          <Icon
            name={mode === "processing" ? "hourglass_top" : mode === "disabled" ? "mic_off" : "mic"}
            className={listening ? "text-[34px]" : "text-[36px]"}
          />
        </button>
      </div>

      {listening && (
        <div className="mb-2 mt-1 flex w-full max-w-xs items-center justify-center gap-3">
          <button
            type="button"
            onClick={onStop}
            className="flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-error-container px-4 py-2 font-label-md text-label-md font-bold text-on-error-container shadow-sm active:scale-95"
          >
            <Icon name="stop" className="text-[18px]" />
            <span>{t.stop}</span>
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex min-h-[48px] items-center justify-center gap-1 rounded-xl bg-surface-container px-4 py-2 font-label-md text-label-md font-medium text-on-surface active:scale-95"
          >
            <Icon name="close" className="text-[18px] text-on-surface-variant" />
            <span>{t.cancel}</span>
          </button>
        </div>
      )}
    </div>
  );
}
