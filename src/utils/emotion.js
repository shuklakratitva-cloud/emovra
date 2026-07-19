// src/utils/emotion.js
export function detectEmotion(text) 
import { EMOTION_KEYWORDS } from "../data/keywords";
import { normalizeText, countMatches } from "./helpers";

/**
 * Detects the dominant emotion from text.
 * Prioritizes higher severity emotions on ties.
 */
const EMOTION_PRIORITY = ["hopeless", "fear", "anxious", "overwhelmed", "lonely", "sad", "angry", "happy"];

export function detectEmotion(text = "") {
  const normalized = normalizeText(text);

  let detectedEmotion = "neutral";
  let highestScore = 0;
  const emotionScores = {};

  for (const emotion in EMOTION_KEYWORDS) {
    const score = countMatches(normalized, EMOTION_KEYWORDS[emotion]);
    emotionScores[emotion] = score;
    if (score > highestScore) {
      highestScore = score;
      detectedEmotion = emotion;
    } else if (score === highestScore && score > 0) {
      // Tie-breaker: use priority list
      const currentPriority = EMOTION_PRIORITY.indexOf(detectedEmotion);
      const newPriority = EMOTION_PRIORITY.indexOf(emotion);
      if (newPriority !== -1 && (currentPriority === -1 || newPriority < currentPriority)) {
        detectedEmotion = emotion;
      }
    }
  }

  return {
    emotion: highestScore > 0 ? detectedEmotion : "neutral",
    confidence: highestScore,
    scores: emotionScores
  };
}

/**
 * Returns true if an emotion was detected.
 */
export function hasEmotion(text = "") {
  return detectEmotion(text).emotion !== "neutral";
}

/**
 * Returns the emotion score object.
 */
export function getEmotionScores(text = "") {
  return detectEmotion(text).scores;
}

/**
 * Returns the confidence score.
 */
export function getEmotionConfidence(text = "") {
  return detectEmotion(text).confidence;
}

/**
 * Returns an emoji for the detected emotion.
 */
export function getEmotionEmoji(emotion = "neutral") {
  switch (emotion.toLowerCase()) {
    case "happy":
      return "😊";

    case "sad":
      return "😢";

    case "angry":
      return "😠";

    case "anxious":
      return "😰";

    case "fear":
      return "😨";

    case "lonely":
      return "🥺";

    case "hopeless":
      return "💔";

    case "overwhelmed":
      return "😞";

    default:
      return "😐";
  }
}

/**
 * Returns a user-friendly label.
 */
export function getEmotionLabel(emotion = "neutral") {
  switch (emotion.toLowerCase()) {
    case "happy":
      return "Happy";

    case "sad":
      return "Sad";

    case "angry":
      return "Angry";

    case "anxious":
      return "Anxious";

    case "fear":
      return "Fear";

    case "lonely":
      return "Lonely";

    case "hopeless":
      return "Hopeless";

    case "overwhelmed":
      return "Overwhelmed";

    default:
      return "Neutral";
  }
}
export default detectEmotion;