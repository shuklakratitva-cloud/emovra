import React, { useState } from "react";

const TOPICS = [
  {
    id: "relationships",
    title: "Healthy Relationships",
    emoji: "🌷",
    tips: [
      "A healthy relationship has room for both people to have bad days - you shouldn't have to perform happiness to be around someone.",
      "Respect looks like someone accepting \"no\" the first time, not needing convincing.",
      "You can love someone and still need space from them sometimes - that's normal, not a red flag on its own.",
      "Watch the pattern, not the apology - does the same hurtful thing keep happening despite \"I'm sorry\"?",
      "A friend or partner who's genuinely good for you makes you feel more like yourself, not less.",
      "It's okay to outgrow a friendship. Not every relationship is meant to last forever, and that doesn't make it a failure.",
    ],
  },
  {
    id: "conflict",
    title: "Conflict Resolution",
    emoji: "🤝",
    tips: [
      "Name the actual issue, not the person - \"I felt hurt when plans changed last minute\" lands very differently than \"you always do this.\"",
      "Ask what the other person actually meant before assuming the worst - a lot of conflict is two people reacting to different stories in their heads.",
      "It's okay to say \"I need a minute before I respond\" - a pause isn't avoidance, it's often what keeps a disagreement from becoming a fight.",
      "Aim for understanding first, being right second. You can both be telling the truth about how something felt.",
      "If it's not resolved in one conversation, that's normal - some things take a few honest talks, not one perfect one.",
    ],
  },
  {
    id: "communication",
    title: "Communication Skills",
    emoji: "💬",
    tips: [
      "\"I feel X when Y happens\" is easier to hear than \"you make me feel X\" - it describes your experience instead of accusing.",
      "Reflecting back (\"so what you're saying is...\") shows you're actually listening, not just waiting for your turn to talk.",
      "Silence in a conversation isn't always bad - sometimes people need a second to find the right words.",
      "It's fine to ask directly for what you need (\"can you just listen right now, I don't need advice\") - people usually can't guess.",
      "Texting strips out tone - if something reads harsher than you think it was meant, it's fair to ask before assuming.",
    ],
  },
  {
    id: "social-anxiety",
    title: "Social Anxiety - Practice Scenarios",
    emoji: "🌱",
    tips: [
      "Scenario: walking into a room where you don't know anyone. Try: find one person standing alone too - they're probably feeling the same thing you are.",
      "Scenario: someone doesn't reply to your message right away. Try: remind yourself a slow reply is usually about their day, not about you.",
      "Scenario: you said something and it got a weird reaction. Try: most people forget an awkward moment within a day - you're the only one still replaying it.",
      "Scenario: you want to join a conversation already happening. Try: a simple \"mind if I join?\" works better than waiting for a perfect opening that never comes.",
      "Small exposure counts - saying one extra sentence today, or making eye contact for one extra second, is real progress, not \"not enough.\"",
    ],
  },
];

export default function SocialSkills() {
  const [activeTopic, setActiveTopic] = useState(TOPICS[0].id);
  const topic = TOPICS.find((t) => t.id === activeTopic);

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2>🫂 Social &amp; Relationship Skills</h2>
      <p style={{ fontSize: 13, opacity: 0.7 }}>Practical, everyday guidance - not a substitute for therapy, just useful starting points.</p>

      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        {TOPICS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTopic(t.id)}
            style={{
              padding: "8px 14px", borderRadius: 999, fontSize: 12, cursor: "pointer",
              border: activeTopic === t.id ? "1px solid var(--accent)" : "1px solid var(--border)",
              background: activeTopic === t.id ? "rgba(212,176,122,0.15)" : "transparent",
              color: activeTopic === t.id ? "var(--text-h)" : "var(--muted)",
              fontWeight: activeTopic === t.id ? 700 : 500,
            }}
          >
            {t.emoji} {t.title}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 18 }}>
        {topic.tips.map((tip, i) => (
          <div key={i} style={{ padding: "12px 0", borderBottom: i < topic.tips.length - 1 ? "1px solid var(--border)" : "none" }}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>{tip}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
