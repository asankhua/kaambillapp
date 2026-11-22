/**
 * On-device normalizer (architecture.md §5.3): spoken Indian quantities → exact numbers.
 * The LLM copies quantities *as spoken* into `qtySpoken`; this pure function decides the value,
 * so the LLM is never trusted for numbers on its own.
 *
 * Rules (Hindi/Hinglish usage):
 *   dedh = 1.5, dhai = 2.5, aadha = 0.5, pauna = 0.75
 *   sawa N = N + 0.25    (sawa do = 2.25)      | sawa <multiplier> = 1.25 × m   (sawa sau = 125)
 *   saadhe N = N + 0.5   (saadhe teen = 3.5)   | saadhe <multiplier> = 1.5 × m
 *   paune N = N − 0.25   (paune do = 1.75)     | paune <multiplier> = 0.75 × m  (paune sau = 75)
 *   sau ×100, hazaar ×1,000, lakh ×1,00,000 — compounds add up: "do hazaar paanch sau" = 2500
 */

/** Hindi number words 1–100 (Romanized, common spellings). Variants are folded by `fold()`. */
export const HINDI_1_100 =
  `ek do teen chaar paanch chhe saat aath nau das gyarah barah terah chaudah pandrah
solah satrah atharah unnis bees ikkees bais teis chaubis pachees chhabbis sattais atthais untees tees
iktees battees taintees chauntees paintees chhattees saintees artees untalees chalees iktalees bayalees
taintalees chauvalees paintalees chhiyalees saintalees artalees unchaas pachaas ikyavan bavan tirpan
chauvan pachpan chhappan sattavan atthavan unsath saath iksath basath tirsath chausath painsath
chhiyasath sadsath adsath unhattar sattar ikhattar bahattar tihattar chauhattar pachattar chhihattar
sathattar athhattar unasi assi ikyasi bayasi tirasi chaurasi pachasi chhiyasi sattasi athasi navasi
nabbe ikyanve banve tiranve chauranve pachanve chhiyanve sattanve atthanve ninyanve sau`
    .split(/\s+/)
    .filter(Boolean);

/** Common alternate spellings → canonical word above. */
const VARIANTS: Record<string, string> = {
  char: "chaar",
  dus: "das",
  dass: "das",
  panch: "paanch",
  paach: "paanch",
  che: "chhe",
  chhah: "chhe",
  chah: "chhe",
  chheh: "chhe",
  chhai: "chhe",
  gyara: "gyarah",
  baara: "barah",
  bara: "barah",
  tera: "terah",
  chauda: "chaudah",
  pandra: "pandrah",
  sola: "solah",
  satra: "satrah",
  athara: "atharah",
  unees: "unnis",
  bis: "bees",
  ikkis: "ikkees",
  baees: "bais",
  baeesh: "bais",
  teyis: "teis",
  chaubees: "chaubis",
  pachis: "pachees",
  pacchis: "pachees",
  chabbees: "chhabbis",
  sattaees: "sattais",
  atthaees: "atthais",
  untis: "untees",
  tis: "tees",
  chalis: "chalees",
  chaalis: "chalees",
  pachas: "pachaas",
  pachchas: "pachaas",
  sath: "saath",
  sattar: "sattar",
  pachhattar: "pachattar",
  assee: "assi",
  nabbey: "nabbe",
  nabe: "nabbe",
  soh: "sau",
  hundred: "sau",
};

const ENGLISH: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

/** Hindi number words 1–100 in Devanagari, index-aligned with HINDI_1_100. */
const HINDI_DEVANAGARI_1_100 =
  `एक दो तीन चार पाँच छह सात आठ नौ दस ग्यारह बारह तेरह चौदह पंद्रह सोलह सत्रह अठारह उन्नीस बीस इक्कीस बाईस तेईस चौबीस पच्चीस छब्बीस सत्ताईस अट्ठाईस उनतीस तीस इकतीस बत्तीस तैंतीस चौंतीस पैंतीस छत्तीस सैंतीस अड़तीस उनतालीस चालीस इकतालीस बयालीस तैंतालीस चवालीस पैंतालीस छियालीस सैंतालीस अड़तालीस उनचास पचास इक्यावन बावन तिरपन चौवन पचपन छप्पन सत्तावन अट्ठावन उनसठ साठ इकसठ बासठ तिरसठ चौंसठ पैंसठ छियासठ सड़सठ अड़सठ उनहत्तर सत्तर इकहत्तर बहत्तर तिहत्तर चौहत्तर पचहत्तर छिहत्तर सतहत्तर अठहत्तर उन्यासी अस्सी इक्यासी बयासी तिरासी चौरासी पचासी छियासी सत्तासी अट्ठासी नवासी नब्बे इक्यानबे बानबे तिरानबे चौरानबे पचानबे छियानबे सत्तानबे अट्ठानबे निन्यानबे सौ`.split(
    " ",
  );

