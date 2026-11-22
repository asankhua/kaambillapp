# Lighthouse (mobile), Phase 6

- Run: 2026-11-21 · Lighthouse 12.8.2 · mobile form factor (simulated slow 4G + 4× CPU) · built app on `vite preview`
- Saved report (URL `/?demo=1`, the demo screen): [`lighthouse.report.html`](./lighthouse.report.html) · [`lighthouse.report.json`](./lighthouse.report.json)
- Chrome: run with `CHROME_PATH` set to Playwright's Chromium (the system headless Chrome closed the connection mid-run)

| Category       | `/?demo=1` | `/`     | Target (phase-6 README) |
| -------------- | ---------- | ------- | ----------------------- |
| Performance    | **97**     | **97**  | ≥ 80 ✅                 |
| Accessibility  | **100**    | **100** | —                       |
| Best practices | **100**    | **100** | —                       |
| SEO            | 83         | 82      | — (not a target)        |

| Metric                   | `/?demo=1` |
| ------------------------ | ---------- |
| first contentful paint   | 2.1 s      |
| largest contentful paint | 2.3 s      |
| total blocking time      | 60 ms      |
| cumulative layout shift  | 0          |
| speed index              | 2.1 s      |

## After the Stitch rebuild (17:40)

The rebuilt Home made the toolbox illustration the LCP element, and performance fell to **73 (LCP 9.2 s)**. Cause: **Google's Material Symbols font was 1.1 MB** (every icon, every weight). Fix: `npm run icons` writes an `icon_names=` subset of the 113 icons the code uses at one weight → **27 KB**. A unit test (`phase-1-ui-ux-design/src/icons.test.ts`) fails if a new icon is used but missing from the subset. Onboarding accessibility fell to 95 (grey `text-outline` captions); they now use `text-on-surface-variant`.

## ⚠️ Correction: earlier scores were measured on an unstyled build

After the code moved into phase folders, `phase-1-ui-ux-design/src/theme.css` used `@source "../../phase-*/src"`. Tailwind matched nothing with that glob, so **no theme classes from the phase folders were compiled** (CSS 10 KB instead of 29 KB). Every e2e test still passed because they check roles and text, not styling. The earlier "97" in this file was measured on that unstyled page.

Fixes:

1. `@source "../../phase-*/src/**/*.{ts,tsx}"` (explicit file glob). The e2e "home renders" test now checks computed theme colours, and fails on the old glob.
2. On the styled build, `/?demo=1` scored **74 (LCP 8.8 s)**: the LCP text repainted when Noto Sans arrived late. The text fonts now use `display=optional` (used only if ready within ~100 ms, cached after the first visit; Android's system font is Noto anyway), so text never repaints late.

## Earlier fixes (first run: performance 72, LCP 9.4 s)

1. **Zod out of the browser:** `Home.tsx` imports `DEMO` from the types-only entry `@kaambill/shared/types`.
2. **Lazy screens:** `SharePreview` (QR + PDF code), `History` and `RateCardScreen` load on demand (`React.lazy` in `app/src/App.tsx`).
3. **Main bundle went from 510 KB to 376 KB** (118 KB gzipped).
4. **Non-blocking text fonts** (`media="print" onload`); the icon font stays blocking so icons never flash as text.
5. **Service-worker register script deferred** (`injectRegister: "script-defer"`).
