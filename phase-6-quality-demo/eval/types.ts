import type { Extraction, Turn } from "@kaambill/shared";

/** Expected item in the eval set: like ExtractedItem, plus the rate-card id the matcher should pick. */
export interface ExpectedItem {
  name: string;
  rateCardId: string | null;
  qtySpoken: string | null;
  qty: number | null;
  unit: string | null;
  spokenUnitPrice: number | null;
}

export interface EvalCase {
  id: string;
  turn: Turn;
  /** The current draft bill the app sends with mid-bill turns (corrections, additions); null for new jobs. */
  draftSummary: string | null;
  /** The app's pending clarifying question, if this turn answers one. */
  pendingQuestion: string | null;
  tags: string[];
  expected: Omit<Extraction, "items"> & { items: ExpectedItem[] };
  /**
   * Mid-bill turns: values that merely repeat the current draft are harmless (the merge treats
   * them as "unchanged"), so they're accepted too. Keyed by top-level field.
   */
  alsoAccept: Partial<
    Record<
      "customerName" | "laborCharge" | "visitingCharge" | "discount",
      (string | number | null)[]
    >
  >;
  /** Bill total in rupees when every item is priced from the rate card; null otherwise. */
  expectedTotal: number | null;
}
