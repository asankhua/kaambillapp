import { describe, expect, it } from "vitest";
import { normalizeUnit, parseSpokenQuantity } from "./normalize";

const q = (s: string | null) => parseSpokenQuantity(s).value;

describe("parseSpokenQuantity: digits", () => {
  it.each([
    ["15", 15],
    ["2", 2],
    ["2.5", 2.5],
    ["1,500", 1500],
    ["०", 0],
    ["१५", 15],
    ["20 meter", 20],
  ])("%s → %d", (s, v) => expect(q(s)).toBe(v));
});

describe("parseSpokenQuantity: Hindi number words 1–100", () => {
  it.each([
    ["ek", 1],
    ["do", 2],
    ["teen", 3],
    ["chaar", 4],
    ["char", 4],
    ["paanch", 5],
    ["panch", 5],
    ["chhe", 6],
    ["dus", 10],
    ["chaalees", 40],
    ["saat", 7],
    ["aath", 8],
    ["nau", 9],
    ["das", 10],
    ["pandrah", 15],
    ["pandra", 15],
    ["bees", 20],
    ["pachees", 25],
    ["pachis", 25],
    ["tees", 30],
    ["chalees", 40],
    ["pachaas", 50],
    ["saath", 60],
    ["sattar", 70],
    ["pachattar", 75],
    ["assi", 80],
    ["nabbe", 90],
    ["ninyanve", 99],
    ["sau", 100],
  ])("%s → %d", (s, v) => expect(q(s)).toBe(v));

  it("saat (7) and saath (60) stay distinct", () => {
    expect(q("saat")).toBe(7);
    expect(q("saath")).toBe(60);
  });
});

describe("parseSpokenQuantity: fractions (dedh, dhai, sawa, saadhe, paune)", () => {
  it.each([
    ["dedh", 1.5],
    ["dhai", 2.5],
    ["aadha", 0.5],
    ["sawa do", 2.25],
    ["sava teen", 3.25],
    ["saadhe chaar", 4.5],
    ["saadhe teen", 3.5],
    ["paune do", 1.75],
    ["paune teen", 2.75],
  ])("%s → %d", (s, v) => expect(q(s)).toBe(v));
});

describe("parseSpokenQuantity: multipliers (sau, hazaar, lakh)", () => {
  it.each([
    ["dedh sau", 150],
    ["dhai sau", 250],
    ["paanch sau", 500],
    ["sawa sau", 125],
    ["paune sau", 75],
    ["sawa do sau", 225],
    ["saadhe teen sau", 350],
    ["ek sau bees", 120],
    ["hazaar", 1000],
    ["dedh hazaar", 1500],
    ["do hazaar paanch sau", 2500],
    ["sawa lakh", 125000],
    ["dhai hazaar", 2500],
    ["paanch hazaar", 5000],
  ])("%s → %d", (s, v) => expect(q(s)).toBe(v));
});

describe("parseSpokenQuantity: Devanagari and English", () => {
  it.each([
    ["दो", 2],
    ["डेढ़ सौ", 150],
    ["सवा दो", 2.25],
    ["पाँच सौ", 500],
    ["दो हज़ार", 2000],
    ["three", 3],
    ["twenty", 20],
    ["two hundred", 200],
    ["fifteen", 15],
  ])("%s → %d", (s, v) => expect(q(s)).toBe(v));
});

describe("parseSpokenQuantity: ambiguity flags", () => {
  it("empty / null → null + ambiguous", () => {
    expect(parseSpokenQuantity(null)).toEqual({ value: null, ambiguous: true });
    expect(parseSpokenQuantity("  ")).toEqual({ value: null, ambiguous: true });
  });
  it("unknown words are flagged but numbers still parsed", () => {
    expect(parseSpokenQuantity("lagbhag pandrah")).toEqual({ value: 15, ambiguous: false });
    expect(parseSpokenQuantity("kuch pandrah")).toEqual({ value: 15, ambiguous: true });
  });
  it("a modifier alone is a value: sawa = 1.25, paune = 0.75", () => {
    expect(parseSpokenQuantity("sawa")).toEqual({ value: 1.25, ambiguous: false });
    expect(q("paune")).toBe(0.75);
  });
  it("a modifier after the number is ambiguous", () => {
    expect(parseSpokenQuantity("do sawa").ambiguous).toBe(true);
  });
  it("no number at all → null", () => {
    expect(q("thoda sa")).toBeNull();
  });
});

