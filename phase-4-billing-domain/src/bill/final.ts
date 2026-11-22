import type { DraftBill, LineItem } from "./model";
import { billTotal, lineTotal, materialTotal } from "./model";

/** A finalized (locked) bill: prices frozen at approval time (architecture.md §4.3). */
export interface FinalBill {
  billNo: string;
  createdAt: string;
  docType: DraftBill["docType"];
  customerName: string;
  items: (Pick<LineItem, "name" | "qty" | "unit" | "rateCardId"> & {
    unitPrice: number;
    amount: number;
  })[];
  materialTotal: number;
  laborCharge: number;
  visitingCharge: number;
  discount: number;
  total: number;
  status: "finalized" | "shared" | "paid";
  paidVia: "upi" | "cash" | null;
  /** What was heard for this bill (on device only, for disputes). */
  transcript: string[];
  /** Customer WhatsApp number if the worker typed one (on device only). */
  customerPhone: string | null;
}

export class UnpricedItemError extends Error {
  override name = "UnpricedItemError";
}

export function finalizeDraft(d: DraftBill, billNo: string, now = new Date()): FinalBill {
  if (d.items.some((l) => l.unitPrice === null))
    throw new UnpricedItemError("an item has no price");
  return {
    billNo,
    createdAt: now.toISOString(),
    docType: d.docType,
    customerName: d.customerName ?? "Grahak",
    items: d.items.map((l) => ({
      name: l.name,
      qty: l.qty,
      unit: l.unit,
      rateCardId: l.rateCardId,
      unitPrice: l.unitPrice!,
      amount: lineTotal(l),
    })),
    materialTotal: materialTotal(d),
    laborCharge: d.laborCharge ?? 0,
    visitingCharge: d.visitingCharge ?? 0,
    discount: d.discount ?? 0,
    total: billTotal(d),
    status: "finalized",
    paidVia: null,
    transcript: [...d.transcript],
    customerPhone: d.customerPhone,
  };
}

/** KB-2026-0042 style numbers. Demo mode starts at 42 (architecture.md §7.4). */
export function createBillNumbers(
  start = import.meta.env?.VITE_DEMO_MODE === "true" ? 42 : 1,
  year = new Date().getFullYear(),
) {
  let n = start;
  return () => `KB-${year}-${String(n++).padStart(4, "0")}`;
}
