import regularUrl from "../fonts/NotoSans-Regular.subset.ttf?url";
import boldUrl from "../fonts/NotoSans-Bold.subset.ttf?url";
import devaUrl from "../fonts/NotoSansDevanagari-Regular.subset.ttf?url";
import type { FinalBill } from "../../phase-4-billing-domain/src/bill/final";
import type { WorkerProfile } from "./profile";

/**
 * A6 receipt PDF (S11 kaambill_printable_receipt_a6), generated on the device.
 * jsPDF and the fonts load lazily, only when a bill is shared. Fonts are Noto Sans subsets
 * (Latin + ₹, about 35 KB each); Devanagari loads only if a name needs it.
 * Limitation: jsPDF does not shape complex scripts, so Devanagari conjuncts may render imperfectly.
 */
export type FontLoader = (file: string) => Promise<string>; // returns base64 TTF

const toBase64 = (buf: ArrayBuffer) => {
  let s = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000)
    s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};
const FONT_URLS: Record<string, string> = {
  "NotoSans-Regular.subset.ttf": regularUrl,
  "NotoSans-Bold.subset.ttf": boldUrl,
  "NotoSansDevanagari-Regular.subset.ttf": devaUrl,
};
export const fetchFont: FontLoader = async (file) =>
  toBase64(await (await fetch(FONT_URLS[file] ?? file)).arrayBuffer());

const hasDevanagari = (s: string) => /[ऀ-ॿ]/.test(s);
const rupees = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/**
 * Payment status printed on the receipt. KaamBill can't see payments (no gateway): "PAID" only
 * means the worker confirmed it in the app, and the receipt says so.
 */
export function receiptPaymentText(bill: Pick<FinalBill, "status" | "paidVia">, payee: string) {
  if (bill.status === "paid") {
    const via = bill.paidVia === "cash" ? " (Cash)" : bill.paidVia === "upi" ? " (UPI)" : "";
    return {
      paid: true,
      status: `PAID${via}`,
      note: `Payment confirmed by ${payee}`,
      qrLabel: "Already paid — no need to scan",
    };
  }
  return {
    paid: false,
    status: "DUE — scan the QR to pay",
    note: null,
    qrLabel: "Scan & pay via any UPI app",
  };
}

