import { useEffect, useMemo, useState } from "react";
import type { FinalBill } from "../../../phase-4-billing-domain/src/bill/final";
import type { HistoryStore } from "../history";
import type { WorkerProfile } from "../profile";
import { formatRupees } from "../../../phase-4-billing-domain/src/speech";
import { buildReceiptPdf, pdfFileName } from "../pdf";
import { qrDataUrl } from "../qr";
import { downloadBlob, shareBill, type ShareResult } from "../share";
import { buildUpiLink, shareMessage, type PaidStatus } from "../upi";
import {
  JourneySteps,
  type JourneyStep,
} from "../../../phase-4-billing-domain/src/ui/JourneySteps";
import { Icon } from "../../../phase-1-ui-ux-design/src/Icon";
import { useT, useUiLang, type UiLangId } from "../../../phase-2-voice-core/src/ui/lang";

const T = {
  hinglish: {
    sectionLabel: "Share preview",
    billPreviewLabel: "Bill preview",
    ready: "Bill taiyaar hai!",
    readyFor: (who: string) => `${who} ko bhejne ke liye ready hai`,
    karigar: "Karigar",
    estimateNo: "Estimate No:",
    billNo: "Bill No:",
    date: "Taareekh:",
    customer: "Grahak",
    itemsHead: "Kaam / Saman Ka Vivaran",
    amountHead: "Rashi (₹)",
    labourRow: "Labour / Mazdoori Charge",
    visitingRow: "Visiting Charge",
    seva: "SEVA",
    material: "Saman Kul (Material):",
    labour: "Mazdoori (Service Charge):",
    visiting: "Visiting Charge:",
    discount: "Chhoot (Discount):",
    total: "Kul Rashi (Total):",
    upiHead: "Direct UPI Se Payment",
    qrAlt: (amt: string, to: string) => `UPI QR: pay ${amt} to ${to}`,
    scanPay: "Scan karke pay karein · Payment to",
    notGst: "Bill / Estimate — not a GST tax invoice",
    unitPc: "nag",
    send: "WhatsApp par bhejein",
    pdf: "PDF download",
    copy: "Link copy",
    copied: "Copy ho gaya!",
    print: "Print",
    opened: "WhatsApp khul gaya hai — bas Send dabaiye.",
    cancelled: "Share band kiya. Jab chahein phir bhejein.",
    controlA: "Aap ",
    controlB: "Send dabayenge tabhi",
    controlC: " bill jayega — poora control aapke paas.",
    phoneReady: (n: string) => `${n} ke WhatsApp number par message taiyaar hai`,
    phoneOptional: (n: string) => `${n} ka WhatsApp number (optional)`,
    phoneField: "Grahak ka WhatsApp number (optional)",
    phonePlaceholder: "10 digit mobile number",
    newBill: "Naya bill",
    approved: "Bill pakka ho gaya",
    detailsTitle: "Payment details",
    amountLabel: "Kul rakam",
    billFor: (c: string) => `${c} ka bill`,
    payeeLabel: "Paisa kisko milega",
    change: "Badlein",
    howPay: "Customer kaise dega?",
    methods: {
      upi: ["UPI (QR)", "QR scan karke abhi"],
      cash: ["Cash", "Haath mein nakad"],
      later: ["Baad mein (udhaar)", "Bill par QR rahega"],
    } as Record<"upi" | "cash" | "later", [string, string]>,
    next: "Aage →",
    back: "Peeche",
    payTitle: "Payment",
    scanTitle: "Customer se scan karwaiye",
    gotMoney: "Paisa mil gaya ✓",
    later: "Baad mein lenge",
    honest: "KaamBill payment nahi dekh sakta — aapke confirm karne par hi paid mark hoga.",
    cashQ: (amt: string) => `${amt} cash mila?`,
    cashYes: "Haan, cash mila ✓",
    paidPill: (via: string | null) => `PAID${via ? ` · ${via}` : ""}`,
    paidNote: "Aapne confirm kiya · Bills mein paid",
    duePill: "DUE",
    dueNote: "QR se pay kar sakte hain",
    qrPaid: "Payment ho chuka hai — scan ki zaroorat nahi",
    cash: "Cash",
  },
  hindi: {
    sectionLabel: "शेयर प्रीव्यू",
    billPreviewLabel: "बिल प्रीव्यू",
    ready: "बिल तैयार है!",
    readyFor: (who: string) => `${who} को भेजने के लिए तैयार है`,
    karigar: "कारीगर",
    estimateNo: "अनुमान नं:",
    billNo: "बिल नं:",
    date: "तारीख:",
    customer: "ग्राहक",
    itemsHead: "काम / सामान का विवरण",
    amountHead: "राशि (₹)",
    labourRow: "मज़दूरी चार्ज",
    visitingRow: "विज़िटिंग चार्ज",
    seva: "सेवा",
    material: "सामान कुल:",
    labour: "मज़दूरी (सर्विस चार्ज):",
    visiting: "विज़िटिंग चार्ज:",
    discount: "छूट:",
    total: "कुल राशि:",
    upiHead: "सीधे UPI से पेमेंट",
    qrAlt: (amt: string, to: string) => `UPI QR: ${to} को ${amt} पे करें`,
    scanPay: "स्कैन करके पे करें · पेमेंट पाने वाले:",
    notGst: "बिल / अनुमान — GST टैक्स इनवॉइस नहीं",
    unitPc: "नग",
    send: "WhatsApp पर भेजें",
    pdf: "PDF डाउनलोड",
    copy: "लिंक कॉपी",
    copied: "कॉपी हो गया!",
    print: "प्रिंट",
    opened: "WhatsApp खुल गया है — बस Send दबाइए।",
    cancelled: "शेयर बंद किया। जब चाहें फिर भेजें।",
    controlA: "आप ",
    controlB: "Send दबाएँगे तभी",
    controlC: " बिल जाएगा — पूरा कंट्रोल आपके पास।",
    phoneReady: (n: string) => `${n} के WhatsApp नंबर पर मैसेज तैयार है`,
    phoneOptional: (n: string) => `${n} का WhatsApp नंबर (ज़रूरी नहीं)`,
    phoneField: "ग्राहक का WhatsApp नंबर (ज़रूरी नहीं)",
    phonePlaceholder: "10 अंकों का मोबाइल नंबर",
    newBill: "नया बिल",
    approved: "बिल पक्का हो गया",
    detailsTitle: "पेमेंट विवरण",
    amountLabel: "कुल रकम",
    billFor: (c: string) => `${c} का बिल`,
    payeeLabel: "पैसा किसको मिलेगा",
    change: "बदलें",
    howPay: "ग्राहक कैसे देगा?",
    methods: {
      upi: ["UPI (QR)", "QR स्कैन करके अभी"],
      cash: ["कैश", "हाथ में नकद"],
      later: ["बाद में (उधार)", "बिल पर QR रहेगा"],
    } as Record<"upi" | "cash" | "later", [string, string]>,
    next: "आगे →",
    back: "पीछे",
    payTitle: "पेमेंट",
    scanTitle: "ग्राहक से स्कैन करवाइए",
    gotMoney: "पैसा मिल गया ✓",
    later: "बाद में लेंगे",
    honest: "KaamBill पेमेंट नहीं देख सकता — आपके कन्फ़र्म करने पर ही पेड मार्क होगा।",
    cashQ: (amt: string) => `${amt} कैश मिला?`,
    cashYes: "हाँ, कैश मिला ✓",
    paidPill: (via: string | null) => `पेड${via ? ` · ${via}` : ""}`,
    paidNote: "आपने कन्फ़र्म किया · बिल्स में पेड",
    duePill: "बाकी",
    dueNote: "QR से पे कर सकते हैं",
    qrPaid: "पेमेंट हो चुका है — स्कैन की ज़रूरत नहीं",
    cash: "कैश",
  },
  english: {
    sectionLabel: "Share preview",
    billPreviewLabel: "Bill preview",
    ready: "Bill is ready!",
    readyFor: (who: string) => `Ready to send to ${who}`,
    karigar: "Worker",
    estimateNo: "Estimate No:",
    billNo: "Bill No:",
    date: "Date:",
    customer: "Customer",
    itemsHead: "Work / Items",
    amountHead: "Amount (₹)",
    labourRow: "Labour Charge",
    visitingRow: "Visiting Charge",
    seva: "SERVICE",
    material: "Material total:",
    labour: "Labour (Service Charge):",
    visiting: "Visiting Charge:",
    discount: "Discount:",
    total: "Total:",
    upiHead: "Pay directly by UPI",
    qrAlt: (amt: string, to: string) => `UPI QR: pay ${amt} to ${to}`,
    scanPay: "Scan to pay · Payment to",
    notGst: "Bill / Estimate — not a GST tax invoice",
    unitPc: "pc",
    send: "Send on WhatsApp",
    pdf: "Save PDF",
    copy: "Copy link",
    copied: "Copied!",
    print: "Print",
    opened: "WhatsApp is open — just tap Send.",
    cancelled: "Share closed. Send again whenever you like.",
    controlA: "The bill goes ",
    controlB: "only when you tap Send",
    controlC: " — you stay in control.",
    phoneReady: (n: string) => `Message ready for ${n}'s WhatsApp number`,
    phoneOptional: (n: string) => `${n}'s WhatsApp number (optional)`,
    phoneField: "Customer's WhatsApp number (optional)",
    phonePlaceholder: "10-digit mobile number",
    newBill: "New bill",
    approved: "Bill approved",
    detailsTitle: "Payment details",
    amountLabel: "Total amount",
    billFor: (c: string) => `Bill for ${c}`,
    payeeLabel: "Money goes to",
    change: "Change",
    howPay: "How will the customer pay?",
    methods: {
      upi: ["UPI (QR)", "Scan the QR now"],
      cash: ["Cash", "Cash in hand"],
      later: ["Later (on credit)", "The QR stays on the bill"],
    } as Record<"upi" | "cash" | "later", [string, string]>,
    next: "Next →",
    back: "Back",
    payTitle: "Payment",
    scanTitle: "Ask the customer to scan",
    gotMoney: "Got the money ✓",
    later: "Collect later",
    honest: "KaamBill can't see payments — it is marked paid only when you confirm.",
    cashQ: (amt: string) => `Got ${amt} in cash?`,
    cashYes: "Yes, got the cash ✓",
    paidPill: (via: string | null) => `PAID${via ? ` · ${via}` : ""}`,
    paidNote: "Confirmed by you · paid in Bills",
    duePill: "DUE",
    dueNote: "Can pay with the QR",
    qrPaid: "Already paid — no need to scan",
    cash: "Cash",
  },
};
const DATE_LOCALE: Record<UiLangId, string> = {
  hinglish: "en-IN",
  hindi: "hi-IN",
  english: "en-IN",
};

