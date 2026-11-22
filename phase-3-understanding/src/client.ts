import type { Extraction, Turn } from "@kaambill/shared";
import { postStructured } from "./http";
import { normalizeExtraction } from "./normalize";

/**
 * Client for POST /api/extract (architecture.md §5.2, §13.2).
 * - 6 s timeout, one retry on network/5xx errors (never on 4xx)
 * - output is run through the on-device normalizer before the app sees it
 * - throws OfflineError when there's no connection, so the caller can queue the turn (S10b)
 * Approval words ("haan", "bhej do") are handled by the state machine and never sent here.
 */
export interface ExtractContext {
  history?: Turn[];
  /** Rate-card names + aliases only; prices never leave the device. */
  catalog?: { name: string; aliases: string[] }[];
  draftSummary?: string | null;
  pendingQuestion?: string | null;
}

export { ExtractError, OfflineError } from "./http";

export async function extract(
  turn: Turn,
  ctx: ExtractContext = {},
  fetchImpl: typeof fetch = fetch,
): Promise<Extraction> {
  const body = {
    turn: {
      text: turn.text,
      source: turn.source,
      sttConfidence: turn.sttConfidence,
      lang: turn.lang,
    },
    history: (ctx.history ?? []).slice(-4).map((t) => ({ text: t.text, source: t.source })),
    catalog: ctx.catalog ?? [],
    draftSummary: ctx.draftSummary ?? null,
    pendingQuestion: ctx.pendingQuestion ?? null,
  };
  const data = await postStructured<{ extraction: Extraction }>("/extract", body, fetchImpl);
  return normalizeExtraction(data.extraction);
}
