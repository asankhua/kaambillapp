#!/usr/bin/env node
/**
 * New-domain scaffold: `npm run domain:new -- <name>` (e.g. grievance, symptoms, quiz).
 * Creates a new folder domain-<name>/ (schema, endpoint, adapter, UI card, test), wired to the
 * reusable phases, plus a one-line Vercel entry in api/<name>.ts.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");
const name = (process.argv[2] ?? "").toLowerCase();
if (!/^[a-z][a-z0-9]{2,30}$/.test(name)) {
  console.error("Usage: npm run domain:new -- <name>   (lowercase letters/digits, e.g. grievance)");
  process.exit(1);
}
const pascal = name[0].toUpperCase() + name.slice(1);
const fill = (s) => s.replaceAll("__NAME__", name).replaceAll("__PASCAL__", pascal).replaceAll("__UPPER__", name.toUpperCase());
const tpl = (f) => fill(readFileSync(join(here, "templates", f), "utf8"));
const dir = `domain-${name}`;
const targets = [
  ["schema.ts.tpl", `${dir}/src/schema.ts`],
  ["api.ts.tpl", `${dir}/server/endpoint.ts`],
  ["adapter.ts.tpl", `${dir}/src/adapter.ts`],
  ["Card.tsx.tpl", `${dir}/src/Card.tsx`],
  ["adapter.test.ts.tpl", `${dir}/src/adapter.test.ts`],
];
if (existsSync(join(root, dir)) || existsSync(join(root, `api/${name}.ts`))) {
  console.error(`Exists: ${dir}/ or api/${name}.ts`);
  process.exit(1);
}
for (const [t, out] of targets) {
  mkdirSync(dirname(join(root, out)), { recursive: true });
  writeFileSync(join(root, out), tpl(t));
  console.log(`created ${out}`);
}
writeFileSync(join(root, `api/${name}.ts`), `export { POST, OPTIONS } from "../${dir}/server/endpoint.js";\n`);
// Same per-folder setup as the phases: own package.json + tsconfigs.
const json = (f, o) => writeFileSync(join(root, dir, f), JSON.stringify(o, null, 2) + "\n");
json("package.json", { name: `@kaambill/${dir}`, version: "0.0.0", private: true, type: "module", description: `Voice domain: ${name}`, dependencies: { zod: "^4.6.7", xstate: "^5.33.4", react: "^19.3.1" } });
const web = { noEmit: true, lib: ["ES2022", "DOM", "DOM.Iterable"], jsx: "react-jsx", types: ["node", "vite/client", "vite-plugin-pwa/client"] };
json("tsconfig.json", { extends: "../phase-0-setup/tsconfig.base.json", compilerOptions: web, include: ["src"] });
json("tsconfig.server.json", { extends: "../phase-0-setup/tsconfig.base.json", compilerOptions: { module: "NodeNext", moduleResolution: "NodeNext", lib: ["ES2022"], types: ["node"], noEmit: true }, include: ["server"] });
console.log(`created ${dir}/package.json, tsconfig.json, tsconfig.server.json (run npm install once)`);
writeFileSync(join(root, `${dir}/eval.seed.jsonl`), "");
console.log(`created api/${name}.ts, ${dir}/eval.seed.jsonl

Next (see phase-7-domain-sprint/scaffold/PLAYBOOK.md):
  1. edit the schema + prompt (H2–4)
  2. adapter: ONE question by priority, read-back ≤ 2 sentences
  3. in app/src/App.tsx swap createBillingAdapter → create${pascal}Adapter and the card
  4. npm test && npm run e2e`);