/** Devanagari words and digits. */
const DEVANAGARI: Record<string, string> = {
  ...Object.fromEntries(HINDI_DEVANAGARI_1_100.map((w, i) => [w, HINDI_1_100[i]!])),
  एक: "ek",
  दो: "do",
  तीन: "teen",
  चार: "chaar",
  पांच: "paanch",
  पाँच: "paanch",
  छह: "chhe",
  छः: "chhe",
  सात: "saat",
  आठ: "aath",
  नौ: "nau",
  दस: "das",
  बीस: "bees",
  पच्चीस: "pachees",
  पचास: "pachaas",
  सौ: "sau",
  हज़ार: "hazaar",
  हजार: "hazaar",
  लाख: "lakh",
  डेढ़: "dedh",
  डेढ: "dedh",
  ढाई: "dhai",
  सवा: "sawa",
  साढ़े: "saadhe",
  साढे: "saadhe",
  पौने: "paune",
  आधा: "aadha",
};

const DEVANAGARI_NFC = new Map(Object.entries(DEVANAGARI).map(([k, v]) => [k.normalize("NFC"), v]));
const DEVANAGARI_DIGITS = "०१२३४५६७८९";

/** Fold spelling variation: lowercase, long vowels → short, w → v. */
function fold(word: string): string {
  return word
    .toLowerCase()
    .replace(/aa/g, "a")
    .replace(/ee/g, "i")
    .replace(/oo/g, "u")
    .replace(/w/g, "v");
}

const WORD_VALUE = new Map<string, number>();
HINDI_1_100.forEach((w, i) => WORD_VALUE.set(fold(w), i + 1));
for (const [variant, canonical] of Object.entries(VARIANTS)) {
  const v = WORD_VALUE.get(fold(canonical));
  if (v !== undefined && !WORD_VALUE.has(fold(variant))) WORD_VALUE.set(fold(variant), v);
}
for (const [w, v] of Object.entries(ENGLISH))
  if (!WORD_VALUE.has(fold(w))) WORD_VALUE.set(fold(w), v);

const STANDALONE: Record<string, number> = {
  dedh: 1.5,
  dhai: 2.5,
  dhaai: 2.5,
  adha: 0.5,
  aadha: 0.5,
  half: 0.5,
  pauna: 0.75,
};
const MODIFIER: Record<string, { add: number; scale: number }> = {
  sava: { add: 0.25, scale: 1.25 },
  sawa: { add: 0.25, scale: 1.25 },
  sadhe: { add: 0.5, scale: 1.5 },
  saadhe: { add: 0.5, scale: 1.5 },
  paune: { add: -0.25, scale: 0.75 },
  pone: { add: -0.25, scale: 0.75 },
};
/** Multipliers. `sau` multiplies the current group; hazaar/lakh close a group. */
const SMALL_MULT: Record<string, number> = { sau: 100, so: 100, hundred: 100 };
const BIG_MULT: Record<string, number> = {
  hazar: 1000,
  hajar: 1000,
  thousand: 1000,
  lakh: 100000,
  lac: 100000,
};

const FILLER = new Set(["aur", "and", "ka", "ke", "ki", "lagbhag", "about", "around", "approx"]);

export interface NormalizedQty {
  value: number | null;
  /** True when some words weren't understood or the phrase was empty: show the item in amber. */
  ambiguous: boolean;
}

function tokenize(input: string): string[] {
  let s = input.normalize("NFC").trim();
  for (const [i, d] of [...DEVANAGARI_DIGITS].entries()) s = s.replaceAll(d, String(i));
  return s
    .replace(/(\d),(?=\d)/g, "$1") // 1,500 → 1500
    .replace(/[^\p{L}\p{M}\p{N}.\s]/gu, " ") // keep combining marks: Hindi vowel signs are \p{M}
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((t) => (DEVANAGARI_NFC.get(t.normalize("NFC")) ?? t).split(" "));
}

