import Fuse from "fuse.js";
import type { RateCardEntry } from "@kaambill/shared";
import { normalizeName, phoneticKey, specNumbers } from "./phonetic";

/**
 * Rate-card matcher (architecture.md §5.4): heard name → rate-card entry.
 *   1. exact name/alias (or alias contained in what was heard) → score 1
 *   2. brand only ("2 Havells") → most common item of that brand, score 0.7 (amber)
 *   3. fuzzy: fuse.js over names/aliases + phonetic keys → score = 1 − fuse distance
 * Spec guard: if the heard name has numbers (2.5mm, 32 amp) that the entry doesn't, the entry is
 * rejected, so "Finolex wire 2.5mm" never silently gets the 1.5mm price.
 */
export const MATCH_THRESHOLD = 0.6;

export interface MatchResult {
  entry: RateCardEntry | null;
  score: number;
  method: "exact" | "alias_in_name" | "brand_only" | "fuzzy" | "none";
}

const singular = (w: string) =>
  w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w;
const clean = (s: string) => normalizeName(s).split(" ").map(singular).join(" ");

interface Doc {
  entry: RateCardEntry;
  text: string;
  phon: string;
}

export function createMatcher(rateCard: RateCardEntry[]) {
  const docs: Doc[] = rateCard.flatMap((entry) =>
    [entry.name, ...entry.aliases].map((t) => ({
      entry,
      text: clean(t),
      phon: phoneticKey(clean(t)),
    })),
  );
  const fuse = new Fuse(docs, {
    keys: [
      { name: "text", weight: 0.6 },
      { name: "phon", weight: 0.4 },
    ],
    includeScore: true,
    threshold: 0.45,
    ignoreLocation: true,
  });
  const brands = new Map<string, RateCardEntry>();
  for (const e of rateCard) {
    const brand = clean(e.name).split(" ")[0]!;
    if (!brands.has(brand) && /^[a-z]{4,}$/.test(brand)) brands.set(brand, e);
  }
  const entryNumbers = new Map(
    rateCard.map((e) => [e.id, new Set([e.name, ...e.aliases].flatMap(specNumbers))]),
  );
  const specOk = (heardNums: string[], e: RateCardEntry) =>
    heardNums.every((n) => entryNumbers.get(e.id)!.has(n));

  return function match(heard: string): MatchResult {
    const h = clean(heard);
    if (!h) return { entry: null, score: 0, method: "none" };
    const nums = specNumbers(heard);

    const exact = docs.find((d) => d.text === h && specOk(nums, d.entry));
    if (exact) return { entry: exact.entry, score: 1, method: "exact" };

    // Largest alias whose words are ALL in the heard words, in any order
    // ("verma ji wala havells mcb" ⊇ "havells mcb", "mcb 32 amp" ⊇ "32 amp mcb").
    const heardWords = new Set(h.split(" "));
    const contained = docs
      .filter(
        (d) =>
          d.text.length >= 3 &&
          d.text.split(" ").every((w) => heardWords.has(w)) &&
          specOk(nums, d.entry),
      )
      .sort(
        (a, b) =>
          b.text.split(" ").length - a.text.split(" ").length || b.text.length - a.text.length,
      )[0];
    if (contained) return { entry: contained.entry, score: 0.95, method: "alias_in_name" };

    const words = h.split(" ");
    if (words.length === 1 && brands.has(words[0]!))
      return { entry: brands.get(words[0]!)!, score: 0.7, method: "brand_only" };

    const hits = fuse.search(h).filter((r) => specOk(nums, r.item.entry));
    const phonHit = docs.find((d) => d.phon === phoneticKey(h) && specOk(nums, d.entry));
    if (phonHit) return { entry: phonHit.entry, score: 0.9, method: "fuzzy" };
    const best = hits[0];
    if (best) {
      const score = Math.round((1 - (best.score ?? 1)) * 100) / 100;
      if (score >= MATCH_THRESHOLD) return { entry: best.item.entry, score, method: "fuzzy" };
    }
    return { entry: null, score: 0, method: "none" };
  };
}
export type Matcher = ReturnType<typeof createMatcher>;
