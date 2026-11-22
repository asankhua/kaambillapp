import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import type { FinalBill } from "../../phase-4-billing-domain/src/bill/final";
import { DEMO_PROFILE } from "./profile";
import { buildReceiptPdf, receiptPaymentText } from "./pdf";
import { qrDataUrl } from "./qr";
import { buildUpiLink, shareMessage } from "./upi";

// Record every text drawn on the receipt (the embedded font encodes glyphs, so the PDF bytes aren't searchable).
const drawn = vi.hoisted(() => [] as string[]);
vi.mock("jspdf", async (orig) => {
  const m = await orig<typeof import("jspdf")>();
  class Recording extends m.jsPDF {
    constructor(...args: ConstructorParameters<typeof m.jsPDF>) {
      super(...args);
      const text = this.text.bind(this);
      this.text = ((t: string | string[], ...rest: unknown[]) => {
        drawn.push(...(Array.isArray(t) ? t : [t]));
        return (text as (...a: unknown[]) => unknown)(t, ...rest);
      }) as typeof this.text;
    }
  }
  return { ...m, jsPDF: Recording };
});

const bill = (p: Partial<FinalBill> = {}): FinalBill => ({
  billNo: "KB-2026-0042",
  createdAt: new Date().toISOString(),
  docType: "Bill",
  customerName: "Verma ji",
  items: [
    {
      name: "Havells MCB 16A Single Pole",
      qty: 2,
      unit: "pc",
      rateCardId: "rc_mcb_16a",
      unitPrice: 180,
      amount: 360,
    },
  ],
  materialTotal: 360,
  laborCharge: 500,
  visitingCharge: 0,
  discount: 0,
  total: 860,
  status: "finalized",
  paidVia: null,
  transcript: [],
  customerPhone: null,
  ...p,
});
const UPI = buildUpiLink({
  vpa: "ramesh@okaxis",
  payeeName: "Ramesh Electricals",
  amount: 860,
  billNo: "KB-2026-0042",
});
const fonts = new URL("../fonts/", import.meta.url);
const load = async (f: string) => readFileSync(new URL(f, fonts)).toString("base64");
async function receiptTexts(b: FinalBill) {
  drawn.length = 0;
  const pdf = await buildReceiptPdf(b, DEMO_PROFILE, await qrDataUrl(UPI), load);
  expect(
    Buffer.from(await pdf.arrayBuffer())
      .subarray(0, 5)
      .toString(),
  ).toBe("%PDF-");
  return [...drawn];
}

describe("receipt payment status (worker-confirmed only)", () => {
  it("due bill: DUE — scan the QR to pay, QR to scan, GST note", async () => {
    const t = await receiptTexts(bill());
    expect(t).toContain("DUE — scan the QR to pay");
    expect(t).toContain("Scan & pay via any UPI app");
    expect(t.some((x) => x.startsWith("PAID"))).toBe(false);
    expect(t.join(" ")).toContain("Bill / Estimate — not a GST tax invoice");
  });
  it("paid by UPI: PAID (UPI), QR labelled already paid, confirmed by the worker", async () => {
    const t = await receiptTexts(bill({ status: "paid", paidVia: "upi" }));
    expect(t).toContain("PAID (UPI)");
    expect(t).toContain("Already paid — no need to scan");
    expect(t).toContain("Payment confirmed by Ramesh Electricals");
    expect(t.some((x) => x.startsWith("DUE"))).toBe(false);
    expect(t.join(" ")).toContain("not a GST tax invoice");
  });
  it("paid in cash: PAID (Cash)", async () => {
    expect(await receiptTexts(bill({ status: "paid", paidVia: "cash" }))).toContain("PAID (Cash)");
  });
  it("shared-but-unpaid is still due; paid with unknown method is plain PAID", () => {
    expect(receiptPaymentText({ status: "shared", paidVia: null }, "X").status).toBe(
      "DUE — scan the QR to pay",
    );
    expect(receiptPaymentText({ status: "paid", paidVia: null }, "X").status).toBe("PAID");
  });
});

describe("WhatsApp message paid vs due", () => {
  it("due: asks to pay and keeps the UPI link", () => {
    const m = shareMessage("Verma ji", 1235, UPI, "Ramesh Electricals");
    expect(m).toBe(
      `Namaste Verma ji, aapka bill ₹1,235 (Ramesh Electricals). UPI se pay karein: ${UPI}\nBill / Estimate — not a GST tax invoice.`,
    );
  });
  it("paid: thanks instead of asking to pay; no UPI link", () => {
    const upi = shareMessage("Verma ji", 1235, UPI, "Ramesh Electricals", { via: "upi" });
    expect(upi).toContain(
      "Namaste Verma ji, aapka bill ₹1,235 (Ramesh Electricals). Payment mil gaya (UPI), dhanyavaad!",
    );
    expect(upi).not.toMatch(/pay karein|upi:\/\//);
    expect(upi).toContain("not a GST tax invoice");
    expect(shareMessage("Verma ji", 1235, UPI, "Ramesh Electricals", { via: "cash" })).toContain(
      "Payment mil gaya (Cash)",
    );
  });
});
