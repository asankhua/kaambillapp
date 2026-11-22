// ESLint looks for the config at the repo root (and in each folder, nearest first), so the rules
// live in Phase 0 under a name it does NOT auto-detect, and this file re-exports them.
export { default } from "./phase-0-setup/eslint.rules.js";
