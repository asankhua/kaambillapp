import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import type { FinalBill } from "../../phase-4-billing-domain/src/bill/final";
import { createMemoryHistory, handleHistoryCommand, startOfWeek, summarize } from "./history";
import { DEMO_PROFILE, createMemoryProfile, isValidVpa } from "./profile";
import { buildReceiptPdf } from "./pdf";
import { qrDataUrl } from "./qr";
import { shareBill, waMeLink } from "./share";
import { buildUpiLink, shareMessage } from "./upi";

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
    {
      name: "Finolex Wire 1.5 sq mm",
      qty: 15,
      unit: "m",
      rateCardId: "rc_wire_1_5",
      unitPrice: 25,
      amount: 375,
    },
  ],
  materialTotal: 735,
  laborCharge: 500,
  visitingCharge: 0,
  discount: 0,
  total: 1235,
  status: "finalized",
  paidVia: null,
  transcript: [],
  customerPhone: null,
  ...p,
});

describe("UPI link", () => {
  it("pays the WORKER (pn), exact amount, INR, bill note", () => {
    expect(
      buildUpiLink({
        vpa: "ramesh@okaxis",
        payeeName: "Ramesh Electricals",
        amount: 1235,
        billNo: "KB-2026-0042",
      }),
    ).toBe(
      "upi://pay?pa=ramesh%40okaxis&pn=Ramesh%20Electricals&am=1235.00&cu=INR&tn=Bill%20KB-2026-0042",
    );
  });
  it("encodes Hindi payee names and rejects bad input", () => {
    expect(buildUpiLink({ vpa: "a@ok", payeeName: "रमेश", amount: 10, billNo: "X" })).toContain(
      "pn=%E0%A4%B0",
    );
    expect(() => buildUpiLink({ vpa: "nope", payeeName: "A", amount: 10, billNo: "X" })).toThrow();
    expect(() => buildUpiLink({ vpa: "a@ok", payeeName: "A", amount: 0, billNo: "X" })).toThrow();
  });
  it("never uses KaamBill as the payee", () => {
    expect(
      buildUpiLink({ vpa: "a@ok", payeeName: DEMO_PROFILE.businessName, amount: 1, billNo: "X" }),
    ).not.toMatch(/pn=KaamBill/);
  });
});

describe("profile", () => {
  it.each([
    ["ramesh@okaxis", true],
    ["ramesh.electric@okhdfcbank", true],
    ["9876543210@ybl", true],
    ["ramesh", false],
    ["@okaxis", false],
    ["r@1", false],
  ])("VPA %s → %s", (v, ok) => expect(isValidVpa(v)).toBe(ok));
  it("refuses to save an invalid UPI ID (format check only)", () => {
    const p = createMemoryProfile();
    expect(() => p.save({ ...DEMO_PROFILE, vpa: "bad" })).toThrow();
    p.save(DEMO_PROFILE);
    expect(p.get()?.businessName).toBe("Ramesh Electricals");
  });
});

describe("share", () => {
  it("uses the share sheet with the PDF when available; the worker sends", async () => {
    const nav = { canShare: vi.fn(() => true), share: vi.fn(async () => {}) };
    const open = vi.fn();
    expect(
      await shareBill(
        { pdf: new Blob(["x"]), fileName: "a.pdf", message: "m" },
        nav as never,
        open,
      ),
    ).toBe("share_sheet");
    expect(open).not.toHaveBeenCalled();
  });
  it("falls back to a wa.me link with +91 for 10-digit numbers", async () => {
    const open = vi.fn();
    expect(
      await shareBill(
        { pdf: new Blob(["x"]), fileName: "a.pdf", message: "Namaste", phone: "98112 34567" },
        undefined,
        open,
      ),
    ).toBe("whatsapp_link");
    expect(open).toHaveBeenCalledWith("https://wa.me/919811234567?text=Namaste");
  });
  it("treats a cancelled share sheet as cancelled (no auto-send fallback)", async () => {
    const nav = {
      canShare: () => true,
      share: async () => {
        throw Object.assign(new Error("x"), { name: "AbortError" });
      },
    };
    const open = vi.fn();
    expect(
      await shareBill(
        { pdf: new Blob(["x"]), fileName: "a.pdf", message: "m" },
        nav as never,
        open,
      ),
    ).toBe("cancelled");
    expect(open).not.toHaveBeenCalled();
  });
  it("message has amount, payee, UPI link and the GST note", () => {
    const m = shareMessage("Verma ji", 1235, "upi://pay?x", "Ramesh Electricals");
    expect(m).toContain("₹1,235");
    expect(m).toContain("not a GST tax invoice");
    expect(waMeLink(m)).toMatch(/^https:\/\/wa\.me\/\?text=/);
  });
});

