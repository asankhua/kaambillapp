import { Icon } from "../../../phase-1-ui-ux-design/src/Icon";
import { useT, type UiLangId } from "../../../phase-2-voice-core/src/ui/lang";

/**
 * The customer journey as a compact 5-step indicator (fits a 360 px phone):
 *   1 Items (live bill) · 2 Check (question / confirm / read-back) · 3 Payment details · 4 Payment · 5 Invoice.
 * Steps 1–2 follow the conversation machine (App.tsx); 3–5 are sub-steps of the share preview (phase 5).
 */
export type JourneyStep = 1 | 2 | 3 | 4 | 5;

const T: Record<
  UiLangId,
  { aria: string; labels: [string, string, string, string, string]; current: string; done: string }
> = {
  hinglish: {
    aria: "Bill ke steps",
    labels: ["Saaman", "Jaanch", "Details", "Payment", "Bill"],
    current: "abhi",
    done: "ho gaya",
  },
  hindi: {
    aria: "बिल के स्टेप",
    labels: ["सामान", "जाँच", "विवरण", "पेमेंट", "बिल"],
    current: "अभी",
    done: "हो गया",
  },
  english: {
    aria: "Bill steps",
    labels: ["Items", "Check", "Details", "Payment", "Invoice"],
    current: "current",
    done: "completed",
  },
};
const ICONS = [
  "format_list_bulleted",
  "fact_check",
  "account_balance_wallet",
  "payments",
  "receipt_long",
] as const;

export function JourneySteps({ step }: { step: JourneyStep }) {
  const t = useT(T);
  return (
    <nav
      aria-label={t.aria}
      className="rounded-2xl bg-surface-container-lowest px-2 py-2.5 shadow-sm"
      data-testid="journey-steps"
      data-step={step}
    >
      <ol className="flex items-start">
        {t.labels.map((label, i) => {
          const n = (i + 1) as JourneyStep;
          const done = n < step;
          const current = n === step;
          return (
            <li
              key={label}
              className="relative flex min-w-0 flex-1 flex-col items-center gap-1"
              aria-current={current || undefined}
            >
              {i > 0 && (
                <span
                  aria-hidden
                  className={`absolute right-1/2 top-[15px] h-0.5 w-full ${n <= step ? "bg-primary-container" : "bg-surface-variant"}`}
                />
              )}
              <span
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full ${
                  current
                    ? "bg-primary-container text-on-primary shadow-sm ring-4 ring-primary-fixed"
                    : done
                      ? "bg-primary-fixed text-primary"
                      : "bg-surface-container text-on-surface-variant"
                }`}
              >
                <Icon name={done ? "check" : ICONS[i]!} className="text-[18px]" />
              </span>
              <span
                className={`w-full truncate text-center font-caption text-[11px] leading-tight ${current ? "font-bold text-primary" : done ? "font-semibold text-on-surface" : "text-on-surface-variant"}`}
              >
                {label}
                <span className="sr-only"> ({current ? t.current : done ? t.done : `${n}/5`})</span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
