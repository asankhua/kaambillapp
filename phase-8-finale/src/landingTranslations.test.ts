import { describe, expect, it } from "vitest";
import { TRANSLATIONS } from "../../app/landing/translations";

/** Tag names in order, e.g. "<b>x</b> <span class='a'>y</span>" -> ["b","/b","span","/span"]. */
// <small> is ignored: the Hindi/Hinglish step titles add a small English gloss the English one doesn't need.
const tags = (html: string) =>
  [...html.matchAll(/<\/?([a-z]+)/gi)]
    .map((m) => m[0].toLowerCase())
    .filter((t) => !/small/.test(t));

describe("landing page translations", () => {
  const entries = Object.entries(TRANSLATIONS);

  it("has Hindi and Hinglish text for every English entry", () => {
    expect(entries.length).toBeGreaterThan(100);
    for (const [en, t] of entries) {
      expect(t.hindi.trim(), en).not.toBe("");
      expect(t.hinglish.trim(), en).not.toBe("");
    }
  });

  it("keeps the markup (bold, icons, line breaks) identical to the English", () => {
    for (const [en, t] of entries) {
      expect(tags(t.hindi), `hindi: ${en}`).toEqual(tags(en));
      expect(tags(t.hinglish), `hinglish: ${en}`).toEqual(tags(en));
    }
  });

  it("writes Hindi in Devanagari and Hinglish in Roman letters", () => {
    const plain = (s: string) => s.replace(/<[^>]*>/g, "");
    const devanagari = /[\u0900-\u097F]/;
    for (const [en, t] of entries) {
      if (/[\u0900-\u097F]/.test(plain(t.hinglish))) {
        // only the deliberate "Hinglish · हिंदी · English" style mentions may mix scripts
        expect(plain(en), en).toMatch(devanagari);
      }
    }
    const withHindi = entries.filter(([en]) => /[A-Za-z]{4}/.test(plain(en)));
    const hindiOk = withHindi.filter(([, t]) => devanagari.test(plain(t.hindi)));
    expect(hindiOk.length / withHindi.length).toBeGreaterThan(0.9);
  });
});
