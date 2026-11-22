/**
 * Phonetic key for Indian spellings of brand/item names (architecture.md §5.4).
 * "Phenolex" ≈ "Finolex", "Hevells" ≈ "Havells", "em see bee" ≈ "MCB".
 */
const LETTER_NAMES: Record<string, string> = {
  ay: "a",
  ae: "a",
  bee: "b",
  be: "b",
  see: "c",
  si: "c",
  dee: "d",
  di: "d",
  ef: "f",
  jee: "g",
  aitch: "h",
  eye: "i",
  jay: "j",
  kay: "k",
  el: "l",
  em: "m",
  en: "n",
  oh: "o",
  pee: "p",
  pi: "p",
  are: "r",
  ess: "s",
  es: "s",
  tee: "t",
  you: "u",
  vee: "v",
  vi: "v",
  ex: "x",
  why: "y",
  zed: "z",
};

/** Normalize text: lowercase, strip punctuation, collapse spelled-out letters ("em see bee" / "m c b" → "mcb"). */
export function normalizeName(s: string): string {
  const tokens = s
    .toLowerCase()
    .normalize("NFC")
    .replace(/[-_]/g, " ")
    .replace(/[^\p{L}\p{M}\p{N}./\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  const letterOf = (t: string) => (t.length === 1 && /\p{L}/u.test(t) ? t : LETTER_NAMES[t]);
  const out: string[] = [];
  for (let i = 0; i < tokens.length;) {
    let j = i;
    while (j < tokens.length && letterOf(tokens[j]!)) j++;
    if (j - i >= 2) {
      out.push(
        tokens
          .slice(i, j)
          .map((t) => letterOf(t)!)
          .join(""),
      ); // a run of ≥ 2 letters = an acronym
      i = j;
    } else {
      out.push(tokens[i]!); // a lone letter-name word ("tee") stays a word
      i++;
    }
  }
  return out.join(" ");
}

/** Consonant skeleton per word: ph→f, w→v, ck/q→k, z→j, double letters collapsed, vowels after the first letter dropped. */
export function phoneticKey(s: string): string {
  return normalizeName(s)
    .split(" ")
    .map((w) => {
      let k = w
        .replace(/ph/g, "f")
        .replace(/w/g, "v")
        .replace(/ck|q/g, "k")
        .replace(/z/g, "j")
        .replace(/(.)\1+/g, "$1");
      k = k[0] + k.slice(1).replace(/[aeiouy]/g, "");
      return k;
    })
    .join(" ");
}

/** Numeric specs in a name: "2.5mm" → ["2.5"], "MCB 32 amp" → ["32"], "1/2 inch" → ["1/2"]. */
export function specNumbers(s: string): string[] {
  return [...s.toLowerCase().matchAll(/\d+(?:[./]\d+)?/g)].map((m) => m[0]);
}
