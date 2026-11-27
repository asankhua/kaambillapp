#!/usr/bin/env node
/**
 * Run one phase's tests: `npm run test:phase -- 4` (unit tests in the phase-4 folder, then its e2e folder if any).
 * Add `--unit` to skip the browser tests.
 */
import { readdirSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const n = process.argv[2];
const dir = readdirSync(".").find((d) => d.startsWith(`phase-${n}-`));
if (!dir) {
  console.error("Usage: npm run test:phase -- <0-8> [--unit]");
  process.exit(1);
}
const run = (cmd, args) => spawnSync(cmd, args, { stdio: "inherit", shell: process.platform === "win32" }).status ?? 1;
console.log(`\n▶ ${dir}: unit tests`);
let status = run("npx", ["vitest", "run", "--config", "phase-6-quality-demo/vitest.config.ts", dir, "--passWithNoTests"]);
if (status === 0 && !process.argv.includes("--unit") && existsSync(`${dir}/e2e`)) {
  console.log(`\n▶ ${dir}: end-to-end tests`);
  status = run("npx", ["playwright", "test", "--config", "phase-6-quality-demo/playwright.config.ts", `${dir}/e2e`]);
}
process.exit(status);
