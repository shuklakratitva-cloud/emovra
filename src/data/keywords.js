// src/data/keywords.js
export const SAFE_NEGATIONS = [
  "dont want to die","do not want to die","don't want to die",
  "dont wanna die","never want to die",
  "dont want to end my life","do not want to end my life",
  "dont want to kill myself","do not want to kill myself"
];

export const VIOLENCE_PHRASES = [
  "kill him","kill her","kill them","kill someone",
  "want to kill","wanna kill","gonna kill","will kill",
  "murder him","murder her","beat him to death","stab him","shoot him",
  "i will kill","i want to kill",
  "mar dalunga","mar dalungi","jaan se mar","khoon kar",
  "कत्ल","मार डालूंगा","मार डालूंगी"
];

export const SUICIDE_PHRASES = [
  "kill myself","want to die","end my life","suicide",
  "no reason to live","better off dead","can't go on","cant go on",
  "i give up","i want to disappear","dont want to live","don't want to live",
  "wish i was dead","mar jana","jeena nahi","marna chahta hu","sab khatam",
  "मर जाना","जीना नहीं","मरना चाहता हूँ","जिंदगी खत्म"
];

export const ABUSE_PATTERNS = [
  "teacher insults me","teacher shouted","teacher humiliates",
  "everyone laughs at me","parents hit me","parents abuse me",
  "bullied","bullying","body shaming","threatened","beizzati"
];

// NEW: Weighted for slightest stress
export const POSITIVE_WORDS = ["happy","good","better","calm","fine","hopeful","grateful","peaceful","safe","relaxed","strong","joy","love","motivated"];

export const NEGATIVE_WORDS = {
  high: ["hopeless","worthless","useless","disappear","die","kill","burden","no reason","better off dead","end my life"],
  medium: ["sad","cry","alone","hurt","panic","fear","anxious","depressed","lonely","failure","broken","overwhelmed","exhausted","burnout","insomnia","can't sleep","cant sleep"],
  low: ["stressed","stress","tired","worried","worry","overthinking","irritated","frustrated","angry","upset","low","down","pressure","nervous","uneasy","bored","headache","tension"] // <- 1 point each, catches slightest stress
};

export const EMOTION_KEYWORDS = {
  happy: ["happy","joy","great","awesome","smile","excited","good"],
  sad: ["sad","cry","crying","upset","depressed","down","low"],
  angry: ["angry","mad","furious","annoyed","hate","frustrated","irritated"],
  anxious: ["anxious","stress","stressed","panic","nervous","worried","overthinking","uneasy"],
  lonely: ["alone","lonely","isolated","ignored"],
  hopeless: ["hopeless","worthless","useless","give up","no point"],
  overwhelmed: ["overwhelmed","too much","can't cope","cant cope","exhausted","burnout"]
};

export const RISK_LEVELS = { GREEN: "GREEN", YELLOW: "YELLOW", ORANGE: "ORANGE", RED: "RED" };