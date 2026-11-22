import { useState, type ReactNode } from "react";
import type { Question } from "../../../phase-2-voice-core/src/machine/types";
import {
  billTotal,
  itemCount,
  lineStatus,
  lineTotal,
  materialTotal,
  type DraftBill,
  type LineItem,
} from "../bill/model";
import { formatRupees, spokenQty } from "../speech";
import { Icon } from "../../../phase-1-ui-ux-design/src/Icon";
import { useT, type UiLangId } from "../../../phase-2-voice-core/src/ui/lang";

const HINGLISH = {
  billAria: "Bill",
  labour: "Labour / Mazdoori",
  visiting: "Visiting charge",
  itemsHeader: "Saman aur mazdoori",
  items: (n: number) => `${n} items`,
  roughTotal: "Kaccha total",
  grandTotal: "Kul rashi",
  itemDetails: "Item details",
  tapToChange: "Badalne ke liye tap karein",
  estimate: "Estimate",
  draftBill: "Kachha bill",
  live: "Live",
  autoCalc: "Auto-calc",
  customerUnknown: "Grahak ?",
  editCustomerAria: "Grahak ka naam badlein",
  today: "Aaj",
  itemsAdded: (n: number) => `${n} items jode`,
  toCheck: (n: number) => `? ${n} item check karein`,
  customerName: "Grahak ka naam",
  listHeader: "Kaam & saman list",
  fromRateCard: "Rate card se jude hain ✓",
  waTitle: "Grahak ko WhatsApp par bhejenge",
  waSub: "Total check karne ke baad bill + UPI QR ke saath WhatsApp khulega; Send aap dabayenge",
  addItem: "+ Item jodein",
  discountBtn: "Discount / Chhoot",
  discountLabel: "Chhoot (₹)",
  readBackCta: "Total dekhein aur bhejein →",
  materials: (n: number) => `${n} saman`,
  labourService: "Mazdoori / service",
  discountRow: "Chhoot / discount",
  discountNone: " (nahi)",
  afterCheck: "Check ke baad pakka",
  billOrEstimate: "Bill / Estimate",
  editLineAria: (name: string) => `${name} badlein`,
  checkChip: "Check karein",
  estimated: "Anumanit",
  confirmAria: "Confirm",
  heard: "Suna gaya",
  ratePreview: "Rate preview",
  yesRight: "Haan, sahi hai",
  change: "Badlein",
  sayOrType: "Bolkar ya likh kar:",
  yesWord: "“Haan”",
  orRightLength: "ya sahi lambai",
  pleaseCheck: (q: string) => `Kripya check karein — ${q} suna gaya`,
  fix: "Sahi karein",
  confirmRate: "Rate confirm karein",
  later: " · baad mein",
  pending: "Pending",
  materialTag: "· Saman",
  justAdded: "Abhi joda gaya ✨",
  ok: "Ok",
  qty: (unit: string) => `Qty (${unit})`,
  rate: "Rate (₹)",
  done: "Theek",
  serviceTag: "Service",
  seva: "Seva",
};
type Strings = typeof HINGLISH;

