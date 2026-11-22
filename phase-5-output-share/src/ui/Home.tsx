import { useState } from "react";
import { DEMO } from "@kaambill/shared/types"; // types-only entry: keeps Zod out of the browser bundle
import type { FinalBill } from "../../../phase-4-billing-domain/src/bill/final";
import { formatRupees } from "../../../phase-4-billing-domain/src/speech";
// Stitch illustration, used straight from the Phase 1 export (single copy).
import toolbox from "../../../phase-1-ui-ux-design/design/worker_toolbox_illustration/screen.png";
import { Icon } from "../../../phase-1-ui-ux-design/src/Icon";
import { useT, useUiLang, type UiLangId } from "../../../phase-2-voice-core/src/ui/lang";
import { UI_LANGUAGES } from "../../../phase-2-voice-core/src/ui/TopBar";

const T = {
  hinglish: {
    namaste: "Namaste",
    todayAccount: "Aaj ka hisaab",
    active: "Chalu",
    todayEarnings: "Aaj ki kamai",
    billCount: (n: number) => `(${n} bill)`,
    toolboxAlt: "Karigar ka toolbox",
    autoCalc: "AI Auto-calc",
    title: "Bol ke bill banaiye",
    subtitle: "Bas ek line boliye, bill turant ready ho jayega",
    example: "Misal ke taur par:",
    exampleText: DEMO.utterance as string,
    exampleHint: "Aise boliye — material aur mazdoori khud jod lega",
    type: "Likh ke daalein",
    how: "Kaise use karein",
    steps: [
      "Neeche mic dabaiye aur poora kaam ek line mein boliye.",
      "Bill banega; jo samajh na aaye, KaamBill ek sawaal poochhega.",
      'Total check karein, "haan" boliye; WhatsApp khulega, Send aap dabayenge.',
    ],
    recent: "Haal hi ke bills",
    seeAll: (n: number) => `Sabhi dekhein (${n}) →`,
    empty: "Abhi koi bill nahi",
    emptyHint: "Pehla bill bol ke banaiye — mic neeche hai.",
    items: (n: number) => `${n} ${n === 1 ? "item" : "items"}`,
    shareAria: (c: string, paid: boolean) =>
      `${c} ka bill ${paid ? "share karein" : "WhatsApp par kholein"}`,
    openAria: (c: string) => `${c} ka bill dekhein`,
    share: "Share",
    tipLabel: "Sujhav:",
    tip: "Pura bill ek saath bol sakte hain, jaise MCB, wire, aur mazdoori.",
  },
  hindi: {
    namaste: "नमस्ते",
    todayAccount: "आज का हिसाब",
    active: "चालू",
    todayEarnings: "आज की कमाई",
    billCount: (n: number) => `(${n} बिल)`,
    toolboxAlt: "कारीगर का टूलबॉक्स",
    autoCalc: "AI ऑटो-हिसाब",
    title: "बोल के बिल बनाइए",
    subtitle: "बस एक लाइन बोलिए, बिल तुरंत तैयार हो जाएगा",
    example: "उदाहरण के लिए:",
    exampleText: "वर्मा जी के घर 2 Havells MCB, 15 मीटर Finolex wire, और 500 लेबर का बिल बना दो",
    exampleHint: "ऐसे बोलिए — सामान और मज़दूरी खुद जुड़ जाएगी",
    type: "लिख के डालें",
    how: "कैसे इस्तेमाल करें",
    steps: [
      "नीचे माइक दबाइए और पूरा काम एक लाइन में बोलिए।",
      "बिल बनेगा; जो समझ न आए, KaamBill एक सवाल पूछेगा।",
      'टोटल चेक करें, "हाँ" बोलिए; WhatsApp खुलेगा, Send आप दबाएँगे।',
    ],
    recent: "हाल के बिल",
    seeAll: (n: number) => `सभी देखें (${n}) →`,
    empty: "अभी कोई बिल नहीं",
    emptyHint: "पहला बिल बोल के बनाइए — माइक नीचे है।",
    items: (n: number) => `${n} आइटम`,
    shareAria: (c: string, paid: boolean) => `${c} का बिल ${paid ? "शेयर करें" : "WhatsApp पर खोलें"}`,
    openAria: (c: string) => `${c} का बिल देखें`,
    share: "शेयर",
    tipLabel: "सुझाव:",
    tip: "पूरा बिल एक साथ बोल सकते हैं, जैसे MCB, wire और मज़दूरी।",
  },
  english: {
    namaste: "Namaste",
    todayAccount: "Today's summary",
    active: "On",
    todayEarnings: "Earned today",
    billCount: (n: number) => `(${n} ${n === 1 ? "bill" : "bills"})`,
    toolboxAlt: "Worker's toolbox",
    autoCalc: "AI Auto-calc",
    title: "Make a bill by speaking",
    subtitle: "Just say one line, your bill is ready at once",
    example: "For example:",
    exampleText:
      "Verma ji's house, 2 Havells MCB, 15 meter Finolex wire and 500 labour, make the bill",
    exampleHint: "Say it like this — material and labour are added up for you",
    type: "Type it in",
    how: "How to use",
    steps: [
      "Press the mic below and say the whole job in one line.",
      "The bill is made; if something is unclear, KaamBill asks one question.",
      'Check the total and say "yes"; WhatsApp opens, you press Send.',
    ],
    recent: "Recent bills",
    seeAll: (n: number) => `See all (${n}) →`,
    empty: "No bills yet",
    emptyHint: "Make your first bill by speaking — the mic is below.",
    items: (n: number) => `${n} ${n === 1 ? "item" : "items"}`,
    shareAria: (c: string, paid: boolean) =>
      paid ? `Share ${c}'s bill` : `Open ${c}'s bill on WhatsApp`,
    openAria: (c: string) => `View ${c}'s bill`,
    share: "Share",
    tipLabel: "Tip:",
    tip: "You can say the whole bill at once, like MCB, wire and labour.",
  },
};