describe("QR + PDF", () => {
  it("builds a PNG QR and an A6 PDF under 200 KB with the ₹ font", async () => {
    const qr = await qrDataUrl(
      buildUpiLink({
        vpa: "ramesh@okaxis",
        payeeName: "Ramesh Electricals",
        amount: 1235,
        billNo: "KB-2026-0042",
      }),
    );
    expect(qr.startsWith("data:image/png;base64,")).toBe(true);
    const fonts = new URL("../fonts/", import.meta.url);
    const load = async (f: string) => readFileSync(new URL(f, fonts)).toString("base64");
    const pdf = await buildReceiptPdf(bill(), DEMO_PROFILE, qr, load);
    const bytes = Buffer.from(await pdf.arrayBuffer());
    expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
    expect(bytes.length).toBeLessThan(200_000);
  });
});

describe("history", () => {
  it("add → shared → paid; summaries exclude estimates", () => {
    const h = createMemoryHistory();
    h.add(bill());
    h.add(bill({ billNo: "KB-2026-0043", customerName: "Sharma ji", total: 765 }));
    h.add(bill({ billNo: "KB-2026-0044", docType: "Estimate", total: 9999 }));
    h.markShared("KB-2026-0042");
    h.markPaid("KB-2026-0043", "cash");
    expect(h.list().find((b) => b.billNo === "KB-2026-0043")).toMatchObject({
      status: "paid",
      paidVia: "cash",
    });
    expect(summarize(h.list(), startOfWeek())).toMatchObject({
      total: 2000,
      count: 2,
      paid: 765,
      pending: 1235,
    });
  });
  it("voice: 'Verma ji ka bill paid mark kar do' and 'kal ka Gupta ji wala bill phir bhejo'", () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString();
    const h = createMemoryHistory([
      bill(),
      bill({ billNo: "KB-2026-0039", customerName: "Gupta ji", createdAt: yesterday }),
    ]);
    expect(
      handleHistoryCommand(h, {
        action: "mark_paid",
        customer: "Verma ji",
        when: null,
        paidVia: "upi",
      }).text,
    ).toBe("Verma ji ka bill paid mark ho gaya (UPI).");
    expect(h.find("verma")?.status).toBe("paid");
    const onResend = vi.fn();
    expect(
      handleHistoryCommand(
        h,
        { action: "resend", customer: "Gupta ji", when: "kal", paidVia: null },
        onResend,
      ).text,
    ).toContain("Gupta ji ka bill khol diya");
    expect(onResend).toHaveBeenCalledWith(expect.objectContaining({ billNo: "KB-2026-0039" }));
    expect(
      handleHistoryCommand(h, {
        action: "resend",
        customer: "Gupta ji",
        when: "aaj",
        paidVia: null,
      }).text,
    ).toBe("Gupta ji ka koi bill nahi mila.");
  });
  it("voice confirmations follow the chosen language (hi, en-IN)", () => {
    const h = createMemoryHistory([bill()]);
    expect(
      handleHistoryCommand(
        h,
        { action: "mark_paid", customer: "Verma ji", when: null, paidVia: "cash" },
        undefined,
        "hi",
      ).text,
    ).toBe("Verma ji का बिल पेड मार्क हो गया (कैश)।");
    expect(
      handleHistoryCommand(
        h,
        { action: "resend", customer: "Verma ji", when: null, paidVia: null },
        undefined,
        "hi",
      ).text,
    ).toBe("Verma ji का बिल खोल दिया — WhatsApp पर Send दबाइए।");
    expect(
      handleHistoryCommand(
        h,
        { action: "resend", customer: "Gupta ji", when: null, paidVia: null },
        undefined,
        "hi",
      ).text,
    ).toBe("Gupta ji का कोई बिल नहीं मिला।");
    expect(
      handleHistoryCommand(
        h,
        { action: "mark_paid", customer: "Verma ji", when: null, paidVia: "upi" },
        undefined,
        "en-IN",
      ).text,
    ).toBe("Verma ji's bill marked paid (UPI).");
    expect(
      handleHistoryCommand(
        h,
        { action: "resend", customer: "Verma ji", when: null, paidVia: null },
        undefined,
        "en-IN",
      ).text,
    ).toBe("Verma ji's bill is open — tap Send in WhatsApp.");
    expect(
      handleHistoryCommand(
        h,
        { action: "resend", customer: "Gupta ji", when: null, paidVia: null },
        undefined,
        "en-IN",
      ).text,
    ).toBe("No bill found for Gupta ji.");
  });
});