const T: Record<UiLangId, Strings> = {
  hinglish: HINGLISH,
  hindi: {
    billAria: "बिल",
    labour: "लेबर / मज़दूरी",
    visiting: "विज़िटिंग चार्ज",
    itemsHeader: "सामान और मज़दूरी",
    items: (n) => `${n} आइटम`,
    roughTotal: "कच्चा टोटल",
    grandTotal: "कुल राशि",
    itemDetails: "आइटम लिस्ट",
    tapToChange: "बदलने के लिए टैप करें",
    estimate: "एस्टिमेट",
    draftBill: "कच्चा बिल",
    live: "लाइव",
    autoCalc: "ऑटो हिसाब",
    customerUnknown: "ग्राहक ?",
    editCustomerAria: "ग्राहक का नाम बदलें",
    today: "आज",
    itemsAdded: (n) => `${n} आइटम जोड़े`,
    toCheck: (n) => `? ${n} आइटम चेक करें`,
    customerName: "ग्राहक का नाम",
    listHeader: "काम और सामान की लिस्ट",
    fromRateCard: "रेट कार्ड से जुड़े हैं ✓",
    waTitle: "ग्राहक को WhatsApp पर भेजेंगे",
    waSub: "टोटल चेक करने के बाद बिल + UPI QR के साथ WhatsApp खुलेगा; Send आप दबाएँगे",
    addItem: "+ आइटम जोड़ें",
    discountBtn: "डिस्काउंट / छूट",
    discountLabel: "छूट (₹)",
    readBackCta: "टोटल देखें और भेजें →",
    materials: (n) => `${n} सामान`,
    labourService: "मज़दूरी / सर्विस",
    discountRow: "छूट / डिस्काउंट",
    discountNone: " (नहीं)",
    afterCheck: "चेक के बाद पक्का",
    billOrEstimate: "बिल / अनुमान",
    editLineAria: (name) => `${name} बदलें`,
    checkChip: "चेक करें",
    estimated: "अनुमानित",
    confirmAria: "पक्का करें",
    heard: "सुना गया",
    ratePreview: "रेट का हिसाब",
    yesRight: "हाँ, सही है",
    change: "बदलें",
    sayOrType: "बोलकर या लिखकर:",
    yesWord: "“हाँ”",
    orRightLength: "या सही लंबाई",
    pleaseCheck: (q) => `कृपया चेक करें — ${q} सुना गया`,
    fix: "सही करें",
    confirmRate: "रेट पक्का करें",
    later: " · बाद में",
    pending: "बाकी",
    materialTag: "· सामान",
    justAdded: "अभी जोड़ा गया ✨",
    ok: "ठीक",
    qty: (unit) => `मात्रा (${unit})`,
    rate: "रेट (₹)",
    done: "ठीक",
    serviceTag: "सर्विस",
    seva: "सेवा",
  },
  english: {
    billAria: "Bill",
    labour: "Labour",
    visiting: "Visiting charge",
    itemsHeader: "Materials and labour",
    items: (n) => `${n} items`,
    roughTotal: "Rough total",
    grandTotal: "Total amount",
    itemDetails: "Item details",
    tapToChange: "Tap to change",
    estimate: "Estimate",
    draftBill: "Draft bill",
    live: "Live",
    autoCalc: "Auto-calc",
    customerUnknown: "Customer ?",
    editCustomerAria: "Change customer name",
    today: "Today",
    itemsAdded: (n) => `${n} items added`,
    toCheck: (n) => `? Check ${n} ${n === 1 ? "item" : "items"}`,
    customerName: "Customer name",
    listHeader: "Work & materials",
    fromRateCard: "From your rate card ✓",
    waTitle: "Goes to the customer on WhatsApp",
    waSub: "After you check the total, WhatsApp opens with the bill + UPI QR; you tap Send",
    addItem: "+ Add item",
    discountBtn: "Discount",
    discountLabel: "Discount (₹)",
    readBackCta: "Check total and send →",
    materials: (n) => `${n} ${n === 1 ? "material" : "materials"}`,
    labourService: "Labour / service",
    discountRow: "Discount",
    discountNone: " (none)",
    afterCheck: "Final after check",
    billOrEstimate: "Bill / Estimate",
    editLineAria: (name) => `Change ${name}`,
    checkChip: "Check",
    estimated: "Estimated",
    confirmAria: "Confirm",
    heard: "Heard",
    ratePreview: "Rate preview",
    yesRight: "Yes, correct",
    change: "Change",
    sayOrType: "Say or type:",
    yesWord: "“Yes”",
    orRightLength: "or the right length",
    pleaseCheck: (q) => `Please check — heard ${q}`,
    fix: "Fix",
    confirmRate: "Confirm rate",
    later: " · later",
    pending: "Pending",
    materialTag: "· Material",
    justAdded: "Just added ✨",
    ok: "OK",
    qty: (unit) => `Qty (${unit})`,
    rate: "Rate (₹)",
    done: "OK",
    serviceTag: "Service",
    seva: "Service",
  },
};

/**
 * The bill card, in three looks (all from the Stitch export):
 * - "live"   S3 kaambill_live_bill_assembling (+ S5: the amber row holds the confirm question inline)
 * - "dimmed" S4 kaambill_sawaal_clarifying_question (bill dimmed above the question card)
 * - "review" S6 kaambill_read_back_aur_approval (item checklist with ✓ before the read-back)
 * Fix F1: the CTA leads to the read-back, never to sharing. Fix F4: no tax claims.
 */
