---
name: Bharat Trades Kinetic
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daef'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e9edff'
  surface-container-high: '#e1e8fd'
  surface-container-highest: '#dce2f7'
  on-surface: '#141b2b'
  on-surface-variant: '#3f4941'
  inverse-surface: '#293040'
  inverse-on-surface: '#edf0ff'
  outline: '#6f7a71'
  outline-variant: '#becabf'
  surface-tint: '#006d41'
  primary: '#005f39'
  on-primary: '#ffffff'
  primary-container: '#0b7a4b'
  on-primary-container: '#a5ffc7'
  inverse-primary: '#7bdaa2'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#754900'
  on-tertiary: '#ffffff'
  tertiary-container: '#965e00'
  on-tertiary-container: '#ffe8d1'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#97f6bc'
  primary-fixed-dim: '#7bdaa2'
  on-primary-fixed: '#002110'
  on-primary-fixed-variant: '#005230'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f9f9ff'
  on-background: '#141b2b'
  surface-variant: '#dce2f7'
typography:
  headline-xl:
    fontFamily: Noto Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Noto Sans
    fontSize: 34px
    fontWeight: '700'
    lineHeight: 42px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Noto Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Noto Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
  headline-md:
    fontFamily: Noto Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
  title-lg:
    fontFamily: Noto Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Noto Sans
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 26px
  body-md:
    fontFamily: Noto Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-lg:
    fontFamily: Noto Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  label-md:
    fontFamily: Noto Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  caption:
    fontFamily: Noto Sans
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system targets blue-collar Indian skilled technicians (electricians, plumbers, carpenters, AC mechanics) operating in demanding, high-glare, dusty field environments. The interface prioritizes extreme clarity, physical confidence, and transactional transparency to foster immediate trust in financial exchanges.

The visual style blends modern Indian fintech reliability with high-utility tactile ergonomics:
- **High-Visibility Pragmatism:** Large hit targets, legible weight distributions, and crisp contrasting boundaries that resist outdoor direct sunlight.
- **Physical Reassurance:** Tangible, card-based surfaces paired with distinct outlines rather than subtle blurs or low-contrast washes.
- **Voice-First Accessibility:** Prominent acoustic triggers tailored for one-handed operation while holding tools or balancing materials.
- **Respectful & Friendly Tone:** Professional, clutter-free layouts that treat trade work as serious business while remaining intuitive and forgiving.

## Colors

The palette is engineered for severe outdoor legibility and intuitive status communication:

- **Primary (`#0B7A4B`):** Deep verdant green communicating financial security, settled balances, and business legitimacy. Paired with soft tint `#E7F5EE` for badge fills, active container highlights, and selected states.
- **Secondary (`#2563EB`):** High-energy cobalt blue reserved strictly for voice input modes, real-time speech transcription surfaces, and audio playback indicators.
- **Tertiary (`#F59E0B`):** Deep amber for pending payments, overdue invoice reminders, and credit warnings, backed by tint `#FFF4DB`.
- **Error (`#DC2626`):** Immediate, punchy crimson for unpaid debts, deletion warnings, and input failures.
- **Canvas & Surfaces:**
  - Base canvas: `#FAFAF7` (warm off-white to cut glare under outdoor sunlight).
  - Raised cards & sheets: `#FFFFFF` (crisp white for clear figure-ground separation).
  - Borders & Outlines: `#E5E7EB` (subtle framing) and `#D1D5DB` (structural boundaries).
- **Text & Content Hierarchy:**
  - Dominant figures & titles: `#111827` (near-black, exceeding 12:1 contrast against white).
  - Secondary labels & helper notes: `#4B5563` (meets WCAG AAA criteria for readability).

## Typography

Noto Sans serves as the universal type engine across all viewports to provide native support for Indian regional scripts and consistent letterforms across various Android builds:

- **Monetary & Numerical Dominance:** All numerical balances, payment dues, and invoice summaries mandate tabular figures (`tnum`) with weights of `600` or `700`. Large money figures use sizes between 32px and 40px to ensure instant glanceability from arm's length.
- **Base Reading Comfort:** Default body text is set to 18px (`body-lg`) with a baseline weight of `500` to prevent thin strokes from washing out under midday sunlight or through dusty screens.
- **Labels with Visual Anchors:** All functional UI labels default to 16px bold (`label-lg`) and must accompany standard outlined pictograms for multi-lingual and varying-literacy comprehension.

## Layout & Spacing

The layout model emphasizes single-column, thumb-driven interaction built for handheld Android devices:

