import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { isValidVpa, type WorkerProfile } from "../profile";
import { qrDataUrl } from "../qr";
import type { RateCardStore } from "../../../phase-4-billing-domain/src/rateCard/store";
import { formatRupees } from "../../../phase-4-billing-domain/src/speech";
import { Icon } from "../../../phase-1-ui-ux-design/src/Icon";
import { UI_LANGUAGES } from "../../../phase-2-voice-core/src/ui/TopBar";
import { useT, useUiLang } from "../../../phase-2-voice-core/src/ui/lang";

type Trade = WorkerProfile["trade"];
const TRADES: { id: Trade; icon: string }[] = [
  { id: "Electrician", icon: "bolt" },
  { id: "Plumber", icon: "plumbing" },
  { id: "Mistri", icon: "construction" },
  { id: "AC Mechanic", icon: "mode_fan" },
];
const TRADE_ICON: Record<Trade, string> = {
  Electrician: "electric_bolt",
  Plumber: "plumbing",
  Mistri: "construction",
  "AC Mechanic": "mode_fan",
  Other: "handyman",
};
/** UPI app chooser: tapping one sets the usual handle for that app (the worker can still type any handle). */
const APPS: { id: string; icon: string; suffix: string; handles: string[] }[] = [
  {
    id: "GPay",
    icon: "payments",
    suffix: "@okaxis",
    handles: ["okaxis", "okhdfcbank", "oksbi", "okicici"],
  },
  { id: "PhonePe", icon: "bolt", suffix: "@ybl", handles: ["ybl", "ibl", "axl"] },
  {
    id: "Paytm",
    icon: "wallet",
    suffix: "@paytm",
    handles: ["paytm", "ptyes", "ptaxis", "pthdfc", "ptsbi"],
  },
  { id: "BHIM", icon: "account_balance", suffix: "@upi", handles: ["upi"] },
];
const STEP_ICONS = ["handyman", "account_balance_wallet", "receipt_long"];
const itemIcon = (id: string, name: string, category: string) => {
  const s = `${id} ${name}`.toLowerCase();
  if (category === "labour") return "handyman";
  if (s.includes("mcb") || s.includes("switch")) return "toggle_on";
  if (s.includes("wire")) return "cable";
  if (s.includes("socket")) return "power";
  if (s.includes("fan")) return "mode_fan";
  if (s.includes("led") || s.includes("batten")) return "light";
  if (s.includes("conduit")) return "view_column";
  if (category === "plumbing") return "plumbing";
  return "construction";
};

