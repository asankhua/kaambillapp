/**
 * Phase 3 eval: run the seed utterances through the real extraction (Groq) + on-device normalizer,
 * score field-level accuracy, and write eval/results/phase3.md.
 *   npm run eval:extract            (all cases)
 *   npm run eval:extract -- u01 u12 (selected ids)
 * Uses GROQ_API_KEY from .env. Prints no secrets.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import Groq from "groq-sdk";
import type { RateCardEntry } from "@kaambill/shared";
import { getEnv } from "../../phase-0-setup/server/env.js";
import {
  extractWithGroq,
  ExtractRequestSchema,
  retryAfterSeconds,
} from "../../phase-3-understanding/server/extract-core.js";
import { normalizeExtraction, normalizeUnit } from "../../phase-3-understanding/src/normalize.js";
import type { EvalCase } from "./types.js";
import {
  billTotal,
  emptyDraft,
  mergeExtraction,
} from "../../phase-4-billing-domain/src/bill/model.js";
import { createMatcher } from "../../phase-4-billing-domain/src/match/matcher.js";
import { nextQuestion } from "../../phase-4-billing-domain/src/clarify.js";
import type { DraftBill } from "../../phase-4-billing-domain/src/bill/model.js";

/** Questions the app would ask before the read-back, answering each one (phase-6 metric). */
function questionsBeforeReadBack(d0: DraftBill): number {
  let d = d0;
  for (let n = 0; n < 20; n++) {
    const q = nextQuestion(d);
    if (!q) return n;
    d = q.targetId
      ? {
          ...d,
          items: d.items.map((l) =>
            l.id === q.targetId ? { ...l, confirmed: true, unitPrice: l.unitPrice ?? 1 } : l,
          ),
        }
      : q.text.startsWith("Kiske")
        ? { ...d, customerName: "x" }
        : { ...d, laborCharge: d.laborCharge ?? 0 };
  }
  return 20;
}

const env = getEnv();
const rateCard = JSON.parse(
  readFileSync(new URL("../../phase-0-setup/seed/rateCard.json", import.meta.url), "utf8"),
) as RateCardEntry[];
const catalog = rateCard.map((e) => ({ name: e.name, aliases: e.aliases }));
const matcher = createMatcher(rateCard);
const byId = new Map(rateCard.map((e) => [e.id, e]));
const only = new Set(process.argv.slice(2).filter((a) => !a.startsWith("--")));
const cases = readFileSync(
  new URL(process.env.EVAL_FILE ?? "./utterances.seed.jsonl", import.meta.url),
  "utf8",
)
  .split("\n")
  .filter(Boolean)
  .map((l) => JSON.parse(l) as EvalCase)
  .filter((c) => only.size === 0 || only.has(c.id));

const client = new Groq({
  apiKey: env.GROQ_API_KEY,
  maxRetries: 0,
  timeout: env.EXTRACT_TIMEOUT_MS,
});
const norm = (s: string | null | undefined) =>
  (s ?? "").normalize("NFC").trim().toLowerCase().replace(/\s+/g, " ");
const unitEq = (a: string | null, b: string | null) =>
  (normalizeUnit(a) ?? "pc") === (normalizeUnit(b) ?? "pc");

interface Row {
  id: string;
  ok: number;
  total: number;
  misses: string[];
  ms: number;
  model: string;
  failure?: string;
  tokens?: number;
  totalOk?: boolean;
  questions?: number;
}

