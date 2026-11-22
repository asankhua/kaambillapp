/**
 * Shared contracts between the PWA (apps/web) and the serverless API (api/).
 * Source of truth: architecture.md §4. Groq strict mode (architecture.md §5.2)
 * requires every field to be present, so "unknown" is always `null`, never omitted.
 */

export type Lang = "hi-Latn" | "hi" | "en-IN";

/** One user utterance: spoken to the mic, or typed / dictated with Wispr Flow into the text box. */
export interface Turn {
  text: string;
  /** "text" = typed or Wispr Flow dictation into the Likh Ke box. */
  source: "stt" | "text";
  /** 0..1 from the speech engine; undefined for text input. */
  sttConfidence?: number;
  lang?: Lang;
}

export interface ExtractedItem {
  /** The words the item came from, e.g. "15 meter Finolex wire". */
  raw: string;
  /** Item name as heard; the matcher maps it to a rate-card entry. */
  name: string;
  /** Quantity exactly as said: "dedh", "sawa do", "15". Null when no quantity was said. */
  qtySpoken: string | null;
  /** Set by the on-device normalizer from qtySpoken; never trusted from the LLM alone. */
  qty: number | null;
  /** Unit as said, normalized later: "m", "pc", "in", "ft"... Null if not said. */
  unit: string | null;
  /**
   * A price the WORKER said for this item ("pachees rupaye meter", "MCB ka rate 200").
   * Never invented by the LLM; null unless spoken. Used to answer "rate kitna hai?"
   * and for voice rate-card edits.
   */
  spokenUnitPrice: number | null;
  /** 0..1 extraction confidence. */
  confidence: number;
}

export type Intent =
  | "new_job" // a new bill / estimate
  | "add_info" // adds items, a customer name, a price answer, a discount
  | "correct" // changes something already in the draft ("15 nahi 20")
  | "approve" // "haan", "bhej do" (normally caught on-device before the API)
  | "cancel"
  | "rate_update" // "MCB ka rate 200 kar do" → rate card edit
  | "history" // Bills screen voice commands: "Verma ji ka bill paid mark kar do"
  | "unknown"; // not understood → "Samajh nahi aaya, ek baar phir boliye"

export interface HistoryAction {
  action: "mark_paid" | "resend";
  customer: string;
  /** Spoken time reference, e.g. "kal", "aaj"; null if none. */
  when: string | null;
  paidVia: "upi" | "cash" | null;
}

export interface Extraction {
  docType: "Bill" | "Estimate";
  language: Lang;
  customerName: string | null;
  items: ExtractedItem[];
  laborCharge: number | null;
  visitingCharge: number | null;
  /** "Discount / Chhoot" in rupees. */
  discount: number | null;
  intent: Intent;
  historyAction: HistoryAction | null;
}

export type RateCardCategory = "electrical" | "plumbing" | "labour" | "other";

export interface RateCardEntry {
  id: string;
  name: string;
  aliases: string[];
  /** Normalized unit: "pc" | "m" | "fan" | ... */
  unit: string;
  /** Whole rupees per unit. */
  price: number;
  category: RateCardCategory;
}

/** Canonical demo data (architecture.md §7.4). */
export const DEMO = {
  workerName: "Ramesh Electricals",
  workerVpa: "ramesh@okaxis",
  customer: "Verma ji",
  utterance:
    "Verma ji ke ghar 2 Havells MCB, 15 meter Finolex wire, aur 500 labour ka bill bana do",
  total: 1235,
  billNo: "KB-2026-0042",
} as const;