const STATUS: Record<UiLangId, Record<FinalBill["status"], string>> = {
  hinglish: { paid: "Paid ✓", shared: "Bheja gaya", finalized: "Bhejna baaki" },
  hindi: { paid: "पेड ✓", shared: "भेजा गया", finalized: "भेजना बाकी" },
  english: { paid: "Paid ✓", shared: "Sent", finalized: "Not sent" },
};

const WHEN: Record<UiLangId, { today: string; yesterday: string; daysAgo: (n: number) => string }> =
  {
    hinglish: { today: "Aaj", yesterday: "Kal", daysAgo: (n) => `${n} din pehle` },
    hindi: { today: "आज", yesterday: "कल", daysAgo: (n) => `${n} दिन पहले` },
    english: { today: "Today", yesterday: "Yesterday", daysAgo: (n) => `${n} days ago` },
  };

/** "Aaj 11:30 AM" / "Kal" / "3 din pehle" (per language) from an ISO timestamp. */
function when(iso: string, lang: UiLangId, now = new Date()) {
  const w = WHEN[lang];
  const d = new Date(iso);
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((day(now) - day(d)) / 864e5);
  if (days <= 0)
    return `${w.today} ${d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase()}`;
  if (days === 1) return w.yesterday;
  return w.daysAgo(days);
}

function StatusPill({ status }: { status: FinalBill["status"] }) {
  const label = STATUS[useUiLang().lang][status];
  if (status === "paid")
    return (
      <span className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-primary-fixed px-2.5 py-1 font-caption text-caption font-bold text-on-primary-fixed">
        <Icon name="check_circle" className="text-[14px]" /> {label}
      </span>
    );
  if (status === "shared")
    return (
      <span className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-tertiary-fixed px-2.5 py-1 font-caption text-caption font-bold text-on-tertiary-fixed">
        <Icon name="schedule" className="text-[14px]" /> {label}
      </span>
    );
  return (
    <span className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-surface-container px-2.5 py-1 font-caption text-caption font-bold text-on-surface-variant">
      <Icon name="draft" className="text-[14px]" /> {label}
    </span>
  );
}

/**
 * Home (kaambill_bol_ke_bill_banaiye, Hinglish wording per fix F7).
 * `dimmed`: App passes true while listening (S2 shows Home faded behind the dock).
 * `onShare` / `onOpen`: re-open a finalized bill (falls back to the Bills tab).
 */
