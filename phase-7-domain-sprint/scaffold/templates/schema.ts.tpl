import { z } from "zod";

/**
 * Domain schema: __NAME__. Groq strict mode rules: z.strictObject, every key required,
 * `.nullable()` (never `.optional()`), no regex patterns / numeric bounds.
 * TODO(H2–4): replace the example fields with what the brief needs.
 */
export const __PASCAL__ItemSchema = z.strictObject({
  label: z.string(),
  qtySpoken: z.string().nullable(), // copy numbers as spoken; normalize on the phone (understanding/normalize.ts)
});

export const __PASCAL__ExtractionSchema = z.strictObject({
  intent: z.enum(["new", "add_info", "correct", "approve", "cancel", "unknown"]),
  items: z.array(__PASCAL__ItemSchema),
  subject: z.string().nullable(), // e.g. patient / student / complainant name
});
export type __PASCAL__Extraction = z.infer<typeof __PASCAL__ExtractionSchema>;
export const unknown__PASCAL__ = (): __PASCAL__Extraction => ({ intent: "unknown", items: [], subject: null });

export const __PASCAL__RequestSchema = z.strictObject({
  text: z.string().min(1).max(1000),
  draftSummary: z.string().max(2000).nullable().optional(),
  pendingQuestion: z.string().max(300).nullable().optional(),
});