async function runCase(c: EvalCase): Promise<Row> {
  const req = ExtractRequestSchema.parse({
    turn: c.turn,
    catalog,
    pendingQuestion: c.pendingQuestion,
    draftSummary: c.draftSummary,
  });
  // Score the MAIN model only (no silent fallback). On Groq's per-minute quota, wait and retry.
  let r: Awaited<ReturnType<typeof extractWithGroq>> | undefined;
  for (let attempt = 0; !r; attempt++) {
    try {
      r = await extractWithGroq(client, req, {
        model: env.LLM_MODEL,
        fallbackModel: env.LLM_MODEL,
        reasoningEffort: env.LLM_REASONING_EFFORT,
        maxTokens: env.LLM_MAX_TOKENS,
        timeoutMs: 20_000,
      });
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      const transient = /APIConnectionError|APIConnectionTimeoutError/.test(name);
      const wait = retryAfterSeconds(err) ?? (transient ? 5 : null);
      if (wait === null || attempt >= 6) throw err;
      process.stdout.write(`  ${c.id}: quota, waiting ${wait + 1}s\n`);
      await new Promise((res) => setTimeout(res, (wait + 1) * 1000));
    }
  }
  const got = normalizeExtraction(r.extraction);
  const exp = c.expected;
  const misses: string[] = [];
  let ok = 0;
  let total = 0;
  const check = (field: string, pass: boolean, detail: string) => {
    total++;
    if (pass) ok++;
    else misses.push(`${field}: ${detail}`);
  };
  check("intent", got.intent === exp.intent, `${got.intent} ≠ ${exp.intent}`);
  check("docType", got.docType === exp.docType, `${got.docType} ≠ ${exp.docType}`);
  const accepted = (field: keyof EvalCase["alsoAccept"], value: string | number | null) =>
    (c.alsoAccept?.[field] ?? []).some((a) =>
      typeof a === "string" ? norm(a) === norm(String(value ?? "")) : a === value,
    );
  check(
    "customerName",
    norm(got.customerName) === norm(exp.customerName) || accepted("customerName", got.customerName),
    `${got.customerName} ≠ ${exp.customerName}`,
  );
  check(
    "laborCharge",
    got.laborCharge === exp.laborCharge || accepted("laborCharge", got.laborCharge),
    `${got.laborCharge} ≠ ${exp.laborCharge}`,
  );
  check(
    "visitingCharge",
    got.visitingCharge === exp.visitingCharge || accepted("visitingCharge", got.visitingCharge),
    `${got.visitingCharge} ≠ ${exp.visitingCharge}`,
  );
  check(
    "discount",
    got.discount === exp.discount || accepted("discount", got.discount),
    `${got.discount} ≠ ${exp.discount}`,
  );
  check(
    "historyAction",
    JSON.stringify(
      got.historyAction && {
        ...got.historyAction,
        customer: norm(got.historyAction.customer),
        when: norm(got.historyAction.when) || null,
      },
    ) ===
      JSON.stringify(
        exp.historyAction && {
          ...exp.historyAction,
          customer: norm(exp.historyAction.customer),
          when: norm(exp.historyAction.when) || null,
        },
      ),
    `${JSON.stringify(got.historyAction)} ≠ ${JSON.stringify(exp.historyAction)}`,
  );
  check(
    "items.count",
    got.items.length === exp.items.length,
    `${got.items.length} ≠ ${exp.items.length}`,
  );
  exp.items.forEach((ei, i) => {
    const gi = got.items[i];
    check(`item${i}.qty`, gi?.qty === ei.qty, `${gi?.qty} ≠ ${ei.qty} (spoken "${gi?.qtySpoken}")`);
    check(`item${i}.unit`, !!gi && unitEq(gi.unit, ei.unit), `${gi?.unit} ≠ ${ei.unit}`);
    check(
      `item${i}.spokenUnitPrice`,
      gi?.spokenUnitPrice === ei.spokenUnitPrice,
      `${gi?.spokenUnitPrice} ≠ ${ei.spokenUnitPrice}`,
    );
  });
  // Phase 4: rate-card match per item, and the full bill total for new-job cases.
  exp.items.forEach((ei, i) => {
    const gi = got.items[i];
    // A price-only answer to a pending question is bound to the ASKED item by the adapter, not by name.
    if (c.pendingQuestion && ei.qty === null && ei.spokenUnitPrice !== null) return;
    check(
      `item${i}.match`,
      !!gi && (matcher(gi.name).entry?.id ?? null) === ei.rateCardId,
      `${gi ? (matcher(gi.name).entry?.id ?? null) : "-"} ≠ ${ei.rateCardId}`,
    );
  });
  let totalOk: boolean | undefined;
  let questions: number | undefined;
  if (exp.intent === "new_job" && !c.draftSummary)
    questions = questionsBeforeReadBack(
      mergeExtraction(emptyDraft(), got, {
        match: matcher,
        rateCard: { get: (id: string) => byId.get(id) },
      }),
    );
  if (c.expectedTotal !== null) {
    const draft = mergeExtraction(emptyDraft(), got, {
      match: matcher,
      rateCard: { get: (id: string) => byId.get(id) },
    });
    const t = billTotal(draft);
    totalOk = t === c.expectedTotal && draft.items.every((l) => l.unitPrice !== null);
    if (!totalOk) misses.push(`TOTAL: ₹${t} ≠ ₹${c.expectedTotal}`);
  }
  return {
    id: c.id,
    ok,
    total,
    misses,
    ms: r.latencyMs,
    model: r.model,
    tokens: r.usage?.total_tokens,
    totalOk,
    questions,
    ...(r.failure ? { failure: r.failure } : {}),
  };
}

