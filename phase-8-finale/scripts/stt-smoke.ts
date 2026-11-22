/** Phase 8 smoke test: real Groq Whisper on synthesized audio → extraction → bill total. `npm run stt:smoke -- <dir>` */
import { readFileSync } from "node:fs";
import Groq from "groq-sdk";
import type { RateCardEntry } from "@kaambill/shared";
import { getEnv } from "../../phase-0-setup/server/env.js";
import { transcribe } from "../server/whisper.js";
import {
  extractWithGroq,
  ExtractRequestSchema,
} from "../../phase-3-understanding/server/extract-core.js";
import { normalizeExtraction } from "../../phase-3-understanding/src/normalize.js";
import { createMatcher } from "../../phase-4-billing-domain/src/match/matcher.js";
import {
  billTotal,
  emptyDraft,
  mergeExtraction,
} from "../../phase-4-billing-domain/src/bill/model.js";

const dir = process.argv[2];
const env = getEnv();
const client = new Groq({ apiKey: env.GROQ_API_KEY, maxRetries: 1 });
const card = JSON.parse(
  readFileSync(new URL("../../phase-0-setup/seed/rateCard.json", import.meta.url), "utf8"),
) as RateCardEntry[];
const hints = card.flatMap((e) => [e.name, ...e.aliases.slice(0, 1)]);
const match = createMatcher(card);
for (const [file, lang, expected] of [
  ["demo.m4a", "hi-IN", 1235],
  ["en.m4a", "en-IN", 890],
] as const) {
  const audio = new Blob([readFileSync(`${dir}/${file}`)], { type: "audio/mp4" });
  const t0 = Date.now();
  const stt = await transcribe(client, audio, {
    model: env.GROQ_STT_MODEL,
    lang,
    hints,
    timeoutMs: 20000,
  });
  const t1 = Date.now();
  const r = await extractWithGroq(
    client,
    ExtractRequestSchema.parse({
      turn: { text: stt.text, source: "stt" },
      catalog: card.map((c) => ({ name: c.name, aliases: c.aliases })),
    }),
    {
      model: env.LLM_MODEL,
      fallbackModel: env.LLM_FALLBACK_MODEL,
      reasoningEffort: env.LLM_REASONING_EFFORT,
      maxTokens: env.LLM_MAX_TOKENS,
      timeoutMs: 20000,
    },
  );
  const draft = mergeExtraction(emptyDraft(), normalizeExtraction(r.extraction), {
    match,
    rateCard: { get: (id: string) => card.find((c) => c.id === id) },
  });
  const total = billTotal(draft);
  console.log(
    `${total === expected ? "✅" : "❌"} ${file} [${lang}] whisper ${t1 - t0} ms (conf ${stt.confidence}) → "${stt.text}"\n   extract ${r.latencyMs} ms → ${draft.customerName} · ${draft.items.map((l) => `${l.name}×${l.qty}${l.unitPrice === null ? "(no price)" : ""}`).join(", ")} · labour ${draft.laborCharge} → ₹${total} (expected ₹${expected})`,
  );
}
