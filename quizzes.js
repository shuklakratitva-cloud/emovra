// backend/data/quizzes.js - simple, non-clinical strength/personality quiz.
// This is NOT a diagnostic instrument - framed purely as a lighthearted,
// self-reflection prompt, never presented as psychological assessment.
export const STRENGTH_QUIZ = {
  id: "core-strength",
  title: "What's your core strength?",
  questions: [
    {
      id: "q1", text: "When a friend is upset, you usually...",
      options: [
        { key: "empath", label: "Sit with them and just listen" },
        { key: "fixer", label: "Try to help them solve the problem" },
        { key: "lifter", label: "Try to make them laugh or feel lighter" },
        { key: "planner", label: "Help them figure out next steps" },
      ],
    },
    {
      id: "q2", text: "Your ideal weekend involves...",
      options: [
        { key: "empath", label: "Deep conversations with close people" },
        { key: "fixer", label: "Finishing a project or fixing something" },
        { key: "lifter", label: "Something fun and spontaneous" },
        { key: "planner", label: "Getting organized for the week ahead" },
      ],
    },
    {
      id: "q3", text: "When things go wrong, you tend to...",
      options: [
        { key: "empath", label: "Process how you feel about it first" },
        { key: "fixer", label: "Look for what can be fixed right away" },
        { key: "lifter", label: "Look for the silver lining" },
        { key: "planner", label: "Make a plan to prevent it happening again" },
      ],
    },
    {
      id: "q4", text: "People often come to you for...",
      options: [
        { key: "empath", label: "Emotional support" },
        { key: "fixer", label: "Practical advice" },
        { key: "lifter", label: "Good energy" },
        { key: "planner", label: "Getting organized" },
      ],
    },
  ],
  results: {
    empath: { label: "The Empath", emoji: "💗", description: "You lead with deep listening and emotional presence. People feel safe being honest with you." },
    fixer: { label: "The Problem-Solver", emoji: "🛠", description: "You turn care into action. When something's wrong, you're already thinking about how to help." },
    lifter: { label: "The Mood-Lifter", emoji: "🌟", description: "You bring lightness into heavy moments. Your energy is genuinely a gift to people around you." },
    planner: { label: "The Planner", emoji: "🗺", description: "You create stability for people through structure and follow-through. Reliability is your love language." },
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
