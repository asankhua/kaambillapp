import { describe, expect, it, vi } from "vitest";
import { createActor, waitFor } from "xstate";
import { unknownExtraction, type Extraction, type ExtractedItem } from "@kaambill/shared";
import { createConversationMachine } from "../../phase-2-voice-core/src/machine/conversation.machine";
import { createBillingAdapter } from "./adapter";
import {
  billTotal,
  emptyDraft,
  itemCount,
  lineStatus,
  mergeExtraction,
  type DraftBill,
} from "./bill/model";
import { createBillNumbers, finalizeDraft, UnpricedItemError } from "./bill/final";
import { nextQuestion, readBack } from "./clarify";
import { createMatcher } from "./match/matcher";
import { createMemoryRateCard } from "./rateCard/store";
import { isApprovalText } from "./speech";

const item = (
  name: string,
  qtySpoken: string | null,
  qty: number | null,
  unit: string | null = null,
  extra: Partial<ExtractedItem> = {},
): ExtractedItem => ({
  raw: `${qtySpoken ?? ""} ${name}`.trim(),
  name,
  qtySpoken,
  qty,
  unit,
  spokenUnitPrice: null,
  confidence: 0.95,
  ...extra,
});
const ext = (p: Partial<Extraction>): Extraction => ({
  ...unknownExtraction(),
  intent: "new_job",
  ...p,
});
/** The canonical demo extraction (architecture.md §7.4), wire heard with low confidence (amber). */
const DEMO_EXTRACTION = ext({
  customerName: "Verma ji",
  items: [item("Havells MCB", "2", 2), item("Finolex wire", "15", 15, "m", { confidence: 0.75 })],
  laborCharge: 500,
});

const setup = () => {
  const rateCard = createMemoryRateCard();
  const match = createMatcher(rateCard.list());
  return { rateCard, env: { match, rateCard } };
};

describe("approval words", () => {
  it.each([
    "haan",
    "Haan bhej do",
    "bhej do",
    "theek hai",
    "yes send",
    "हाँ",
    "हाँ भेज दो",
    "ji haan",
    "ठीक है",
    "okay",
  ])("approval: %s", (t) => expect(isApprovalText(t)).toBe(true));
  it.each(["haan woh MCB 3 hai", "nahi", "15 meter wire", "hanuman", "okra"])(
    "not approval: %s",
    (t) => expect(isApprovalText(t)).toBe(false),
  );
});

describe("bill model", () => {
  it("canonical demo → ₹1,235 with 3 items, wire amber", () => {
    const { env } = setup();
    const d = mergeExtraction(emptyDraft(), DEMO_EXTRACTION, env);
    expect(d.items.map((l) => [l.rateCardId, l.qty, l.unitPrice])).toEqual([
      ["rc_mcb_16a", 2, 180],
      ["rc_wire_1_5", 15, 25],
    ]);
    expect(billTotal(d)).toBe(1235);
    expect(itemCount(d)).toBe(3);
    expect(d.items.map(lineStatus)).toEqual(["ok", "amber"]);
  });

  it("correction replaces the quantity on the existing line (no duplicate)", () => {
    const { env } = setup();
    const d1 = mergeExtraction(emptyDraft(), DEMO_EXTRACTION, env);
    const d2 = mergeExtraction(
      d1,
      ext({ intent: "correct", items: [item("wire", "20", 20, "m")] }),
      env,
    );
    expect(d2.items).toHaveLength(2);
    expect(d2.items[1]!.qty).toBe(20);
    expect(billTotal(d2)).toBe(360 + 500 + 500);
  });

  it("null = unchanged; repeating a value is harmless; discount and visiting apply", () => {
    const { env } = setup();
    const d1 = mergeExtraction(emptyDraft(), DEMO_EXTRACTION, env);
    const d2 = mergeExtraction(
      d1,
      ext({
        intent: "add_info",
        customerName: "Verma ji",
        laborCharge: 500,
        discount: 100,
        visitingCharge: 200,
      }),
      env,
    );
    expect(d2.customerName).toBe("Verma ji");
    expect(billTotal(d2)).toBe(1235 - 100 + 200);
  });

  it("unknown item (Finolex 2.5mm) is pending, never priced from the 1.5mm wire", () => {
    const { env } = setup();
    const d = mergeExtraction(
      emptyDraft(),
      ext({
        customerName: "Verma ji",
        items: [item("Finolex wire 2.5mm", "20", 20, "m")],
        laborCharge: 500,
      }),
      env,
    );
    expect(d.items[0]).toMatchObject({ rateCardId: null, unitPrice: null });
    expect(lineStatus(d.items[0]!)).toBe("pending");
    expect(() => finalizeDraft(d, "KB-1")).toThrow(UnpricedItemError);
  });

  it("fractional quantities round to whole rupees", () => {
    const { env } = setup();
    const d = mergeExtraction(
      emptyDraft(),
      ext({ customerName: "A", items: [item("conduit pipe", "saadhe chaar", 4.5, "m")] }),
      env,
    );
    expect(billTotal(d)).toBe(81);
  });
});

