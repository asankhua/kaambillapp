import type { Extraction, RateCardEntry, Turn } from "@kaambill/shared";
import type { Matcher } from "../match/matcher";

/**
 * Draft bill (architecture.md §4.3) and how an LLM extraction is merged into it.
 * Prices come ONLY from the rate card or from what the worker said (spokenUnitPrice), never the LLM.
 * Money is whole rupees: line totals are rounded to the nearest rupee.
 */
export type LineStatus = "ok" | "amber" | "pending";

export interface LineItem {
  id: string;
  /** Display name: the rate-card name when matched, else the heard name. */
  name: string;
  heard: string;
  rateCardId: string | null;
  qty: number;
  unit: string;
  unitPrice: number | null;
  priceSource: "rate_card" | "spoken" | null;
  /** min(stt, extraction, match), architecture.md §5.5. */
  confidence: number;
  /** The worker confirmed this line ("haan, sahi hai") or edited it by hand. */
  confirmed: boolean;
  /** "Baad mein tay karein": asked last, but still blocks the bill until priced. */
  skipped: boolean;
  /** Bumped on every change, for the "Abhi joda gaya" highlight. */
  rev: number;
}

export interface DraftBill {
  docType: "Bill" | "Estimate";
  language: Extraction["language"];
  customerName: string | null;
  items: LineItem[];
  laborCharge: number | null;
  visitingCharge: number | null;
  discount: number | null;
  /** Turns saved while offline (S10b). */
  queued: Turn[];
  /** Most recently changed line, for the highlight. */
  lastChangedId: string | null;
  /** Everything the worker said/typed for this bill, kept on the device for disputes (architecture.md §4.3). */
  transcript: string[];
  /** Optional, kept only on the device (typed on S7 for the wa.me link). */
  customerPhone: string | null;
}

export const emptyDraft = (): DraftBill => ({
  docType: "Bill",
  language: "hi-Latn",
  customerName: null,
  items: [],
  laborCharge: null,
  visitingCharge: null,
  discount: null,
  queued: [],
  lastChangedId: null,
  transcript: [],
  customerPhone: null,
});

export const CONF = {
  high: Number(import.meta.env?.VITE_CONF_HIGH ?? 0.85),
  low: Number(import.meta.env?.VITE_CONF_LOW ?? 0.6),
};

export function lineStatus(l: LineItem): LineStatus {
  if (l.unitPrice === null) return "pending";
  if (!l.confirmed && l.confidence < CONF.high) return "amber";
  return "ok";
}

export const lineTotal = (l: LineItem) =>
  l.unitPrice === null ? 0 : Math.round(l.qty * l.unitPrice);
export const materialTotal = (d: DraftBill) => d.items.reduce((s, l) => s + lineTotal(l), 0);
export const billTotal = (d: DraftBill) =>
  Math.max(
    0,
    materialTotal(d) + (d.laborCharge ?? 0) + (d.visitingCharge ?? 0) - (d.discount ?? 0),
  );
/** Items as the worker counts them: material lines + labour + visiting (canonical demo = "3 items"). */
export const itemCount = (d: DraftBill) =>
  d.items.length + (d.laborCharge ? 1 : 0) + (d.visitingCharge ? 1 : 0);
export const isEmpty = (d: DraftBill) =>
  d.items.length === 0 &&
  d.laborCharge === null &&
  d.visitingCharge === null &&
  d.customerName === null;

let seq = 0;
const newId = () => `li_${Date.now().toString(36)}_${(seq++).toString(36)}`;

export interface MergeEnv {
  match: Matcher;
  rateCard: { get(id: string): RateCardEntry | undefined };
  /** STT confidence of the turn (undefined for text). */
  sttConfidence?: number;
}

/** Find the existing line an extracted item refers to (same rate-card entry, or same heard name). */
function findLine(d: DraftBill, rateCardId: string | null, heard: string): LineItem | undefined {
  const h = heard.trim().toLowerCase();
  return d.items.find(
    (l) =>
      (rateCardId && l.rateCardId === rateCardId) ||
      l.heard.toLowerCase() === h ||
      l.name.toLowerCase() === h,
  );
}

/**
 * Merge an extraction into the draft. Rules: null = unchanged; repeating a value = unchanged;
 * `correct` replaces quantities on existing lines; `add_info` / `new_job` add lines
 * (or set price/qty on an existing line with the same item).
 */
export function mergeExtraction(draft: DraftBill, e: Extraction, env: MergeEnv): DraftBill {
  const d: DraftBill = { ...draft, items: draft.items.map((l) => ({ ...l })), lastChangedId: null };
  if (e.customerName) d.customerName = e.customerName;
  if (e.docType === "Estimate") d.docType = "Estimate";
  if (draft.items.length === 0) d.language = e.language;
  if (e.laborCharge !== null) d.laborCharge = Math.round(e.laborCharge);
  if (e.visitingCharge !== null) d.visitingCharge = Math.round(e.visitingCharge);
  if (e.discount !== null) d.discount = Math.round(e.discount);

  for (const it of e.items) {
    const m = env.match(it.name);
    const entry = m.entry;
    const confidence = Math.min(it.confidence, m.entry ? m.score : 1, env.sttConfidence ?? 1);
    const existing = findLine(d, entry?.id ?? null, it.name);

    if (existing) {
      if (it.qty !== null) existing.qty = it.qty;
      if (it.unit) existing.unit = it.unit;
      if (it.spokenUnitPrice !== null) {
        existing.unitPrice = Math.round(it.spokenUnitPrice);
        existing.priceSource = "spoken";
        existing.skipped = false;
      }
      existing.confidence = it.qty !== null ? confidence : existing.confidence;
      existing.confirmed = existing.confirmed && it.qty === null;
      existing.rev++;
      d.lastChangedId = existing.id;
      continue;
    }
    if (it.qty === null && it.spokenUnitPrice === null) continue; // nothing usable
    const line: LineItem = {
      id: newId(),
      name: entry?.name ?? it.name,
      heard: it.name,
      rateCardId: entry?.id ?? null,
      qty: it.qty ?? 1,
      unit: it.unit ?? entry?.unit ?? "pc",
      unitPrice:
        it.spokenUnitPrice !== null ? Math.round(it.spokenUnitPrice) : (entry?.price ?? null),
      priceSource: it.spokenUnitPrice !== null ? "spoken" : entry ? "rate_card" : null,
      confidence,
      confirmed: false,
      skipped: false,
      rev: 0,
    };
    d.items.push(line);
    d.lastChangedId = line.id;
  }
  return d;
}

/** Short text sent to /api/extract so mid-bill turns have context (no prices, no phone numbers). */
export function draftSummary(d: DraftBill): string | null {
  if (isEmpty(d)) return null;
  const parts = [d.customerName ?? "(no customer yet)"];
  for (const l of d.items)
    parts.push(`${l.name} ×${l.qty} ${l.unit}${l.unitPrice === null ? " (rate missing)" : ""}`);
  if (d.laborCharge) parts.push(`labour ₹${d.laborCharge}`);
  if (d.visitingCharge) parts.push(`visiting ₹${d.visitingCharge}`);
  return parts.join(" · ");
}
