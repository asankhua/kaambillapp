import type { Turn } from "@kaambill/shared";

/**
 * Domain-agnostic contracts for the conversation machine (architecture.md §3, §1.1).
 * KaamBill implements DomainAdapter in src/domain (Phase 4); a new domain (Phase 7) swaps in its own.
 * Nothing in src/core may import src/domain (enforced by ESLint).
 */

/** A message the app shows on screen (status / banner / read-back). No audio. Keep text ≤ 2 sentences. */
export interface Utterance {
  /** Shown on screen, e.g. "Verma ji ka total ₹1,235 bana hai…". KaamBill has no spoken output. */
  text: string;
}

/** A single clarifying question (only ONE is ever asked at a time). */
export interface Question extends Utterance {
  /** Kind lets the UI pick S4 (question) vs S5 (low-confidence confirm). */
  kind: "missing" | "confirm";
  /** Quick-reply chips shown under the question (S4), e.g. ["₹25 / meter", "₹30 / meter"]. */
  quickReplies?: string[];
  /** Id of the item the question is about, so the UI can focus it (amber chip). */
  targetId?: string;
}

/** What happened after a turn was understood and applied to the draft. */
export type ApplyOutcome =
  | "updated" // draft changed → ask next question / read back
  | "approve" // the user approved by speech that reached the server
  | "cancel" // drop the draft
  | "unknown" // not understood → S10c
  | "side_effect"; // e.g. history command or rate update: done, nothing to read back

export interface ApplyResult<TDraft> {
  draft: TDraft;
  outcome: ApplyOutcome;
  /** Optional on-screen confirmation for side effects ("Verma ji ka bill paid ho gaya"). */
  say?: Utterance;
}

export interface UnderstandContext {
  history: Turn[];
  pendingQuestion: Question | null;
}

export interface DomainAdapter<TDraft, TOutput> {
  emptyDraft(): TDraft;
  /** Understand one turn (e.g. call /api/extract) and apply it. May throw OfflineError-like errors. */
  understand(turn: Turn, draft: TDraft, ctx: UnderstandContext): Promise<ApplyResult<TDraft>>;
  /** Local approval words ("haan", "bhej do") so approvals never need the network. */
  isApproval(text: string): boolean;
  /** At most ONE question, by the domain's priority order; null when nothing is missing. */
  nextQuestion(draft: TDraft): Question | null;
  /** The read-back before any action ("Verma ji ka total ₹1,235 bana hai…"). */
  readBack(draft: TDraft): Utterance;
  /** Lock the draft and build the output (PDF, UPI QR…). Only reachable after approval. */
  finalize(draft: TDraft): Promise<TOutput>;
  /** S10c message in the user's language (default: Hinglish). */
  notUnderstood?(draft: TDraft): Utterance;
  /** Called when understand() fails because we're offline; return the draft with the turn queued. */
  queueOffline?(turn: Turn, draft: TDraft): TDraft;
}

/** Errors the machine distinguishes (each maps to a screen). */
export type VoiceErrorKind =
  | "mic_blocked"
  | "no_speech"
  | "unsupported"
  | "network"
  | "offline"
  | "rate_limited"
  | "key_not_set" // the server has no GROQ_API_KEY
  | "unknown";