describe("normalizeUnit", () => {
  it.each([
    ["meter", "m"],
    ["mtr", "m"],
    ["Metre", "m"],
    ["मीटर", "m"],
    ["nag", "pc"],
    ["piece", "pc"],
    ["pcs", "pc"],
    ["inch", "in"],
    ["feet", "ft"],
    ["pankha", "fan"],
    ["coil", "coil"],
    [null, null],
    ["", null],
    ["bundle", "bundle"],
  ])("%s → %s", (u, v) => expect(normalizeUnit(u)).toBe(v));
});

import { normalizeExtraction, DISAGREEMENT_CONFIDENCE } from "./normalize";

describe("normalizeExtraction", () => {
  const item = (qtySpoken: string | null, qty: number | null, unit: string | null = "meter") => ({
    raw: "x",
    name: "wire",
    qtySpoken,
    qty,
    unit,
    spokenUnitPrice: null,
    confidence: 0.95,
  });

  it("takes qty from the spoken words, not the LLM", () => {
    const out = normalizeExtraction({ items: [item("dedh sau", 150)] });
    expect(out.items[0]).toMatchObject({ qty: 150, unit: "m", confidence: 0.95 });
  });

  it("drops to amber when the LLM's number disagrees with the words", () => {
    const out = normalizeExtraction({ items: [item("sawa do", 2.5)] }); // LLM wrongly did ×1.25
    expect(out.items[0]).toMatchObject({ qty: 2.25, confidence: DISAGREEMENT_CONFIDENCE });
  });

  it("keeps the LLM qty only when the words can't be parsed, and flags it", () => {
    const out = normalizeExtraction({ items: [item("thoda", 3)] });
    expect(out.items[0]).toMatchObject({ qty: 3, confidence: DISAGREEMENT_CONFIDENCE });
  });

  it("leaves price-only items alone (qtySpoken null)", () => {
    const out = normalizeExtraction({ items: [item(null, null, "m")] });
    expect(out.items[0]).toMatchObject({ qty: null, unit: "m", confidence: 0.95 });
  });
});

describe("parseSpokenQuantity: only Hinglish, Hindi and English", () => {
  it.each([
    ["दो", 2],
    ["पंद्रह", 15],
    ["डेढ़", 1.5],
    ["ढाई सौ", 250],
    ["सवा दो", 2.25],
    ["पाँच सौ", 500],
    ["two", 2],
    ["fifteen", 15],
  ])("%s → %d", (s, v) => expect(q(s)).toBe(v));
  it("Devanagari Hindi 1–100 all parse", () => {
    const words =
      "एक दो तीन चार पाँच छह सात आठ नौ दस ग्यारह बारह तेरह चौदह पंद्रह सोलह सत्रह अठारह उन्नीस बीस इक्कीस बाईस तेईस चौबीस पच्चीस छब्बीस सत्ताईस अट्ठाईस उनतीस तीस इकतीस बत्तीस तैंतीस चौंतीस पैंतीस छत्तीस सैंतीस अड़तीस उनतालीस चालीस इकतालीस बयालीस तैंतालीस चवालीस पैंतालीस छियालीस सैंतालीस अड़तालीस उनचास पचास इक्यावन बावन तिरपन चौवन पचपन छप्पन सत्तावन अट्ठावन उनसठ साठ इकसठ बासठ तिरसठ चौंसठ पैंसठ छियासठ सड़सठ अड़सठ उनहत्तर सत्तर इकहत्तर बहत्तर तिहत्तर चौहत्तर पचहत्तर छिहत्तर सतहत्तर अठहत्तर उन्यासी अस्सी इक्यासी बयासी तिरासी चौरासी पचासी छियासी सत्तासी अट्ठासी नवासी नब्बे इक्यानबे बानबे तिरानबे चौरानबे पचानबे छियानबे सत्तानबे अट्ठानबे निन्यानबे सौ".split(
        " ",
      );
    expect(words.map((w) => q(w))).toEqual(Array.from({ length: 100 }, (_, i) => i + 1));
  });
  it("other languages' number words are not converted", () => {
    for (const w of ["ரெண்டு", "ಎರಡು", "दोन", "पंधरा"]) expect(q(w)).toBeNull();
  });
});
