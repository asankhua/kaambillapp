import type { Extraction, HistoryAction, Lang, Turn } from "@kaambill/shared";
import type {
  ApplyResult,
  DomainAdapter,
  Question,
  UnderstandContext,
  Utterance,
} from "../../phase-2-voice-core/src/machine/types";
import type { ExtractContext } from "../../phase-3-understanding/src/client";
import { draftSummary, emptyDraft, mergeExtraction, type DraftBill } from "./bill/model";
import { finalizeDraft, type FinalBill } from "./bill/final";
import { nextQuestion, notUnderstood, readBack, type ClarifySettings } from "./clarify";
import { createMatcher } from "./match/matcher";
import type { RateCardStore } from "./rateCard/store";
import { formatRupees, isApprovalText, isSkipText } from "./speech";
import { adapterPhrasesFor } from "./i18n";

/**
 * KaamBill's DomainAdapter (phase-4-billing-domain): plugs the billing logic into the generic
 * conversation machine. Network access is injected (`extract`) so this is testable offline.
 */
export interface BillingDeps {
  rateCard: RateCardStore;
  extract: (turn: Turn, ctx: ExtractContext) => Promise<Extraction>;
  nextBillNo: () => string;
  settings?: ClarifySettings;
  /** Bills-screen voice commands (Phase 5). Returns what to say. */
  onHistory?: (a: HistoryAction) => Utterance | Promise<Utterance>;
  /** Called with the locked bill (Phase 5 stores it in history). */
  onFinalized?: (bill: FinalBill, stats: BillStats) => void | Promise<void>;
  /**
   * Language chosen in the app (top-bar menu). When set, the app's questions and read-back use it
   * instead of the language the LLM detected in the speech.
   */
  getLang?: () => Lang;
}

/** Per-bill counters for telemetry (no content, just counts and timing). */
export interface BillStats {
  msToFinalize: number;
  clarificationTurns: number;
  amberConfirmations: number;
}

const say = (text: string): Utterance => ({ text });

export function createBillingAdapter(deps: BillingDeps): DomainAdapter<DraftBill, FinalBill> {
  const settings = deps.settings ?? { alwaysAskLabour: false };
  const inLang = (d: DraftBill): DraftBill =>
    deps.getLang ? { ...d, language: deps.getLang() } : d;
  let matcher = createMatcher(deps.rateCard.list());
  deps.rateCard.subscribe(() => (matcher = createMatcher(deps.rateCard.list())));
  let stats = { startedAt: 0, clarificationTurns: 0, amberConfirmations: 0 };
  const env = (turn: Turn) => ({
    match: (n: string) => matcher(n),
    rateCard: deps.rateCard,
    sttConfidence: turn.sttConfidence,
  });

  const updateLine = (
    d: DraftBill,
    id: string,
    patch: Partial<DraftBill["items"][number]>,
  ): DraftBill => ({
    ...d,
    items: d.items.map((l) => (l.id === id ? { ...l, ...patch, rev: l.rev + 1 } : l)),
    lastChangedId: id,
  });

  return {
    emptyDraft,
    isApproval: isApprovalText,
    nextQuestion: (d) => nextQuestion(inLang(d), settings),
    readBack: (d) => readBack(inLang(d)),
    notUnderstood: (d) => notUnderstood(inLang(d)),

    async understand(turn, draft, ctx: UnderstandContext): Promise<ApplyResult<DraftBill>> {
      const q: Question | null = ctx.pendingQuestion;
      if (draft.items.length === 0 && draft.customerName === null)
        stats = { startedAt: Date.now(), clarificationTurns: 0, amberConfirmations: 0 };
      if (q) stats.clarificationTurns++;
      // Answers handled on the phone, without the network:
      if (q?.kind === "confirm" && q.targetId && isApprovalText(turn.text)) {
        stats.amberConfirmations++;
        return { draft: updateLine(draft, q.targetId, { confirmed: true }), outcome: "updated" };
      }
      if (q?.kind === "missing" && q.targetId && isSkipText(turn.text))
        return { draft: updateLine(draft, q.targetId, { skipped: true }), outcome: "updated" };

      const e = await deps.extract(turn, {
        history: ctx.history,
        catalog: deps.rateCard.list().map((r) => ({ name: r.name, aliases: r.aliases })),
        draftSummary: draftSummary(draft),
        pendingQuestion: q?.text ?? null,
      });

      switch (e.intent) {
        case "unknown":
          return { draft, outcome: "unknown" };
        case "cancel":
          return { draft: emptyDraft(), outcome: "cancel" };
        case "approve":
          return { draft, outcome: "approve" };
        case "rate_update": {
          const t = adapterPhrasesFor(deps.getLang?.());
          const done: string[] = [];
          for (const it of e.items) {
            if (it.spokenUnitPrice === null) continue;
            const m = matcher(it.name);
            if (m.entry) {
              deps.rateCard.setPrice(m.entry.id, it.spokenUnitPrice);
              done.push(t.rateSet(m.entry.name, formatRupees(it.spokenUnitPrice)));
            } else done.push(t.rateItemNotFound(it.name));
          }
          return { draft, outcome: "side_effect", say: say(done[0] ?? t.rateNotUnderstood) };
        }
        case "history": {
          const u =
            e.historyAction && deps.onHistory
              ? await deps.onHistory(e.historyAction)
              : say(adapterPhrasesFor(deps.getLang?.()).billsInBillsTab);
          return { draft, outcome: "side_effect", say: u };
        }
        default: {
          // A price answer to "X ka rate kitna hai?" applies to X, whatever name the LLM used.
          let ext = e;
          const target = q?.targetId ? draft.items.find((l) => l.id === q.targetId) : undefined;
          if (target && q?.kind === "missing") {
            const priceOnly = e.items.filter((i) => i.spokenUnitPrice !== null && i.qty === null);
            if (priceOnly.length === 1)
              ext = {
                ...e,
                items: e.items.map((i) => (i === priceOnly[0] ? { ...i, name: target.heard } : i)),
              };
          }
          const merged = mergeExtraction(draft, ext, env(turn));
          return {
            draft: { ...merged, queued: [], transcript: [...draft.transcript, turn.text] },
            outcome: "updated",
          };
        }
      }
    },

    async finalize(d) {
      const bill = finalizeDraft(d, deps.nextBillNo());
      // Learn prices the worker stated for items not in the rate card (now confirmed by approval).
      for (const l of d.items)
        if (!l.rateCardId && l.priceSource === "spoken" && l.unitPrice !== null)
          deps.rateCard.learn(l.name, l.unit, l.unitPrice, l.heard);
      await deps.onFinalized?.(bill, {
        msToFinalize: stats.startedAt ? Date.now() - stats.startedAt : 0,
        clarificationTurns: stats.clarificationTurns,
        amberConfirmations: stats.amberConfirmations,
      });
      return bill;
    },

    queueOffline: (turn, d) => ({ ...d, queued: [...d.queued, turn] }),
  };
}
