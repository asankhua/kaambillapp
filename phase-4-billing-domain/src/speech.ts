/** "₹1,235" with Indian digit grouping (₹1,23,456). */
export const formatRupees = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/**
 * Approval words, handled on the phone (never sent to the server).
 * Note: \b doesn't work for Devanagari, so word ends are matched explicitly.
 */
const END = String.raw`(?=$|[\s.!,?।])`;
const APPROVAL = new RegExp(
  String.raw`^\s*(ji\s+)?(haan|haa+n?|ha+|han|bhej do|bhejo|bhej dijiye|yes|send|theek hai|thik hai|ok|okay|sahi hai|हाँ|हां|हा|भेज दो|भेजो|ठीक है)${END}[\s.!,।]*((ji|haan|bhej do|bhejo|send|kar do|भेज दो|भेजो|जी)${END}[\s.!,।]*)*$`,
  "i",
);
export const isApprovalText = (t: string) => APPROVAL.test(t.normalize("NFC"));

export const isSkipText = (t: string) =>
  /^\s*(baad mein|baad me|skip|chhodo abhi|later|बाद में)/i.test(t.normalize("NFC"));

const UNIT_WORD: Record<string, string> = {
  m: "meter",
  ft: "foot",
  in: "inch",
  fan: "fan",
  pc: "",
};
/** "15 meter", "2" (pieces are implied), "4.5 meter". */
export function spokenQty(qty: number, unit: string): string {
  const word = unit in UNIT_WORD ? UNIT_WORD[unit] : unit;
  return word ? `${qty} ${word}` : `${qty}`;
}
