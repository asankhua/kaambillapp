import { describe, expect, it, vi } from "vitest";
import { emptyDraft } from "../../phase-4-billing-domain/src/bill/model";
import { createMemoryDrafts, matchesSearch } from "./drafts";
import { createMemoryHistory } from "./history";

const draft = (p = {}) => ({
  ...emptyDraft(),
  customerName: "Verma ji",
  laborCharge: 500,
  transcript: ["Verma ji … 500 labour"],
  ...p,
});

describe("draft store (architecture.md §4.3 draft → queued)", () => {
  it("saves a non-empty draft, marks queued when turns wait for the network, clears on empty", () => {
    const persist = vi.fn();
    const s = createMemoryDrafts(null, persist, () => new Date("2026-11-21T10:00:00Z"));
    s.save(draft());
    expect(s.get()).toMatchObject({ status: "draft", savedAt: "2026-11-21T10:00:00.000Z" });
    s.save(draft({ queued: [{ text: "2 MCB", source: "stt" }] }));
    expect(s.get()?.status).toBe("queued");
    s.save(emptyDraft());
    expect(s.get()).toBeNull();
    expect(persist).toHaveBeenLastCalledWith(null);
  });
  it("search matches customer, items, bill no. or anything said", () => {
    expect(matchesSearch("verma", ["Verma ji"])).toBe(true);
    expect(matchesSearch("finolex", ["Sharma ji", "Finolex Wire 1.5 sq mm"])).toBe(true);
    expect(matchesSearch("0042", ["KB-2026-0042"])).toBe(true);
    expect(matchesSearch("labour", ["x", "…500 labour"])).toBe(true);
    expect(matchesSearch("gupta", ["Verma ji"])).toBe(false);
    expect(matchesSearch("  ", ["anything"])).toBe(true);
  });
});

describe("history keeps the customer's number when shared", () => {
  it("markShared stores the phone and keeps an earlier one if none is typed", () => {
    const h = createMemoryHistory([
      {
        billNo: "B1",
        createdAt: new Date().toISOString(),
        docType: "Bill",
        customerName: "Verma ji",
        items: [],
        materialTotal: 0,
        laborCharge: 0,
        visitingCharge: 0,
        discount: 0,
        total: 10,
        status: "finalized",
        paidVia: null,
        transcript: [],
        customerPhone: null,
      },
    ]);
    h.markShared("B1", "98112 34567");
    expect(h.list()[0]).toMatchObject({ status: "shared", customerPhone: "98112 34567" });
    h.markShared("B1", null);
    expect(h.list()[0]!.customerPhone).toBe("98112 34567");
  });
});
