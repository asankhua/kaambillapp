#!/usr/bin/env node
/**
 * Typecheck every folder with its own tsconfig: each phase (tsconfig.json + tsconfig.server.json),
 * any domain-<name>/, app/ and api/. Usage: `npm run typecheck` (or `-- 4` for one phase).
 */
import { existsSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";

const only = process.argv[2];
const dirs = readdirSync(".")
  .filter((d) => /^(phase-\d|domain-)/.test(d) || d === "app" || d === "api")
  .filter((d) => !only || d.startsWith(`phase-${only}-`))
  .sort();
let failed = 0;
for (const d of dirs)
  for (const cfg of ["tsconfig.json", "tsconfig.server.json"]) {
    if (!existsSync(`${d}/${cfg}`)) continue;
    const r = spawnSync("npx", ["tsc", "-p", `${d}/${cfg}`], { stdio: "inherit" });
    if (r.status !== 0) failed++;
    else console.log(`✓ ${d}/${cfg}`);
  }
process.exit(failed ? 1 : 0);
