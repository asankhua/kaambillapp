import type { RateCardEntry } from "@kaambill/shared";
import type { Question, Utterance } from "../../../phase-2-voice-core/src/machine/types";
import { Icon } from "../../../phase-1-ui-ux-design/src/Icon";
import { billTotal, itemCount, lineStatus, type DraftBill, type LineItem } from "../bill/model";
import { formatRupees, spokenQty } from "../speech";
import { useT, type UiLangId } from "../../../phase-2-voice-core/src/ui/lang";

const HINGLISH = {
  hello: (name: string) => `Namaste, ${name}`,
  liveMode: "Live bill mode",
  youSaid: "Aapne kaha",
  customerUnknown: "Grahak ?",
  customer: "Grahak",
  items: (n: number) => `${n} items`,
  oneQuestionLeft: "1 sawaal baki",
  questionAria: "Sawaal",
  appQuestion: "KaamBill ka sawaal",
  notInRateCard: "Rate card mein nahi mila · 1 sawaal",
  addedToBill: (customer: string, what: string) =>
    `${customer} ke bill mein ${what} joda gaya hai.`,
  likePrice: (from: string) => `${from} jaisa`,
  sayAnswer: "Boliye jawab",
  type: "Likh ke",
  decideLater: "Baad mein tay karein",
  today: "Aaj",
  estimate: "Estimate",
  bill: "Bill",
  allOk: "Sab theek",
  ratesChecked: (n: number) => `${n} items · rate check ho gaye`,
  readBackAria: "Read-back",
  checkTotal: "Total check karein",
  finalTotal: "Kul rashi (final)",
  whatsappNote: (customer: string) =>
    `Haan bolte hi WhatsApp khulega — bill aur UPI QR ready honge. Aap Send dabayenge tabhi ${customer} ko jayega.`,
  makeChanges: "Badlav karein",
  yesSend: "Haan, bhejo",
  sayOrType: "Bolkar ya likh kar:",
  yesWord: "“Haan”",
  or: "ya",
  sendWord: "“Bhej do”",
  newBill: "Naya bill",
  queueAria: "Queue",
  inQueue: "Queue mein ⏳",
  queueNote: "Net aate hi bill aur UPI QR ban jayega — kaam ruka nahi hai",
  quickAddTitle: "Jaldi jodne ke liye tap karein:",
  quickAddAria: "Jaldi jodne ke liye",
  quickAddChips: ["+ Finolex Wire 10 meter", "+ Labour ₹500", "+ 1 MCB", "+ Visiting ₹200"],
  /** Word that replaces the "+ " when a chip is sent as text. */
  quickAddPrefix: "aur ",
};

const T: Record<UiLangId, typeof HINGLISH> = {
  hinglish: HINGLISH,
  hindi: {
    hello: (name) => `नमस्ते, ${name}`,
    liveMode: "लाइव बिल मोड",
    youSaid: "आपने कहा",
    customerUnknown: "ग्राहक ?",
    customer: "ग्राहक",
    items: (n) => `${n} आइटम`,
    oneQuestionLeft: "1 सवाल बाकी",
    questionAria: "सवाल",
    appQuestion: "KaamBill का सवाल",
    notInRateCard: "रेट कार्ड में नहीं मिला · 1 सवाल",
    addedToBill: (customer, what) => `${customer} के बिल में ${what} जोड़ा गया है।`,
    likePrice: (from) => `${from} जैसा`,
    sayAnswer: "जवाब बोलिए",
    type: "लिखकर",
    decideLater: "बाद में तय करें",
    today: "आज",
    estimate: "एस्टिमेट",
    bill: "बिल",
    allOk: "सब ठीक",
    ratesChecked: (n) => `${n} आइटम · रेट चेक हो गए`,
    readBackAria: "टोटल की जाँच",
    checkTotal: "टोटल चेक करें",
    finalTotal: "कुल राशि (फ़ाइनल)",
    whatsappNote: (customer) =>
      `हाँ बोलते ही WhatsApp खुलेगा — बिल और UPI QR तैयार होंगे। आप Send दबाएँगे तभी ${customer} को जाएगा।`,
    makeChanges: "बदलाव करें",
    yesSend: "हाँ, भेजो",
    sayOrType: "बोलकर या लिखकर:",
    yesWord: "“हाँ”",
    or: "या",
    sendWord: "“भेज दो”",
    newBill: "नया बिल",
    queueAria: "कतार",
    inQueue: "कतार में ⏳",
    queueNote: "नेट आते ही बिल और UPI QR बन जाएगा — काम रुका नहीं है",
    quickAddTitle: "जल्दी जोड़ने के लिए टैप करें:",
    quickAddAria: "जल्दी जोड़ने के लिए",
    quickAddChips: ["+ Finolex वायर 10 मीटर", "+ लेबर ₹500", "+ 1 MCB", "+ विज़िटिंग ₹200"],
    quickAddPrefix: "और ",
  },
  english: {
    hello: (name) => `Hello, ${name}`,
    liveMode: "Live bill mode",
    youSaid: "You said",
    customerUnknown: "Customer ?",
    customer: "Customer",
    items: (n) => `${n} items`,
    oneQuestionLeft: "1 question left",
    questionAria: "Question",
    appQuestion: "KaamBill asks",
    notInRateCard: "Not in rate card · 1 question",
    addedToBill: (customer, what) => `${what} added to ${customer}'s bill.`,
    likePrice: (from) => `Like ${from}`,
    sayAnswer: "Speak",
    type: "Type",
    decideLater: "Decide later",
    today: "Today",
    estimate: "Estimate",
    bill: "Bill",
    allOk: "All OK",
    ratesChecked: (n) => `${n} items · rates checked`,
    readBackAria: "Total check",
    checkTotal: "Check the total",
    finalTotal: "Total amount (final)",
    whatsappNote: (customer) =>
      `Say Yes and WhatsApp opens with the bill and UPI QR ready. It goes to ${customer} only when you tap Send.`,
    makeChanges: "Change",
    yesSend: "Yes, send",
    sayOrType: "Say or type:",
    yesWord: "“Yes”",
    or: "or",
    sendWord: "“Send”",
    newBill: "New bill",
    queueAria: "Queue",
    inQueue: "In queue ⏳",
    queueNote: "The bill and UPI QR will be made when the net is back — your work is not stopped",
    quickAddTitle: "Tap to add quickly:",
    quickAddAria: "Quick add",
    quickAddChips: ["+ Finolex wire 10 metres", "+ Labour ₹500", "+ 1 MCB", "+ Visiting ₹200"],
    quickAddPrefix: "add ",
  },
};

