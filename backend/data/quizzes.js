// backend/data/quizzes.js - simple, non-clinical strength/personality quiz.
// This is NOT a diagnostic instrument - framed purely as a lighthearted,
// self-reflection prompt, never presented as psychological assessment.
//
// _hi fields are the Hindi counterparts of the field with the same name
// (title/title_hi, text/text_hi, label/label_hi, description/description_hi).
// The API returns both - the frontend (PersonalityQuiz.jsx) picks whichever
// matches the active language, falling back to English if a _hi field is
// ever missing.
export const STRENGTH_QUIZ = {
  id: "core-strength",
  title: "What's your core strength?",
  title_hi: "आपकी मुख्य ताकत क्या है?",
  questions: [
    {
      id: "q1", text: "When a friend is upset, you usually...",
      text_hi: "जब कोई दोस्त परेशान हो, तो आप आमतौर पर...",
      options: [
        { key: "empath", label: "Sit with them and just listen", label_hi: "उनके साथ बैठते हैं और बस सुनते हैं" },
        { key: "fixer", label: "Try to help them solve the problem", label_hi: "समस्या हल करने में मदद करने की कोशिश करते हैं" },
        { key: "lifter", label: "Try to make them laugh or feel lighter", label_hi: "उन्हें हंसाने या हल्का महसूस कराने की कोशिश करते हैं" },
        { key: "planner", label: "Help them figure out next steps", label_hi: "अगले कदम तय करने में मदद करते हैं" },
      ],
    },
    {
      id: "q2", text: "Your ideal weekend involves...",
      text_hi: "आपका आदर्श वीकेंड इसमें शामिल है...",
      options: [
        { key: "empath", label: "Deep conversations with close people", label_hi: "करीबी लोगों के साथ गहरी बातचीत" },
        { key: "fixer", label: "Finishing a project or fixing something", label_hi: "कोई प्रोजेक्ट पूरा करना या कुछ ठीक करना" },
        { key: "lifter", label: "Something fun and spontaneous", label_hi: "कुछ मज़ेदार और अचानक तय किया हुआ" },
        { key: "planner", label: "Getting organized for the week ahead", label_hi: "आने वाले हफ्ते के लिए खुद को व्यवस्थित करना" },
      ],
    },
    {
      id: "q3", text: "When things go wrong, you tend to...",
      text_hi: "जब चीज़ें गलत हो जाती हैं, तो आप आमतौर पर...",
      options: [
        { key: "empath", label: "Process how you feel about it first", label_hi: "पहले यह समझते हैं कि आपको कैसा महसूस हो रहा है" },
        { key: "fixer", label: "Look for what can be fixed right away", label_hi: "देखते हैं कि तुरंत क्या ठीक किया जा सकता है" },
        { key: "lifter", label: "Look for the silver lining", label_hi: "अच्छे पहलू को खोजने की कोशिश करते हैं" },
        { key: "planner", label: "Make a plan to prevent it happening again", label_hi: "दोबारा न हो, इसके लिए एक योजना बनाते हैं" },
      ],
    },
    {
      id: "q4", text: "People often come to you for...",
      text_hi: "लोग अक्सर आपके पास किसलिए आते हैं...",
      options: [
        { key: "empath", label: "Emotional support", label_hi: "भावनात्मक सहारा" },
        { key: "fixer", label: "Practical advice", label_hi: "व्यावहारिक सलाह" },
        { key: "lifter", label: "Good energy", label_hi: "अच्छी ऊर्जा" },
        { key: "planner", label: "Getting organized", label_hi: "व्यवस्थित होने में मदद" },
      ],
    },
  ],
  results: {
    empath: {
      label: "The Empath", label_hi: "एम्पैथ",
      emoji: "💗",
      description: "You lead with deep listening and emotional presence. People feel safe being honest with you.",
      description_hi: "आप गहराई से सुनने और भावनात्मक साथ देने में आगे रहते हैं। लोग आपके सामने ईमानदार होने में सुरक्षित महसूस करते हैं।",
    },
    fixer: {
      label: "The Problem-Solver", label_hi: "प्रॉब्लम-सॉल्वर",
      emoji: "🛠",
      description: "You turn care into action. When something's wrong, you're already thinking about how to help.",
      description_hi: "आप परवाह को काम में बदल देते हैं। जब कुछ गलत होता है, तो आप पहले से ही मदद करने के तरीके सोचने लगते हैं।",
    },
    lifter: {
      label: "The Mood-Lifter", label_hi: "मूड-लिफ्टर",
      emoji: "🌟",
      description: "You bring lightness into heavy moments. Your energy is genuinely a gift to people around you.",
      description_hi: "आप भारी पलों में हल्कापन ले आते हैं। आपकी ऊर्जा वाकई आपके आसपास के लोगों के लिए एक तोहफा है।",
    },
    planner: {
      label: "The Planner", label_hi: "प्लानर",
      emoji: "🗺",
      description: "You create stability for people through structure and follow-through. Reliability is your love language.",
      description_hi: "आप व्यवस्था और निरंतरता के ज़रिए लोगों के लिए स्थिरता बनाते हैं। भरोसेमंद होना ही आपका प्यार जताने का तरीका है।",
    },
  },
};

export function scoreQuiz(answers) {
  // answers: { q1: "empath", q2: "fixer", ... }
  const tally = {};
  Object.values(answers || {}).forEach((key) => { tally[key] = (tally[key] || 0) + 1; });
  let top = "empath", topCount = -1;
  for (const [key, count] of Object.entries(tally)) {
    if (count > topCount) { top = key; topCount = count; }
  }
  return top;
}