export type InvoiceMode = "live" | "dimmed" | "review";

export function InvoiceCard({
  draft,
  focusId,
  onEditLine,
  onEditCharges,
  onAddItem,
  onReadBack,
  canReadBack,
  mode = "live",
  confirm,
}: {
  draft: DraftBill;
  focusId?: string | null;
  onEditLine: (id: string, patch: { qty: number; unitPrice: number | null }) => void;
  onEditCharges: (
    patch: Partial<Pick<DraftBill, "laborCharge" | "visitingCharge" | "discount" | "customerName">>,
  ) => void;
  onAddItem: () => void;
  onReadBack?: () => void;
  canReadBack: boolean;
  mode?: InvoiceMode;
  /** S5: the open low-confidence question; shown inside the amber row it is about. */
  confirm?: { q: Question; onYes: () => void } | null;
}) {
  const t = useT(T);
  const [editing, setEditing] = useState<string | null>(null);
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const toCheck = draft.items.filter((l) => lineStatus(l) !== "ok").length;
  const confirmId = confirm?.q.targetId ?? null;
  const dimOk = mode === "dimmed" || !!confirmId;
  const toggle = (id: string) => setEditing(editing === id ? null : id);
  const lines = draft.items.map((l) => (
    <ItemRow
      key={l.id}
      line={l}
      mode={mode}
      focused={focusId === l.id}
      dim={dimOk && lineStatus(l) === "ok"}
      justAdded={draft.lastChangedId === l.id}
      editing={editing === l.id}
      confirm={confirm && confirmId === l.id ? confirm : null}
      onTap={() => toggle(l.id)}
      onSave={(patch) => {
        setEditing(null);
        onEditLine(l.id, patch);
      }}
    />
  ));
  const charges = (
    <>
      {draft.laborCharge !== null && (
        <ChargeRow
          icon="engineering"
          label={t.labour}
          amount={draft.laborCharge}
          mode={mode}
          dim={dimOk}
          editing={editing === "labour"}
          onTap={() => toggle("labour")}
          onSave={(v) => {
            setEditing(null);
            onEditCharges({ laborCharge: v });
          }}
        />
      )}
      {draft.visitingCharge !== null && (
        <ChargeRow
          icon="directions_bike"
          label={t.visiting}
          amount={draft.visitingCharge}
          mode={mode}
          dim={dimOk}
          editing={editing === "visiting"}
          onTap={() => toggle("visiting")}
          onSave={(v) => {
            setEditing(null);
            onEditCharges({ visitingCharge: v });
          }}
        />
      )}
    </>
  );
  const totalNumber = (
    <>
      <span data-testid="bill-total">{formatRupees(billTotal(draft))}</span>
      {toCheck ? <span className="text-amber">*</span> : null}
    </>
  );

  if (mode === "dimmed")
    return (
      <section
        className="flex flex-col gap-3 rounded-2xl bg-surface-container-lowest p-4 shadow-sm"
        aria-label={t.billAria}
      >
        <div className="flex items-center justify-between px-1 opacity-60">
          <span className="font-label-lg text-label-lg text-on-surface-variant">
            {t.itemsHeader}
          </span>
          <span className="font-caption text-caption text-on-surface-variant">
            {t.items(itemCount(draft))}
          </span>
        </div>
        <ul className="flex flex-col gap-2.5">
          {lines}
          {charges}
        </ul>
        <div className="flex items-center justify-between px-1 pt-1">
          <span className="font-body-lg text-body-lg text-on-surface-variant opacity-70">
            {toCheck ? t.roughTotal : t.grandTotal}
          </span>
          <span className="tabular font-headline-lg-mobile text-headline-lg-mobile text-on-surface-variant">
            {totalNumber}
          </span>
        </div>
      </section>
    );

  if (mode === "review")
    return (
      <section
        className="flex flex-col gap-3 rounded-2xl bg-surface-container-lowest p-4 shadow-sm"
        aria-label={t.billAria}
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 font-title-lg text-title-lg text-on-surface">
            <Icon name="format_list_bulleted" className="text-primary-container" /> {t.itemDetails}
          </span>
          <span className="font-caption text-caption text-on-surface-variant">{t.tapToChange}</span>
        </div>
        <ul className="flex flex-col gap-2.5">
          {lines}
          {charges}
        </ul>
        <Totals draft={draft} toCheck={toCheck} totalNumber={totalNumber} flat />
      </section>
    );

  return (
    <section
      className="flex flex-col gap-4 rounded-2xl bg-surface-container-lowest p-4 shadow-md"
      aria-label={t.billAria}
    >
      <div className="rounded-xl bg-surface-container-low/60 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="whitespace-nowrap rounded-md bg-primary-container px-2 py-0.5 font-caption text-[11px] font-bold uppercase tracking-wider text-on-primary">
                {draft.docType === "Estimate" ? t.estimate : t.draftBill} → {t.live}
              </span>
              <span className="flex items-center gap-0.5 whitespace-nowrap font-caption text-[11px] text-on-surface-variant">
                <Icon name="auto_awesome" className="text-[14px] text-primary-container" />{" "}
                {t.autoCalc}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="truncate font-headline-lg-mobile text-headline-lg-mobile leading-tight text-on-surface">
                {draft.customerName ?? t.customerUnknown}
              </span>
              <button
                type="button"
                onClick={() => toggle("customer")}
                aria-label={t.editCustomerAria}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant active:scale-95"
              >
                <Icon name="edit" className="text-[16px]" />
              </button>
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 font-caption text-caption text-on-surface-variant">
              <Icon name="schedule" className="text-[15px]" /> {today} · {t.today}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="rounded-full bg-secondary-fixed px-2 py-0.5 font-caption text-[11px] font-semibold text-on-secondary-fixed">
              {t.itemsAdded(itemCount(draft))}
            </span>
            {toCheck > 0 && (
              <span
                className="rounded-full bg-[#FEF3C7] px-2 py-0.5 font-caption text-[11px] font-bold text-[#92400E]"
                data-testid="to-check"
              >
                {t.toCheck(toCheck)}
              </span>
            )}
          </div>
        </div>
        {editing === "customer" && (
          <InlineText
            initial={draft.customerName ?? ""}
            label={t.customerName}
            onDone={(v) => {
              setEditing(null);
              if (v) onEditCharges({ customerName: v });
            }}
          />
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="font-caption text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            {t.listHeader}
          </span>
          <span className="font-caption text-caption font-semibold text-primary-container">
            {t.fromRateCard}
          </span>
        </div>
        <ul className="flex flex-col gap-2.5">
          {lines}
          {charges}
        </ul>
      </div>

      <Totals draft={draft} toCheck={toCheck} totalNumber={totalNumber} />

      <div className="flex items-center gap-3 rounded-xl bg-surface-container p-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary shadow-sm">
          <Icon name="chat" className="text-[20px]" />
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="font-label-md text-label-md leading-tight text-on-surface">
            {t.waTitle}
          </span>
          <span className="font-caption text-caption text-on-surface-variant">{t.waSub}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={onAddItem}
          className="flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-surface-container-high px-3 font-label-md text-label-md text-on-surface shadow-sm active:scale-95"
        >
          <Icon name="add_circle" className="text-[20px] text-primary-container" /> {t.addItem}
        </button>
        <button
          type="button"
          onClick={() => toggle("discount")}
          className="flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-surface-container-high px-3 font-label-md text-label-md text-on-surface shadow-sm active:scale-95"
        >
          <Icon name="percent" className="text-[20px] text-tertiary" /> {t.discountBtn}
        </button>
      </div>
      {editing === "discount" && (
        <InlineNumber
          initial={draft.discount ?? 0}
          label={t.discountLabel}
          onDone={(v) => {
            setEditing(null);
            onEditCharges({ discount: v || null });
          }}
        />
      )}

      {canReadBack && onReadBack && (
        <button
          type="button"
          onClick={onReadBack}
          className="flex min-h-[56px] w-full items-center justify-center gap-3 rounded-xl bg-primary-container px-3 py-3 font-title-lg text-[19px] font-bold text-on-primary shadow-[0_4px_14px_rgba(11,122,75,0.3)] active:scale-95"
        >
          <Icon name="fact_check" className="text-[24px]" />{" "}
          <span className="whitespace-nowrap tracking-tight">{t.readBackCta}</span>
        </button>
      )}
    </section>
  );
}

function Totals({
  draft,
  toCheck,
  totalNumber,
  flat = false,
}: {
  draft: DraftBill;
  toCheck: number;
  totalNumber: ReactNode;
  flat?: boolean;
}) {
  const t = useT(T);
  const service = (draft.laborCharge ?? 0) + (draft.visitingCharge ?? 0);
  return (
    <div
      className={`flex flex-col gap-2.5 rounded-xl ${flat ? "px-1 pt-1" : "bg-surface-container-low p-3.5"}`}
    >
      <Row label={t.materials(draft.items.length)} value={formatRupees(materialTotal(draft))} />
      <Row label={t.labourService} value={formatRupees(service)} />
      <div className="flex items-center justify-between font-caption text-caption text-on-surface-variant">
        <span>
          {t.discountRow}
          {draft.discount ? "" : t.discountNone}
        </span>
        <span className="tabular font-semibold text-primary-container">
          {draft.discount ? `− ${formatRupees(draft.discount)}` : "₹0"}
        </span>
      </div>
      <div
        className={`flex items-end justify-between rounded-lg bg-surface-container-lowest ${flat ? "border-t-2 border-surface-container pt-3" : "p-3 shadow-sm"}`}
      >
        <div className="flex flex-col">
          <span className="font-caption text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            {toCheck ? t.roughTotal : t.grandTotal}
          </span>
          <span
            className={`font-caption text-caption font-semibold ${toCheck ? "text-amber-text" : "text-primary-container"}`}
          >
            {toCheck ? t.afterCheck : draft.docType === "Estimate" ? t.estimate : t.billOrEstimate}
          </span>
        </div>
        <span className="tabular font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary-container">
          {totalNumber}
        </span>
      </div>
    </div>
  );
}

/** Material Symbols icon for an item row (Stitch: toggle_on for MCB, cable for wire…). */
export function itemIcon(name: string): string {
  const n = name.toLowerCase();
  if (/mcb|breaker/.test(n)) return "toggle_on";
  if (/wire|cable|taar/.test(n)) return "cable";
  if (/fan|pankha/.test(n)) return "mode_fan";
  if (/led|bulb|batten|light/.test(n)) return "lightbulb";
  if (/switch|socket|board|plate/.test(n)) return "electrical_services";
  if (/pipe|elbow|tee|conduit/.test(n)) return "plumbing";
  if (/valve|tap|nal/.test(n)) return "water_drop";
  if (/tape/.test(n)) return "healing";
  return "inventory_2";
}

function ItemRow({
  line,
  mode,
  focused,
  dim,
  justAdded,
  editing,
  confirm,
  onTap,
  onSave,
}: {
  line: LineItem;
  mode: InvoiceMode;
  focused: boolean;
  dim: boolean;
  justAdded: boolean;
  editing: boolean;
  confirm: { q: Question; onYes: () => void } | null;
  onTap: () => void;
  onSave: (p: { qty: number; unitPrice: number | null }) => void;
}) {
  const t = useT(T);
  const status = lineStatus(line);
  const qtyText = spokenQty(line.qty, line.unit);
  const rate = line.unitPrice === null ? "₹ ---" : formatRupees(line.unitPrice);
  const amount = line.unitPrice === null ? "₹ ---" : formatRupees(lineTotal(line));
  const common = { "data-status": status, "data-testid": `line-${line.rateCardId ?? "new"}` };

  if (status === "amber")
    return (
      <li
        {...common}
        className={`flex flex-col gap-2.5 rounded-xl border-2 border-[#FCD34D] bg-[#FFFBEB] p-3.5 shadow-sm ${focused && !confirm ? "ring-2 ring-amber" : ""}`}
      >
        <button
          type="button"
          onClick={onTap}
          aria-label={t.editLineAria(line.name)}
          className="flex w-full items-start justify-between gap-2 text-left"
        >
          <div className="flex min-w-0 items-start gap-2.5">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F59E0B] text-white shadow-sm">
              <Icon name={itemIcon(line.name)} className="text-[22px]" />
            </div>
            <div className="flex min-w-0 flex-col">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-body-lg text-body-lg font-semibold leading-tight text-on-surface">
                  {line.name}
                </span>
                <span className="flex items-center gap-1.5 rounded-full border border-[#FCD34D] bg-[#FEF3C7] px-2 py-0.5 font-caption text-[11px] font-bold text-[#92400E]">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#92400E] text-[10px] leading-none text-[#FEF3C7]">
                    ?
                  </span>{" "}
                  {t.checkChip}
                </span>
              </div>
              <span className="mt-0.5 font-caption text-caption font-medium text-[#92400E]">
                {qtyText} × {rate} = {amount}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end">
            <span className="tabular font-body-lg text-body-lg font-bold text-on-surface">
              {amount}
            </span>
            <span className="font-caption text-[11px] font-bold text-[#B45309]">{t.estimated}</span>
          </div>
        </button>
        {confirm ? (
          <div
            role="dialog"
            aria-label={t.confirmAria}
            className="flex flex-col gap-3 rounded-xl bg-surface-container-lowest p-3.5 shadow-sm"
          >
            <div className="flex items-end justify-between gap-2">
              <div className="flex flex-col">
                <span className="font-caption text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  {t.heard}
                </span>
                <span className="font-headline-lg-mobile text-headline-lg-mobile leading-tight text-on-surface">
                  {qtyText}
                </span>
              </div>
              <div className="flex flex-col items-end font-caption text-caption text-on-surface-variant">
                <span>{t.ratePreview}</span>
                <span className="font-label-lg text-label-lg text-on-surface">
                  {qtyText} × {rate}
                </span>
                <span className="font-title-lg text-title-lg text-primary-container">
                  = {amount}
                </span>
              </div>
            </div>
            <p className="flex items-start gap-2 border-t border-surface-container pt-3 font-headline-md text-headline-md text-on-surface">
              <Icon name="help" className="mt-1 text-[22px] text-[#D97706]" /> {confirm.q.text}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={confirm.onYes}
                className="flex min-h-[56px] items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-primary-container px-2 font-label-lg text-[17px] font-bold text-on-primary shadow-sm active:scale-95"
              >
                <Icon name="done_all" /> {t.yesRight}
              </button>
              <button
                type="button"
                onClick={onTap}
                className="flex min-h-[56px] items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-surface-container px-2 font-label-lg text-[17px] font-bold text-on-surface active:scale-95"
              >
                <Icon name="edit_square" /> {t.change}
              </button>
            </div>
            <p className="text-center font-caption text-caption text-on-surface-variant">
              <Icon name="mic" className="align-middle text-[16px] text-primary-container" />{" "}
              {t.sayOrType} <b>{t.yesWord}</b> {t.orRightLength}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="flex min-w-0 items-center gap-1.5 font-caption text-[12px] text-[#92400E]">
              <Icon name="help_center" className="shrink-0 text-[16px] text-[#D97706]" />{" "}
              <span className="truncate">{t.pleaseCheck(qtyText)}</span>
            </span>
            <button
              type="button"
              onClick={onTap}
              className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl bg-[#D97706] px-3.5 py-1.5 font-label-md text-label-md text-white shadow-sm active:scale-95"
            >
              <Icon name="tune" className="text-[16px]" /> {t.fix}
            </button>
          </div>
        )}
        {editing && <LineEditor line={line} onSave={onSave} />}
      </li>
    );

  if (status === "pending")
    return (
      <li
        {...common}
        className={`rounded-xl border-2 border-dashed border-[#FCD34D] bg-[#FFFBEB] p-3 ${focused ? "ring-2 ring-amber" : ""}`}
      >
        <button
          type="button"
          onClick={onTap}
          aria-label={t.editLineAria(line.name)}
          className="flex w-full items-center justify-between gap-2 text-left"
        >
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FEF3C7] text-[#D97706]">
              <Icon name="help" className="text-[22px]" />
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="font-body-lg text-body-lg font-semibold leading-tight text-on-surface">
                {line.name}
              </span>
              <span className="mt-0.5 font-caption text-caption text-[#92400E]">
                {qtyText} · {t.confirmRate}
                {line.skipped ? t.later : ""}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end">
            <span className="tabular font-body-lg text-body-lg font-bold text-[#92400E]">
              ₹ ---
            </span>
            <span className="rounded bg-[#FEF3C7] px-1.5 font-caption text-[11px] font-bold uppercase tracking-wider text-[#B45309]">
              {t.pending}
            </span>
          </div>
        </button>
        {editing && <LineEditor line={line} onSave={onSave} />}
      </li>
    );

  const review = mode === "review";
  return (
    <li
      {...common}
      className={`rounded-xl p-3 shadow-sm transition-colors ${justAdded && !review ? "bg-primary-fixed/20" : "bg-surface-container-low"} ${dim ? "opacity-60" : ""}`}
    >
      <button
        type="button"
        onClick={onTap}
        aria-label={t.editLineAria(line.name)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <div className="flex min-w-0 items-start gap-3">
          {review ? (
            <Icon
              name="check_circle"
              className="mt-0.5 shrink-0 text-[28px] text-primary-container [font-variation-settings:'FILL'_1]"
            />
          ) : (
            <div
              className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${justAdded ? "bg-primary-container text-on-primary" : "bg-surface-container-highest text-primary-container"}`}
            >
              <Icon name={itemIcon(line.name)} className="text-[22px]" />
            </div>
          )}
          <div className="flex min-w-0 flex-col">
            <span className="line-clamp-2 font-body-lg text-body-lg font-semibold leading-tight text-on-surface">
              {line.name}
            </span>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              <span
                className={
                  review
                    ? "font-caption text-caption text-on-surface-variant"
                    : "rounded-md bg-surface-container px-2 py-0.5 font-caption text-caption font-semibold text-on-surface-variant"
                }
              >
                {qtyText} × {rate}
              </span>
              {review && (
                <span className="font-caption text-caption font-semibold text-primary-container">
                  {t.materialTag}
                </span>
              )}
              {justAdded && !review && (
                <span className="rounded-full bg-primary-container px-1.5 py-0.5 font-caption text-[10px] font-bold text-on-primary">
                  {t.justAdded}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 pl-2">
          {review ? (
            <span className="flex flex-col items-end">
              <span className="tabular font-title-lg text-title-lg font-bold text-on-surface">
                {amount}
              </span>
              <span className="flex items-center font-caption text-caption text-primary-container">
                <Icon name="done_all" className="text-[14px]" /> {t.ok}
              </span>
            </span>
          ) : (
            <>
              <span className="tabular font-body-lg text-body-lg font-bold text-on-surface">
                {amount}
              </span>
              <span className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-surface-container text-on-surface-variant">
                <Icon name="edit" className="text-[18px]" />
              </span>
            </>
          )}
        </div>
      </button>
      {editing && <LineEditor line={line} onSave={onSave} />}
    </li>
  );
}

function LineEditor({
  line,
  onSave,
}: {
  line: LineItem;
  onSave: (p: { qty: number; unitPrice: number | null }) => void;
}) {
  const t = useT(T);
  const [qty, setQty] = useState(String(line.qty));
  const [price, setPrice] = useState(line.unitPrice === null ? "" : String(line.unitPrice));
  return (
    <form
      className="mt-2 grid grid-cols-[1fr_1fr_auto] gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          qty: Number(qty) || line.qty,
          unitPrice: price === "" ? null : Math.round(Number(price)),
        });
      }}
    >
      <label className="flex flex-col text-caption text-on-surface-variant">
        {t.qty(line.unit)}
        <input
          inputMode="decimal"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="min-h-[48px] rounded-xl border-2 border-border-strong bg-white px-3 text-body-lg text-on-surface"
        />
      </label>
      <label className="flex flex-col text-caption text-on-surface-variant">
        {t.rate}
        <input
          inputMode="numeric"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="min-h-[48px] rounded-xl border-2 border-border-strong bg-white px-3 text-body-lg text-on-surface"
        />
      </label>
      <button
        type="submit"
        className="mt-4 min-h-[48px] rounded-xl bg-primary-container px-3 font-label-lg text-label-lg text-on-primary"
      >
        {t.done}
      </button>
    </form>
  );
}

function ChargeRow({
  icon,
  label,
  amount,
  mode,
  dim,
  editing,
  onTap,
  onSave,
}: {
  icon: string;
  label: string;
  amount: number;
  mode: InvoiceMode;
  dim: boolean;
  editing: boolean;
  onTap: () => void;
  onSave: (v: number | null) => void;
}) {
  const t = useT(T);
  const review = mode === "review";
  return (
    <li className={`rounded-xl bg-surface-container-low p-3 shadow-sm ${dim ? "opacity-60" : ""}`}>
      <button
        type="button"
        onClick={onTap}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="flex min-w-0 items-start gap-3">
          {review ? (
            <Icon
              name="check_circle"
              className="mt-0.5 shrink-0 text-[28px] text-primary-container [font-variation-settings:'FILL'_1]"
            />
          ) : (
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-highest text-secondary">
              <Icon name={icon} className="text-[22px]" />
            </span>
          )}
          <span className="flex min-w-0 flex-col">
            <span className="flex flex-wrap items-center gap-x-2">
              <span className="font-body-lg text-body-lg font-semibold leading-tight text-on-surface">
                {label}
              </span>
              {!review && (
                <span className="rounded bg-surface-container-high px-1.5 font-caption text-[10px] text-on-surface-variant">
                  {t.serviceTag}
                </span>
              )}
            </span>
            {review && (
              <span className="mt-0.5 font-caption text-caption font-semibold text-secondary">
                {t.seva}
              </span>
            )}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2 pl-2">
          {review ? (
            <span className="flex flex-col items-end">
              <span className="tabular font-title-lg text-title-lg font-bold text-on-surface">
                {formatRupees(amount)}
              </span>
              <span className="flex items-center font-caption text-caption text-primary-container">
                <Icon name="done_all" className="text-[14px]" /> {t.ok}
              </span>
            </span>
          ) : (
            <>
              <span className="tabular font-body-lg text-body-lg font-bold text-on-surface">
                {formatRupees(amount)}
              </span>
              <span className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg bg-surface-container text-on-surface-variant">
                <Icon name="edit" className="text-[18px]" />
              </span>
            </>
          )}
        </span>
      </button>
      {editing && (
        <InlineNumber initial={amount} label={`${label} (₹)`} onDone={(v) => onSave(v)} />
      )}
    </li>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between font-caption text-caption text-on-surface-variant">
      <span>{label}</span>
      <span className="tabular font-semibold text-on-surface">{value}</span>
    </div>
  );
}

function InlineNumber({
  initial,
  label,
  onDone,
}: {
  initial: number;
  label: string;
  onDone: (v: number | null) => void;
}) {
  const t = useT(T);
  const [v, setV] = useState(String(initial));
  return (
    <form
      className="mt-2 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onDone(v === "" ? null : Math.round(Number(v)));
      }}
    >
      <input
        aria-label={label}
        inputMode="numeric"
        value={v}
        onChange={(e) => setV(e.target.value)}
        className="min-h-[48px] flex-1 rounded-xl border-2 border-border-strong bg-white px-3 text-body-lg"
      />
      <button
        type="submit"
        className="min-h-[48px] rounded-xl bg-primary-container px-4 font-label-lg text-label-lg text-on-primary"
      >
        {t.done}
      </button>
    </form>
  );
}

function InlineText({
  initial,
  label,
  onDone,
}: {
  initial: string;
  label: string;
  onDone: (v: string) => void;
}) {
  const t = useT(T);
  const [v, setV] = useState(initial);
  return (
    <form
      className="mt-2 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onDone(v.trim());
      }}
    >
      <input
        aria-label={label}
        value={v}
        onChange={(e) => setV(e.target.value)}
        className="min-h-[48px] flex-1 rounded-xl border-2 border-border-strong bg-white px-3 text-body-lg"
      />
      <button
        type="submit"
        className="min-h-[48px] rounded-xl bg-primary-container px-4 font-label-lg text-label-lg text-on-primary"
      >
        {t.done}
      </button>
    </form>
  );
}