export function Home({
  workerName = "",
  trade,
  todayTotal = 0,
  todayCount = 0,
  recent = [],
  dimmed = false,
  onType,
  onHelp,
  onAllBills,
  onShare,
  onOpen,
}: {
  workerName?: string;
  trade?: string;
  todayTotal?: number;
  todayCount?: number;
  recent?: FinalBill[];
  dimmed?: boolean;
  onType: () => void;
  onHelp?: () => void;
  onAllBills?: () => void;
  onShare?: (b: FinalBill) => void;
  onOpen?: (b: FinalBill) => void;
}) {
  const [help, setHelp] = useState(false);
  const t = useT(T);
  const { lang } = useUiLang();
  const langLabel = UI_LANGUAGES.find((l) => l.id === lang)?.label ?? "Hinglish";
  const latest = [...recent].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);
  return (
    <section
      className={`flex flex-col gap-4 pb-6 transition-opacity ${dimmed ? "pointer-events-none opacity-40" : ""}`}
    >
      {/* Worker strip + today's earnings */}
      <div className="flex flex-col gap-2 rounded-xl bg-surface-container-lowest p-3.5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-on-primary-fixed">
              <Icon name="bolt" className="text-[18px]" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-label-md text-label-md font-semibold leading-tight text-on-surface">
                {t.namaste}
                {workerName ? `, ${workerName}` : ""}
              </p>
              <p className="font-caption text-caption leading-tight text-on-surface-variant">
                {trade && trade !== "Other" ? `${trade} • ` : ""}
                {t.todayAccount}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-primary-fixed/60 px-2.5 py-1">
            <span className="h-2 w-2 rounded-full bg-primary-container" />
            <span className="font-caption text-caption font-bold text-on-primary-fixed">
              {t.active}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-lg bg-surface-container px-3 py-2">
          <div className="flex items-center gap-1.5">
            <Icon name="account_balance_wallet" className="text-[20px] text-primary-container" />
            <span className="font-caption text-caption font-medium text-on-surface-variant">
              {t.todayEarnings}
            </span>
          </div>
          <div className="flex min-w-0 items-baseline gap-1.5">
            <span
              className="tabular text-[34px] font-extrabold leading-tight tracking-tight text-primary-container tabular-nums min-[380px]:text-[40px]"
              data-testid="today-total"
            >
              {formatRupees(todayTotal)}
            </span>
            <span className="shrink-0 font-caption text-caption text-on-surface-variant">
              {t.billCount(todayCount)}
            </span>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="relative flex flex-col items-center overflow-clip rounded-2xl bg-surface-container-lowest p-4 text-center shadow-sm">
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-primary-fixed/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-surface-container/60 blur-xl" />
        <div className="relative my-1 flex h-[180px] w-[180px] items-center justify-center">
          <img
            src={toolbox}
            alt={t.toolboxAlt}
            className="h-full w-full object-contain drop-shadow-md"
          />
          <div className="absolute bottom-2 right-4 flex items-center gap-1 rounded-full bg-tertiary-fixed px-2 py-0.5 font-caption text-caption font-bold text-on-tertiary-fixed shadow-sm">
            <Icon name="auto_awesome" className="text-[14px]" />
            <span>{t.autoCalc}</span>
          </div>
        </div>
        <h1 className="mt-1 font-headline-lg-mobile text-headline-lg-mobile font-bold tracking-tight text-on-surface">
          {t.title}
        </h1>
        <p className="mt-1 max-w-[280px] font-body-md text-body-md text-on-surface-variant">
          {t.subtitle}
        </p>

        <div className="relative mt-4 w-full rounded-xl bg-surface-container-low p-3 text-left shadow-inner">
          <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container shadow-sm">
              <Icon name="mic" className="text-[16px]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-0.5 flex items-center justify-between">
                <span className="font-caption text-[11px] font-bold uppercase tracking-wide text-secondary">
                  {t.example}
                </span>
                <span className="flex items-center gap-0.5 font-caption text-[11px] text-on-surface-variant">
                  <Icon name="hearing" className="text-[13px]" /> {langLabel}
                </span>
              </div>
              <p className="font-body-md text-body-md font-semibold leading-snug text-on-surface">
                “{t.exampleText}”
              </p>
              <div className="mt-2 flex items-center gap-1.5 pt-2">
                <Icon name="task_alt" className="text-[16px] text-primary-container" />
                <span className="font-caption text-caption font-medium text-primary-container">
                  {t.exampleHint}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative mt-3 grid w-full grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onType}
            className="flex min-h-[52px] items-center justify-center gap-1.5 rounded-xl bg-surface-container px-2 py-2 font-label-md min-[380px]:whitespace-nowrap text-label-md text-on-surface active:scale-[0.98]"
          >
            <Icon name="keyboard" className="shrink-0 text-[20px] text-primary-container" />
            <span>{t.type}</span>
          </button>
          <button
            type="button"
            aria-expanded={onHelp ? undefined : help}
            onClick={() => (onHelp ? onHelp() : setHelp(!help))}
            className="flex min-h-[52px] items-center justify-center gap-1.5 rounded-xl bg-surface-container px-2 py-2 font-label-md min-[380px]:whitespace-nowrap text-label-md text-on-surface active:scale-[0.98]"
          >
            <Icon name="help" className="shrink-0 text-[20px] text-tertiary-container" />
            <span>{t.how}</span>
          </button>
        </div>
        {help && !onHelp && (
          <ol className="mt-3 w-full list-decimal rounded-xl bg-surface-container-low p-3 pl-8 text-left font-body-md text-body-md text-on-surface">
            {t.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        )}
      </div>

      {/* Recent bills */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <Icon name="history_edu" className="text-[20px] text-primary-container" />
            <h2 className="font-headline-md text-[18px] font-bold text-on-surface">{t.recent}</h2>
          </div>
          {recent.length > 0 && (
            <button
              type="button"
              onClick={onAllBills}
              className="flex min-h-[48px] items-center px-2 font-label-md text-label-md font-bold text-primary-container active:opacity-75"
            >
              {t.seeAll(recent.length)}
            </button>
          )}
        </div>

        {latest.length === 0 ? (
          <div className="flex flex-col items-center gap-1 rounded-2xl bg-surface-container-lowest p-5 text-center shadow-sm">
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-surface-container text-primary-container">
              <Icon name="receipt_long" className="text-[22px]" />
            </div>
            <p className="font-label-lg text-label-lg text-on-surface">{t.empty}</p>
            <p className="font-body-md text-body-md text-on-surface-variant">{t.emptyHint}</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {latest.map((b) => {
              const paid = b.status === "paid";
              return (
                <li
                  key={b.billNo}
                  className="flex w-full flex-col gap-2.5 rounded-2xl bg-surface-container-lowest p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-body-lg text-body-lg font-bold text-on-surface">
                        {b.customerName}
                      </p>
                      <p className="mt-0.5 truncate font-caption text-caption text-on-surface-variant">
                        {t.items(b.items.length)} • {when(b.createdAt, lang)}
                      </p>
                    </div>
                    <span className="tabular shrink-0 font-headline-lg-mobile text-headline-lg-mobile font-bold text-on-surface tabular-nums">
                      {formatRupees(b.total)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <StatusPill status={b.status} />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={t.shareAria(b.customerName, paid)}
                        onClick={() => (onShare ? onShare(b) : onAllBills?.())}
                        className="flex min-h-[48px] min-w-[48px] items-center justify-center gap-1 rounded-xl bg-surface-container px-2.5 py-1.5 text-on-surface active:scale-95"
                      >
                        <Icon
                          name={paid ? "share" : "chat"}
                          className="text-[18px] text-primary-container"
                        />
                        <span className="font-label-md text-label-md font-semibold">
                          {paid ? t.share : "WhatsApp"}
                        </span>
                      </button>
                      <button
                        type="button"
                        aria-label={t.openAria(b.customerName)}
                        onClick={() => (onOpen ? onOpen(b) : onAllBills?.())}
                        className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container text-on-surface-variant active:scale-95"
                      >
                        <Icon name="chevron_right" className="text-[20px]" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Tip */}
      <div className="flex w-full items-center justify-between gap-2 rounded-xl bg-surface-container p-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-container text-on-primary">
            <Icon name="tips_and_updates" className="text-[18px]" />
          </div>
          <p className="truncate font-caption text-caption text-on-surface">
            <strong>{t.tipLabel}</strong> {t.tip}
          </p>
        </div>
        <Icon name="arrow_forward" className="shrink-0 text-[18px] text-on-surface-variant" />
      </div>
    </section>
  );
}