// ── Run (resumable) ───────────────────────────────────────────────────────────────────────────
// Groq's free tier has a per-minute AND a daily quota, so a 200-case run can take hours. Every scored
// case is cached in results/eval-cache.json (keyed by model + case content); a re-run skips cached
// cases and retries errors. `npm run eval:extract -- --report` rebuilds the reports from the cache only.
const cacheUrl = new URL("./results/eval-cache.json", import.meta.url);
const cache: Record<string, Row> = existsSync(cacheUrl)
  ? JSON.parse(readFileSync(cacheUrl, "utf8"))
  : {};
const keyOf = (c: EvalCase) =>
  `${env.LLM_MODEL}|${createHash("sha1").update(JSON.stringify(c)).digest("hex").slice(0, 12)}`;
const reportOnly = process.argv.includes("--report");

let ran = 0;
for (const c of cases) {
  if (reportOnly || cache[keyOf(c)]) continue;
  try {
    cache[keyOf(c)] = await runCase(c);
    ran++;
    writeFileSync(cacheUrl, JSON.stringify(cache, null, 1));
    process.stdout.write(`  ${c.id} ✓ (${ran} new)\n`);
  } catch (err) {
    process.stdout.write(
      `  ${c.id}: error ${err instanceof Error ? err.name + " " + err.message : err} (will retry next run)\n`,
    );
  }
}

// ── Reports ──────────────────────────────────────────────────────────────────────────────────────
interface Scored {
  c: EvalCase;
  r: Row;
}
const scored: Scored[] = cases.flatMap((c) =>
  cache[keyOf(c)] ? [{ c, r: cache[keyOf(c)]! }] : [],
);
const missing = cases.length - scored.length;

function summary(list: Scored[]) {
  const rows = list.map((x) => x.r);
  const ok = rows.reduce((s, r) => s + r.ok, 0);
  const total = rows.reduce((s, r) => s + r.total, 0);
  const lat = rows
    .map((r) => r.ms)
    .filter(Boolean)
    .sort((a, b) => a - b);
  const pct = (p: number) => lat[Math.min(lat.length - 1, Math.floor(p * lat.length))] ?? 0;
  const totalRows = rows.filter((r) => r.totalOk !== undefined);
  const qRows = rows.filter((r) => r.questions !== undefined);
  return {
    n: rows.length,
    ok,
    total,
    accuracy: total ? ((ok / total) * 100).toFixed(1) : "–",
    perfect: rows.filter((r) => r.ok === r.total).length,
    totalsOk: totalRows.filter((r) => r.totalOk).length,
    totalsN: totalRows.length,
    avgQ: (qRows.reduce((s, r) => s + r.questions!, 0) / Math.max(1, qRows.length)).toFixed(2),
    qN: qRows.length,
    p50: pct(0.5),
    p90: pct(0.9),
    tokens: Math.round(
      rows.reduce((s, r) => s + (r.tokens ?? 0), 0) /
        Math.max(1, rows.filter((r) => r.tokens).length),
    ),
  };
}

