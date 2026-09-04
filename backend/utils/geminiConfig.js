// Single source of truth for which Gemini model the risk-analysis
// endpoints call. Previously each route (analyze.js, the old emotion.js,
// gemini.js) redefined its own copy of this string - harmless as long as
// they never drifted apart, but a real footgun the moment someone updates
// one call site's model and not the others.
export const GEMINI_MODEL = "gemini-3.5-flash-lite";
