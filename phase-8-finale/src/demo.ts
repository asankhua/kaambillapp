/** Demo mode for the finale stage: VITE_DEMO_MODE=true at build time, or `?demo=1` in the URL. */
export const isDemo = () =>
  import.meta.env?.VITE_DEMO_MODE === "true" ||
  (typeof location !== "undefined" && new URLSearchParams(location.search).get("demo") === "1");
