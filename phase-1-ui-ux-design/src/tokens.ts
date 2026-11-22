/**
 * Design tokens for logic that needs values in TS (canvas waveform, thresholds, sizes).
 * Colours/type for styling live in src/index.css (@theme, generated from the Stitch export).
 * Source: design/bharat_trades_kinetic/DESIGN.md · architecture.md §7.5.
 */
export const tokens = {
  color: {
    primary: "#005F39",
    primaryContainer: "#0B7A4B", // brand, money, primary buttons, idle mic
    primaryTint: "#E7F5EE",
    canvas: "#FAFAF7",
    card: "#FFFFFF",
    border: "#E5E7EB",
    borderStrong: "#D1D5DB",
    text: "#141B2B",
    textMuted: "#3F4941",
    listening: "#2563EB", // blue = listening ONLY
    amber: "#F59E0B", // "needs attention" ONLY (low confidence / unpaid)
    amberTint: "#FFF4DB",
    danger: "#BA1A1A", // errors ONLY
  },
  touch: { min: 48, button: 52, input: 56, chip: 44, mic: 88, micPulse: 112 },
  radius: { card: 16, chip: 12, pill: 9999 },
} as const;

/** Confidence thresholds (architecture.md §5.5), overridable via VITE_CONF_* */
export const confidence = {
  high: Number(import.meta.env.VITE_CONF_HIGH ?? 0.85),
  low: Number(import.meta.env.VITE_CONF_LOW ?? 0.6),
} as const;