const LANGS: [string, string][] = [
  ["hi-Latn", "Hinglish"],
  ["hi", "Hindi (Devanagari)"],
  ["en-IN", "English"],
];

function report(title: string, list: Scored[], of: number, target: string, extra: string[] = []) {
  const s = summary(list);
  const complete = list.length === of;
  return [
    `# ${title} (${new Date().toISOString().slice(0, 10)})`,
    ``,
    complete
      ? `- Cases: **${s.n}** (all), text input; normalizer applied on-device`
      : `- ⚠️ **Partial: ${s.n} of ${of} cases scored so far** (Groq free-tier quota). Re-run \`npm run eval:extract\` to continue; finished cases are cached.`,
    `- Model: \`${env.LLM_MODEL}\`, reasoning_effort \`${env.LLM_REASONING_EFFORT}\`, strict JSON schema; main model only (no fallback while scoring)`,
    `- **Field accuracy: ${s.accuracy}%** (${s.ok}/${s.total} fields) · fully correct cases: ${s.perfect}/${s.n}`,
    `- **Bill total exact match (Groq → normalizer → matcher → bill): ${s.totalsOk}/${s.totalsN}**`,
    `- **Clarifying questions per new bill (before read-back): avg ${s.avgQ}** over ${s.qN} bills`,
    `- **Latency (server call): p50 ${s.p50} ms · p90 ${s.p90} ms** · tokens per request avg ${s.tokens}`,
    `- Target: ${target}`,
    ...extra,
    ``,
    `| Case | Lang | Score | ms | Misses |`,
    `|---|---|---|---|---|`,
    ...list.map(
      ({ c, r }) =>
        `| ${r.id} | ${c.expected.language} | ${r.ok}/${r.total} | ${r.ms} | ${r.failure ? `**${r.failure}** ` : ""}${r.misses.join("; ").replace(/\|/g, "/") || "✓"} |`,
    ),
    ``,
    `Item matches and bill totals use the on-device matcher and bill model (Phase 4).`,
  ].join("\n");
}

const byLang = LANGS.map(([code, name]) => {
  const list = scored.filter((x) => x.c.expected.language === code);
  const of = cases.filter((c) => c.expected.language === code).length;
  const s = summary(list);
  return `| ${name} (\`${code}\`) | ${list.length}/${of} | ${s.accuracy}% | ${s.totalsOk}/${s.totalsN} | ${s.p50} ms |`;
});
const langTable = [
  ``,
  `**By language** (Phase 8 target > 85% each):`,
  ``,
  `| Language | Scored | Field accuracy | Totals exact | p50 |`,
  `|---|---|---|---|---|`,
  ...byLang,
];

const outDir = (f: string) => new URL(`./results/${f}`, import.meta.url);
writeFileSync(
  outDir("phase6.md"),
  report(
    "Phase 6/8 eval: extraction + bill totals, all cases",
    scored,
    cases.length,
    "> 90% field accuracy (phase 6); > 85% per language (phase 8); p50 < 3 s end of speech → read-back",
    langTable,
  ) + "\n",
);
// Phase 3 acceptance is on the 30 original seed sentences (u001–u030).
const SEED = new Set(Array.from({ length: 30 }, (_, i) => `u${String(i + 1).padStart(3, "0")}`));
const seed = scored.filter((x) => SEED.has(x.c.id));
writeFileSync(
  outDir("phase3.md"),
  report(
    "Phase 3 eval: the 30 seed sentences",
    seed,
    cases.filter((c) => SEED.has(c.id)).length,
    "≥ 85% field accuracy, p50 < 1.5 s (phase-3 acceptance)",
  ) + "\n",
);

const all = summary(scored);
console.log(
  `${ran} new · ${scored.length}/${cases.length} scored${missing ? ` (${missing} left)` : ""} · field accuracy ${all.accuracy}% · totals ${all.totalsOk}/${all.totalsN} · p50 ${all.p50} ms → results/phase6.md, results/phase3.md`,
);