describe("clarifier: ONE question, by priority", () => {
  const { env } = setup();
  it("unknown price first, then customer, then amber", () => {
    let d: DraftBill = mergeExtraction(
      emptyDraft(),
      ext({
        items: [
          item("Finolex wire 2.5mm", "20", 20, "m"),
          item("Finolex wire", "15", 15, "m", { confidence: 0.7 }),
        ],
      }),
      env,
    );
    expect(nextQuestion(d)?.text).toBe("Finolex wire 2.5mm ka rate kitna hai?");
    d = { ...d, items: d.items.map((l, i) => (i === 0 ? { ...l, unitPrice: 25 } : l)) };
    expect(nextQuestion(d)?.text).toBe("Kiske naam pe bill banana hai?");
    d = { ...d, customerName: "Verma ji" };
    expect(nextQuestion(d)).toMatchObject({
      kind: "confirm",
      text: "15 meter Finolex wire, sahi hai?",
    });
    d = { ...d, items: d.items.map((l) => ({ ...l, confirmed: true })) };
    expect(nextQuestion(d)).toBeNull();
  });
  it("labour is asked only when the setting is on", () => {
    const d = {
      ...mergeExtraction(
        emptyDraft(),
        ext({ customerName: "A", items: [item("MCB", "1", 1)] }),
        env,
      ),
    };
    expect(nextQuestion(d)).toBeNull();
    expect(nextQuestion(d, { alwaysAskLabour: true })?.text).toBe("Labour kitna jodna hai?");
  });
  it("read-back is on-screen text only (no audio version)", () => {
    const d = mergeExtraction(emptyDraft(), DEMO_EXTRACTION, env);
    expect(readBack(d)).toEqual({
      text: "Verma ji ka total ₹1,235 bana hai, 3 items ke saath. WhatsApp par bhej doon?",
    });
  });
});

