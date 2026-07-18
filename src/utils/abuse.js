// src/utils/abuse.js

import { ABUSE_PATTERNS } from "../data/keywords";
import {
  normalizeText,
  containsPhrase,
  getMatches,
} from "./helpers";

/**
 * Detects emotional abuse or bullying.
 *
 * Returns:
 * {
 *   abuseDetected: true,
 *   matches: [...],
 *   severity: "high"
 * }
 */

export function detectAbuse(text = "") {
  const normalized = normalizeText(text);

  const abuseDetected = containsPhrase(
    normalized,
    ABUSE_PATTERNS
  );

  const matches = getMatches(
    normalized,
    ABUSE_PATTERNS
  );

  let severity = "none";

  if (matches.length >= 3) {
    severity = "high";
  } else if (matches.length >= 2) {
    severity = "medium";
  } else if (matches.length === 1) {
    severity = "low";
  }

  return {
    abuseDetected,
    severity,
    matches,
    count: matches.length,
  };
}

/**
 * Returns true if bullying/emotional abuse is detected.
 */

export function detectBullying(text = "") {
  return detectAbuse(text).abuseDetected;
}

/**
 * Returns all matched abuse phrases.
 */

export function getAbuseMatches(text = "") {
  return detectAbuse(text).matches;
}

/**
 * Returns abuse severity.
 */

export function getAbuseSeverity(text = "") {
  return detectAbuse(text).severity;
}

/**
 * Returns abuse score (0–100).
 */

export function getAbuseScore(text = "") {
  const { count } = detectAbuse(text);

  if (count === 0) return 0;
  if (count === 1) return 40;
  if (count === 2) return 70;

  return 100;
}

/**
 * Returns warning message for UI.
 */

export function getAbuseMessage(severity) {
  switch (severity) {
    case "high":
      return "Serious emotional abuse or bullying detected.";

    case "medium":
      return "Signs of emotional abuse were detected.";

    case "low":
      return "Possible bullying or emotional abuse detected.";

    default:
      return "No abuse detected.";
  }
}

/**
 * Returns color for UI.
 */

export function getAbuseColor(severity) {
  switch (severity) {
    case "high":
      return "#dc2626"; // Red

    case "medium":
      return "#f97316"; // Orange

    case "low":
      return "#facc15"; // Yellow

    default:
      return "#22c55e"; // Green
  }
}

/**
 * Returns icon/emoji for UI.
 */

export function getAbuseEmoji(severity) {
  switch (severity) {
    case "high":
      return "🚨";

    case "medium":
      return "⚠️";

    case "low":
      return "🟠";

    default:
      return "✅";
  }
}