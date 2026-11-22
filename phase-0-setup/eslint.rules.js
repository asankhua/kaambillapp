import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

/** Phase folders in build order. A phase may import earlier phases, never later ones (only app/ wires all). */
const PHASES = [
  "phase-0-setup", "phase-1-ui-ux-design", "phase-2-voice-core", "phase-3-understanding", "phase-4-billing-domain",
  "phase-5-output-share", "phase-6-quality-demo", "phase-7-domain-sprint", "phase-8-finale",
];

const boundaries = PHASES.map((phase, i) => ({
  files: [`${phase}/src/**/*.{ts,tsx}`, `${phase}/server/**/*.ts`],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          ...PHASES.slice(i + 1).map((later) => ({
            group: [`**/${later}/**`],
            message: `${phase} must not import ${later}: earlier phases never depend on later ones (wire it in app/).`,
          })),
          { group: ["**/app/src/**"], message: "Phases must not import the app shell." },
        ],
      },
    ],
  },
}));

export default tseslint.config(
  { ignores: ["**/dist/**", "**/node_modules/**", "phase-1-ui-ux-design/design/**", "phase-7-domain-sprint/scaffold/templates/**", "test-results/**", "playwright-report/**", "**/*.tsbuildinfo"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", destructuredArrayIgnorePattern: "^_" }],
    },
  },
  {
    files: ["app/src/**/*.{ts,tsx}", "phase-*/src/**/*.{ts,tsx}", "domain-*/src/**/*.{ts,tsx}"],
    languageOptions: { globals: globals.browser },
    plugins: { "react-hooks": reactHooks },
    rules: { ...reactHooks.configs.recommended.rules },
  },
  {
    files: ["api/**/*.ts", "phase-*/server/**/*.ts", "domain-*/server/**/*.ts", "phase-*/scripts/**/*.ts", "phase-*/scripts/**/*.mjs", "phase-*/eval/**/*.ts", "phase-*/e2e/**/*.ts", "phase-0-setup/testing/**/*.ts", "phase-*/scaffold/**/*.mjs", "*.config.{js,ts}", "phase-*/*.config.{js,ts}", "phase-0-setup/eslint.rules.js", "app/vite.config.ts"],
    languageOptions: { globals: globals.node },
  },
  ...boundaries,
);
