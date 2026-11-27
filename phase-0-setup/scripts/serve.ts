/**
 * Production server for one container (the Hugging Face Space, or any Docker host):
 *   GET /…      the built front end in app/dist (landing page at /, the app at /app/)
 *   /api/…      the same API handlers as on Vercel (api-router.ts)
 * Needs `npm run build` (or `npx vite build --config app/vite.config.ts`) first. Server env vars
 * (GROQ_API_KEY, SARVAM_API_KEY, VOICE_PROVIDER, ALLOWED_ORIGINS, …) come from the host, not a file.
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join } from "node:path";
import { handleApi, repoRoot } from "./api-router.js";

const PORT = Number(process.env.PORT ?? 7860); // Hugging Face Spaces expect 7860
const HOST = process.env.HOST ?? "0.0.0.0";
const DIST = join(repoRoot, "app", "dist");

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

/** Maps a URL path to a file inside app/dist. `/app` and `/app/` both find app/index.html. */
function resolveStatic(pathname: string): string | null {
  const rel = decodeURIComponent(pathname).replace(/^\/+/, "");
  if (rel.split("/").includes("..") || rel.includes("\0")) return null;
  const candidates =
    rel === "" || rel.endsWith("/") ? [rel + "index.html"] : [rel, `${rel}/index.html`];
  for (const c of candidates) {
    const p = join(DIST, c);
    if (existsSync(p) && statSync(p).isFile()) return p;
  }
  return null;
}

if (!existsSync(join(DIST, "index.html"))) {
  console.error(
    `Front end not built: ${DIST} is missing. Run: npx vite build --config app/vite.config.ts`,
  );
  process.exit(1);
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  try {
    if (url.pathname === "/api" || url.pathname.startsWith("/api/"))
      return await handleApi(req, res, url);
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, { Allow: "GET, HEAD" }).end();
      return;
    }
    const file = resolveStatic(url.pathname);
    if (!file) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("Not found");
      return;
    }
    const hashed = url.pathname.startsWith("/assets/"); // Vite file names contain a content hash
    res.writeHead(200, {
      "content-type": MIME[extname(file)] ?? "application/octet-stream",
      "cache-control": hashed ? "public, max-age=31536000, immutable" : "no-cache",
      "x-content-type-options": "nosniff",
    });
    if (req.method === "HEAD") return res.end();
    createReadStream(file).pipe(res);
  } catch {
    if (!res.headersSent) res.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
    res.end("Bad request");
  }
}).listen(PORT, HOST, () => console.log(`KaamBill listening on http://${HOST}:${PORT}`));
