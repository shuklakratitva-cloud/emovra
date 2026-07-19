import { cleanText } from './cleanText.js';

export function detectEmotion(text = "") {
  // STEP 2: clean grammar/typos BEFORE checking - fixes "iam anxius" -> "i am anxious"
  const cleaned = cleanText(text || "");
  const lower = String(cleaned || "").toLowerCase();
  
  if (!lower.trim()) return "neutral";
  
  // ✅ NEW: Check critical phrases FIRST
  if (lower.includes("dont want to die") || lower.includes("do not want to die") || lower.includes("don't want to die")) return "hopeful";
  if (lower.includes("want to die") || lower.includes("kill myself") || lower.includes("end my life") || lower.includes("suicidal")) return "despair";

  if (lower.includes("happy") || lower.includes("joy") || lower.includes("excited") || lower.includes("great") || lower.includes("good")) return "happy";
  
  // ✅ UPDATED: Added depressed, hopeless for better coverage
  if (lower.includes("sad") || lower.includes("lonely") || lower.includes("cry") || lower.includes("down") || lower.includes("depressed") || lower.includes("hopeless") || lower.includes("worthless")) return "sad";
  
  // ✅ UPDATED: Added anxiety keyword
  if (lower.includes("anxious") || lower.includes("anxiety") || lower.includes("worried") || lower.includes("panic") || lower.includes("nervous")) return "anxious";
  
  if (lower.includes("angry") || lower.includes("hate") || lower.includes("mad") || lower.includes("frustrated")) return "angry";
  
  // ✅ UPDATED: Added stressed, exhausted
  if (lower.includes("overwhelmed") || lower.includes("stressed") || lower.includes("exhausted") || lower.includes("tired")) return "overwhelmed";
  
  // ✅ UPDATED: Added alone, isolated
  if (lower.includes("alone") || lower.includes("isolated")) return "lonely";
  
  return "neutral";
}

export default detectEmotion;