/** S3 worker strip (kaambill_live_bill_assembling): "Namaste, …" + LIVE BILL MODE chip. */
export function LiveBillStrip({ name, sub }: { name: string; sub?: string | null }) {
  const t = useT(T);
  return (
    <div className="flex items-center justify-between gap-2 px-1">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-on-primary-fixed shadow-sm">
          <Icon name="electric_bolt" className="text-[18px]" />
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-label-md text-label-md text-on-surface">
            {t.hello(name)}
          </span>
          {sub && (
            <span className="truncate font-caption text-caption text-on-surface-variant">
              {sub}
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary-fixed px-3 py-1.5 text-on-primary-fixed shadow-sm">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-container opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-container" />
        </span>
        <span className="font-caption text-[11px] font-bold uppercase tracking-wider">
          {t.liveMode}
        </span>
      </div>
    </div>
  );
}

/** S3 transcript card: what the worker said or typed for this bill (fix F3: no "Wispr AI"). */
export function HeardCard({ text }: { text: string }) {
  const t = useT(T);
  return (
    <div className="rounded-xl bg-surface-container-high p-3.5 shadow-sm">
      <p className="mb-1.5 flex items-center gap-1.5 font-caption text-caption font-bold text-primary-container">
        <Icon name="graphic_eq" className="text-[18px]" /> {t.youSaid}
      </p>
      <p
        className="font-body-md text-body-md font-medium italic leading-snug text-on-surface"
        data-testid="heard"
      >
        “{text}”
      </p>
    </div>
  );
}

/** S4 summary header (kaambill_sawaal_clarifying_question): who the bill is for + "1 sawaal baki". */
export function QuestionSummary({ draft }: { draft: DraftBill }) {
  const t = useT(T);
  const name = draft.customerName ?? t.customerUnknown;
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface-container-lowest p-3.5 shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-fixed font-headline-md text-headline-md text-on-primary-fixed">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-headline-md text-headline-md leading-tight text-on-surface">
            {name}
          </span>
          <span className="truncate font-caption text-caption text-on-surface-variant">
            {t.items(itemCount(draft))} · {formatRupees(billTotal(draft))}*
          </span>
        </div>
      </div>
      <span className="flex shrink-0 items-center gap-1 font-label-md text-label-md text-tertiary">
        <span className="h-2 w-2 rounded-full bg-tertiary" /> {t.oneQuestionLeft}
      </span>
    </div>
  );
}

/** A real price hint for an unknown item: a similar rate-card entry (S4 price chips). */
export interface PriceHint {
  price: number;
  unit: string;
  from: string;
}

const tokens = (s: string) =>
  s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !/^\d/.test(t));

