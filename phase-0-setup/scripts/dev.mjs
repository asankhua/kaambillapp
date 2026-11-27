/** `npm run dev`: local API (port 3000, real Groq via .env) + Vite PWA (port 5173). Ctrl+C stops both. */
import { spawn } from "node:child_process";

const run = (script) => spawn("npm", ["run", script], { stdio: "inherit" });
const procs = [run("dev:api"), run("dev:web")];
const stop = () => procs.forEach((p) => p.kill("SIGTERM"));
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
procs.forEach((p) => p.on("exit", (code) => { stop(); process.exitCode = code ?? 0; }));