- **Grid & Safe Regions:** 
  - Mobile layouts utilize a 4-column fluid structure with `margin` at `1rem` (16px) and `gutter` at `1rem` (16px).
  - Tablet/Desktop expansions conform to a centered 8-to-12 column max-width frame (640px for single workflows, 960px for ledger tables) with gutters widening to `1.5rem`.
- **Thumb Zone Priority:** Key transactional triggers, primary actions, and voice transcription inputs sit within the bottom 35% of the mobile viewport.
- **Clear Separation:** Components must use explicit gaps (`space-md` to `space-lg`) to prevent mis-taps when wearing trade gloves or handling wet/chalky hands.

## Elevation & Depth

Visual hierarchy uses crisp boundaries combined with shallow, clean shadows to ensure edges remain sharp under intense outdoor lighting:

- **Flat Outlined Surfaces (Base):** Standard cards rely on a 1px solid border (`#E5E7EB`) set over the `#FFFFFF` container. This eliminates muddy contrast artifacts common to subtle ambient blur effects.
- **Tonal Elevation:**
  - `Surface 0 (Canvas)`: `#FAFAF7` with zero elevation.
  - `Surface 1 (Card)`: `#FFFFFF`, 1px outline in `#E5E7EB`, optional shadow: `0 1px 3px rgba(17, 24, 39, 0.08)`.
  - `Surface 2 (Floating Toolbar / Bottom Dock)`: `#FFFFFF`, top border `1px solid #E5E7EB`, shadow: `0 -4px 12px rgba(17, 24, 39, 0.06)`.
  - `Surface 3 (Voice Action Button)`: Elevated circular hub with concentrated contrast shadow: `0 8px 20px rgba(37, 99, 235, 0.28)`.
- **Direct Sunlight Resilience:** Neomorphic indents and glassmorphism blurs are strictly prohibited; all state transitions rely on stark color fills, thicker borders, and deliberate high-contrast outlines.

## Shapes

The design system adopts a consistent 16px structural radius across core UI blocks (`roundedness: 2` scale):

- **Standard Containers (`rounded-lg`, 1rem / 16px):** Action cards, balance summaries, text fields, item line cards, and bottom sheet dialogs.
- **Interactive Controls (0.75rem to 1rem):** Primary buttons, quick filter chips, and alert boxes adopt full 12px–16px radiuses to create soft, inviting tap targets.
- **Full Circular Radius (Pill / Round):** Used exclusively for tag status indicators, numeric increment badges, and the 88px primary voice microphone module.

## Components

- **Voice/Mic Trigger Button:**
  - Fixed centrally within the bottom navigation band with an 88x88px circular footprint.
  - `#2563EB` solid fill, containing a 36px white outlined microphone glyph.
  - When actively listening, the button pulses with an animated ring using `#2563EB` at 20% opacity expanding to 112px.
- **Buttons:**
  - Minimum tap height: 52px (strictly exceeding the 48px baseline standard).
  - Primary: Background `#0B7A4B`, text `#FFFFFF`, font weight 600 at 18px.
  - Secondary/Ghost: 2px solid border `#0B7A4B`, background transparent, text `#0B7A4B`.
  - Tap states require immediate tactile contrast (scale down to 0.98, dark shift to `#085C38`).
- **Cards (Client, Bill, and Work Order):**
  - Background `#FFFFFF`, border-radius 16px, 1px solid `#E5E7EB`.
  - Padding: 16px vertical, 16px horizontal.
  - Large currency figures pinned to the top right in `#111827`, using tabular figures (`headline-lg-mobile`).
- **Input Fields:**
  - Minimum height: 56px.
  - Border: 2px solid `#D1D5DB`, radius 16px, background `#FFFFFF`. Focus state shifts border to 2px `#0B7A4B`.
  - Floating labels always set to `label-lg` (16px) with an accompanying functional icon (phone, rupee symbol, user silhouette).
- **Chips & Quick Filters:**
  - Minimum height: 44px.
  - Unselected: Surface `#FFFFFF`, border 1px solid `#D1D5DB`, text `#4B5563`.
  - Selected: Surface `#E7F5EE`, border 2px solid `#0B7A4B`, text `#0B7A4B`, font weight 600.
- **Checkboxes & Radios:**
  - Minimum touch target 48x48px with physical check boundary 24x24px.
  - Active check fill: `#0B7A4B` with bold white inner checkmark.
- **Bill Item List Rows:**
  - High-density visual hierarchy: Left-aligned material/labor title (18px weight 600), below it quantity/rate chip (14px neutral), right-aligned calculated total (20px bold tabular).
  - Tap targets include dedicated plus/minus stepper targets sizing at 48x48px each.