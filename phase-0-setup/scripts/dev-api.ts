/**
 * Local stand-in for `vercel dev`: serves the same `api/*.ts` entry files on http://localhost:3000.
 * Vite (port 5173) proxies `/api` here (app/vite.config.ts). Run with `npm run dev`.
 */
import { createServer } from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { handleApi } from "./api-router.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const PORT = Number(process.env.API_PORT ?? 3000);

createServer((req, res) => handleApi(req, res, root, PORT)).listen(PORT, () =>
  console.log(`KaamBill API (local) on http://localhost:${PORT}/api`),
);
