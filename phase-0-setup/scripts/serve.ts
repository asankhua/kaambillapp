/**
 * Production server (Render, or any Node host): one process serves
 *   /            the landing page        (app/dist/index.html)
 *   /app/...     the KaamBill app       (app/dist/app/index.html, SPA fallback)
 *   /api/...     the speech and billing API (api/*.ts, same handlers as on Vercel and `npm run dev`)
 * Build first with `npm run build`, then `npm start`. Listens on $PORT (Render sets it).
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { handleApi } from "./api-router.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const dist = join(root, "app", "dist");
const PORT = Number(process.env.PORT ?? 3000);

if (!existsSync(join(dist, "index.html"))) {
  console.error("app/dist is missing. Run `npm run build` first.");
  process.exit(1);
}

// Render gives every service its public URL in RENDER_EXTERNAL_URL. Browsers send it as the Origin of
// API requests, so allow it (ALLOWED_ORIGINS can still list custom domains).
const renderOrigin = process.env.RENDER_EXTERNAL_URL
  ? new URL(process.env.RENDER_EXTERNAL_URL).origin
  : undefined;
if (renderOrigin) {
  const allowed = (process.env.ALLOWED_ORIGINS ?? "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!allowed.includes(renderOrigin)) allowed.push(renderOrigin);
  process.env.ALLOWED_ORIGINS = allowed.join(",");
}

// Fail at startup, with the variable names (never the values), instead of on the first request.
const { getEnv } = await import("../server/env.js");
try {
  getEnv();
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

const isFile = (p: string) => existsSync(p) && statSync(p).isFile();

/** Resolve a URL path to a file inside app/dist, or null if it would leave that folder. */
function resolveInDist(pathname: string): string | null {
  const candidate = resolve(dist, "." + pathname);
  return candidate === dist || candidate.startsWith(dist + sep) ? candidate : null;
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (url.pathname.startsWith("/api/")) return handleApi(req, res, root, PORT);

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { allow: "GET, HEAD" }).end();
    return;
  }
  let pathname: string;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    res.writeHead(400).end("Bad request");
    return;
  }
  const target = resolveInDist(pathname);
  if (!target) {
    res.writeHead(404).end("Not found");
    return;
  }

  // A file, or a folder's index.html. Anything else under /app/ is the app's own page (SPA fallback).
  let file: string | null = null;
  if (isFile(target)) file = target;
  else if (isFile(join(target, "index.html"))) file = join(target, "index.html");
  else if (pathname === "/app" || pathname.startsWith("/app/"))
    file = join(dist, "app", "index.html");

  if (!file) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("Not found");
    return;
  }
  const hashed = file.includes(`${sep}assets${sep}`); // Vite file names carry a content hash
  res.writeHead(200, {
    "content-type": TYPES[extname(file)] ?? "application/octet-stream",
    "cache-control": hashed ? "public, max-age=31536000, immutable" : "no-cache",
  });
  if (req.method === "HEAD") return res.end();
  createReadStream(file).pipe(res);
}).listen(PORT, "0.0.0.0", () => console.log(`KaamBill listening on port ${PORT}`));