export async function buildReceiptPdf(
  bill: FinalBill,
  profile: WorkerProfile,
  qrPngDataUrl: string,
  loadFont: FontLoader = fetchFont,
): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a6", compress: true });
  doc.addFileToVFS("NotoSans-Regular.ttf", await loadFont("NotoSans-Regular.subset.ttf"));
  doc.addFont("NotoSans-Regular.ttf", "Noto", "normal");
  doc.addFileToVFS("NotoSans-Bold.ttf", await loadFont("NotoSans-Bold.subset.ttf"));
  doc.addFont("NotoSans-Bold.ttf", "Noto", "bold");
  const needsDeva = [
    bill.customerName,
    profile.businessName,
    ...bill.items.map((i) => i.name),
  ].some(hasDevanagari);
  if (needsDeva) {
    doc.addFileToVFS("NotoDeva.ttf", await loadFont("NotoSansDevanagari-Regular.subset.ttf"));
    doc.addFont("NotoDeva.ttf", "NotoDeva", "normal");
  }
  const font = (style: "normal" | "bold", text = "") =>
    doc.setFont(
      hasDevanagari(text) && needsDeva ? "NotoDeva" : "Noto",
      hasDevanagari(text) ? "normal" : style,
    );

  const W = 105,
    M = 7;
  let y = 10;
  const green = [11, 122, 75] as const;
  // Header
  font("bold", profile.businessName);
  doc.setFontSize(13);
  doc.setTextColor(...green);
  doc.text(profile.businessName, M, y);
  y += 5;
  font("normal");
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  doc.text(
    [profile.trade, profile.city, profile.phone ? `Ph: ${profile.phone}` : null]
      .filter(Boolean)
      .join(" • "),
    M,
    y,
  );
  y += 5;
  doc.setDrawColor(...green);
  doc.setLineWidth(0.4);
  doc.line(M, y, W - M, y);
  y += 5;
  font("bold");
  doc.setFontSize(9);
  doc.setTextColor(20, 27, 43);
  doc.text(bill.docType === "Estimate" ? "ESTIMATE" : "KACHHA BILL · Cash / UPI Memo", M, y);
  font("normal");
  doc.setFontSize(7.5);
  doc.text(`Bill No: ${bill.billNo}`, W - M, y - 0.5, { align: "right" });
  doc.text(
    `Taareekh: ${new Date(bill.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`,
    W - M,
    y + 3,
    { align: "right" },
  );
  y += 6;
  font("normal", bill.customerName);
  doc.setFontSize(8.5);
  doc.text(`Billed to: ${bill.customerName}`, M, y);
  y += 6;

  // Table
  font("bold");
  doc.setFontSize(7.5);
  doc.setFillColor(233, 237, 255);
  doc.rect(M, y - 3.5, W - 2 * M, 5, "F");
  doc.text("Item / Kaam", M + 1, y);
  doc.text("Qty", 60, y, { align: "right" });
  doc.text("Rate", 75, y, { align: "right" });
  doc.text("Amount", W - M - 1, y, { align: "right" });
  y += 5;
  const row = (name: string, qty: string, rate: string, amount: string) => {
    font("normal", name);
    doc.setFontSize(7.5);
    const lines = doc.splitTextToSize(name, 42) as string[];
    doc.text(lines, M + 1, y);
    font("normal");
    doc.text(qty, 60, y, { align: "right" });
    doc.text(rate, 75, y, { align: "right" });
    doc.text(amount, W - M - 1, y, { align: "right" });
    y += 4 * lines.length + 0.5;
  };
  for (const i of bill.items)
    row(i.name, `${i.qty} ${i.unit}`, rupees(i.unitPrice), rupees(i.amount));
  if (bill.laborCharge)
    row("Labour / Mazdoori", "1", rupees(bill.laborCharge), rupees(bill.laborCharge));
  if (bill.visitingCharge)
    row("Visiting charge", "1", rupees(bill.visitingCharge), rupees(bill.visitingCharge));
  if (bill.discount) row("Chhoot / Discount", "", "", `− ${rupees(bill.discount)}`);
  doc.setDrawColor(200, 200, 200);
  doc.line(M, y - 1.5, W - M, y - 1.5);
  y += 3;
  font("bold");
  doc.setFontSize(11);
  doc.setTextColor(...green);
  doc.text("KUL RAKAM / TOTAL", M + 1, y);
  doc.text(rupees(bill.total), W - M - 1, y, { align: "right" });
  y += 4;

  // Payment status (worker-confirmed) — green PAID or amber DUE
  const pay = receiptPaymentText(bill, profile.businessName);
  if (pay.paid) doc.setFillColor(...green);
  else doc.setFillColor(255, 244, 219);
  doc.roundedRect(M, y, W - 2 * M, 7, 1.5, 1.5, "F");
  font("bold");
  doc.setFontSize(9);
  if (pay.paid) doc.setTextColor(255, 255, 255);
  else doc.setTextColor(120, 72, 0);
  doc.text(pay.status, W / 2, y + 4.8, { align: "center" });
  y += 7;
  if (pay.note) {
    font("normal", pay.note);
    doc.setFontSize(6.5);
    doc.setTextColor(90, 90, 90);
    doc.text(pay.note, W / 2, y + 3, { align: "center" });
    y += 3;
  }
  y += 4;

  // UPI QR (kept on paid bills too, labelled "already paid")
  const qr = 34;
  doc.addImage(qrPngDataUrl, "PNG", (W - qr) / 2, y, qr, qr);
  y += qr + 4;
  font("bold");
  doc.setFontSize(8);
  doc.setTextColor(20, 27, 43);
  doc.text(pay.qrLabel, W / 2, y, { align: "center" });
  y += 3.5;
  font("normal", profile.businessName);
  doc.setFontSize(7.5);
  doc.text(`Payee: ${profile.businessName} · ${rupees(bill.total)} · ${profile.vpa}`, W / 2, y, {
    align: "center",
  });
  y += 6;
  font("normal");
  doc.setFontSize(6.5);
  doc.setTextColor(90, 90, 90);
  doc.text("Bill / Estimate — not a GST tax invoice · Made with KaamBill", W / 2, 143, {
    align: "center",
  });
  return doc.output("blob");
}

export const pdfFileName = (bill: FinalBill) => `KaamBill-${bill.billNo}.pdf`;