describe("billing adapter inside the conversation machine (end to end, no network)", () => {
  function run(extractions: Extraction[]) {
    const rateCard = createMemoryRateCard();
    const extract = vi.fn();
    for (const e of extractions) extract.mockResolvedValueOnce(e);
    const onFinalized = vi.fn();
    const adapter = createBillingAdapter({
      rateCard,
      extract,
      nextBillNo: createBillNumbers(42, 2026),
      onFinalized,
    });
    const speak = vi.fn(); // on-screen messages (no audio)
    const actor = createActor(
      createConversationMachine({
        adapter,
        startListening: vi.fn(),
        stopListening: vi.fn(),
        onMessage: speak,
      }),
    ).start();
    const until = (s: string) => waitFor(actor, (x) => x.matches(s as never), { timeout: 1000 });
    return {
      actor,
      extract,
      speak,
      until,
      rateCard,
      onFinalized,
      said: () => speak.mock.calls.map((c) => c[0].text as string),
    };
  }

  it("canonical demo: amber wire → 'haan' → read-back ₹1,235 → 'haan' → KB-2026-0042", async () => {
    const t = run([DEMO_EXTRACTION]);
    t.actor.send({
      type: "TEXT_SUBMIT",
      text: "Verma ji ke ghar 2 Havells MCB, 15 meter Finolex wire, aur 500 labour ka bill bana do",
    });
    await t.until("asking");
    expect(t.said().at(-1)).toBe("15 meter Finolex wire, sahi hai?");
    t.actor.send({ type: "TEXT_SUBMIT", text: "haan" }); // confirms the amber line ON THE PHONE
    await t.until("awaitApproval");
    expect(t.extract).toHaveBeenCalledTimes(1);
    expect(t.said().at(-1)).toBe(
      "Verma ji ka total ₹1,235 bana hai, 3 items ke saath. WhatsApp par bhej doon?",
    );
    t.actor.send({ type: "TEXT_SUBMIT", text: "haan bhej do" });
    await t.until("sharePreview");
    expect(t.actor.getSnapshot().context.output).toMatchObject({
      billNo: "KB-2026-0042",
      total: 1235,
      customerName: "Verma ji",
    });
    expect(t.onFinalized).toHaveBeenCalledOnce();
  });

  it("unknown price: asks once, the spoken answer prices the item and is learned on approval", async () => {
    const t = run([
      ext({
        customerName: "Verma ji",
        items: [item("Finolex wire 2.5mm", "20", 20, "m")],
        laborCharge: 500,
      }),
      ext({
        intent: "add_info",
        items: [item("copper wire", null, null, "m", { spokenUnitPrice: 25 })],
      }), // LLM used another name
    ]);
    t.actor.send({
      type: "TEXT_SUBMIT",
      text: "Verma ji ke liye Finolex 2.5mm wire 20 meter aur 500 labour",
    });
    await t.until("asking");
    expect(t.said().at(-1)).toBe("Finolex wire 2.5mm ka rate kitna hai?");
    t.actor.send({ type: "TEXT_SUBMIT", text: "pachees rupaye meter" });
    await t.until("awaitApproval");
    expect(t.said().at(-1)).toBe(
      "Verma ji ka total ₹1,000 bana hai, 2 items ke saath. WhatsApp par bhej doon?",
    );
    t.actor.send({ type: "APPROVE" });
    await t.until("sharePreview");
    const learned = t.rateCard.list().find((e) => e.name === "Finolex wire 2.5mm");
    expect(learned).toMatchObject({ price: 25, unit: "m" });
    expect(t.rateCard.isLearned(learned!.id)).toBe(true);
  });

  it("skip ('baad mein') moves on but the item is asked again before read-back", async () => {
    const t = run([ext({ items: [item("geyser element", "1", 1)] })]);
    t.actor.send({ type: "TEXT_SUBMIT", text: "ek geyser element" });
    await t.until("asking");
    expect(t.said().at(-1)).toBe("geyser element ka rate kitna hai?");
    t.actor.send({ type: "TEXT_SUBMIT", text: "baad mein" });
    await t.until("asking");
    expect(t.said().at(-1)).toBe("Kiske naam pe bill banana hai?");
  });

  it("rate update by voice is a side effect that changes the rate card", async () => {
    const t = run([
      ext({
        intent: "rate_update",
        items: [item("MCB", null, null, null, { spokenUnitPrice: 200 })],
      }),
    ]);
    t.actor.send({ type: "TEXT_SUBMIT", text: "MCB ka rate 200 kar do" });
    await t.until("idle");
    await vi.waitFor(() => expect(t.rateCard.get("rc_mcb_16a")?.price).toBe(200));
    expect(t.said().at(-1)).toBe("Havells MCB 16A Single Pole ka rate ₹200 kar diya.");
  });

  it("tap-to-edit during approval forces a NEW read-back", async () => {
    const t = run([ext({ ...DEMO_EXTRACTION, items: [item("Havells MCB", "2", 2)] })]);
    t.actor.send({ type: "TEXT_SUBMIT", text: "x" });
    await t.until("awaitApproval");
    t.actor.send({
      type: "DRAFT_EDIT",
      update: ((d: DraftBill) => ({ ...d, laborCharge: 700 })) as never,
    });
    await t.until("awaitApproval");
    expect(t.said().at(-1)).toBe(
      "Verma ji ka total ₹1,060 bana hai, 2 items ke saath. WhatsApp par bhej doon?",
    );
  });

  it("unknown intent → not understood (S10c)", async () => {
    const t = run([unknownExtraction()]);
    t.actor.send({ type: "TEXT_SUBMIT", text: "haan woh matlab" });
    await t.until("notUnderstood");
  });
});

