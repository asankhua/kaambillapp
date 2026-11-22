import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DEMO, type RateCardEntry } from "@kaambill/shared";
import rateCard from "../../phase-0-setup/seed/rateCard.json";
import type { EvalCase } from "./types";

const card = rateCard as RateCardEntry[];
const byId = new Map(card.map((e) => [e.id, e]));
const cases: EvalCase[] = readFileSync(new URL("./utterances.seed.jsonl", import.meta.url), "utf8")
  .split("\n")
  .filter(Boolean)
  .map((line) => JSON.parse(line) as EvalCase);

describe("seed rate card", () => {
  it("has 15 items with unique ids", () => {
    expect(card).toHaveLength(15);
    expect(new Set(card.map((e) => e.id)).size).toBe(15);
  });

  it("every item has ≥ 2 aliases, a whole-rupee price and a known category", () => {
    for (const e of card) {
      expect(e.aliases.length, e.id).toBeGreaterThanOrEqual(2);
      expect(Number.isInteger(e.price) && e.price > 0, e.id).toBe(true);
      expect(["electrical", "plumbing", "labour", "other"]).toContain(e.category);
    }
  });

  it("has no alias shared by two items (the matcher would be ambiguous)", () => {
    const seen = new Map<string, string>();
    for (const e of card)
      for (const a of e.aliases) {
        const key = a.toLowerCase();
        expect(seen.get(key), `alias "${a}" in ${e.id} and ${seen.get(key)}`).toBeUndefined();
        seen.set(key, e.id);
      }
  });

  it("does NOT contain Finolex 2.5mm (the canonical clarifying-question scenario needs it missing)", () => {
    expect(card.some((e) => /2\.5/.test(e.name) && /wire/i.test(e.name))).toBe(false);
  });
});

describe("seed eval set", () => {
  it("has ≥ 100 cases with unique ids (phase 6), incl. ≥ 20 Wispr Flow-dictated", () => {
    expect(cases.length).toBeGreaterThanOrEqual(100);
    expect(new Set(cases.map((c) => c.id)).size).toBe(cases.length);
    expect(cases.filter((c) => c.tags.includes("wispr-dictated")).length).toBeGreaterThanOrEqual(
      20,
    );
  });

  it("has ≥ 200 cases, incl. ≥ 30 Hindi (Devanagari) and ≥ 30 English (phase 8)", () => {
    expect(cases.length).toBeGreaterThanOrEqual(200);
    expect(cases.filter((c) => c.expected.language === "hi").length).toBeGreaterThanOrEqual(30);
    expect(cases.filter((c) => c.expected.language === "en-IN").length).toBeGreaterThanOrEqual(30);
  });

  it("references only real rate-card ids", () => {
    for (const c of cases)
      for (const item of c.expected.items)
        if (item.rateCardId)
          expect(byId.has(item.rateCardId), `${c.id}: ${item.rateCardId}`).toBe(true);
  });

  it("every expectedTotal matches rate-card prices + labour + visiting − discount", () => {
    for (const c of cases) {
      if (c.expectedTotal === null) continue;
      const e = c.expected;
      const items = e.items.reduce((sum, it) => {
        const entry = byId.get(it.rateCardId ?? "");
        expect(entry, `${c.id}: priced case has an unmatched item`).toBeDefined();
        return sum + (it.qty ?? 0) * (entry?.price ?? 0);
      }, 0);
      const total = items + (e.laborCharge ?? 0) + (e.visitingCharge ?? 0) - (e.discount ?? 0);
      expect(Number.isInteger(total), `${c.id}: total must be whole rupees`).toBe(true);
      expect(total, c.id).toBe(c.expectedTotal);
    }
  });

  it("the canonical demo sentence totals ₹1,235 (architecture.md §7.4)", () => {
    const demo = cases.find((c) => c.turn.text === DEMO.utterance);
    expect(demo?.expectedTotal).toBe(DEMO.total);
  });

  it("history cases always have a historyAction, others never do", () => {
    for (const c of cases)
      expect(c.expected.historyAction !== null, c.id).toBe(c.expected.intent === "history");
  });

  it("covers the required scenarios from phase-0-setup", () => {
    const tags = new Set(cases.flatMap((c) => c.tags));
    for (const t of [
      "fraction-dedh",
      "fraction-sawa",
      "fraction-dhai",
      "fraction-paune",
      "fraction-saadhe",
      "brand-mispronounced",
      "missing-customer",
      "unknown-item",
      "approval",
      "correction",
      "devanagari",
      "english",
      "estimate",
      "mid-bill",
      "rate-update",
      "history",
      "spec-32a",
      "wispr-dictated",
    ])
      expect(tags.has(t), t).toBe(true);
  });
});

import { parseSpokenQuantity } from "../../phase-3-understanding/src/normalize";
import { createMatcher } from "../../phase-4-billing-domain/src/match/matcher";

describe("seed eval set vs on-device code (no LLM)", () => {
  const match = createMatcher(card);
  it("every expected qty is what the normalizer reads from qtySpoken", () => {
    for (const c of cases)
      for (const it of c.expected.items)
        if (it.qtySpoken !== null)
          expect(parseSpokenQuantity(it.qtySpoken).value, `${c.id}: "${it.qtySpoken}"`).toBe(
            it.qty,
          );
  });
  it("every expected rate-card id is what the matcher picks for the heard name", () => {
    for (const c of cases)
      for (const it of c.expected.items)
        if (!(c.pendingQuestion && it.qty === null))
          expect(match(it.name).entry?.id ?? null, `${c.id}: "${it.name}"`).toBe(it.rateCardId);
  });
});
