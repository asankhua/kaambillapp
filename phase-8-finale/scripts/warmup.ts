/**
 * Before going on stage: `npm run warmup -- https://your-app.vercel.app`
 * 1. GET /api/health (config OK?)  2. one real extraction with the canonical sentence (warms the
 * function + checks Groq quota). Prints latency; no secrets.
 */
const base = (process.argv[2] ?? "").replace(/\/$/, "");
if (!/^https?:\/\//.test(base)) {
  console.error("Usage: npm run warmup -- https://your-app.vercel.app");
  process.exit(1);
}
const health = await fetch(`${base}/api/health`);
console.log(`health: HTTP ${health.status}`, JSON.stringify(await health.json().catch(() => ({}))));
for (let i = 1; i <= 2; i++) {
  const t0 = Date.now();
  const res = await fetch(`${base}/api/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: base },
    body: JSON.stringify({
      turn: {
        text: "Verma ji ke ghar 2 Havells MCB, 15 meter Finolex wire, aur 500 labour ka bill bana do",
        source: "text",
      },
    }),
  });
  const body = (await res.json().catch(() => ({}))) as {
    extraction?: { intent: string; items: unknown[] };
    error?: string;
  };
  console.log(
    `extract #${i}: HTTP ${res.status} in ${Date.now() - t0} ms → ${body.extraction ? `${body.extraction.intent}, ${body.extraction.items.length} items` : body.error}`,
  );
}

export {};
