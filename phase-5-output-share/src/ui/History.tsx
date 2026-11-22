import { useState, useSyncExternalStore } from "react";
import type { FinalBill } from "../../../phase-4-billing-domain/src/bill/final";
import { startOfWeek, summarize, type HistoryStore } from "../history";
import { matchesSearch, type DraftStore } from "../drafts";
import type { DraftBill } from "../../../phase-4-billing-domain/src/bill/model";
import { billTotal } from "../../../phase-4-billing-domain/src/bill/model";
import { formatRupees } from "../../../phase-4-billing-domain/src/speech";
import { Icon } from "../../../phase-1-ui-ux-design/src/Icon";
import { useT, useUiLang, type UiLangId } from "../../../phase-2-voice-core/src/ui/lang";

const T = {
  hinglish: {
    sectionLabel: "Mere Bills",
    title: "Mere Bills",
    totalBadge: (n: number) => `${n} Total`,
    subtitle: "Aapke saare bills, hisaab-kitab aur vasooli",
    search: "Dhoondhein",
    searchPlaceholder: "Naam, saman ya #bill...",
    searchLabel: "Bills dhoondhein",
    searchClear: "Search saaf karein",
    weekTitle: "Is hafte ki kul kamai",
    billsCount: (n: number) => `${n} bills`,
    collectedPct: (n: number) => `Vasooli ${n}%`,
    collected: (n: number) => `Kul Vasooli (${n})`,
    collectedSub: "Jma ho chuka",
    pending: (n: number) => `Baaki / Pending (${n})`,
    pendingSub: "Vasoolna bacha hai",
    filterLabel: "Filter",
    fAll: "Sab",
    fPending: "Baaki",
    fPaid: "Paid",
    fDrafts: "Drafts",
    noMatch: "Kuch nahi mila.",
    noBills: "Abhi koi bill nahi.",
    estimate: "Estimate",
    labourCharge: "Labour charge",
    heard: "Suna gaya",
    ledger: "Khata updated",
    receipt: "Receipt dekhein",
    gotUpi: "UPI se mila",
    gotCash: "Cash mila",
    pillUpi: "UPI se mila",
    pillCash: "Cash mila",
    markPaid: "Paid mark",
    resend: "Phir bhejein",
    paid: "Paid",
    sentPending: "Bheja · Baaki",
    pendingPill: "Baaki",
    noCustomer: "Grahak ?",
    itemsCount: (n: number) => `${n} saman`,
    queued: "Queue mein",
    draft: "Draft (adhoora)",
    noItems: "Abhi koi saman nahi",
    rateMissing: (n: number) => ` (${n} item ka rate baaki)`,
    resume: "Poora karein & check karein",
    discard: "Hata dein",
    tipTitle: "Boliye aur turant update karein",
    tipLead: "Neeche mic daba kar bolein: ",
    tipEx1: "“Verma ji ka bill paid mark kar do”",
    tipOr: " ya ",
    tipEx2: "“Kal ka Sharma ji wala bill bhejo”",
    today: "Aaj",
    yesterday: "Kal",
  },
  hindi: {
    sectionLabel: "मेरे बिल",
    title: "मेरे बिल",
    totalBadge: (n: number) => `कुल ${n}`,
    subtitle: "आपके सारे बिल, हिसाब-किताब और वसूली",
    search: "ढूँढें",
    searchPlaceholder: "नाम, सामान या #बिल...",
    searchLabel: "बिल ढूँढें",
    searchClear: "सर्च साफ़ करें",
    weekTitle: "इस हफ़्ते की कुल कमाई",
    billsCount: (n: number) => `${n} बिल`,
    collectedPct: (n: number) => `वसूली ${n}%`,
    collected: (n: number) => `कुल वसूली (${n})`,
    collectedSub: "जमा हो चुका",
    pending: (n: number) => `बाकी (${n})`,
    pendingSub: "वसूलना बचा है",
    filterLabel: "फ़िल्टर",
    fAll: "सब",
    fPending: "बाकी",
    fPaid: "पेड",
    fDrafts: "ड्राफ़्ट",
    noMatch: "कुछ नहीं मिला।",
    noBills: "अभी कोई बिल नहीं।",
    estimate: "अनुमान",
    labourCharge: "मज़दूरी चार्ज",
    heard: "जो सुना गया",
    ledger: "खाता अपडेट हुआ",
    receipt: "रसीद देखें",
    gotUpi: "UPI से मिला",
    gotCash: "कैश मिला",
    pillUpi: "UPI से मिला",
    pillCash: "कैश मिला",
    markPaid: "पेड मार्क करें",
    resend: "फिर भेजें",
    paid: "पेड",
    sentPending: "भेजा · बाकी",
    pendingPill: "बाकी",
    noCustomer: "ग्राहक ?",
    itemsCount: (n: number) => `${n} सामान`,
    queued: "कतार में",
    draft: "ड्राफ़्ट (अधूरा)",
    noItems: "अभी कोई सामान नहीं",
    rateMissing: (n: number) => ` (${n} आइटम का रेट बाकी)`,
    resume: "पूरा करें और जाँचें",
    discard: "हटा दें",
    tipTitle: "बोलिए और तुरंत अपडेट करें",
    tipLead: "नीचे माइक दबाकर बोलें: ",
    tipEx1: "“वर्मा जी का बिल पेड मार्क कर दो”",
    tipOr: " या ",
    tipEx2: "“कल का शर्मा जी वाला बिल भेजो”",
    today: "आज",
    yesterday: "कल",
  },
  english: {
    sectionLabel: "My bills",
    title: "My bills",
    totalBadge: (n: number) => `${n} total`,
    subtitle: "All your bills and payments",
    search: "Search",
    searchPlaceholder: "Name, item or #bill...",
    searchLabel: "Search bills",
    searchClear: "Clear search",
    weekTitle: "This week's earnings",
    billsCount: (n: number) => `${n} ${n === 1 ? "bill" : "bills"}`,
    collectedPct: (n: number) => `Collected ${n}%`,
    collected: (n: number) => `Collected (${n})`,
    collectedSub: "Received",
    pending: (n: number) => `Pending (${n})`,
    pendingSub: "Still to collect",
    filterLabel: "Filter",
    fAll: "All",
    fPending: "Pending",
    fPaid: "Paid",
    fDrafts: "Drafts",
    noMatch: "Nothing found.",
    noBills: "No bills yet.",
    estimate: "Estimate",
    labourCharge: "Labour charge",
    heard: "What was heard",
    ledger: "Accounts updated",
    receipt: "View receipt",
    gotUpi: "Paid by UPI",
    gotCash: "Paid in cash",
    pillUpi: "UPI paid",
    pillCash: "Cash paid",
    markPaid: "Mark paid",
    resend: "Send again",
    paid: "Paid",
    sentPending: "Sent · Due",
    pendingPill: "Due",
    noCustomer: "Customer ?",
    itemsCount: (n: number) => `${n} ${n === 1 ? "item" : "items"}`,
    queued: "In queue",
    draft: "Draft (unfinished)",
    noItems: "No items yet",
    rateMissing: (n: number) => ` (rate missing for ${n} ${n === 1 ? "item" : "items"})`,
    resume: "Finish & check",
    discard: "Delete",
    tipTitle: "Speak to update instantly",
    tipLead: "Press the mic below and say: ",
    tipEx1: "“Mark Verma ji's bill paid”",
    tipOr: " or ",
    tipEx2: "“Send yesterday's bill for Sharma ji”",
    today: "Today",
    yesterday: "Yesterday",
  },
};
type Strings = (typeof T)["hinglish"];
const DATE_LOCALE: Record<UiLangId, string> = {
  hinglish: "en-IN",
  hindi: "hi-IN",
  english: "en-IN",
};

