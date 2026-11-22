import { assign, fromPromise, setup } from "xstate";
import type { Turn } from "@kaambill/shared";
import type { ApplyResult, DomainAdapter, Question, Utterance, VoiceErrorKind } from "./types";

/**
 * Conversation state machine (architecture.md §3). Domain-agnostic: all billing logic comes in
 * through `adapter`. Speech-to-text is injected so tests run without a browser. There is NO spoken
 * output: questions, the read-back and confirmations are shown on screen only.
 *
 *   idle ─MIC_TAP→ listening ─STT_FINAL→ processing ─┬→ clarifying / confirming (ONE question)
 *     └──────────TEXT_SUBMIT──────────────────────────┘   ├→ readBack → awaitApproval ─haan→ finalizing → sharePreview
 *                                                          ├→ notUnderstood (S10c) · offlineQueued (S10b)
 *                                                          └→ idle (cancel / side effect)
 * Rule: the ONLY way to finalizing is through awaitApproval (read-back first), never from processing.
 */

export interface MachineDeps<TDraft, TOutput> {
  adapter: DomainAdapter<TDraft, TOutput>;
  /** Start / stop the speech-to-text engine (Phase 2: WebSpeechProvider). */
  startListening: () => void;
  stopListening: () => void;
  /** Optional hook: every message the app shows (question, read-back, confirmation). No audio. */
  onMessage?: (u: Utterance) => void;
}

export interface ConversationContext<TDraft, TOutput> {
  draft: TDraft;
  history: Turn[];
  pendingQuestion: Question | null;
  /** The turn being processed (or last processed). */
  turn: Turn | null;
  partial: string;
  /** The last read-back shown (S6). */
  lastSaid: Utterance | null;
  /** On-screen confirmation of a side effect, e.g. "Verma ji ka bill paid ho gaya". */
  notice: Utterance | null;
  error: VoiceErrorKind | null;
  output: TOutput | null;
  /** Where we return to after listening: normal input, or answering the approval prompt. */
  awaiting: "input" | "approval";
}

export type ConversationEvent =
  | { type: "MIC_TAP" }
  | { type: "TEXT_SUBMIT"; text: string }
  | { type: "STT_PARTIAL"; text: string }
  | { type: "STT_FINAL"; turn: Turn }
  | { type: "STT_ERROR"; kind: VoiceErrorKind }
  | { type: "STOP" }
  | { type: "CANCEL" }
  | { type: "APPROVE" } // "Haan, bhejo" button (S6)
  | { type: "EDIT" } // "Badlav karein" (S6) → back to building
  | { type: "SHARED" } // share sheet opened / done (S7)
  | { type: "RETRY" } // offline queue / not-understood retry
  | { type: "RESET" }
  /** Tap-to-fix edits from the UI (S3 chips). The draft changes, then the machine re-decides
   *  (new question or a NEW read-back), so an edit can never skip the read-back. */
  | { type: "DRAFT_EDIT"; update: (draft: never) => unknown };

const errorKindOf = (err: unknown): VoiceErrorKind => {
  const name = err instanceof Error ? err.name : "";
  if (name === "OfflineError") return "offline";
  if (
    err &&
    typeof err === "object" &&
    "status" in err &&
    (err as { status: number }).status === 429
  )
    return "rate_limited";
  return "network";
};