const T = {
  hinglish: {
    langAria: (l: string) => `Bhasha: ${l}`,
    onboarding: "Onboarding",
    businessProfile: "Business profile",
    stepChips: ["Vyapar", "UPI ID", "Rate card"],
    stepTitles: ["Vyapaar ki jaankari", "Payment setup", "Rate card ready"],
    stepOf: (n: number, total: number) => `Kadam ${n} / ${total}`,
    oneMinute: "Sirf 1 minute",
    pctDone: (p: number) => `${p}% ho gaya`,
    back: "← Peeche jaayein",
    trades: {
      Electrician: "Electrician",
      Plumber: "Plumber",
      Mistri: "Mistri",
      "AC Mechanic": "AC Mechanic",
      Other: "Other",
    } as Record<Trade, string>,
    units: { pc: "piece", m: "meter", fan: "fan" } as Record<string, string>,
    welcome: "Shubh Shuruat!",
    askName: "Namaste! Aapka naam?",
    nameHelp: "Ya aapki dukaan / kaam ka naam likhiye",
    nameLabel: "Aapka / Dukaan ka naam",
    written: "Likh diya ✓",
    namePh: "Jaise: Ramesh Electricals",
    yourWork: "Aapka kaam:",
    nameOnBill: "Bill par yahi naam dikhai dega:",
    nameOnBillHelp: "Aapke sabhi WhatsApp bills aur PDF par upar header mein yahi naam chhapega.",
    changeLater: "Baad mein Khata tab se badal sakte hain",
    next1: "Aage badhein →",
    askUpi: "Aapka UPI ID?",
    upiHelp: "Customer ka paisa seedha aapke bank account mein aayega.",
    commission: "0% commission, 100% aapka.",
    upiLabel: "Enter UPI ID / VPA",
    upiAria: "UPI ID",
    upiPh: "jaise 9876543210@paytm",
    upiOk: "UPI ID ka format sahi hai ✓",
    upiHint: "Jaise: naam@okaxis, 98xxxxxx@ybl",
    chooseApp: "Aapka app chunein:",
    phoneAria: "Aapka phone (bill par, optional)",
    phonePh: "Phone (optional, bill par)",
    customerSees: "Customer ko bill par aisa dikhega:",
    livePreview: "Live preview",
    paymentTo: "Payment to",
    scanPay: "Scan & pay via any app",
    upiPlaceholder: "aapka-upi@bank",
    allUpi: "Sabhi UPI chalenge",
    customerPay1: "Customer WhatsApp bill par QR scan karke ya UPI link se ",
    customerPay2: "seedha aapko pay kar sakenge",
    customerPay3: ".",
    npci: "NPCI / UPI se payment",
    npciHelp:
      "Paisa customer ke UPI app se seedha aapke account mein jaata hai. KaamBill beech mein paisa nahi rakhta.",
    next2: "Aage →",
    save: "Save karein",
    rcTitle: (n: number) => `Aapke rate card mein ${n} common items pehle se hain`,
    rcHelp: "Bolte hi app inke daam khud jod lega. Aap kabhi bhi badal sakte hain.",
    magic: "Jaadui feature",
    tip: "Tip:",
    tip1: " Bill banate waqt ",
    tipPhrase: "“15 meter wire”",
    tip2: " bolenge toh ",
    tip3: " khud calculate ho jayega!",
    standardRates: "Standard rates",
    items: (n: number) => `${n} items`,
    labour: "Labour",
    material: "Material",
    editAria: (name: string) => `${name} ka rate badlein`,
    edit: "Badlein",
    newRate: "Naya rate",
    ok: "Theek",
    voiceAdd: "Bolkar naya item jodein",
    voiceAddHelp: "Bill mein naya item ka rate bolenge toh KaamBill use yaad rakhega.",
    start: "Shuru karein 🚀",
    ready: "Sab ready hai! Ab pehla bill banaiye.",
  },
  hindi: {
    langAria: (l: string) => `भाषा: ${l}`,
    onboarding: "शुरुआत",
    businessProfile: "बिज़नेस प्रोफ़ाइल",
    stepChips: ["व्यापार", "UPI ID", "रेट कार्ड"],
    stepTitles: ["व्यापार की जानकारी", "पेमेंट सेटअप", "रेट कार्ड तैयार"],
    stepOf: (n: number, total: number) => `कदम ${n} / ${total}`,
    oneMinute: "सिर्फ़ 1 मिनट",
    pctDone: (p: number) => `${p}% हो गया`,
    back: "← पीछे जाएँ",
    trades: {
      Electrician: "इलेक्ट्रीशियन",
      Plumber: "प्लंबर",
      Mistri: "मिस्त्री",
      "AC Mechanic": "AC मैकेनिक",
      Other: "अन्य",
    } as Record<Trade, string>,
    units: { pc: "पीस", m: "मीटर", fan: "पंखा" } as Record<string, string>,
    welcome: "शुभ शुरुआत!",
    askName: "नमस्ते! आपका नाम?",
    nameHelp: "या अपनी दुकान / काम का नाम लिखें",
    nameLabel: "आपका / दुकान का नाम",
    written: "लिख दिया ✓",
    namePh: "जैसे: रमेश इलेक्ट्रिकल्स",
    yourWork: "आपका काम:",
    nameOnBill: "बिल पर यही नाम दिखेगा:",
    nameOnBillHelp: "आपके सभी WhatsApp बिल और PDF के ऊपर यही नाम छपेगा।",
    changeLater: "बाद में खाता टैब से बदल सकते हैं",
    next1: "आगे बढ़ें →",
    askUpi: "आपकी UPI ID?",
    upiHelp: "ग्राहक का पैसा सीधे आपके बैंक खाते में आएगा।",
    commission: "0% कमीशन, 100% आपका।",
    upiLabel: "UPI ID / VPA डालें",
    upiAria: "UPI ID",
    upiPh: "जैसे 9876543210@paytm",
    upiOk: "UPI ID का फ़ॉर्मेट सही है ✓",
    upiHint: "जैसे: naam@okaxis, 98xxxxxx@ybl",
    chooseApp: "अपना ऐप चुनें:",
    phoneAria: "आपका फ़ोन (बिल पर, ज़रूरी नहीं)",
    phonePh: "फ़ोन (ज़रूरी नहीं, बिल पर)",
    customerSees: "ग्राहक को बिल पर ऐसा दिखेगा:",
    livePreview: "लाइव झलक",
    paymentTo: "भुगतान:",
    scanPay: "किसी भी ऐप से स्कैन करके पे करें",
    upiPlaceholder: "aapka-upi@bank",
    allUpi: "सभी UPI चलेंगे",
    customerPay1: "ग्राहक WhatsApp बिल पर QR स्कैन करके या UPI लिंक से ",
    customerPay2: "सीधे आपको पे कर सकेंगे",
    customerPay3: "।",
    npci: "NPCI / UPI से पेमेंट",
    npciHelp: "पैसा ग्राहक के UPI ऐप से सीधे आपके खाते में जाता है। KaamBill बीच में पैसा नहीं रखता।",
    next2: "आगे →",
    save: "सेव करें",
    rcTitle: (n: number) => `आपके रेट कार्ड में ${n} आम आइटम पहले से हैं`,
    rcHelp: "बोलते ही ऐप इनके दाम खुद जोड़ देगा। आप कभी भी बदल सकते हैं।",
    magic: "जादुई फ़ीचर",
    tip: "टिप:",
    tip1: " बिल बनाते समय ",
    tipPhrase: "“15 मीटर wire”",
    tip2: " बोलेंगे तो ",
    tip3: " खुद जुड़ जाएगा!",
    standardRates: "स्टैंडर्ड रेट",
    items: (n: number) => `${n} आइटम`,
    labour: "मज़दूरी",
    material: "सामान",
    editAria: (name: string) => `${name} का रेट बदलें`,
    edit: "बदलें",
    newRate: "नया रेट",
    ok: "ठीक",
    voiceAdd: "बोलकर नया आइटम जोड़ें",
    voiceAddHelp: "बिल में नए आइटम का रेट बोलेंगे तो KaamBill उसे याद रखेगा।",
    start: "शुरू करें 🚀",
    ready: "सब तैयार है! अब पहला बिल बनाइए।",
  },
  english: {
    langAria: (l: string) => `Language: ${l}`,
    onboarding: "Onboarding",
    businessProfile: "Business profile",
    stepChips: ["Business", "UPI ID", "Rate card"],
    stepTitles: ["Business details", "Payment setup", "Rate card ready"],
    stepOf: (n: number, total: number) => `Step ${n} / ${total}`,
    oneMinute: "Just 1 minute",
    pctDone: (p: number) => `${p}% done`,
    back: "← Go back",
    trades: {
      Electrician: "Electrician",
      Plumber: "Plumber",
      Mistri: "Mason",
      "AC Mechanic": "AC Mechanic",
      Other: "Other",
    } as Record<Trade, string>,
    units: { pc: "piece", m: "meter", fan: "fan" } as Record<string, string>,
    welcome: "Great start!",
    askName: "Hello! Your name?",
    nameHelp: "Or your shop / business name",
    nameLabel: "Your / shop name",
    written: "Done ✓",
    namePh: "E.g. Ramesh Electricals",
    yourWork: "Your trade:",
    nameOnBill: "This name will show on the bill:",
    nameOnBillHelp: "This name is printed at the top of all your WhatsApp bills and PDFs.",
    changeLater: "You can change it later in the Account tab",
    next1: "Continue →",
    askUpi: "Your UPI ID?",
    upiHelp: "Customer payments go straight to your bank account.",
    commission: "0% commission, 100% yours.",
    upiLabel: "Enter UPI ID / VPA",
    upiAria: "UPI ID",
    upiPh: "e.g. 9876543210@paytm",
    upiOk: "UPI ID format is correct ✓",
    upiHint: "E.g. name@okaxis, 98xxxxxx@ybl",
    chooseApp: "Choose your app:",
    phoneAria: "Your phone (on the bill, optional)",
    phonePh: "Phone (optional, on the bill)",
    customerSees: "What customers see:",
    livePreview: "Live preview",
    paymentTo: "Payment to",
    scanPay: "Scan & pay via any app",
    upiPlaceholder: "your-upi@bank",
    allUpi: "Any UPI app",
    customerPay1: "Customers can scan the QR on the WhatsApp bill or use the UPI link to ",
    customerPay2: "pay you directly",
    customerPay3: ".",
    npci: "Payment via NPCI / UPI",
    npciHelp:
      "Money goes from the customer's UPI app straight to your account. KaamBill never holds your money.",
    next2: "Next →",
    save: "Save",
    rcTitle: (n: number) => `Your rate card already has ${n} common items`,
    rcHelp: "Just speak and the app fills in their prices. You can change them anytime.",
    magic: "Magic feature",
    tip: "Tip:",
    tip1: " While making a bill, say ",
    tipPhrase: "“15 meter wire”",
    tip2: " and ",
    tip3: " is calculated for you!",
    standardRates: "Standard rates",
    items: (n: number) => `${n} items`,
    labour: "Labour",
    material: "Material",
    editAria: (name: string) => `Change rate of ${name}`,
    edit: "Edit",
    newRate: "New rate",
    ok: "OK",
    voiceAdd: "Add new items by speaking",
    voiceAddHelp: "Say a new item's rate in a bill and KaamBill will remember it.",
    start: "Get started 🚀",
    ready: "All set! Now make your first bill.",
  },
};

