function pick(pool) {
  return pool[Math.floor(Math.random() * pool.length)];
}
function firstName(name) {
  if (!name) return "";
  return String(name).trim().split(" ")[0];
}
export function getStoredUserName() {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    return u?.name || "";
  } catch {
    return "";
  }
}
const TRIGGER_PHRASES = {
  breakup: "Breakups are genuinely hard, even when people act like they shouldn't be.",
  lonely: "Loneliness is a real, heavy feeling - not something to brush off.",
  akela: "Loneliness is a real, heavy feeling - not something to brush off.",
  anxious: "That anxious, on-edge feeling is exhausting to carry all day.",
  anxiety: "That anxious, on-edge feeling is exhausting to carry all day.",
  panic: "Panic is scary in the moment - you got through it, and that counts.",
  exam: "Exam pressure has a way of making everything feel bigger than it is.",
  sleep: "Not sleeping well makes everything else so much harder to deal with.",
  "neend nahi": "Not sleeping well makes everything else so much harder to deal with.",
  tired: "Sounds like you're running on empty right now.",
  overwhelmed: "That overwhelmed, too-much-at-once feeling is real and valid.",
  stress: "That's a lot of pressure to be sitting with.",
  sad: "It's okay that today feels sad - that's allowed.",
};
function specificAcknowledgment(triggers = []) {
  const lower = (triggers || []).map((t) => String(t).toLowerCase());
  for (const key of Object.keys(TRIGGER_PHRASES)) {
    if (lower.some((t) => t.includes(key))) return TRIGGER_PHRASES[key];
  }
  return null;
}
const GREEN_BY_EMOTION = {
  happy: (n) => [
    `${n ? n + ", y" : "Y"}ou sound genuinely happy today - love that for you. Keep riding this.`,
    "This is a great headspace to be in. Whatever you're doing, it's working - keep going!",
    "Good energy, noted. You're doing great.",
  ],
  calm: (n) => [
    `Steady and calm, ${n || "friend"} - that's not nothing. That's a skill you're building.`,
    "This kind of quiet is hard-won. Nicely done.",
    "Calm like this is worth celebrating. Keep it up.",
  ],
  hopeful: (n) => [
     `${n ? n + ", th" : "Th"}at spark of hope is worth holding onto - keep going.`,
    "That's real hope in what you wrote. Hold onto it.",
    "Small steps forward still count as forward. You're doing it.",
  ],
  neutral: (n) => [
       `An even day${n ? ", " + n : ""} - nothing urgent, and that's perfectly fine. Keep checking in like this.`,
    "An ordinary day, logged and taken care of. Nice work showing up for yourself.",
    "Nothing urgent here - just keep doing what you're doing.",
  ],
  default: (n) => [
    `Nice and steady${n ? ", " + n : ""} - keep it up, let's go!`,
    "Showing up to write this down is already a win. Congrats on that.",
    "Steady as it goes. You're doing okay - genuinely.",
  ],
};
export function getGreenMessage(emotion, name) {
  const n = firstName(name || getStoredUserName());
  const key = (emotion || "default").toLowerCase();
  const gen = GREEN_BY_EMOTION[key] || GREEN_BY_EMOTION.default;
  return pick(gen(n));
}
export function getMotivationalMessage(emotion) {
  return getGreenMessage(emotion);
}
const YELLOW_MESSAGES = (n) => [
  `Sounds like today's a bit of a mixed one${n ? ", " + n : ""}. Nothing urgent, but worth being gentle with yourself.`,
  `A little heavier than usual today${n ? ", " + n : ""} - that's okay. Small self-care things can help: water, a short walk, a break from your screen.`,
  "Not your easiest day, and that's fine. Keep an eye on how you're doing, and be kind to yourself.",
];
export function getYellowMessage({ name, triggers, reasons } = {}) {
  const n = firstName(name || getStoredUserName());
  const base = pick(YELLOW_MESSAGES(n));
  const specific = specificAcknowledgment([...(triggers || []), ...(reasons || [])]);
  return specific ? `${specific} ${base}` : base;
}
const ORANGE_GENERAL = (n) => [
  `Sounds like you're carrying a lot right now${n ? ", " + n : ""}. That's real, and you don't have to sort it out alone - Tele-MANAS (14416) is free and available anytime.`,
  `It's okay to not be okay today${n ? ", " + n : ""}. If it'd help to talk it through with someone, Tele-MANAS: 14416 is there.`,
  "Things feel heavy right now, and that's worth taking seriously. Talking to someone - a friend, or Tele-MANAS at 14416 - can help more than it might seem.",
];
const ORANGE_HOME_ABUSE = (n) => [
  `What you described isn't okay${n ? ", " + n : ""}, and it's not your fault. You deserve to feel safe. Tele-MANAS (14416) or Kiran (1800-599-0019) can help you figure out next steps.`,
  "That sounds really hard to carry. Please know you don't have to handle this by yourself - reaching out to Tele-MANAS (14416) is a real option, anytime.",
];
const ORANGE_SCHOOL_ABUSE = (n) => [
  `It's painful when words from a teacher hurt like that${n ? ", " + n : ""}. One remark doesn't define your worth. A counselor you trust, or Tele-MANAS (14416), can be a good place to talk this through.`,
  "That kind of public put-down stays with you - it makes sense that it hurts. You're allowed to talk to someone you trust about it, or call Tele-MANAS: 14416.",
];
export function getOrangeMessage({ name, category, abuseType, triggers, reasons } = {}) {
  const n = firstName(name || getStoredUserName());
  let base;
  if (category === "school_emotional_abuse" || abuseType === "school_emotional_abuse") {
    base = pick(ORANGE_SCHOOL_ABUSE(n));
  } else if (category === "emotional_abuse" || abuseType === "home_abuse") {
    base = pick(ORANGE_HOME_ABUSE(n));
  } else {
    base = pick(ORANGE_GENERAL(n));
  }
  const specific = specificAcknowledgment([...(triggers || []), ...(reasons || [])]);
  return specific ? `${specific} ${base}` : base;
}
const RED_MESSAGES = (n) => [
  `${n ? n + ", t" : "T"}his sounds really heavy, and I don't want you to carry it alone right now. Please call Tele-MANAS: 14416 - it's free, confidential, and someone is there right now.`,
  `What you wrote matters, and so do you${n ? ", " + n : ""}. Please reach out right now - Tele-MANAS: 14416, or Kiran: 1800-599-0019. You don't have to do this by yourself.`,
  "This is serious, and it's okay to need help with it. Call Tele-MANAS: 14416 right now, or stay with someone you trust until you can.",
];
export function getRedMessage({ name } = {}) {
  const n = firstName(name || getStoredUserName());
  return pick(RED_MESSAGES(n));
}