const TRADE_ICON: Record<WorkerProfile["trade"], string> = {
  Electrician: "electric_bolt",
  Plumber: "plumbing",
  Mistri: "construction",
  "AC Mechanic": "ac_unit",
  Other: "handyman",
};
const unitLabel = (u: string, pc: string) => (u === "pc" || u === "pcs" || u === "" ? pc : u);

type Step = "paymentDetails" | "pay" | "invoice";
type Method = "upi" | "cash" | "later";
const STEP_NO: Record<Step, JourneyStep> = { paymentDetails: 3, pay: 4, invoice: 5 };

/**
 * After approval: S7 share preview (kaambill_share_preview) + S11 receipt layout, as three steps
 * (journey steps 3–5; the conversation machine stays in `sharePreview` throughout):
 *   3 Payment details (amount, payee, customer number, how they'll pay) →
 *   4 Payment (UPI QR / cash; "Baad mein" skips it) → 5 Invoice (receipt, PAID / DUE, WhatsApp, PDF).
 * KaamBill has no payment gateway and can't see payments: "paid" is ONLY the worker's own confirmation
 * (history.markPaid), and the copy says so. The app never sends: "WhatsApp par bhejein" opens the
 * share sheet; the worker taps Send.
 * `startAt="invoice"` (re-sending a saved bill from Home / Bills) opens straight on the receipt.
 * Left out from Stitch: "Parcha Verified" (F5), "Instant Share" (F2), customer address/phone we don't have.
 */
