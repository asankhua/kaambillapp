/**
 * Icon font subset. Google's full Material Symbols font is ~1.1 MB (it slowed the first screen to
 * 9 s on a slow phone). We ask Google Fonts for only the icons the app uses (`icon_names=`, ~27 KB).
 *
 *   npm run icons          → rewrite the icon <link> in app/app/index.html from the source code
 *   (the unit test icons.test.ts fails if a new icon is used but missing from the link)
 *
 * Icon names are found as string literals in app/src and phase-* /src that are valid Material Symbols
 * names (list in ../icons/material-symbols-names.txt: every name in fonts.google.com/metadata/icons;
 * Google silently drops unknown names from a subset, so `npm run icons` also render-checks each one).
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const valid = new Set(readFileSync(join(root, "phase-1-ui-ux-design/icons/material-symbols-names.txt"), "utf8").split("\n").filter(Boolean));

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(f) && !/\.(test|spec)\./.test(f)) out.push(p);
  }
  return out;
}

/** Sorted icon names used anywhere in the app's browser code. */
function sourceFiles() {
  const dirs = ["app/src", ...readdirSync(root).filter((d) => /^(phase-\d|domain-)/.test(d)).map((d) => `${d}/src`)];
  const files = [];
  for (const d of dirs) {
    try { files.push(...walk(join(root, d))); } catch { /* phase without src/ */ }
  }
  return files;
}

export function usedIconNames() {
  const used = new Set();
  for (const f of sourceFiles()) for (const [, m] of readFileSync(f, "utf8").matchAll(/"([a-z][a-z0-9_]*)"/g)) if (valid.has(m)) used.add(m);
  return [...used].sort();
}

export const iconFontUrl = (names) =>
  `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&icon_names=${names.join(",")}&display=block`;

// Whitespace-tolerant: Prettier (pre-commit) wraps the <link> attributes onto separate lines.
export const ICON_LINK_RE = /<link\s+href="https:\/\/fonts\.googleapis\.com\/css2\?family=Material\+Symbols\+Outlined[^"]*"\s+rel="stylesheet"\s*\/>/;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = join(root, "app/app/index.html");
  const html = readFileSync(file, "utf8");
  if (!ICON_LINK_RE.test(html)) throw new Error("Icon <link> not found in app/app/index.html");
  const names = usedIconNames();
  writeFileSync(file, html.replace(ICON_LINK_RE, `<link href="${iconFontUrl(names)}" rel="stylesheet" />`));
  console.log(`app/app/index.html: icon font subset with ${names.length} icons`);

  // Verify with a real browser: every icon must render as ONE glyph (1em wide). A name Google
  // doesn't know is silently dropped from the subset and would show as a word.
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ channel: "chromium" });
  const page = await browser.newPage();
  await page.setContent(`<link rel="stylesheet" href="${iconFontUrl(names)}">` + names.map((n) => `<span class="material-symbols-outlined" style="font-size:24px" data-n="${n}">${n}</span><br>`).join(""));
  await page.waitForTimeout(3000);
  const widths = await page.$$eval("span", (els) => els.map((e) => [e.dataset.n, Math.round(e.getBoundingClientRect().width)]));
  await browser.close();
  const broken = widths.filter(([, w]) => w > 30).map(([n]) => n);
  // The scan also picks up ordinary words that happen to be icon names ("discount" as a field):
  // only fail for names used in an icon position.
  const src = sourceFiles().map((f) => readFileSync(f, "utf8")).join("\n");
  const asIcon = (n) => new RegExp(`(name=\\{?[^\\n}]*"${n}"|icon:\\s*"${n}"|ICON[A-Z_]*[^\\n]*"${n}")`).test(src);
  const realBroken = broken.filter(asIcon);
  if (broken.length > realBroken.length) console.log(`not icons (ignored): ${broken.filter((n) => !asIcon(n)).join(", ")}`);
  if (realBroken.length) {
    console.error(`These icons don't exist in Material Symbols and would render as text: ${realBroken.join(", ")}`);
    process.exitCode = 1;
  } else console.log(`verified: every icon used renders as a glyph`);
}