/** Up to 2 rate-card entries sharing a word with the item ("Finolex wire 2.5mm" → Finolex Wire 1.5 sq mm ₹25/m). */
export function similarRates(entries: RateCardEntry[], line: LineItem | undefined): PriceHint[] {
  if (!line) return [];
  const mine = new Set([...tokens(line.name), ...tokens(line.heard)]);
  return entries
    .map((e) => ({
      e,
      score: tokens(`${e.name} ${e.aliases.join(" ")}`).filter((t) => mine.has(t)).length,
    }))
    .filter((x) => x.score > 0 && x.e.category !== "labour")
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map(({ e }) => ({ price: e.price, unit: e.unit, from: e.name }));
}

/**
 * S4 Question (kaambill_sawaal_clarifying_question): ONE question, shown BELOW the dimmed bill.
 * Price chips come from `q.quickReplies` or from similar rate-card entries (`prices`). No audio wording.
 */
export function QuestionBanner({
  q,
  line,
  customer,
  prices = [],
  onPrice,
  onReply,
  onSkip,
  onType,
  onMic,
}: {
  q: Question;
  line?: LineItem;
  customer?: string | null;
  prices?: PriceHint[];
  onPrice?: (p: PriceHint) => void;
  onReply: (t: string) => void;
  onSkip: () => void;
  onType: () => void;
  onMic?: () => void;
}) {
  const t = useT(T);
  const priceQuestion = !!line && lineStatus(line) === "pending";
  return (
    <section
      role="dialog"
      aria-label={t.questionAria}
      className="flex flex-col gap-3 rounded-2xl bg-surface-container-lowest p-4 shadow-lg"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-full bg-primary-fixed px-3 py-1.5 font-caption text-[11px] font-bold uppercase tracking-wider text-on-primary-fixed">
          <Icon name="quiz" className="text-[16px]" /> {t.appQuestion}
        </span>
        {priceQuestion && (
          <span className="flex items-center gap-1 rounded-full bg-surface-container px-3 py-1.5 font-caption text-caption text-on-surface">
            <Icon name="search_off" className="text-[16px]" /> {t.notInRateCard}
          </span>
        )}
      </div>
      <div>
        <p className="font-headline-md text-headline-md leading-snug text-on-surface">{q.text}</p>
        {line && customer && (
          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
            {t.addedToBill(
              customer,
              `${spokenQty(line.qty, line.unit)} ${line.heard || line.name}`,
            )}
          </p>
        )}
      </div>
      {(prices.length > 0 || !!q.quickReplies?.length) && (
        <div className="grid grid-cols-2 gap-2.5">
          {prices.map((p) => (
            <button
              key={`${p.from}-${p.price}`}
              type="button"
              onClick={() => onPrice?.(p)}
              className="flex min-h-[56px] flex-col items-start rounded-xl bg-surface-container-low px-3 py-2 text-left active:scale-95"
            >
              <span className="font-headline-md text-headline-md text-on-surface">
                {formatRupees(p.price)}
                <span className="font-caption text-caption text-on-surface-variant">
                  {" "}
                  / {p.unit}
                </span>
              </span>
              <span className="line-clamp-1 font-caption text-caption text-on-surface-variant">
                {t.likePrice(p.from)}
              </span>
            </button>
          ))}
          {q.quickReplies?.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onReply(r)}
              className="min-h-[56px] rounded-xl bg-surface-container-low px-3 font-label-lg text-label-lg text-on-surface active:scale-95"
            >
              {r}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-[1.4fr_1fr] gap-2.5">
        {onMic ? (
          <button
            type="button"
            onClick={onMic}
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-primary-container px-3 font-label-lg text-label-lg text-on-primary shadow-sm active:scale-95"
          >
            <Icon name="mic" /> {t.sayAnswer}
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={onType}
          className="flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-surface-container px-3 font-label-lg text-label-lg text-on-surface active:scale-95"
        >
          <Icon name="edit" /> {t.type}
        </button>
      </div>
      {q.targetId && (
        <button
          type="button"
          onClick={onSkip}
          className="flex min-h-[44px] items-center justify-center gap-1.5 font-label-md text-label-md text-on-surface-variant"
        >
          <Icon name="schedule" className="text-[18px]" /> {t.decideLater}
        </button>
      )}
    </section>
  );
}

/** S6 status header (kaambill_read_back_aur_approval): customer, "Sab theek", n items checked. */
export function ReadBackStatus({ draft }: { draft: DraftBill }) {
  const t = useT(T);
  const allOk = draft.items.every((l) => lineStatus(l) === "ok");
  const n = itemCount(draft);
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-surface-container-lowest p-3.5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-container text-primary-container">
            <Icon name="person" className="text-[26px] [font-variation-settings:'FILL'_1]" />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-headline-md text-headline-md leading-tight text-on-surface">
              {draft.customerName ?? t.customer}
            </span>
            <span className="font-caption text-caption text-on-surface-variant">
              {t.today} · {draft.docType === "Estimate" ? t.estimate : t.bill}
            </span>
          </div>
        </div>
        {allOk && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary-fixed px-2.5 py-1 font-label-md text-label-md text-on-primary-fixed">
            <Icon name="check_circle" className="text-[16px]" /> {t.allOk}
          </span>
        )}
      </div>
      <div className="rounded-lg bg-surface-container-low px-3 py-2 text-center font-label-md text-label-md text-on-surface">
        {t.ratesChecked(n)}
      </div>
    </div>
  );
}

/**
 * S6 Read-back card + approval (kaambill_read_back_aur_approval). Shown AFTER the item checklist.
 * Fix F2: WhatsApp OPENS; the worker presses Send. Fix F8: no photos. No audio: on-screen only.
 */
export function ReadBackPanel({
  u,
  total,
  customer,
  onApprove,
  onEdit,
}: {
  u: Utterance;
  total: string;
  customer: string;
  onApprove: () => void;
  onEdit: () => void;
}) {
  const t = useT(T);
  return (
    <section
      aria-label={t.readBackAria}
      className="flex flex-col gap-3 rounded-2xl bg-surface-container-lowest p-4 shadow-sm"
    >
      <div className="rounded-xl bg-primary-container p-4 text-on-primary shadow-sm">
        <p className="flex items-center gap-2 font-label-md text-label-md font-bold uppercase tracking-wide">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
            <Icon name="fact_check" className="text-[18px]" />
          </span>{" "}
          {t.checkTotal}
        </p>
        <p className="mt-2 font-headline-md text-headline-md leading-snug" data-testid="readback">
          “{u.text}”
        </p>
      </div>
      <div className="rounded-xl bg-surface-container-low p-4 text-center">
        <p className="font-label-md text-label-md uppercase text-on-surface-variant">
          {t.finalTotal}
        </p>
        <p className="tabular font-headline-xl text-headline-xl text-primary-container">{total}</p>
        <p className="mt-1 font-caption text-caption text-on-surface-variant">
          {t.whatsappNote(customer)}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onEdit}
          className="flex min-h-[56px] items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-surface-container px-2 font-label-lg text-[17px] font-bold text-on-surface active:scale-95"
        >
          <Icon name="edit_note" /> {t.makeChanges}
        </button>
        <button
          type="button"
          onClick={onApprove}
          className="flex min-h-[56px] items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-primary-container px-2 font-label-lg text-[17px] font-bold text-on-primary shadow-sm active:scale-95"
        >
          <Icon name="send" /> {t.yesSend}
        </button>
      </div>
      <p className="text-center font-body-md text-body-md text-on-surface-variant">
        <Icon name="mic" className="align-middle text-[18px] text-primary-container" />{" "}
        {t.sayOrType} <b className="text-primary-container">{t.yesWord}</b> {t.or}{" "}
        <b className="text-primary-container">{t.sendWord}</b>
      </p>
    </section>
  );
}

/** S10b queued bill card (kaambill_offline_queue_mode): what is saved on the phone, waiting for the net. */
export function QueuedCard({ draft }: { draft: DraftBill }) {
  const t = useT(T);
  if (!draft.queued.length) return null;
  return (
    <section
      aria-label={t.queueAria}
      className="flex flex-col gap-3 rounded-2xl bg-surface-container-lowest p-4 shadow-md"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-headline-md text-headline-md text-on-surface">
          {draft.customerName ?? t.newBill}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-surface-container px-3 py-1 font-label-md text-label-md text-on-surface">
          <Icon name="sync" className="text-[16px]" /> {t.inQueue}
        </span>
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-surface-container-low p-3 font-caption text-caption text-on-surface">
        <Icon name="wifi_off" className="text-[20px] text-secondary" /> {t.queueNote}
      </div>
      <ul className="flex flex-col gap-2">
        {draft.queued.map((t, i) => (
          <li key={i} className="flex items-start gap-2 rounded-xl bg-surface-container-low p-3">
            <Icon name="save" className="mt-0.5 text-[20px] text-primary-container" />
            <span className="font-body-md text-body-md italic text-on-surface">“{t.text}”</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** S10a quick-add chips (kaambill_mic_blocked_fallback). */
export function QuickAddChips({ onAdd }: { onAdd: (text: string) => void }) {
  const t = useT(T);
  const chips = t.quickAddChips;
  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-center gap-1.5 font-label-md text-label-md text-on-surface">
        <Icon name="touch_app" className="text-[18px]" /> {t.quickAddTitle}
      </p>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" aria-label={t.quickAddAria}>
        {chips.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onAdd(c.replace(/^\+\s*/, t.quickAddPrefix).replace("₹", ""))}
            className="flex min-h-[48px] shrink-0 items-center gap-1 rounded-xl bg-surface-container px-3 font-label-lg text-label-lg text-on-surface active:scale-95"
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
