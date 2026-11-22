import type { Lang } from "@kaambill/shared";
import { formatRupees } from "./speech";

/**
 * Everything KaamBill SHOWS (on screen only; no audio), per language (product rule: mirror the speaker's language,
 * ≤ 2 sentences, no accounting jargon). Language = what the LLM detected for the bill.
 * Supported: Hinglish (hi-Latn), Hindi (hi, Devanagari) and English (en-IN).
 * ⚠️ The Devanagari strings still need a native-speaker review before the finale.
 */
export interface Phrases {
  askItems: string;
  askCustomer: string;
  askPrice: (item: string) => string;
  confirm: (qty: string, item: string) => string;
  askLabour: string;
  readBack: (who: string, total: string, n: number, estimate: boolean) => string;
  notUnderstood: string;
  completion: string;
  customerFallback: string;
}

export const PHRASES: Record<Lang, Phrases> = {
  "hi-Latn": {
    askItems: "Kya kya kaam kiya, boliye?",
    askCustomer: "Kiske naam pe bill banana hai?",
    askPrice: (i) => `${i} ka rate kitna hai?`,
    confirm: (q, i) => `${q} ${i}, sahi hai?`,
    askLabour: "Labour kitna jodna hai?",
    readBack: (w, t, n, e) =>
      e
        ? `${w} ka estimate ${t} hai, ${n} items ke saath. WhatsApp par bhej doon?`
        : `${w} ka total ${t} bana hai, ${n} items ke saath. WhatsApp par bhej doon?`,
    notUnderstood: "Samajh nahi aaya, ek baar phir boliye.",
    completion: "Bill taiyaar hai, WhatsApp khul gaya hai — bas Send dabaiye.",
    customerFallback: "Grahak",
  },
  hi: {
    askItems: "क्या क्या काम किया, बोलिए?",
    askCustomer: "किसके नाम पे बिल बनाना है?",
    askPrice: (i) => `${i} का रेट कितना है?`,
    confirm: (q, i) => `${q} ${i}, सही है?`,
    askLabour: "लेबर कितना जोड़ना है?",
    readBack: (w, t, n, e) =>
      e
        ? `${w} का एस्टिमेट ${t} है, ${n} आइटम के साथ। WhatsApp पर भेज दूँ?`
        : `${w} का टोटल ${t} बना है, ${n} आइटम के साथ। WhatsApp पर भेज दूँ?`,
    notUnderstood: "समझ नहीं आया, एक बार फिर बोलिए।",
    completion: "बिल तैयार है, WhatsApp खुल गया है — बस Send दबाइए।",
    customerFallback: "ग्राहक",
  },
  "en-IN": {
    askItems: "What work did you do? Please tell me.",
    askCustomer: "Whose name should the bill be in?",
    askPrice: (i) => `What is the rate for ${i}?`,
    confirm: (q, i) => `${q} ${i}, is that right?`,
    askLabour: "How much labour should I add?",
    readBack: (w, t, n, e) =>
      e
        ? `${w}'s estimate is ${t}, with ${n} items. Shall I send it on WhatsApp?`
        : `${w}'s total is ${t}, with ${n} items. Shall I send it on WhatsApp?`,
    notUnderstood: "Sorry, I didn't catch that. Please say it again.",
    completion: "The bill is ready and WhatsApp is open — just tap Send.",
    customerFallback: "Customer",
  },
};

export const phrasesFor = (lang: Lang | undefined) =>
  PHRASES[lang ?? "hi-Latn"] ?? PHRASES["hi-Latn"];

/** A message for the screen. */
export const utter = (text: string) => ({ text });
export { formatRupees };

/** Messages the billing adapter creates itself (rate updates, Bills-screen commands), per language. */
export interface AdapterPhrases {
  rateSet: (item: string, price: string) => string;
  rateItemNotFound: (item: string) => string;
  rateNotUnderstood: string;
  billsInBillsTab: string;
}

export const ADAPTER_PHRASES: Record<Lang, AdapterPhrases> = {
  "hi-Latn": {
    rateSet: (i, p) => `${i} ka rate ${p} kar diya.`,
    rateItemNotFound: (i) => `${i} rate card mein nahi mila.`,
    rateNotUnderstood: "Rate samajh nahi aaya.",
    billsInBillsTab: "Bills ka kaam Bills tab mein karein.",
  },
  hi: {
    rateSet: (i, p) => `${i} का रेट ${p} कर दिया।`,
    rateItemNotFound: (i) => `${i} रेट कार्ड में नहीं मिला।`,
    rateNotUnderstood: "रेट समझ नहीं आया।",
    billsInBillsTab: "बिल का काम Bills टैब में करें।",
  },
  "en-IN": {
    rateSet: (i, p) => `${i} rate set to ${p}.`,
    rateItemNotFound: (i) => `${i} is not in the rate card.`,
    rateNotUnderstood: "Sorry, I didn't get the rate.",
    billsInBillsTab: "Please manage bills in the Bills tab.",
  },
};

export const adapterPhrasesFor = (lang: Lang | undefined) =>
  ADAPTER_PHRASES[lang ?? "hi-Latn"] ?? ADAPTER_PHRASES["hi-Latn"];
