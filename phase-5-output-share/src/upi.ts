/**
 * UPI deep link (architecture.md §5.7). `pn` is the WORKER's name, never "KaamBill", so the
 * customer's UPI app shows who is actually being paid. No API call: the OS hands it to a UPI app.
 *   upi://pay?pa={vpa}&pn={payee}&am={total}.00&cu=INR&tn=Bill%20{billNo}
 */
export interface UpiParams {
  vpa: string;
  payeeName: string;
  amount: number;
  billNo: string;
}

export function buildUpiLink({ vpa, payeeName, amount, billNo }: UpiParams): string {
  if (!vpa.includes("@")) throw new Error("invalid UPI ID");
  if (!(amount > 0)) throw new Error("amount must be positive");
  const q = [
    `pa=${encodeURIComponent(vpa.trim())}`,
    `pn=${encodeURIComponent(payeeName.trim())}`,
    `am=${Math.round(amount)}.00`,
    `cu=INR`,
    `tn=${encodeURIComponent(`Bill ${billNo}`)}`,
  ];
  return `upi://pay?${q.join("&")}`;
}

/** Who paid how. KaamBill can't see payments: "paid" is only the worker's own confirmation. */
export type PaidStatus = { via: "upi" | "cash" | null } | null;

/**
 * WhatsApp message text (phase-5-output-share §1.4). Due bills carry the UPI link; a bill the
 * worker marked paid thanks the customer instead of asking them to pay again.
 */
export function shareMessage(
  customer: string,
  total: number,
  upiLink: string,
  payee: string,
  paid: PaidStatus = null,
): string {
  const amt = `₹${Math.round(total).toLocaleString("en-IN")}`;
  const head = `Namaste ${customer}, aapka bill ${amt} (${payee}).`;
  const body = paid
    ? `Payment mil gaya${paid.via ? ` (${paid.via === "cash" ? "Cash" : "UPI"})` : ""}, dhanyavaad!`
    : `UPI se pay karein: ${upiLink}`;
  return `${head} ${body}\nBill / Estimate — not a GST tax invoice.`;
}
