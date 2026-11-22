import { z } from "zod";
import type { Extraction } from "./types.js";

/**
 * Zod schema for the LLM's structured output (architecture.md §4.1, §5.2).
 * Groq strict mode rules: every key required, `null` for unknown (never optional),
 * `additionalProperties: false` (z.strictObject), flat, no regex patterns / numeric bounds.
 * Range checks (e.g. confidence 0..1) are applied AFTER parsing, in `clampExtraction`.
 */
export const LangSchema = z.enum(["hi-Latn", "hi", "en-IN"]);

export const IntentSchema = z.enum([
  "new_job",
  "add_info",
  "correct",
  "approve",
  "cancel",
  "rate_update",
  "history",
  "unknown",
]);

export const ExtractedItemSchema = z.strictObject({
  raw: z.string(),
  name: z.string(),
  qtySpoken: z.string().nullable(),
  qty: z.number().nullable(),
  unit: z.string().nullable(),
  spokenUnitPrice: z.number().nullable(),
  confidence: z.number(),
});

export const HistoryActionSchema = z.strictObject({
  action: z.enum(["mark_paid", "resend"]),
  customer: z.string(),
  when: z.string().nullable(),
  paidVia: z.enum(["upi", "cash"]).nullable(),
});

export const ExtractionSchema = z.strictObject({
  docType: z.enum(["Bill", "Estimate"]),
  language: LangSchema,
  customerName: z.string().nullable(),
  items: z.array(ExtractedItemSchema),
  laborCharge: z.number().nullable(),
  visitingCharge: z.number().nullable(),
  discount: z.number().nullable(),
  intent: IntentSchema,
  historyAction: HistoryActionSchema.nullable(),
});

/** Compile-time guarantee that the schema and the hand-written types never drift apart. */
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const _schemaMatchesTypes: Same<z.infer<typeof ExtractionSchema>, Extraction> = true;
void _schemaMatchesTypes;

/** Clamp/clean values the JSON schema can't constrain in strict mode. */
export function clampExtraction(e: Extraction): Extraction {
  return {
    ...e,
    items: e.items.map((it) => ({
      ...it,
      confidence: Math.min(1, Math.max(0, Number.isFinite(it.confidence) ? it.confidence : 0)),
    })),
  };
}

/** The "couldn't understand" result: the app shows S10c and asks the worker to repeat. */
export function unknownExtraction(language: Extraction["language"] = "hi-Latn"): Extraction {
  return {
    docType: "Bill",
    language,
    customerName: null,
    items: [],
    laborCharge: null,
    visitingCharge: null,
    discount: null,
    intent: "unknown",
    historyAction: null,
  };
}
