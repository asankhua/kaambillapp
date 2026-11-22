import type { Question, Utterance } from "../../phase-2-voice-core/src/machine/types";
import { billTotal, itemCount, lineStatus, type DraftBill, type LineItem } from "./bill/model";
import { phrasesFor, utter } from "./i18n";
import { formatRupees, spokenQty } from "./speech";

export interface ClarifySettings {
  /** Ask for labour if none was said (off by default, architecture.md §3). */
  alwaysAskLabour: boolean;
}

/** Short spoken name: "Finolex Wire 1.5 sq mm" → "wire" style is too lossy, so use the heard name. */
const sayName = (l: LineItem) => l.heard || l.name;

/**
 * ONE question at a time, by priority (architecture.md §3):
 *   1. item with no price → "X ka rate kitna hai?"   (skipped ones are asked last, but still asked)
 *   2. no customer name    → "Kiske naam pe bill banana hai?"
 *   3. amber item          → "15 meter wire, sahi hai?"
 *   4. labour (setting)    → "Labour kitna jodna hai?"
 * Bill vs Estimate is never asked.
 */
export function nextQuestion(
  d: DraftBill,
  s: ClarifySettings = { alwaysAskLabour: false },
): Question | null {
  const p = phrasesFor(d.language);
  const ask = (text: string, extra: Partial<Question> = {}): Question => ({
    kind: "missing",
    ...utter(text),
    ...extra,
  });
  const missingPrice = (l: LineItem) =>
    ask(p.askPrice(sayName(l)), { targetId: l.id, quickReplies: [] });
  const pending = d.items.filter((l) => lineStatus(l) === "pending");
  const firstPending = pending.find((l) => !l.skipped);
  if (firstPending) return missingPrice(firstPending);
  if (d.items.length === 0 && d.laborCharge === null && d.visitingCharge === null)
    return ask(p.askItems);
  if (!d.customerName) return ask(p.askCustomer);
  const amber = d.items.find((l) => lineStatus(l) === "amber");
  if (amber)
    return ask(p.confirm(spokenQty(amber.qty, amber.unit), sayName(amber)), {
      kind: "confirm",
      targetId: amber.id,
    });
  if (s.alwaysAskLabour && d.laborCharge === null) return ask(p.askLabour);
  const skipped = pending[0];
  if (skipped) return missingPrice(skipped);
  return null;
}

/** The read-back before any action (S6). Shown with "₹1,235"; spoken with the amount in words. */
export function readBack(d: DraftBill): Utterance {
  const p = phrasesFor(d.language);
  return utter(
    p.readBack(
      d.customerName ?? p.customerFallback,
      formatRupees(billTotal(d)),
      itemCount(d),
      d.docType === "Estimate",
    ),
  );
}

/** S10c message in the bill's language. */
export const notUnderstood = (d: DraftBill): Utterance =>
  utter(phrasesFor(d.language).notUnderstood);
