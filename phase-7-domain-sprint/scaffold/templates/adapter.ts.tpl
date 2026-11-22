import type { Turn } from "@kaambill/shared";
import type { __PASCAL__Extraction } from "./schema";
import type { ApplyResult, DomainAdapter, Question } from "../../phase-2-voice-core/src/machine/types";
import { postStructured } from "../../phase-3-understanding/src/http";

/** Voice domain: __NAME__. Copy patterns from phase-7-domain-sprint/src/rehearsal/adapter.ts and phase-4-billing-domain/src/adapter.ts. */
export interface __PASCAL__Draft { subject: string | null; items: { label: string; qtySpoken: string | null }[] }
export type __PASCAL__Output = __PASCAL__Draft & { savedAt: string };

export const fetch__PASCAL__ = async (text: string, draftSummary: string | null, pendingQuestion: string | null) =>
  (await postStructured<{ extraction: __PASCAL__Extraction }>("/__NAME__", { text, draftSummary, pendingQuestion })).extraction;

export function create__PASCAL__Adapter(extract = fetch__PASCAL__): DomainAdapter<__PASCAL__Draft, __PASCAL__Output> {
  return {
    emptyDraft: () => ({ subject: null, items: [] }),
    isApproval: (t) => /^\s*(haan|ha|yes|ok|theek hai|हाँ)(?=$|[\s.!,?।])/i.test(t.normalize("NFC")),
    async understand(turn: Turn, draft, ctx): Promise<ApplyResult<__PASCAL__Draft>> {
      const e = await extract(turn.text, JSON.stringify(draft), ctx.pendingQuestion?.text ?? null);
      if (e.intent === "unknown") return { draft, outcome: "unknown" };
      if (e.intent === "cancel") return { draft: { subject: null, items: [] }, outcome: "cancel" };
      if (e.intent === "approve") return { draft, outcome: "approve" };
      return { draft: { subject: e.subject ?? draft.subject, items: [...draft.items, ...e.items] }, outcome: "updated" };
    },
    nextQuestion(d): Question | null {
      // TODO(H2–4): ONE question at a time, by priority from the brief.
      if (!d.subject) return { kind: "missing", text: "Kiske liye hai?", lang: "hi-IN" };
      return null;
    },
    readBack: (d) => ({ text: `${d.subject}: ${d.items.length} cheezein. Theek hai?`, lang: "hi-IN" }), // TODO: ≤ 2 sentences
    finalize: async (d) => ({ ...d, savedAt: new Date().toISOString() }),
  };
}