/** Parse a spoken quantity: "dedh sau" → 150, "sawa do" → 2.25, "15" → 15, "do hazaar paanch sau" → 2500. */
export function parseSpokenQuantity(spoken: string | null | undefined): NormalizedQty {
  if (spoken == null || spoken.trim() === "") return { value: null, ambiguous: true };
  const tokens = tokenize(spoken);
  let total = 0;
  let group: number | null = null;
  let pending: { add: number; scale: number } | null = null;
  let ambiguous = false;
  let sawNumber = false;

  const pushValue = (n: number) => {
    if (pending) {
      n = n + pending.add;
      pending = null;
    }
    group = (group ?? 0) + n;
    sawNumber = true;
  };

  for (const raw of tokens) {
    const t = fold(raw);
    if (FILLER.has(t)) continue;
    if (/^\d+(\.\d+)?$/.test(t)) {
      pushValue(Number(t));
      continue;
    }
    if (t in MODIFIER) {
      pending = MODIFIER[t]!;
      continue;
    }
    if (t in STANDALONE) {
      pushValue(STANDALONE[t]!);
      continue;
    }
    if (t in SMALL_MULT) {
      const m = SMALL_MULT[t]!;
      if (group === null) group = pending ? pending.scale : 1; // "sau" / "sawa sau"
      pending = null;
      group = group * m;
      sawNumber = true;
      continue;
    }
    if (t in BIG_MULT) {
      const m = BIG_MULT[t]!;
      if (group === null) group = pending ? pending.scale : 1; // "hazaar" / "dedh hazaar" handled via group
      pending = null;
      total += group * m;
      group = null;
      sawNumber = true;
      continue;
    }
    const w = WORD_VALUE.get(t);
    if (w !== undefined) {
      pushValue(w);
      continue;
    }
    ambiguous = true; // unknown word: keep going, but flag it
  }
  // A modifier on its own is a number too: "sawa meter" = 1.25, "paune" = 0.75, "saadhe" = 1.5.
  if (pending && !sawNumber) {
    group = (pending as { scale: number }).scale;
    pending = null;
    sawNumber = true;
  }
  if (pending) ambiguous = true; // e.g. "do sawa" (modifier after the number)
  if (!sawNumber) return { value: null, ambiguous: true };
  const value = Math.round((total + (group ?? 0)) * 1000) / 1000;
  return { value, ambiguous };
}

const UNIT_ALIASES: Record<string, string> = {
  m: "m",
  meter: "m",
  meters: "m",
  metre: "m",
  metres: "m",
  mtr: "m",
  mtrs: "m",
  mitar: "m",
  मीटर: "m",
  मीटर्स: "m",
  pc: "pc",
  pcs: "pc",
  piece: "pc",
  pieces: "pc",
  peice: "pc",
  nag: "pc",
  nos: "pc",
  no: "pc",
  number: "pc",
  unit: "pc",
  units: "pc",
  पीस: "pc",
  नग: "pc",
  in: "in",
  inch: "in",
  inches: "in",
  '"': "in",
  suta: "in",
  इंच: "in",
  ft: "ft",
  foot: "ft",
  feet: "ft",
  fit: "ft",
  फुट: "ft",
  fan: "fan",
  fans: "fan",
  pankha: "fan",
  pankhe: "fan",
  roll: "roll",
  coil: "coil",
  box: "box",
  set: "set",
  job: "job",
  visit: "visit",
};

/** "meter" → "m", "nag" → "pc". Unknown units are lower-cased and kept. */
export function normalizeUnit(unit: string | null | undefined): string | null {
  if (unit == null) return null;
  const u = unit.trim().toLowerCase();
  if (u === "") return null;
  return UNIT_ALIASES[u] ?? UNIT_ALIASES[u.replace(/\.$/, "")] ?? u;
}

/** Confidence given to an item whose spoken quantity is ambiguous or disagrees with the LLM (→ amber). */
export const DISAGREEMENT_CONFIDENCE = 0.7;

/**
 * Apply the normalizer to an LLM extraction (runs on the phone, after /api/extract):
 * - qty comes from qtySpoken (the LLM's own qty is only a fallback)
 * - units are normalized
 * - if the LLM's qty disagrees with the spoken words, or the words are ambiguous,
 *   confidence drops into the amber band so the worker confirms it (architecture.md §5.5).
 */
export function normalizeExtraction<E extends { items: ExtractedItemLike[] }>(e: E): E {
  return {
    ...e,
    items: e.items.map((it) => {
      const unit = normalizeUnit(it.unit);
      if (it.qtySpoken == null) return { ...it, unit };
      const parsed = parseSpokenQuantity(it.qtySpoken);
      const qty = parsed.value ?? it.qty;
      const disagrees =
        parsed.value !== null && it.qty !== null && Math.abs(parsed.value - it.qty) > 1e-9;
      const confidence =
        parsed.ambiguous || disagrees
          ? Math.min(it.confidence, DISAGREEMENT_CONFIDENCE)
          : it.confidence;
      return { ...it, qty, unit, confidence };
    }),
  };
}

interface ExtractedItemLike {
  qtySpoken: string | null;
  qty: number | null;
  unit: string | null;
  confidence: number;
}
