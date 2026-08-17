// src/data/counselingKB.js - Public coping strategies, not private data
export const counselingKB = [
  {
    id: 1,
    emotion: "anxious",
    keywords: ["anxious", "worry", "panic", "nervous", "overthinking"],
    technique: "Box Breathing + Grounding",
    advice: "From NIMHANS anxiety toolkit: Try 4-4-4-4 breathing. Inhale 4s, hold 4s, exhale 4s, hold 4s. Repeat 4 times. Then name 5 things you see, 4 you touch, 3 you hear. This resets your nervous system.",
    source: "NIMHANS Wellness Guide",
    steps: ["Sit comfortably", "Breathe in 4 sec", "Hold 4 sec", "Breathe out 4 sec", "Repeat"]
  },
  {
    id: 2,
    emotion: "sad",
    keywords: ["sad", "lonely", "down", "cry", "empty"],
    technique: "Behavioral Activation",
    advice: "WHO low mood guide suggests: Don't wait to feel better to act. Do 1 small pleasant activity for 10 mins - walk, music, message a friend. Action creates motivation, not the other way.",
    source: "WHO Mental Health Action",
    steps: ["Pick 1 tiny task", "Set 10-min timer", "Do it without judging", "Note how you feel after"]
  },
  {
    id: 3,
    emotion: "stressed",
    keywords: ["stressed", "stress", "overwhelmed", "pressure", "exhausted", "tired"],
    technique: "Stress Container",
    advice: "Based on Tele-MANAS counseling framework: Imagine stress as water filling a container. Identify 3 taps filling it (work, sleep, thoughts) and 3 drains (walk, talk, water). Close one tap, open one drain today.",
    source: "Tele-MANAS Counselor Manual",
    steps: ["List 3 stressors", "List 3 relievers", "Reduce 1 stressor by 10%", "Increase 1 reliever"]
  },
  {
    id: 4,
    emotion: "angry",
    keywords: ["angry", "irritated", "frustrated", "mad"],
    technique: "TIPP Skill",
    advice: "From DBT Skills: When angry, change body temperature. Splash cold water, hold cold bottle. Then intense exercise 2 mins, then paced breathing.",
    source: "DBT Skills Training",
    steps: ["Cold water on face 30s", "Fast walk/jumping jacks", "Slow breathing"]
  }
  // Add 20-30 more from public sources
];