describe("bill record keeps the transcript (architecture.md §4.3)", () => {
  it("every understood turn is stored on the finished bill, approvals are not", async () => {
    const rateCard = createMemoryRateCard();
    const adapter = createBillingAdapter({
      rateCard,
      extract: vi.fn().mockResolvedValue(DEMO_EXTRACTION),
      nextBillNo: () => "KB-1",
    });
    const actor = createActor(
      createConversationMachine({ adapter, startListening: vi.fn(), stopListening: vi.fn() }),
    ).start();
    actor.send({
      type: "TEXT_SUBMIT",
      text: "Verma ji ke ghar 2 Havells MCB, 15 meter Finolex wire, aur 500 labour ka bill bana do",
    });
    await waitFor(actor, (s) => s.matches("asking"));
    actor.send({ type: "TEXT_SUBMIT", text: "haan" });
    await waitFor(actor, (s) => s.matches("awaitApproval"));
    actor.send({ type: "APPROVE" });
    await waitFor(actor, (s) => s.matches("sharePreview"));
    expect(actor.getSnapshot().context.output).toMatchObject({
      transcript: [
        "Verma ji ke ghar 2 Havells MCB, 15 meter Finolex wire, aur 500 labour ka bill bana do",
      ],
      customerPhone: null,
    });
  });
});

describe("rate card store: learned vs manually added items", () => {
  it("a price learned from a bill is tagged; an item added with the S8 form is not", () => {
    const rc = createMemoryRateCard();
    const fromBill = rc.learn("Geyser element", "pc", 350, "geyser element");
    const manual = rc.learn("Anchor Fastener 10mm", "pc", 5, undefined, { manual: true });
    expect(rc.isLearned(fromBill.id)).toBe(true);
    expect(rc.isLearned(manual.id)).toBe(false);
    expect(rc.list().map((e) => e.name)).toEqual(
      expect.arrayContaining(["Geyser element", "Anchor Fastener 10mm"]),
    );
  });
});

describe("adapter's own messages follow the chosen language", () => {
  const ctx = { history: [], pendingQuestion: null };
  const turn = { text: "x", source: "text" as const };
  const adapterIn = (lang: "hi-Latn" | "hi" | "en-IN" | undefined, e: Extraction) =>
    createBillingAdapter({
      rateCard: createMemoryRateCard(),
      extract: vi.fn().mockResolvedValue(e),
      nextBillNo: () => "KB-1",
      getLang: lang ? () => lang : undefined,
    });
  const rateUpdate = ext({
    intent: "rate_update",
    items: [item("MCB", null, null, null, { spokenUnitPrice: 200 })],
  });
  const unknownRate = ext({ intent: "rate_update", items: [item("MCB", null, null, null)] });
  const history = ext({ intent: "history", historyAction: null });

  it.each([
    [
      undefined,
      "Havells MCB 16A Single Pole ka rate ₹200 kar diya.",
      "Rate samajh nahi aaya.",
      "Bills ka kaam Bills tab mein karein.",
    ],
    [
      "hi-Latn",
      "Havells MCB 16A Single Pole ka rate ₹200 kar diya.",
      "Rate samajh nahi aaya.",
      "Bills ka kaam Bills tab mein karein.",
    ],
    [
      "hi",
      "Havells MCB 16A Single Pole का रेट ₹200 कर दिया।",
      "रेट समझ नहीं आया।",
      "बिल का काम Bills टैब में करें।",
    ],
    [
      "en-IN",
      "Havells MCB 16A Single Pole rate set to ₹200.",
      "Sorry, I didn't get the rate.",
      "Please manage bills in the Bills tab.",
    ],
  ] as const)("%s", async (lang, rateSet, rateUnknown, bills) => {
    expect((await adapterIn(lang, rateUpdate).understand(turn, emptyDraft(), ctx)).say?.text).toBe(
      rateSet,
    );
    expect((await adapterIn(lang, unknownRate).understand(turn, emptyDraft(), ctx)).say?.text).toBe(
      rateUnknown,
    );
    expect((await adapterIn(lang, history).understand(turn, emptyDraft(), ctx)).say?.text).toBe(
      bills,
    );
  });
});
