// src/data/counselingKB.js - Public coping strategies, not private data
export const counselingKB = [
  {
    id: 1,
    emotion: "anxious",
    keywords: ["anxious", "worry", "panic", "nervous", "overthinking"],
    technique: "Box Breathing + Grounding",
    technique_hi: "बॉक्स ब्रीदिंग + ग्राउंडिंग",
    advice: "From NIMHANS anxiety toolkit: Try 4-4-4-4 breathing. Inhale 4s, hold 4s, exhale 4s, hold 4s. Repeat 4 times. Then name 5 things you see, 4 you touch, 3 you hear. This resets your nervous system.",
    advice_hi: "NIMHANS एंग्जायटी टूलकिट से: 4-4-4-4 ब्रीदिंग आज़माएं। 4 सेकंड साँस अंदर लें, 4 सेकंड रोकें, 4 सेकंड साँस छोड़ें, 4 सेकंड रोकें। इसे 4 बार दोहराएं। फिर 5 चीज़ें बताएं जो आप देखते हैं, 4 जिन्हें छूते हैं, 3 जो सुनते हैं। इससे आपका नर्वस सिस्टम शांत होता है।",
    source: "NIMHANS Wellness Guide",
    steps: ["Sit comfortably", "Breathe in 4 sec", "Hold 4 sec", "Breathe out 4 sec", "Repeat"],
    steps_hi: ["आराम से बैठें", "4 सेकंड साँस अंदर लें", "4 सेकंड रोकें", "4 सेकंड साँस छोड़ें", "दोहराएं"]
  },
  {
    id: 2,
    emotion: "sad",
    keywords: ["sad", "lonely", "down", "cry", "empty"],
    technique: "Behavioral Activation",
    technique_hi: "बिहेवियरल एक्टिवेशन",
    advice: "WHO low mood guide suggests: Don't wait to feel better to act. Do 1 small pleasant activity for 10 mins - walk, music, message a friend. Action creates motivation, not the other way.",
    advice_hi: "WHO की लो-मूड गाइड के अनुसार: बेहतर महसूस करने का इंतज़ार किए बिना कुछ करें। 10 मिनट के लिए कोई एक छोटी सुखद गतिविधि करें - टहलना, संगीत सुनना, किसी दोस्त को मैसेज करना। एक्शन से मोटिवेशन बनता है, उल्टा नहीं।",
    source: "WHO Mental Health Action",
    steps: ["Pick 1 tiny task", "Set 10-min timer", "Do it without judging", "Note how you feel after"],
    steps_hi: ["एक छोटा-सा काम चुनें", "10 मिनट का टाइमर लगाएं", "बिना आंकलन किए इसे करें", "बाद में महसूस करें कि आप कैसा महसूस कर रहे हैं"]
  },
  {
    id: 3,
    emotion: "stressed",
    keywords: ["stressed", "stress", "overwhelmed", "pressure", "exhausted", "tired"],
    technique: "Stress Container",
    technique_hi: "स्ट्रेस कंटेनर",
    advice: "Based on Tele-MANAS counseling framework: Imagine stress as water filling a container. Identify 3 taps filling it (work, sleep, thoughts) and 3 drains (walk, talk, water). Close one tap, open one drain today.",
    advice_hi: "Tele-MANAS काउंसलिंग फ्रेमवर्क पर आधारित: तनाव को एक बर्तन में भरते पानी की तरह सोचें। इसे भरने वाले 3 नल (काम, नींद, विचार) और इसे खाली करने वाली 3 नालियां (टहलना, बात करना, पानी पीना) पहचानें। आज एक नल बंद करें, एक नाली खोलें।",
    source: "Tele-MANAS Counselor Manual",
    steps: ["List 3 stressors", "List 3 relievers", "Reduce 1 stressor by 10%", "Increase 1 reliever"],
    steps_hi: ["3 तनाव के कारण लिखें", "3 राहत देने वाली चीज़ें लिखें", "एक तनाव के कारण को 10% कम करें", "एक राहत देने वाली चीज़ को बढ़ाएं"]
  },
  {
    id: 4,
    emotion: "angry",
    keywords: ["angry", "irritated", "frustrated", "mad"],
    technique: "TIPP Skill",
    technique_hi: "TIPP स्किल",
    advice: "From DBT Skills: When angry, change body temperature. Splash cold water, hold cold bottle. Then intense exercise 2 mins, then paced breathing.",
    advice_hi: "DBT स्किल्स से: जब गुस्सा आए, शरीर का तापमान बदलें। ठंडा पानी चेहरे पर छिड़कें, ठंडी बोतल पकड़ें। फिर 2 मिनट तेज़ एक्सरसाइज़ करें, फिर धीमी साँस लें।",
    source: "DBT Skills Training",
    steps: ["Cold water on face 30s", "Fast walk/jumping jacks", "Slow breathing"],
    steps_hi: ["चेहरे पर 30 सेकंड ठंडा पानी", "तेज़ चलना/जंपिंग जैक्स", "धीमी साँस लेना"]
  }
  // Add 20-30 more from public sources
];