/** S1a–c onboarding (onboarding_1/2/3). UPI: FORMAT check only, no "bank linked" claim (fix F5). */
export function Onboarding({
  initial,
  rateCard,
  onDone,
  standalone = true,
}: {
  initial?: WorkerProfile | null;
  rateCard: RateCardStore;
  onDone: (p: WorkerProfile) => void;
  standalone?: boolean;
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initial?.businessName ?? "");
  const [trade, setTrade] = useState<Trade>(initial?.trade ?? "Electrician");
  const [vpa, setVpa] = useState(initial?.vpa ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [qrState, setQrState] = useState<{ link: string; url: string } | null>(null);
  const t = useT(T);
  const { lang: langId, setLang } = useUiLang();
  const [editing, setEditing] = useState<string | null>(null);
  const entries = useSyncExternalStore(rateCard.subscribe, rateCard.list);
  const vpaOk = isValidVpa(vpa);
  const steps = standalone ? 3 : 2;
  const pct = Math.floor(((step + 1) / steps) * 100);
  const finish = () =>
    onDone({
      businessName: name.trim(),
      trade,
      vpa: vpa.trim(),
      phone: phone.trim() || null,
      city: initial?.city ?? null,
    });
  const handle = vpa.split("@")[1]?.toLowerCase() ?? "";
  const langIdx = Math.max(
    0,
    UI_LANGUAGES.findIndex((l) => l.id === langId),
  );
  const lang = UI_LANGUAGES[langIdx]!;

  // Live preview QR: the real UPI link the bill will carry (no amount yet), generated on the device.
  const qrLink = vpaOk
    ? `upi://pay?pa=${encodeURIComponent(vpa.trim())}&pn=${encodeURIComponent(name.trim() || "KaamBill user")}&cu=INR`
    : null;
  useEffect(() => {
    if (!qrLink) return;
    let live = true;
    void qrDataUrl(qrLink, 224)
      .then((url) => live && setQrState({ link: qrLink, url }))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [qrLink]);
  const qr = qrLink && qrState?.link === qrLink ? qrState.url : null;

  const cycleLang = () => {
    setLang(UI_LANGUAGES[(langIdx + 1) % UI_LANGUAGES.length]!.id);
  };

  const footer = (primary: ReactNode, back?: () => void) => (
    <div
      className={
        standalone
          ? "fixed inset-x-0 bottom-0 z-40 bg-surface/90 pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur-xl"
          : ""
      }
    >
      <div
        className={`flex flex-col gap-space-xs ${standalone ? "mx-auto max-w-md px-margin pb-space-md pt-space-sm" : ""}`}
      >
        {primary}
        {back && (
          <button
            type="button"
            onClick={back}
            className="min-h-[44px] w-full py-space-xs text-center font-label-md text-label-md text-on-surface-variant active:text-on-surface"
          >
            {t.back}
          </button>
        )}
      </div>
    </div>
  );
  const bigBtn =
    "flex h-14 min-h-[56px] w-full items-center justify-center gap-space-sm rounded-2xl bg-primary-container font-body-lg text-body-lg font-semibold text-on-primary shadow-md active:scale-[0.98] disabled:opacity-40 disabled:shadow-none";

  return (
    <section
      className={`flex flex-col gap-space-lg ${standalone ? "pb-36 pt-24" : ""}`}
      aria-label={t.onboarding}
    >
      {standalone && (
        <header className="fixed inset-x-0 top-0 z-40 bg-surface/90 pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
          <div className="mx-auto flex max-w-md flex-col gap-space-sm px-margin py-space-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-container text-on-primary shadow-[0_2px_6px_rgba(11,122,75,0.25)]">
                  <Icon name="handyman" className="text-[20px]" />
                </div>
                <span className="font-title-lg text-title-lg tracking-tight text-on-surface">
                  KaamBill
                </span>
              </div>
              <button
                type="button"
                onClick={cycleLang}
                aria-label={t.langAria(lang.label)}
                className="flex min-h-[44px] items-center gap-1 rounded-full bg-surface-container px-space-sm py-1 font-label-md text-label-md text-on-surface-variant active:bg-surface-container-high"
              >
                <Icon name="translate" className="text-[18px] text-primary" />
                <span>{lang.label}</span>
              </button>
            </div>
            <div className="flex items-center justify-between px-space-xs">
              <div className="flex flex-col">
                <span className="font-caption text-caption font-medium uppercase tracking-wider text-on-surface-variant">
                  {t.onboarding}
                </span>
                <span className="font-label-lg text-label-lg font-semibold text-on-surface">
                  {t.businessProfile}
                </span>
              </div>
              <div className="flex items-center gap-2" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    {i > 0 && (
                      <div
                        className={`h-1 w-6 rounded-full ${i <= step ? "bg-primary-container" : "bg-surface-container-highest"}`}
                      />
                    )}
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full font-label-md text-label-md font-bold ${i <= step ? "bg-primary-container text-on-primary shadow-sm" : "bg-surface-container-highest text-on-surface-variant"}`}
                    >
                      {i < step ? <Icon name="check" className="text-[16px]" /> : i + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Step tracker: "Kadam n / N", % done, step chips */}
      <div
        className="flex flex-col gap-space-xs"
        role="progressbar"
        aria-label={t.onboarding}
        aria-valuemin={1}
        aria-valuemax={steps}
        aria-valuenow={step + 1}
        aria-valuetext={t.stepOf(step + 1, steps)}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className={`flex items-center gap-1 font-bold text-primary ${step === 0 ? "font-label-md text-label-md" : "font-caption text-caption uppercase tracking-wider"}`}
          >
            <Icon name={STEP_ICONS[step]!} className="text-[16px]" />
            {t.stepOf(step + 1, steps)}: {t.stepTitles[step]}
          </span>
          <span className="shrink-0 font-caption text-caption font-semibold text-on-surface-variant">
            {step === 0 ? t.oneMinute : t.pctDone(pct)}
          </span>
        </div>
        <div className="flex items-center gap-2 pt-1">
          {t.stepChips.slice(0, steps).map((c, i) => (
            <div key={i} className="contents">
              {i > 0 && (
                <div
                  className={`h-1 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-surface-container-highest"}`}
                />
              )}
              <div
                className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 font-caption text-caption font-bold ${i < step ? "bg-primary-fixed text-on-primary-fixed" : i === step ? "bg-primary-container text-on-primary shadow-sm" : "bg-surface-container font-semibold text-on-surface-variant"}`}
              >
                {i < step && <Icon name="check_circle" className="text-[15px]" />}
                {i === step && (
                  <Icon
                    name={i === 1 ? "currency_rupee" : STEP_ICONS[i]!}
                    className="text-[15px]"
                  />
                )}
                {c}
              </div>
            </div>
          ))}
        </div>
      </div>

      {step === 0 && (
        <>
          <div className="flex items-center justify-between gap-space-md rounded-2xl bg-surface-container-lowest p-space-md shadow-sm">
            <div className="flex flex-col gap-0.5">
              <span className="inline-flex items-center gap-1 font-label-md text-label-md font-bold text-tertiary-container">
                <Icon name="celebration" className="text-[16px]" /> {t.welcome}
              </span>
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold tracking-tight text-on-surface">
                {t.askName}
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant">{t.nameHelp}</p>
            </div>
            <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary-fixed/40">
              <Icon name="storefront" className="text-[36px] text-primary-container" />
              {name.trim() && (
                <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-container shadow">
                  <Icon name="check" className="text-[14px] text-on-primary" />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center justify-between px-1">
              <label
                htmlFor="kb-name"
                className="flex items-center gap-1 font-label-lg text-label-lg font-bold text-on-surface"
              >
                <span>{t.nameLabel}</span>
                <span className="font-bold text-error">*</span>
              </label>
              {name.trim() && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-fixed px-2 py-0.5 font-caption text-caption font-bold text-on-primary-fixed">
                  <Icon name="check_circle" className="text-[14px]" /> {t.written}
                </span>
              )}
            </div>
            <div className="relative flex items-center">
              <Icon
                name="storefront"
                className="pointer-events-none absolute left-4 text-[24px] text-primary"
              />
              <input
                id="kb-name"
                aria-label={t.nameLabel}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.namePh}
                className="h-14 w-full rounded-2xl bg-surface-container-lowest pl-12 pr-12 font-body-lg text-body-lg font-semibold text-on-surface shadow-sm outline-none focus:ring-2 focus:ring-primary"
              />
              <Icon
                name="edit"
                className="pointer-events-none absolute right-4 text-[20px] text-on-surface-variant"
              />
            </div>
          </div>

          <div className="flex flex-col gap-space-xs">
            <span className="px-1 font-label-md text-label-md text-on-surface-variant">
              {t.yourWork}
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {TRADES.map((tr) => (
                <button
                  key={tr.id}
                  type="button"
                  aria-pressed={trade === tr.id}
                  onClick={() => setTrade(tr.id)}
                  className={`flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3 font-label-md text-label-md shadow-sm ${trade === tr.id ? "bg-primary-fixed font-bold text-on-primary-fixed" : "bg-surface-container font-medium text-on-surface-variant"}`}
                >
                  <Icon name={tr.icon} className="text-[18px] text-primary" />
                  {t.trades[tr.id]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-space-sm rounded-2xl bg-surface-container-high p-space-md text-on-surface shadow-sm">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
              <Icon name="receipt_long" className="text-[18px]" />
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="font-label-md text-label-md font-bold text-on-surface">
                {t.nameOnBill} <span className="text-primary">“{name.trim() || "…"}”</span>
              </p>
              <p className="font-caption text-caption text-on-surface-variant">
                {t.nameOnBillHelp}
              </p>
            </div>
          </div>
          <p className="-mt-3 flex items-center justify-center gap-1.5 font-caption text-caption text-on-surface-variant">
            <Icon name="lock_reset" className="text-[16px] text-primary" /> {t.changeLater}
          </p>

          {footer(
            <button
              type="button"
              disabled={!name.trim()}
              onClick={() => setStep(1)}
              className={bigBtn}
            >
              {t.next1}
            </button>,
          )}
        </>
      )}

      {step === 1 && (
        <>
          <div className="flex flex-col gap-space-xs">
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
              {t.askUpi}
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {t.upiHelp} <span className="font-semibold text-primary">{t.commission}</span>
            </p>
          </div>

          <div className="flex flex-col gap-space-md rounded-2xl bg-surface-container-lowest p-space-md shadow-sm">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="kb-upi"
                className="flex items-center gap-1 font-label-md text-label-md text-on-surface"
              >
                <Icon name="contactless" className="text-[18px] text-primary" /> {t.upiLabel}
              </label>
              <div className="relative flex items-center">
                <Icon
                  name="payments"
                  className="pointer-events-none absolute left-3.5 text-[22px] text-primary"
                />
                <input
                  id="kb-upi"
                  aria-label={t.upiAria}
                  value={vpa}
                  onChange={(e) => setVpa(e.target.value)}
                  placeholder={t.upiPh}
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="off"
                  className={`h-14 w-full rounded-2xl bg-surface-container-low pl-11 pr-3 font-body-lg text-body-lg font-semibold text-on-surface outline-none focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_#005f39] ${vpa && !vpaOk ? "shadow-[0_0_0_2px_#ba1a1a]" : ""}`}
                />
              </div>
              <p
                className={`flex items-center gap-1 px-1 font-caption text-caption font-semibold ${vpaOk ? "text-primary" : vpa ? "text-error" : "text-on-surface-variant"}`}
              >
                {vpaOk ? t.upiOk : t.upiHint}
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="font-caption text-caption font-semibold uppercase tracking-wider text-on-surface-variant">
                {t.chooseApp}
              </span>
              <div className="grid grid-cols-4 gap-2">
                {APPS.map((a) => {
                  const on = a.handles.includes(handle);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setVpa(`${vpa.split("@")[0]?.trim() ?? ""}${a.suffix}`)}
                      className={`flex h-11 items-center justify-center gap-1 rounded-xl font-label-md text-label-md active:scale-95 ${on ? "bg-primary-fixed font-bold text-on-primary-fixed shadow-sm" : "bg-surface-container font-semibold text-on-surface-variant"}`}
                    >
                      <Icon name={a.icon} className="text-[16px]" />
                      {a.id}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="relative flex items-center">
              <Icon
                name="call"
                className="pointer-events-none absolute left-3.5 text-[22px] text-primary"
              />
              <input
                aria-label={t.phoneAria}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                placeholder={t.phonePh}
                className="h-14 w-full rounded-2xl bg-surface-container-low pl-11 pr-3 font-body-lg text-body-lg text-on-surface outline-none focus:bg-surface-container-lowest focus:shadow-[0_0_0_2px_#005f39]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center justify-between px-1">
              <span className="flex items-center gap-1.5 font-label-md text-label-md font-bold text-on-surface">
                <Icon name="visibility" className="text-[18px] text-primary" /> {t.customerSees}
              </span>
              <span className="font-caption text-caption font-semibold text-on-surface-variant">
                {t.livePreview}
              </span>
            </div>
            <div className="relative flex flex-col gap-space-md overflow-hidden rounded-2xl bg-surface-container-low p-space-md shadow-md">
              <div className="absolute left-0 right-0 top-0 h-1.5 bg-primary-container" />
              <div className="flex items-center gap-3 pt-1">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-container text-on-primary shadow-sm">
                  <Icon name={TRADE_ICON[trade]} className="text-[24px]" />
                </div>
                <p className="flex min-w-0 flex-col">
                  <span className="font-caption text-caption font-bold uppercase tracking-wider text-on-surface-variant">
                    {t.paymentTo}
                  </span>{" "}
                  <span className="font-title-lg text-title-lg font-bold leading-tight text-on-surface">
                    {name.trim() || "…"}
                  </span>
                </p>
              </div>
              <div className="flex items-center justify-between gap-space-md rounded-xl bg-surface-container-lowest p-space-md shadow-sm">
                <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-lg bg-white p-1.5 shadow-sm">
                  {qr ? (
                    <img src={qr} alt={`UPI QR: ${vpa.trim()}`} className="h-full w-full" />
                  ) : (
                    <Icon
                      name="qr_code_2"
                      className="text-[64px] text-on-surface-variant-variant"
                    />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center">
                  <span className="font-caption text-caption font-semibold uppercase text-on-surface-variant">
                    {t.scanPay}
                  </span>
                  <div className="mt-1 flex w-fit max-w-full items-center gap-1.5 rounded-lg bg-surface-container px-2.5 py-1.5">
                    <Icon name="qr_code_scanner" className="shrink-0 text-[16px] text-primary" />
                    <span className="truncate font-label-md text-label-md font-bold text-primary">
                      {vpa.trim() || t.upiPlaceholder}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex -space-x-1" aria-hidden>
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-fixed text-[10px] font-bold text-on-primary-fixed">
                        G
                      </div>
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary-fixed text-[10px] font-bold text-on-secondary-fixed">
                        P
                      </div>
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-container-highest text-[10px] font-bold text-on-surface">
                        B
                      </div>
                    </div>
                    <span className="font-caption text-caption font-medium text-on-surface-variant">
                      {t.allUpi}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 px-1">
                <Icon name="mark_chat_read" className="shrink-0 text-[20px] text-primary" />
                <p className="font-caption text-caption leading-snug text-on-surface-variant">
                  {t.customerPay1}
                  <strong>{t.customerPay2}</strong>
                  {t.customerPay3}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-space-sm rounded-xl bg-primary-fixed/40 p-space-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary">
              <Icon name="lock" className="text-[18px]" />
            </div>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md font-bold text-on-primary-fixed">
                {t.npci}
              </span>
              <span className="font-caption text-caption text-on-surface-variant">
                {t.npciHelp}
              </span>
            </div>
          </div>

          {footer(
            <button
              type="button"
              disabled={!vpaOk}
              onClick={() => (standalone ? setStep(2) : finish())}
              className={bigBtn}
            >
              {standalone ? t.next2 : t.save}
            </button>,
            () => setStep(0),
          )}
        </>
      )}

      {step === 2 && (
        <>
          <div className="rounded-2xl bg-surface-container-lowest p-space-md shadow-sm">
            <div className="flex items-start gap-space-sm">
              <div className="flex-1">
                <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                  {t.rcTitle(entries.length)}
                </h1>
                <p className="mt-space-xs font-body-md text-body-md text-on-surface-variant">
                  {t.rcHelp}
                </p>
              </div>
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-surface-container-low">
                <Icon name="receipt_long" className="text-[36px] text-primary-container" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-primary-fixed p-space-md shadow-sm">
            <div className="flex items-start gap-space-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary shadow-sm">
                <Icon name="lightbulb" className="text-[22px] text-on-primary" />
              </div>
              <div className="flex-1">
                <span className="font-label-md text-label-md font-bold uppercase tracking-wide text-on-primary-fixed">
                  {t.magic}
                </span>
                <p className="mt-1 font-body-md text-body-md text-on-primary-fixed">
                  <span className="font-semibold text-primary">{t.tip}</span>
                  {t.tip1}
                  <span className="font-bold underline decoration-primary decoration-2">
                    {t.tipPhrase}
                  </span>
                  {t.tip2}
                  <span className="font-bold">₹375</span>
                  {t.tip3}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-space-sm">
            <div className="flex items-center gap-2 px-1">
              <span className="font-title-lg text-title-lg text-on-surface">{t.standardRates}</span>
              <span className="rounded-full bg-surface-container-highest px-2 py-0.5 font-caption text-caption font-bold text-on-surface">
                {t.items(entries.length)}
              </span>
            </div>
            <ul className="flex flex-col gap-space-sm">
              {entries.map((e) => (
                <li
                  key={e.id}
                  className="rounded-2xl bg-surface-container-lowest p-space-md shadow-sm"
                >
                  <div className="flex items-center justify-between gap-space-sm">
                    <div className="flex min-w-0 items-start gap-space-sm">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-container-low">
                        <Icon
                          name={itemIcon(e.id, e.name, e.category)}
                          className="text-[24px] text-primary"
                        />
                      </div>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-body-lg text-body-lg font-bold text-on-surface">
                          {e.name}
                        </span>
                        <span
                          className={`mt-1 w-fit rounded-md px-2 py-0.5 font-caption text-caption ${e.category === "labour" ? "bg-tertiary-fixed font-semibold text-on-tertiary-fixed" : "bg-surface-container font-medium text-on-surface-variant"}`}
                        >
                          {e.category === "labour" ? t.labour : t.material}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end">
                      <div className="flex items-baseline gap-1">
                        <span className="tabular font-headline-md text-headline-md font-bold text-on-surface">
                          {formatRupees(e.price)}
                        </span>
                        <span className="font-caption text-caption text-on-surface-variant">
                          / {t.units[e.unit] ?? e.unit}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditing(editing === e.id ? null : e.id)}
                        aria-label={t.editAria(e.name)}
                        className="mt-1 flex min-h-[32px] items-center gap-0.5 font-label-md text-caption text-secondary active:opacity-75"
                      >
                        <Icon name="edit" className="text-[16px]" />
                        <span>{t.edit}</span>
                      </button>
                    </div>
                  </div>
                  {editing === e.id && (
                    <form
                      className="mt-2 flex gap-2"
                      onSubmit={(ev) => {
                        ev.preventDefault();
                        const v = Number(new FormData(ev.currentTarget).get("price"));
                        if (v > 0) rateCard.setPrice(e.id, v);
                        setEditing(null);
                      }}
                    >
                      <input
                        name="price"
                        aria-label={t.newRate}
                        inputMode="numeric"
                        defaultValue={e.price}
                        className="min-h-[48px] min-w-0 flex-1 rounded-xl bg-surface-container-low px-3 text-body-lg outline-none focus:shadow-[0_0_0_2px_#005f39]"
                      />
                      <button
                        type="submit"
                        className="min-h-[48px] rounded-xl bg-primary-container px-4 font-label-lg text-label-lg text-on-primary"
                      >
                        {t.ok}
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-space-sm rounded-2xl bg-surface-container-high p-space-md">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-on-secondary">
              <Icon name="mic" className="text-[22px]" />
            </div>
            <div className="flex flex-col">
              <span className="font-label-lg text-label-lg font-bold text-on-surface">
                {t.voiceAdd}
              </span>
              <span className="font-caption text-caption text-on-surface-variant">
                {t.voiceAddHelp}
              </span>
            </div>
          </div>

          {footer(
            <>
              <button type="button" onClick={finish} className={bigBtn}>
                {t.start}
              </button>
              <p className="text-center font-caption text-caption text-on-surface-variant">
                {t.ready}
              </p>
            </>,
            () => setStep(1),
          )}
        </>
      )}
    </section>
  );
}