export function createConversationMachine<TDraft, TOutput>(deps: MachineDeps<TDraft, TOutput>) {
  const { adapter } = deps;

  const draftEdit = {
    target: "deciding" as const,
    actions: [
      assign<
        ConversationContext<TDraft, TOutput>,
        Extract<ConversationEvent, { type: "DRAFT_EDIT" }>,
        undefined,
        ConversationEvent,
        never
      >({
        draft: ({ context, event }) => event.update(context.draft as never) as TDraft,
        pendingQuestion: null,
      }),
    ],
  };

  return setup({
    types: {
      context: {} as ConversationContext<TDraft, TOutput>,
      events: {} as ConversationEvent,
    },
    actors: {
      understand: fromPromise<
        ApplyResult<TDraft>,
        { turn: Turn; draft: TDraft; history: Turn[]; pendingQuestion: Question | null }
      >(({ input }) =>
        adapter.understand(input.turn, input.draft, {
          history: input.history,
          pendingQuestion: input.pendingQuestion,
        }),
      ),
      finalize: fromPromise<TOutput, { draft: TDraft }>(({ input }) =>
        adapter.finalize(input.draft),
      ),
    },
    guards: {
      isLocalApproval: ({ context, event }) => {
        if (context.awaiting !== "approval") return false;
        const text =
          event.type === "TEXT_SUBMIT"
            ? event.text
            : event.type === "STT_FINAL"
              ? event.turn.text
              : "";
        return adapter.isApproval(text);
      },
      outcomeIs: (
        _,
        params: { result: ApplyResult<TDraft>; outcome: ApplyResult<TDraft>["outcome"] },
      ) => params.result.outcome === params.outcome,
      hasQuestion: ({ context }) => adapter.nextQuestion(context.draft) !== null,
    },
    actions: {
      startListening: () => deps.startListening(),
      stopListening: () => deps.stopListening(),
      show: (_, u: Utterance) => deps.onMessage?.(u),
    },
  }).createMachine({
    id: "conversation",
    context: {
      draft: adapter.emptyDraft(),
      history: [],
      pendingQuestion: null,
      turn: null,
      partial: "",
      lastSaid: null,
      notice: null,
      error: null,
      output: null,
      awaiting: "input",
    },
    initial: "idle",
    on: {
      RESET: {
        target: ".idle",
        actions: [
          "stopListening",
          assign({
            draft: () => adapter.emptyDraft(),
            history: [],
            pendingQuestion: null,
            turn: null,
            partial: "",
            notice: null,
            error: null,
            output: null,
            awaiting: "input",
          }),
        ],
      },
    },
    states: {
      /** Home (Tap karke boliye) and also "waiting for the answer" after a question. */
      idle: {
        on: {
          DRAFT_EDIT: draftEdit,
          MIC_TAP: "listening",
          TEXT_SUBMIT: [
            { guard: "isLocalApproval", target: "finalizing" },
            {
              target: "processing",
              actions: assign({
                turn: ({ event }) => ({ text: event.text, source: "text" as const }),
              }),
            },
          ],
        },
      },

      /** S2: Sun raha hoon… */
      listening: {
        entry: [assign({ partial: "", error: null }), "startListening"],
        exit: "stopListening",
        on: {
          STT_PARTIAL: { actions: assign({ partial: ({ event }) => event.text }) },
          STT_FINAL: [
            { guard: "isLocalApproval", target: "finalizing" },
            { target: "processing", actions: assign({ turn: ({ event }) => event.turn }) },
          ],
          STT_ERROR: { target: "error", actions: assign({ error: ({ event }) => event.kind }) },
          STOP: [
            {
              guard: ({ context }) => context.partial.trim().length > 0,
              target: "processing",
              actions: assign({
                turn: ({ context }) => ({ text: context.partial, source: "stt" as const }),
              }),
            },
            { target: "idle" },
          ],
          CANCEL: { target: "idle", actions: assign({ partial: "" }) },
          TEXT_SUBMIT: {
            target: "processing",
            actions: assign({
              turn: ({ event }) => ({ text: event.text, source: "text" as const }),
            }),
          },
        },
      },

      /** S3: Rate check kar raha hoon… */
      processing: {
        entry: assign({ notice: null }),
        invoke: {
          src: "understand",
          input: ({ context }) => ({
            turn: context.turn!,
            draft: context.draft,
            history: context.history,
            pendingQuestion: context.pendingQuestion,
          }),
          onDone: [
            {
              guard: {
                type: "outcomeIs",
                params: ({ event }) => ({ result: event.output, outcome: "unknown" }),
              },
              target: "notUnderstood",
              actions: assign({
                history: ({ context }) => [...context.history, context.turn!].slice(-4),
              }),
            },
            {
              guard: {
                type: "outcomeIs",
                params: ({ event }) => ({ result: event.output, outcome: "cancel" }),
              },
              target: "idle",
              actions: assign({
                draft: () => adapter.emptyDraft(),
                history: [],
                pendingQuestion: null,
                awaiting: "input",
              }),
            },
            {
              // Approval that reached the server still goes through the read-back gate:
              // only allowed if we were already awaiting approval.
              guard: ({ context, event }) =>
                event.output.outcome === "approve" && context.awaiting === "approval",
              target: "finalizing",
            },
            {
              guard: {
                type: "outcomeIs",
                params: ({ event }) => ({ result: event.output, outcome: "side_effect" }),
              },
              target: "idle",
              actions: [
                assign({
                  draft: ({ event }) => event.output.draft,
                  pendingQuestion: null,
                  notice: ({ event }) => event.output.say ?? { text: "Ho gaya." },
                }),
                { type: "show", params: ({ event }) => event.output.say ?? { text: "Ho gaya." } },
              ],
            },
            {
              target: "deciding",
              actions: assign({
                draft: ({ event }) => event.output.draft,
                history: ({ context }) => [...context.history, context.turn!].slice(-4),
                pendingQuestion: null,
              }),
            },
          ],
          onError: [
            {
              guard: ({ event }) =>
                errorKindOf(event.error) === "offline" &&
                typeof adapter.queueOffline === "function",
              target: "offlineQueued",
              actions: assign({
                draft: ({ context }) => adapter.queueOffline!(context.turn!, context.draft),
                error: "offline",
              }),
            },
            {
              target: "error",
              actions: assign({ error: ({ event }) => errorKindOf(event.error) }),
            },
          ],
        },
      },

      /** Pick ONE next step: question, or read-back. */
      deciding: {
        always: [
          { guard: "hasQuestion", target: "asking", actions: assign({ awaiting: "input" }) },
          { target: "readBack" },
        ],
      },

      /** S4 (missing) / S5 (confirm): ask exactly one question, then wait for the answer. */
      asking: {
        entry: [
          assign({ pendingQuestion: ({ context }) => adapter.nextQuestion(context.draft) }),
          { type: "show", params: ({ context }) => context.pendingQuestion! },
        ],
        on: {
          DRAFT_EDIT: draftEdit,
          MIC_TAP: "listening",
          TEXT_SUBMIT: {
            target: "processing",
            actions: assign({
              turn: ({ event }) => ({ text: event.text, source: "text" as const }),
            }),
          },
          CANCEL: { target: "idle", actions: assign({ pendingQuestion: null }) },
        },
      },

      /** S6: show the read-back on screen, then wait for "haan" (tap, type or dictate). */
      readBack: {
        entry: [
          assign({
            lastSaid: ({ context }) => adapter.readBack(context.draft),
            awaiting: "approval",
          }),
          { type: "show", params: ({ context }) => context.lastSaid! },
        ],
        always: "awaitApproval",
      },

      /** S6: 'Haan' ka intezaar… */
      awaitApproval: {
        on: {
          DRAFT_EDIT: draftEdit,
          APPROVE: "finalizing",
          MIC_TAP: "listening",
          TEXT_SUBMIT: [
            { guard: "isLocalApproval", target: "finalizing" },
            {
              target: "processing",
              actions: assign({
                turn: ({ event }) => ({ text: event.text, source: "text" as const }),
              }),
            },
          ],
          EDIT: { target: "idle", actions: assign({ awaiting: "input" }) },
          CANCEL: { target: "idle", actions: assign({ awaiting: "input" }) },
        },
      },

      /** Lock the bill and build the output (only reachable from the approval gate). */
      finalizing: {
        invoke: {
          src: "finalize",
          input: ({ context }) => ({ draft: context.draft }),
          onDone: {
            target: "sharePreview",
            actions: assign({ output: ({ event }) => event.output, awaiting: "input" }),
          },
          onError: { target: "error", actions: assign({ error: "unknown" }) },
        },
      },

      /** S7: Bill taiyaar hai! The worker taps Send in WhatsApp; the app never sends. */
      sharePreview: {
        on: {
          SHARED: {
            target: "idle",
            actions: assign({
              draft: () => adapter.emptyDraft(),
              history: [],
              pendingQuestion: null,
              output: null,
            }),
          },
          EDIT: {
            target: "awaitApproval",
            actions: assign({ output: null, awaiting: "approval" }),
          },
        },
      },

      /** S10c: Samajh nahi aaya, ek baar phir boliye. */
      notUnderstood: {
        entry: {
          type: "show",
          params: ({ context }) =>
            adapter.notUnderstood?.(context.draft) ?? {
              text: "Samajh nahi aaya, ek baar phir boliye.",
            },
        },
        on: {
          DRAFT_EDIT: draftEdit,
          MIC_TAP: "listening",
          RETRY: "listening",
          TEXT_SUBMIT: {
            target: "processing",
            actions: assign({
              turn: ({ event }) => ({ text: event.text, source: "text" as const }),
            }),
          },
          CANCEL: "idle",
        },
      },

      /** S10b: Internet nahi hai — bill save ho gaya, baad mein process hoga. */
      offlineQueued: {
        on: {
          RETRY: { target: "processing", actions: assign({ error: null }) },
          MIC_TAP: "listening",
          CANCEL: "idle",
        },
      },

      /** S10a (mic blocked) / generic error. Text input always stays available. */
      error: {
        on: {
          MIC_TAP: { target: "listening", actions: assign({ error: null }) },
          RETRY: { target: "listening", actions: assign({ error: null }) },
          TEXT_SUBMIT: {
            target: "processing",
            actions: assign({
              error: null,
              turn: ({ event }) => ({ text: event.text, source: "text" as const }),
            }),
          },
          CANCEL: { target: "idle", actions: assign({ error: null }) },
        },
      },
    },
  });
}