export function SharePreview({
  bill,
  profile,
  onShared,
  onDone,
  history,
  onEditPayee,
  startAt = "paymentDetails",
}: {
  bill: FinalBill;
  profile: WorkerProfile;
  onShared: (r: ShareResult, customerPhone: string | null) => void;
  onDone: () => void;
  /** Where "Paisa mil gaya" / "Haan, cash mila" record the worker's confirmation (the bill is already saved). */
  history?: Pick<HistoryStore, "markPaid">;
  /** "Badlein" next to the payee: opens the worker profile (Khata). */
  onEditPayee?: () => void;
  startAt?: "paymentDetails" | "invoice";
}) {
  const t = useT(T);
  const { lang } = useUiLang();
  const upi = buildUpiLink({
    vpa: profile.vpa,
    payeeName: profile.businessName,
    amount: bill.total,
    billNo: bill.billNo,
  });
  const [step, setStep] = useState<Step>(startAt);
  const [method, setMethod] = useState<Method>("upi");
  const [paid, setPaid] = useState<PaidStatus>(
    bill.status === "paid" ? { via: bill.paidVia } : null,
  );
  const [qr, setQr] = useState<string | null>(null);
  const [phone, setPhone] = useState(bill.customerPhone ?? "");
  const [status, setStatus] = useState<"idle" | "working" | ShareResult>("idle");
  const [built, setBuilt] = useState<{ for: FinalBill; blob: Blob } | null>(null);
  const [copied, setCopied] = useState(false);
  // The bill as the customer gets it: with the worker-confirmed payment status.
  const shown = useMemo<FinalBill>(
    () => (paid ? { ...bill, status: "paid", paidVia: paid.via } : bill),
    [bill, paid],
  );
  useEffect(() => {
    if (typeof window !== "undefined" && typeof window.scrollTo === "function")
      window.scrollTo({ top: 0 });
  }, [step]);
  // Build QR + PDF as soon as the preview opens, so the share happens instantly after the tap
  // (navigator.share / window.open need a recent user tap). Rebuilt when the payment status changes.
  useEffect(() => {
    let alive = true;
    void (async () => {
      const q = await qrDataUrl(upi);
      if (!alive) return;
      setQr(q);
      const b = await buildReceiptPdf(shown, profile, q);
      if (alive) setBuilt({ for: shown, blob: b });
    })();
    return () => {
      alive = false;
    };
  }, [upi, shown, profile]);
  const pdfBlob = built?.for === shown ? built.blob : null; // stale once the payment status changes
  const pdf = async () => pdfBlob ?? buildReceiptPdf(shown, profile, qr ?? (await qrDataUrl(upi)));
  const message = shareMessage(bill.customerName, bill.total, upi, profile.businessName, paid);
  const date = new Date(bill.createdAt).toLocaleString(DATE_LOCALE[lang], {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const karigar = [profile.trade !== "Other" ? profile.trade : null, profile.phone]
    .filter(Boolean)
    .join(" · ");
  const sevaRows = [
    bill.laborCharge > 0 ? { name: t.labourRow, amount: bill.laborCharge } : null,
    bill.visitingCharge > 0 ? { name: t.visitingRow, amount: bill.visitingCharge } : null,
  ].filter((r): r is { name: string; amount: number } => r !== null);
  const typedPhone = phone.trim();
  const total = formatRupees(bill.total);
  const markPaid = (via: "upi" | "cash") => {
    history?.markPaid(bill.billNo, via);
    setPaid({ via });
    setStep("invoice");
  };
  const viaLabel = (v: "upi" | "cash" | null) =>
    v === "cash" ? t.cash : v === "upi" ? "UPI" : null;
  const stepper = startAt === "paymentDetails" ? <JourneySteps step={STEP_NO[step]} /> : null;
  const phoneBlock = (
    <div className="flex w-full flex-col gap-1.5 rounded-lg bg-surface-container-low p-2.5">
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${typedPhone ? "bg-primary-container" : "bg-outline"}`}
        />
        <span className="font-caption text-caption text-on-surface">
          {typedPhone ? t.phoneReady(bill.customerName) : t.phoneOptional(bill.customerName)}
        </span>
      </div>
      <input
        aria-label={t.phoneField}
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        inputMode="tel"
        placeholder={t.phonePlaceholder}
        className="min-h-[48px] rounded-lg bg-surface-container-lowest px-3 font-body-md text-body-md shadow-sm outline-none focus:ring-2 focus:ring-primary-container"
      />
    </div>
  );
  const honestNote = (
    <p
      className="flex items-start gap-1.5 px-1 font-caption text-caption text-on-surface-variant"
      data-testid="paid-honesty"
    >
      <Icon name="info" className="mt-0.5 shrink-0 text-[16px]" />
      <span>{t.honest}</span>
    </p>
  );
  const backButton = (
    <button
      type="button"
      onClick={() => setStep("paymentDetails")}
      className="flex min-h-[52px] w-full items-center justify-center gap-1.5 rounded-xl border-2 border-outline-variant font-label-lg text-label-lg text-on-surface"
    >
      <Icon name="chevron_right" className="rotate-180 text-[22px]" /> {t.back}
    </button>
  );
  const primaryBtn =
    "flex min-h-[56px] w-full items-center justify-center gap-2.5 rounded-xl bg-primary-container px-5 py-3.5 font-headline-md text-[18px] text-on-primary shadow-md transition-transform active:scale-95";

  // Step 3: Payment details
  if (step === "paymentDetails")
    return (
      <section className="flex flex-col gap-4" aria-label={t.detailsTitle}>
        {stepper}
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary">
              <Icon
                name="check_circle"
                className="text-[20px] [font-variation-settings:'FILL'_1]"
              />
            </div>
            <div className="flex min-w-0 flex-col">
              <h2 className="font-title-lg text-title-lg font-bold leading-tight text-on-surface">
                {t.detailsTitle}
              </h2>
              <span className="font-caption text-caption text-on-surface-variant">
                {t.approved}
              </span>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-surface-container-high px-2.5 py-1 font-caption text-caption font-semibold text-primary">
            #{bill.billNo}
          </span>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl bg-surface-container-lowest p-4 shadow-sm">
          <div className="flex flex-col items-center gap-0.5 rounded-xl bg-surface-container-low px-3 py-3">
            <span className="font-caption text-caption font-bold uppercase tracking-wider text-on-surface-variant">
              {t.amountLabel}
            </span>
            <span
              className="tabular text-[40px] font-extrabold leading-none tracking-tight text-primary-container"
              data-testid="pay-amount"
            >
              {total}
            </span>
            <span className="mt-1 truncate font-body-md text-body-md text-on-surface">
              {t.billFor(bill.customerName)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container text-primary-container">
                <Icon name="account_balance_wallet" className="text-[22px]" />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="font-caption text-caption text-on-surface-variant">
                  {t.payeeLabel}
                </span>
                <span
                  className="truncate font-label-lg text-label-lg font-bold text-on-surface"
                  data-testid="payee-name"
                >
                  {profile.businessName}
                </span>
                <span className="break-all font-mono text-[12px] text-on-surface-variant">
                  UPI ID: {profile.vpa}
                </span>
              </div>
            </div>
            {onEditPayee && (
              <button
                type="button"
                onClick={onEditPayee}
                className="flex min-h-[44px] shrink-0 items-center gap-1 rounded-lg px-2 font-label-md text-label-md text-primary-container underline-offset-2 hover:underline"
              >
                <Icon name="edit" className="text-[18px]" /> {t.change}
              </button>
            )}
          </div>
          {phoneBlock}
        </div>

        <fieldset className="flex flex-col gap-2 rounded-2xl bg-surface-container-lowest p-4 shadow-sm">
          <legend className="sr-only">{t.howPay}</legend>
          <span aria-hidden className="font-headline-md text-[18px] font-bold text-on-surface">
            {t.howPay}
          </span>
          {(["upi", "cash", "later"] as const).map((m) => {
            const [label, sub] = t.methods[m];
            return (
              <label
                key={m}
                className={`flex min-h-[56px] cursor-pointer items-center gap-3 rounded-xl border-2 p-3 ${method === m ? "border-primary-container bg-primary-fixed/30" : "border-outline-variant/40"}`}
              >
                <input
                  type={"radio"}
                  /* single quotes: not an icon name for scripts/icons.mjs */ name="pay-method"
                  className="h-5 w-5 shrink-0 accent-[#0b7a4b]"
                  checked={method === m}
                  onChange={() => setMethod(m)}
                />
                <Icon
                  name={m === "upi" ? "qr_code_2" : m === "cash" ? "payments" : "schedule"}
                  className={`text-[24px] ${m === "later" ? "text-tertiary-container" : "text-primary-container"}`}
                />
                <span className="flex min-w-0 flex-col">
                  <span className="font-label-lg text-label-lg font-bold text-on-surface">
                    {label}
                  </span>
                  <span className="font-body-md text-[14px] text-on-surface-variant">{sub}</span>
                </span>
              </label>
            );
          })}
        </fieldset>

        <button
          type="button"
          onClick={() => setStep(method === "later" ? "invoice" : "pay")}
          className={primaryBtn}
        >
          {t.next}
        </button>
      </section>
    );

  // Step 4: Payment (UPI QR or cash). Only the worker can say the money arrived.
  if (step === "pay")
    return (
      <section className="flex flex-col gap-4" aria-label={t.payTitle}>
        {stepper}
        {method === "upi" ? (
          <>
            <div className="flex flex-col items-center gap-2.5 rounded-2xl bg-surface-container-lowest p-4 shadow-sm">
              <h2 className="flex items-center gap-2 font-headline-md text-[18px] font-bold text-on-surface">
                <Icon name="qr_code_scanner" className="text-[24px] text-primary-container" />
                {t.scanTitle}
              </h2>
              <span
                className="tabular text-[36px] font-extrabold leading-none tracking-tight text-primary-container"
                data-testid="pay-amount"
              >
                {total}
              </span>
              <div className="flex items-center justify-center rounded-xl bg-surface-container-lowest p-2.5 shadow-inner">
                {qr ? (
                  <img
                    src={qr}
                    alt={t.qrAlt(total, profile.businessName)}
                    className="h-56 w-56"
                    data-testid="pay-qr"
                  />
                ) : (
                  <div className="h-56 w-56 animate-pulse rounded-lg bg-surface-container" />
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {["GPay", "PhonePe", "Paytm"].map((a) => (
                  <span
                    key={a}
                    className="rounded bg-surface-container px-2 py-0.5 font-caption text-[11px] font-bold text-on-surface"
                  >
                    {a}
                  </span>
                ))}
                <span className="rounded bg-primary-fixed px-2 py-0.5 font-caption text-[11px] font-bold text-on-primary-fixed">
                  BHIM UPI
                </span>
              </div>
              <p className="text-center font-caption text-caption font-medium text-on-surface-variant">
                {t.scanPay} <strong className="text-on-surface">{profile.businessName}</strong>
              </p>
              <p className="-mt-2 font-mono text-[12px] text-on-surface-variant">
                UPI ID: {profile.vpa}
              </p>
            </div>
            {honestNote}
            <button type="button" onClick={() => markPaid("upi")} className={primaryBtn}>
              <Icon
                name="check_circle"
                className="text-[24px] [font-variation-settings:'FILL'_1]"
              />{" "}
              {t.gotMoney}
            </button>
            <button
              type="button"
              onClick={() => setStep("invoice")}
              className="flex min-h-[52px] w-full items-center justify-center gap-1.5 rounded-xl border-2 border-tertiary-container font-label-lg text-label-lg text-on-surface"
            >
              <Icon name="schedule" className="text-[22px] text-tertiary-container" /> {t.later}
            </button>
            <button
              type="button"
              onClick={() => setStep("paymentDetails")}
              className="min-h-[44px] font-label-md text-label-md text-on-surface-variant"
            >
              ← {t.back}
            </button>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center gap-3 rounded-2xl bg-surface-container-lowest p-5 shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-fixed text-primary">
                <Icon name="payments" className="text-[36px]" />
              </div>
              <h2
                className="text-center font-headline-md text-headline-md font-bold text-on-surface"
                data-testid="cash-question"
              >
                {t.cashQ(total)}
              </h2>
              <span className="font-body-md text-body-md text-on-surface-variant">
                {t.billFor(bill.customerName)} · #{bill.billNo}
              </span>
            </div>
            {honestNote}
            <button type="button" onClick={() => markPaid("cash")} className={primaryBtn}>
              <Icon
                name="check_circle"
                className="text-[24px] [font-variation-settings:'FILL'_1]"
              />{" "}
              {t.cashYes}
            </button>
            {backButton}
          </>
        )}
      </section>
    );

  // Step 5: Invoice
  return (
    <section className="flex flex-col gap-4" aria-label={t.sectionLabel}>
      {stepper}
      {/* Success banner + worker-confirmed payment status */}
      <div className="flex w-full flex-col gap-2.5 rounded-xl bg-surface-container-lowest p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-fixed text-primary">
              <Icon
                name="check_circle"
                className="text-[20px] [font-variation-settings:'FILL'_1]"
              />
            </div>
            <span className="font-title-lg text-title-lg font-bold text-on-surface">{t.ready}</span>
          </div>
          <span className="shrink-0 whitespace-nowrap rounded-full bg-surface-container-high px-2.5 py-1 font-caption text-caption font-semibold text-primary">
            #{bill.billNo}
          </span>
        </div>
        <p className="-mt-1 pl-10 font-body-md text-body-md text-on-surface-variant">
          {t.readyFor(`${bill.customerName}${typedPhone ? ` (${typedPhone})` : ""}`)}
        </p>
        {paid ? (
          <div
            className="flex flex-wrap items-center gap-2 pl-10"
            data-testid="pay-status"
            data-paid="true"
          >
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-container px-3 py-1 font-label-md text-label-md font-bold text-on-primary">
              <Icon name="task_alt" className="text-[16px]" /> {t.paidPill(viaLabel(paid.via))}
            </span>
            <span className="font-caption text-caption text-on-surface-variant">{t.paidNote}</span>
          </div>
        ) : (
          <div
            className="flex flex-wrap items-center gap-2 pl-10"
            data-testid="pay-status"
            data-paid="false"
          >
            <span className="inline-flex items-center gap-1 rounded-full bg-tertiary-fixed px-3 py-1 font-label-md text-label-md font-bold text-on-tertiary-fixed">
              <Icon name="hourglass_top" className="text-[16px]" /> {t.duePill}
            </span>
            <span className="font-caption text-caption text-on-surface-variant">{t.dueNote}</span>
          </div>
        )}
      </div>

      {/* Paper-style bill */}
      <article
        className="relative w-full overflow-hidden rounded-xl bg-surface-container-lowest shadow-md"
        aria-label={t.billPreviewLabel}
      >
        <div className="h-2 w-full bg-primary-container" />
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="font-headline-md text-headline-md font-bold leading-tight text-on-surface">
                  {profile.businessName}
                </h2>
                {karigar && (
                  <p className="font-caption text-caption font-medium text-on-surface-variant">
                    {t.karigar}: {karigar}
                  </p>
                )}
                {profile.city && (
                  <p className="font-caption text-caption text-on-surface-variant">
                    {profile.city}
                  </p>
                )}
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container-low text-primary-container">
                <Icon name={TRADE_ICON[profile.trade] ?? "handyman"} className="text-[24px]" />
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-surface-container-low p-2.5 text-on-surface">
              <div className="flex flex-col">
                <span className="font-caption text-caption text-on-surface-variant">
                  {bill.docType === "Estimate" ? t.estimateNo : t.billNo}
                </span>
                <span className="font-label-md text-label-md font-bold">{bill.billNo}</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="font-caption text-caption text-on-surface-variant">{t.date}</span>
                <span className="font-label-md text-label-md font-bold">{date}</span>
              </div>
              <div className="col-span-2 flex items-center gap-1.5 rounded bg-surface-container-lowest/80 p-1.5">
                <Icon name="person_pin_circle" className="text-[18px] text-primary-container" />
                <span className="truncate font-caption text-caption font-semibold">
                  {t.customer}: {bill.customerName}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between pb-1 font-label-md text-label-md text-on-surface-variant">
              <span>{t.itemsHead}</span>
              <span>{t.amountHead}</span>
            </div>
            {bill.items.map((i) => (
              <div
                key={i.name}
                className="flex items-center justify-between rounded-lg bg-surface-container-lowest p-2.5 shadow-sm"
              >
                <div className="flex max-w-[70%] flex-col">
                  <span className="font-body-md text-body-md font-bold leading-tight text-on-surface">
                    {i.name}
                  </span>
                  <span className="mt-0.5 font-caption text-caption text-on-surface-variant">
                    {i.qty} {unitLabel(i.unit, t.unitPc)} × {formatRupees(i.unitPrice)}
                  </span>
                </div>
                <span className="tabular font-title-lg text-title-lg font-bold text-on-surface">
                  {formatRupees(i.amount)}
                </span>
              </div>
            ))}
            {sevaRows.map((r) => (
              <div
                key={r.name}
                className="flex items-center justify-between rounded-lg bg-surface-container-lowest p-2.5 shadow-sm"
              >
                <div className="flex max-w-[70%] items-center gap-1">
                  <span className="font-body-md text-body-md font-bold leading-tight text-on-surface">
                    {r.name}
                  </span>
                  <span className="rounded bg-tertiary-fixed px-1.5 font-caption text-[11px] font-bold text-on-tertiary-fixed">
                    {t.seva}
                  </span>
                </div>
                <span className="tabular font-title-lg text-title-lg font-bold text-on-surface">
                  {formatRupees(r.amount)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 rounded-xl bg-surface-container-low p-3">
            <div className="flex items-center justify-between font-body-md text-body-md text-on-surface-variant">
              <span>{t.material}</span>
              <span className="tabular font-semibold text-on-surface">
                {formatRupees(bill.materialTotal)}
              </span>
            </div>
            {bill.laborCharge > 0 && (
              <div className="flex items-center justify-between font-body-md text-body-md text-on-surface-variant">
                <span>{t.labour}</span>
                <span className="tabular font-semibold text-on-surface">
                  {formatRupees(bill.laborCharge)}
                </span>
              </div>
            )}
            {bill.visitingCharge > 0 && (
              <div className="flex items-center justify-between font-body-md text-body-md text-on-surface-variant">
                <span>{t.visiting}</span>
                <span className="tabular font-semibold text-on-surface">
                  {formatRupees(bill.visitingCharge)}
                </span>
              </div>
            )}
            {bill.discount > 0 && (
              <div className="flex items-center justify-between font-body-md text-body-md text-on-surface-variant">
                <span>{t.discount}</span>
                <span className="tabular font-semibold text-on-surface">
                  − {formatRupees(bill.discount)}
                </span>
              </div>
            )}
            <div className="my-0.5 h-0.5 w-full bg-surface-variant/70" />
            <div className="flex items-center justify-between pt-0.5">
              <span className="font-title-lg text-title-lg font-bold leading-tight text-on-surface">
                {t.total}
              </span>
              <span
                className="tabular text-[40px] font-extrabold leading-none tracking-tight text-primary-container"
                data-testid="final-total"
              >
                {formatRupees(bill.total)}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-2 rounded-xl bg-surface-container-lowest p-3.5 shadow-sm">
            <span className="font-caption text-caption font-bold uppercase tracking-wider text-on-surface-variant">
              {paid ? t.qrPaid : t.upiHead}
            </span>
            <div
              className={`flex items-center justify-center rounded-lg bg-surface-container-lowest p-2.5 shadow-inner ${paid ? "opacity-40" : ""}`}
            >
              {qr ? (
                <img
                  src={qr}
                  alt={t.qrAlt(formatRupees(bill.total), profile.businessName)}
                  className="h-36 w-36"
                  data-testid="upi-qr"
                />
              ) : (
                <div className="h-36 w-36 animate-pulse rounded-lg bg-surface-container" />
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
              {["GPay", "PhonePe", "Paytm"].map((a) => (
                <span
                  key={a}
                  className="rounded bg-surface-container px-2 py-0.5 font-caption text-[11px] font-bold text-on-surface"
                >
                  {a}
                </span>
              ))}
              <span className="rounded bg-primary-fixed px-2 py-0.5 font-caption text-[11px] font-bold text-on-primary-fixed">
                BHIM UPI
              </span>
            </div>
            {!paid && (
              <p className="text-center font-caption text-caption font-medium text-on-surface-variant">
                {t.scanPay} <strong className="text-on-surface">{profile.businessName}</strong>
              </p>
            )}
            <p className={`font-mono text-[12px] text-on-surface-variant ${paid ? "" : "-mt-2"}`}>
              UPI ID: {profile.vpa}
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-surface-container pt-2 text-on-surface-variant">
            <span className="font-caption text-[11px]">{t.notGst}</span>
            <span className="font-caption text-[11px] font-semibold text-primary-container">
              KaamBill Karigar
            </span>
          </div>
        </div>
      </article>

      <div className="flex flex-col gap-2.5 pt-1">
        <button
          type="button"
          disabled={status === "working"}
          onClick={async () => {
            setStatus("working");
            const r = await shareBill({
              pdf: await pdf(),
              fileName: pdfFileName(bill),
              message,
              phone,
            });
            setStatus(r);
            onShared(r, typedPhone || null);
          }}
          className="flex min-h-[56px] w-full items-center justify-center gap-2.5 rounded-xl bg-primary-container px-5 py-3.5 font-headline-md text-[18px] text-on-primary shadow-md transition-transform active:scale-95 disabled:opacity-60"
        >
          <Icon name="chat" className="text-[26px]" />
          <span>{t.send}</span>
          <Icon name="send" className="text-[20px]" />
        </button>
        <div className="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={async () => downloadBlob(await pdf(), pdfFileName(bill))}
            className="flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-xl bg-surface-container-lowest px-2 py-2 font-label-md text-label-md text-on-surface shadow-sm active:bg-surface-container"
          >
            <Icon name="picture_as_pdf" className="text-[22px] text-tertiary-container" /> {t.pdf}
          </button>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(message).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              });
            }}
            className="flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-xl bg-surface-container-lowest px-2 py-2 font-label-md text-label-md text-on-surface shadow-sm active:bg-surface-container"
          >
            <Icon name="link" className="text-[22px] text-secondary" /> {copied ? t.copied : t.copy}
          </button>
          <button
            type="button"
            onClick={async () => window.open(URL.createObjectURL(await pdf()), "_blank")}
            className="flex min-h-[56px] flex-col items-center justify-center gap-0.5 rounded-xl bg-surface-container-lowest px-2 py-2 font-label-md text-label-md text-on-surface shadow-sm active:bg-surface-container"
          >
            <Icon name="print" className="text-[22px] text-primary-container" /> {t.print}
          </button>
        </div>
        <p
          className="flex items-center justify-center gap-1.5 py-1 text-center font-caption text-caption font-medium text-on-surface-variant"
          role="status"
        >
          <Icon name="verified_user" className="text-[18px] text-primary-container" />
          {status === "share_sheet" || status === "whatsapp_link" ? (
            t.opened
          ) : status === "cancelled" ? (
            t.cancelled
          ) : (
            <span>
              {t.controlA}
              <span className="font-bold text-on-surface">{t.controlB}</span>
              {t.controlC}
            </span>
          )}
        </p>
        {phoneBlock}
        <button
          type="button"
          onClick={onDone}
          className="min-h-[52px] rounded-xl border-2 border-primary-container font-label-lg text-label-lg text-primary-container"
        >
          {t.newBill}
        </button>
      </div>
    </section>
  );
}
