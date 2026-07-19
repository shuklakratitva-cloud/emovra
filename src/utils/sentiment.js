// src/utils/sentiment.js

import {
  POSITIVE_WORDS,
  NEGATIVE_WORDS,
} from "../data/keywords";

import {
  normalizeText,
  countMatches,
  clamp,
} from "./helpers";

/**
 * Detects overall sentiment from text.
 *
 * Returns:
 * {
 *   sentiment: "positive",
 *   score: 78,
 *   positiveCount: 5,
 *   negativeCount: 1
 * }
 */

export function detectSentiment(text = "") {
  const normalized = normalizeText(text);

  const positiveCount = countMatches(
    normalized,
    POSITIVE_WORDS
  );

  const negativeCount = countMatches(
    normalized,
    NEGATIVE_WORDS
  );

  let sentiment = "neutral";

  if (positiveCount > negativeCount) {
    sentiment = "positive";
  } else if (negativeCount > positiveCount) {
    sentiment = "negative";
  }

  let score = 50;

  if (positiveCount || negativeCount) {
    score =
      50 +
      (positiveCount - negativeCount) * 10;
  }

  score = clamp(score, 0, 100);

  return {
    sentiment,
    score,
    positiveCount,
    negativeCount,
  };
}

/**
 * Returns only the sentiment label.
 */

export function getSentiment(text = "") {
  return detectSentiment(text).sentiment;
}

/**
 * Returns sentiment score.
 */

export function getSentimentScore(text = "") {
  return detectSentiment(text).score;
}

/**
 * Returns true if sentiment is positive.
 */

export function isPositive(text = "") {
  return getSentiment(text) === "positive";
}

/**
 * Returns true if sentiment is negative.
 */

export function isNegative(text = "") {
  return getSentiment(text) === "negative";
}

/**
 * Returns a sentiment emoji.
 */

export function getSentimentEmoji(sentiment) {
  switch (sentiment) {
    case "positive":
      return "😊";

    case "negative":
      return "😔";

    default:
      return "😐";
  }
}

/**
 * Returns a color for UI.
 */

export function getSentimentColor(sentiment) {
  switch (sentiment) {
    case "positive":
      return "#22c55e"; // Green

    case "negative":
      return "#ef4444"; // Red

    default:
      return "#facc15"; // Yellow
  }
}

export { detectSentiment as analyzeSentiment };