type Filter = "all" | "pending" | "paid" | "drafts";

const when = (iso: string, lang: UiLangId) => {
  const t = T[lang];
  const d = new Date(iso);
  const days = Math.round(
    (new Date(new Date().toDateString()).getTime() - new Date(d.toDateString()).getTime()) /
      86_400_000,
  );
  const time = d.toLocaleTimeString(DATE_LOCALE[lang], { hour: "numeric", minute: "2-digit" });
  if (days === 0) return `${t.today}, ${time}`;
  if (days === 1) return `${t.yesterday}, ${time}`;
  return d.toLocaleDateString(DATE_LOCALE[lang], {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};
const qtyShort = (qty: number, unit: string) =>
  unit === "meter" || unit === "m" ? `${qty}m` : `${qty}`;
const itemSummary = (
  items: { name: string; qty: number; unit: string }[],
  labour: boolean,
  labourLabel: string,
) =>
  [
    ...items.map((i) => `${i.name} (${qtyShort(i.qty, i.unit)})`),
    ...(labour ? [labourLabel] : []),
  ].join(", ");

/** S9 Mere Bills (kaambill_bill_history). Amber = unpaid here (architecture.md §5.5 colour rule). */
export function History({
  store,
  drafts,
  onResend,
  onResume,
}: {
  store: HistoryStore;
  drafts?: DraftStore;
  onResend: (b: FinalBill) => void;
  onResume?: (d: DraftBill) => void;
}) {
  const t = useT(T);
  const { lang } = useUiLang();
  const bills = useSyncExternalStore(store.subscribe, store.list);
  const saved = useSyncExternalStore(drafts?.subscribe ?? noopSubscribe, drafts?.get ?? noDraft);
  const [filter, setFilter] = useState<Filter>("all");
  const [paying, setPaying] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [openTranscript, setOpenTranscript] = useState<string | null>(null);
  const week = summarize(bills, startOfWeek());
  const searchable = (b: FinalBill) => [
    b.customerName,
    b.billNo,
    ...b.items.map((i) => i.name),
    ...(b.transcript ?? []),
  ];
  const shown =
    filter === "drafts"
      ? []
      : bills
          .filter(
            (b) =>
              filter === "all" || (filter === "paid" ? b.status === "paid" : b.status !== "paid"),
          )
          .filter((b) => matchesSearch(q, searchable(b)));
  const draftShown =
    saved &&
    (filter === "drafts" || filter === "all") &&
    matchesSearch(q, [
      saved.draft.customerName,
      ...saved.draft.items.map((i) => i.name),
      ...saved.draft.transcript,
    ])
      ? saved
      : null;
  const pendingCount = bills.filter((b) => b.status !== "paid").length;
  const paidPct = week.total > 0 ? (week.paid / week.total) * 100 : 0;

  const chips: {
    f: Filter;
    label: string;
    count: number;
    dot?: string;
    icon?: string;
    pill: string;
  }[] = [
    { f: "all", label: t.fAll, count: bills.length, pill: "bg-surface-container text-on-surface" },
    {
      f: "pending",
      label: t.fPending,
      count: pendingCount,
      dot: "bg-tertiary-container",
      pill: "bg-tertiary-fixed text-on-tertiary-fixed",
    },
    {
      f: "paid",
      label: t.fPaid,
      count: bills.length - pendingCount,
      dot: "bg-primary-container",
      pill: "bg-primary-fixed text-on-primary-fixed",
    },
    {
      f: "drafts",
      label: t.fDrafts,
      count: saved ? 1 : 0,
      icon: "edit_note",
      pill: "bg-surface-container text-on-surface",
    },
  ];

  return (
    <section className="flex flex-col" aria-label={t.sectionLabel}>
      {/* Heading strip */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
              {t.title}
            </h1>
            <span className="rounded-full bg-primary-container px-2 py-0.5 font-caption text-caption font-semibold text-on-primary">
              {t.totalBadge(bills.length)}
            </span>
          </div>
          <p className="font-caption text-caption text-on-surface-variant">{t.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => setSearchOpen((o) => !o)}
          aria-expanded={searchOpen || q !== ""}
          className="flex min-h-[48px] shrink-0 items-center gap-1.5 rounded-xl bg-surface-container-lowest px-3.5 py-2 font-label-md text-label-md text-on-surface shadow-sm active:scale-95"
        >
          <Icon name="search" className="text-[20px] text-primary-container" />
          <span>{t.search}</span>
        </button>
      </div>
      {(searchOpen || q !== "") && (
        <div className="mb-2 flex w-full items-center rounded-xl bg-surface-container-lowest p-1.5 shadow-sm">
          <Icon name="search" className="ml-2 text-[22px] text-on-surface-variant" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.searchPlaceholder}
            aria-label={t.searchLabel}
            className="w-full bg-transparent px-3 py-2 font-body-md text-body-md text-on-surface outline-none placeholder:text-on-surface-variant"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label={t.searchClear}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container text-primary-container"
            >
              <Icon name="close" className="text-[20px]" />
            </button>
          )}
        </div>
      )}

      {/* Weekly summary */}
      <div className="mb-4 rounded-xl bg-surface-container-lowest p-4 shadow-sm">
        <div className="flex items-start justify-between gap-1 pb-2">
          <div className="flex flex-col">
            <span className="font-caption text-caption font-medium text-on-surface-variant">
              {t.weekTitle}
            </span>
            <p className="mt-0.5 flex items-baseline gap-1.5" data-testid="week-total">
              <span className="tabular font-headline-lg-mobile text-headline-lg-mobile tracking-tight text-on-surface">
                {formatRupees(week.total)}
              </span>
              <span className="font-caption text-caption font-medium text-on-surface-variant">
                · {t.billsCount(week.count)}
              </span>
            </p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-on-primary-fixed">
            <Icon name="trending_up" className="text-[22px] [font-variation-settings:'FILL'_1]" />
          </div>
        </div>
        <div
          className="my-2 flex h-2.5 w-full overflow-hidden rounded-full bg-surface-container"
          role="img"
          aria-label={t.collectedPct(Math.round(paidPct))}
        >
          <div className="h-full bg-primary-container" style={{ width: `${paidPct}%` }} />
          <div
            className="h-full bg-tertiary-container"
            style={{ width: `${week.total > 0 ? (week.pending / week.total) * 100 : 0}%` }}
          />
        </div>
        <div className="grid grid-cols-2 gap-1 pt-1">
          <div className="flex flex-col rounded-lg bg-surface-container-low p-2.5">
            <div className="mb-1 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary-container" />
              <span className="font-caption text-caption font-semibold text-on-surface-variant">
                {t.collected(week.paidCount)}
              </span>
            </div>
            <span className="tabular font-title-lg text-title-lg font-bold text-primary">
              {formatRupees(week.paid)}
            </span>
            <span className="mt-0.5 font-caption text-[11px] text-primary-container">
              {t.collectedSub}
            </span>
          </div>
          <div className="flex flex-col rounded-lg bg-surface-container-low p-2.5">
            <div className="mb-1 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-tertiary-container" />
              <span className="font-caption text-caption font-semibold text-on-surface-variant">
                {t.pending(week.pendingCount)}
              </span>
            </div>
            <span className="tabular font-title-lg text-title-lg font-bold text-tertiary">
              {formatRupees(week.pending)}
            </span>
            <span className="mt-0.5 font-caption text-[11px] text-tertiary-container">
              {t.pendingSub}
            </span>
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div
        className="mb-1 flex items-center gap-1 overflow-x-auto pb-2"
        role="group"
        aria-label={t.filterLabel}
      >
        {chips.map((c) => {
          const on = filter === c.f;
          return (
            <button
              key={c.f}
              type="button"
              aria-pressed={on}
              onClick={() => setFilter(c.f)}
              className={`flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full px-4 py-2 font-label-md text-label-md shadow-sm active:scale-95 ${on ? "bg-primary-container text-on-primary" : "bg-surface-container-lowest text-on-surface"}`}
            >
              {c.dot && !on && <span className={`h-2 w-2 rounded-full ${c.dot}`} />}
              {c.icon && (
                <Icon
                  name={c.icon}
                  className={`text-[16px] ${on ? "" : "text-on-surface-variant"}`}
                />
              )}
              <span>{c.label}</span>{" "}
              <span
                className={`rounded-full px-1.5 py-0.5 font-caption text-[11px] font-bold ${on ? "bg-primary text-on-primary" : c.pill}`}
              >
                {c.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        {shown.length === 0 && !draftShown && (
          <p className="rounded-xl bg-surface-container-lowest p-6 text-center text-body-md text-on-surface-variant shadow-sm">
            {q ? t.noMatch : t.noBills}
          </p>
        )}
        <ul className="flex flex-col gap-2">
          {shown.map((b) => {
            const paid = b.status === "paid";
            return (
              <li
                key={b.billNo}
                className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-4 shadow-sm"
                data-testid={`bill-${b.billNo}`}
              >
                {!paid && (
                  <div className="absolute bottom-0 left-0 top-0 w-1.5 bg-tertiary-container" />
                )}
                <div className="flex items-start justify-between gap-1">
                  <div className={`flex min-w-0 flex-col ${paid ? "" : "pl-1"}`}>
                    <span className="truncate font-headline-md text-headline-md text-on-surface">
                      {b.customerName}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1 font-caption text-caption text-on-surface-variant">
                      <Icon name={paid ? "event_available" : "schedule"} className="text-[14px]" />
                      {when(b.createdAt, lang)} ·{" "}
                      <span className="whitespace-nowrap">#{b.billNo}</span>
                      {b.docType === "Estimate" ? ` · ${t.estimate}` : ""}
                    </span>
                  </div>
                  <div className="flex shrink-0 flex-col items-end">
                    <span
                      className={`tabular font-bold tracking-tight text-on-surface ${paid ? "font-title-lg text-title-lg" : "font-headline-md text-headline-md"}`}
                    >
                      {formatRupees(b.total)}
                    </span>
                    <StatusPill b={b} t={t} />
                  </div>
                </div>
                <div
                  className={`mt-2 flex items-center gap-2 rounded-lg bg-surface-container-low px-2.5 py-2 ${paid ? "" : "ml-1"}`}
                >
                  <Icon
                    name="build_circle"
                    className="shrink-0 text-[18px] text-on-surface-variant"
                  />
                  <p className="truncate font-caption text-caption text-on-surface">
                    {itemSummary(b.items, b.laborCharge > 0, t.labourCharge)}
                  </p>
                </div>
                {((b.transcript?.length ?? 0) > 0 || b.customerPhone) && (
                  <button
                    type="button"
                    onClick={() => setOpenTranscript(openTranscript === b.billNo ? null : b.billNo)}
                    className={`mt-1 min-h-[44px] font-label-md text-label-md text-primary-container ${paid ? "" : "pl-1"}`}
                    aria-expanded={openTranscript === b.billNo}
                  >
                    {openTranscript === b.billNo ? "▾" : "▸"} {t.heard}
                    {b.customerPhone ? ` · 📱 ${b.customerPhone}` : ""}
                  </button>
                )}
                {openTranscript === b.billNo && (
                  <ul
                    className="mt-1 flex flex-col gap-1 rounded-lg bg-surface-container-low p-3 text-body-md"
                    data-testid={`transcript-${b.billNo}`}
                  >
                    {(b.transcript ?? []).map((t, i) => (
                      <li key={i}>“{t}”</li>
                    ))}
                  </ul>
                )}
                {paid ? (
                  <div className="mt-2 flex items-center justify-between gap-1 pt-1">
                    <div className="flex items-center gap-1.5 text-primary">
                      <Icon name="done_all" className="text-[16px]" />
                      <span className="font-caption text-caption font-medium text-primary">
                        {t.ledger}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onResend(b)}
                      className="flex min-h-[48px] items-center gap-1.5 rounded-xl bg-surface-container px-3.5 py-2 font-label-md text-label-md text-on-surface active:scale-95"
                    >
                      <Icon name="receipt_long" className="text-[18px] text-primary-container" />{" "}
                      {t.receipt}
                    </button>
                  </div>
                ) : paying === b.billNo ? (
                  <div className="mt-2 grid grid-cols-2 gap-1 pl-1">
                    <button
                      type="button"
                      onClick={() => {
                        store.markPaid(b.billNo, "upi");
                        setPaying(null);
                      }}
                      className="flex min-h-[52px] items-center justify-center gap-1.5 rounded-xl bg-primary-container font-label-lg text-label-lg text-on-primary shadow-sm"
                    >
                      <Icon name="qr_code_2" className="text-[20px]" /> {t.gotUpi}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        store.markPaid(b.billNo, "cash");
                        setPaying(null);
                      }}
                      className="flex min-h-[52px] items-center justify-center gap-1.5 rounded-xl bg-primary-container font-label-lg text-label-lg text-on-primary shadow-sm"
                    >
                      <Icon name="payments" className="text-[20px]" /> {t.gotCash}
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 grid grid-cols-2 gap-1 pl-1">
                    <button
                      type="button"
                      onClick={() => setPaying(b.billNo)}
                      className="flex min-h-[52px] items-center justify-center gap-1.5 rounded-xl bg-primary-container px-3 py-2.5 font-label-lg text-label-lg text-on-primary shadow-sm"
                    >
                      <Icon
                        name="check_circle"
                        className="text-[20px] [font-variation-settings:'FILL'_1]"
                      />{" "}
                      {t.markPaid}
                    </button>
                    <button
                      type="button"
                      onClick={() => onResend(b)}
                      className="flex min-h-[52px] items-center justify-center gap-1.5 rounded-xl bg-surface-container-lowest px-3 py-2.5 font-label-lg text-label-lg text-primary-container shadow-sm"
                    >
                      <Icon name="chat" className="text-[20px] text-[#25D366]" /> {t.resend}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {draftShown && (
          <article
            className="rounded-xl bg-surface-container-lowest p-4 shadow-sm"
            data-testid="draft-card"
          >
            <div className="flex items-start justify-between gap-1">
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-headline-md text-headline-md text-on-surface">
                  {draftShown.draft.customerName ?? t.noCustomer}
                </span>
                <span className="mt-0.5 flex items-center gap-1 font-caption text-caption text-on-surface-variant">
                  <Icon name="edit_calendar" className="text-[14px]" />
                  {when(new Date(draftShown.savedAt).toISOString(), lang)} ·{" "}
                  {t.itemsCount(draftShown.draft.items.length)}
                </span>
              </div>
              <div className="flex shrink-0 flex-col items-end">
                <span className="tabular font-title-lg text-title-lg font-bold tracking-tight text-on-surface-variant">
                  ~{formatRupees(billTotal(draftShown.draft))}
                </span>
                <span className="mt-1 flex items-center gap-1 whitespace-nowrap rounded-full bg-surface-container px-2.5 py-1 font-caption text-caption font-semibold text-on-surface">
                  <Icon
                    name={draftShown.status === "queued" ? "cloud_off" : "pending"}
                    className="text-[14px]"
                  />
                  {draftShown.status === "queued" ? t.queued : t.draft}
                </span>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-surface-container-low px-2.5 py-2">
              <Icon name="edit_note" className="shrink-0 text-[18px] text-tertiary-container" />
              <p className="truncate font-caption text-caption text-on-surface">
                {itemSummary(
                  draftShown.draft.items,
                  (draftShown.draft.laborCharge ?? 0) > 0,
                  t.labourCharge,
                ) || t.noItems}
                {(() => {
                  const n = draftShown.draft.items.filter((i) => i.unitPrice === null).length;
                  return n ? t.rateMissing(n) : "";
                })()}
              </p>
            </div>
            <div className="mt-2 flex flex-col gap-1 pt-1">
              <button
                type="button"
                onClick={() => onResume?.(draftShown.draft)}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-surface-variant px-4 py-2.5 font-label-md text-label-md font-bold text-on-surface active:scale-95"
              >
                <Icon name="edit" className="text-[18px] text-primary-container" /> {t.resume}
              </button>
              <button
                type="button"
                onClick={() => drafts?.clear()}
                className="min-h-[44px] self-center px-3 font-caption text-caption font-semibold text-on-surface-variant"
              >
                {t.discard}
              </button>
            </div>
          </article>
        )}
      </div>

      {/* Voice tip */}
      <div className="mt-4 flex items-start gap-3 rounded-xl bg-surface-container p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary shadow-sm">
          <Icon name="mic" className="text-[22px]" />
        </div>
        <div className="flex flex-col">
          <span className="font-label-md text-label-md font-bold text-on-surface">
            {t.tipTitle}
          </span>
          <p className="mt-0.5 font-caption text-caption leading-snug text-on-surface-variant">
            {t.tipLead}
            <span className="font-semibold text-on-surface">{t.tipEx1}</span>
            {t.tipOr}
            <span className="font-semibold text-on-surface">{t.tipEx2}</span>
            {lang === "hindi" ? "।" : "."}
          </p>
        </div>
      </div>
    </section>
  );
}

function StatusPill({ b, t }: { b: FinalBill; t: Strings }) {
  if (b.status === "paid") {
    const [icon, label] =
      b.paidVia === "cash"
        ? ["payments", t.pillCash]
        : b.paidVia === "upi"
          ? ["check_circle", t.pillUpi]
          : ["check_circle", t.paid];
    return (
      <span
        className="mt-1 flex items-center gap-1 whitespace-nowrap rounded-full bg-primary-fixed px-2.5 py-1 font-caption text-caption font-semibold text-on-primary-fixed"
        data-testid="paid-pill"
      >
        <Icon name={icon} className="text-[14px] [font-variation-settings:'FILL'_1]" /> {label}
      </span>
    );
  }
  return (
    <span className="mt-1 flex items-center gap-1 whitespace-nowrap rounded-full bg-tertiary-fixed px-2.5 py-1 font-caption text-caption font-semibold text-on-tertiary-fixed">
      <Icon name="hourglass_top" className="text-[14px]" />{" "}
      {b.status === "shared" ? t.sentPending : t.pendingPill}
    </span>
  );
}

const noopSubscribe = () => () => {};
const noDraft = () => null;
