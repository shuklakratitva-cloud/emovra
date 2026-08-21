import React, { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

function CopingStrategy() {
  const [feeling, setFeeling] = useState(null);
  const { t } = useLanguage();

  const COPING_MAP = {
    overwhelmed: { label: t("selfCareTools.feelingOverwhelmed"), items: [t("selfCareTools.overwhelmed1"), t("selfCareTools.overwhelmed2"), t("selfCareTools.overwhelmed3")] },
    anxious: { label: t("selfCareTools.feelingAnxious"), items: [t("selfCareTools.anxious1"), t("selfCareTools.anxious2"), t("selfCareTools.anxious3")] },
    sad: { label: t("selfCareTools.feelingSad"), items: [t("selfCareTools.sad1"), t("selfCareTools.sad2"), t("selfCareTools.sad3")] },
    angry: { label: t("selfCareTools.feelingAngry"), items: [t("selfCareTools.angry1"), t("selfCareTools.angry2"), t("selfCareTools.angry3")] },
    lonely: { label: t("selfCareTools.feelingLonely"), items: [t("selfCareTools.lonely1"), t("selfCareTools.lonely2"), t("selfCareTools.lonely3")] },
    tired: { label: t("selfCareTools.feelingTired"), items: [t("selfCareTools.tired1"), t("selfCareTools.tired2"), t("selfCareTools.tired3")] },
  };

  return (
    <div>
      <p style={{ fontSize: 12, opacity: 0.7 }}>{t("selfCareTools.copingQuestion")}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
        {Object.keys(COPING_MAP).map((f) => (
          <button key={f} onClick={() => setFeeling(f)} style={{ padding: "8px 14px", borderRadius: 999, fontSize: 12, cursor: "pointer", border: feeling === f ? "1px solid var(--accent)" : "1px solid var(--border)", background: feeling === f ? "rgba(212,176,122,0.15)" : "transparent", color: "var(--text)" }}>
            {COPING_MAP[f].label}
          </button>
        ))}
      </div>
      {feeling && (
        <div style={{ marginTop: 16 }}>
          {COPING_MAP[feeling].items.map((s, i) => (
            <div key={i} style={{ padding: "10px 0", borderBottom: i < COPING_MAP[feeling].items.length - 1 ? "1px solid var(--border)" : "none", fontSize: 13, lineHeight: 1.5 }}>{s}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function SelfCareWheel() {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [rotation, setRotation] = useState(0);
  const { t } = useLanguage();

  const SELF_CARE_ACTIVITIES = [
    t("selfCareTools.activity1"), t("selfCareTools.activity2"), t("selfCareTools.activity3"),
    t("selfCareTools.activity4"), t("selfCareTools.activity5"), t("selfCareTools.activity6"),
    t("selfCareTools.activity7"), t("selfCareTools.activity8"), t("selfCareTools.activity9"),
    t("selfCareTools.activity10"),
  ];

  function spin() {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    const picked = SELF_CARE_ACTIVITIES[Math.floor(Math.random() * SELF_CARE_ACTIVITIES.length)];
    setRotation((r) => r + 1080 + Math.random() * 360);
    setTimeout(() => { setResult(picked); setSpinning(false); }, 1800);
  }

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        width: 140, height: 140, margin: "10px auto", borderRadius: "50%",
        background: "conic-gradient(from 0deg, #d4b07a, #a78bfa, #60a5fa, #4ade80, #fbbf24, #f87171, #d4b07a)",
        transform: `rotate(${rotation}deg)`, transition: "transform 1.8s cubic-bezier(0.2,0.8,0.2,1)",
        border: "3px solid var(--accent)",
      }} />
      <button onClick={spin} disabled={spinning} style={{ marginTop: 14, padding: "8px 20px", borderRadius: 999, border: "none", background: "var(--accent)", color: "#000", fontWeight: 700, cursor: "pointer" }}>
        {spinning ? t("selfCareTools.spinning") : t("selfCareTools.spin")}
      </button>
      {result && <p style={{ marginTop: 14, fontSize: 14, color: "var(--text-h)", fontWeight: 600 }}>{result}</p>}
    </div>
  );
}

function PhotoChallenge() {
  const { t } = useLanguage();
  const PHOTO_PROMPTS = [
    t("selfCareTools.photoPrompt1"), t("selfCareTools.photoPrompt2"), t("selfCareTools.photoPrompt3"),
    t("selfCareTools.photoPrompt4"), t("selfCareTools.photoPrompt5"), t("selfCareTools.photoPrompt6"),
    t("selfCareTools.photoPrompt7"), t("selfCareTools.photoPrompt8"),
  ];
  const [prompt, setPrompt] = useState(() => PHOTO_PROMPTS[Math.floor(Math.random() * PHOTO_PROMPTS.length)]);
  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ fontSize: 12, opacity: 0.6 }}>{t("selfCareTools.photoHint")}</p>
      <div style={{ marginTop: 16, padding: 20, borderRadius: 12, border: "1px solid var(--border)", fontSize: 15, color: "var(--text-h)" }}>📷 {prompt}</div>
      <button onClick={() => setPrompt(PHOTO_PROMPTS[Math.floor(Math.random() * PHOTO_PROMPTS.length)])} style={{ marginTop: 12, padding: "6px 16px", borderRadius: 999, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", cursor: "pointer", fontSize: 11 }}>
        {t("selfCareTools.newPrompt")}
      </button>
    </div>
  );
}

const TABS = [
  { id: "coping", emoji: "🧭", labelKey: "selfCareTools.copingTab", Component: CopingStrategy },
  { id: "wheel", emoji: "🎡", labelKey: "selfCareTools.wheelTab", Component: SelfCareWheel },
  { id: "photo", emoji: "📷", labelKey: "selfCareTools.photoTab", Component: PhotoChallenge },
];

export default function SelfCareTools() {
  const [active, setActive] = useState("coping");
  const { t } = useLanguage();
  const Active = TABS.find((tb) => tb.id === active)?.Component;
  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2>🌿 {t("selfCareTools.heading")}</h2>
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActive(tab.id)} style={{ padding: "8px 14px", borderRadius: 999, fontSize: 12, cursor: "pointer", border: active === tab.id ? "1px solid var(--accent)" : "1px solid var(--border)", background: active === tab.id ? "rgba(212,176,122,0.15)" : "transparent", color: active === tab.id ? "var(--text-h)" : "var(--muted)", fontWeight: active === tab.id ? 700 : 500 }}>
            {tab.emoji} {t(tab.labelKey)}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 16 }}>{Active && <Active />}</div>
    </div>
  );
}
