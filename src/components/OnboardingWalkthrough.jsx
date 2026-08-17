import React, { useState, useEffect } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const LS_KEY = "emovra_onboarding_seen";

const STEPS = [
  { emoji: "👋", titleKey: "onboarding.step0Title", bodyKey: "onboarding.step0Body" },
  { emoji: "💬", titleKey: "onboarding.step1Title", bodyKey: "onboarding.step1Body" },
  { emoji: "📖", titleKey: "onboarding.step2Title", bodyKey: "onboarding.step2Body" },
  { emoji: "🧘", titleKey: "onboarding.step3Title", bodyKey: "onboarding.step3Body" },
  { emoji: "📊", titleKey: "onboarding.step4Title", bodyKey: "onboarding.step4Body" },
  { emoji: "🛟", titleKey: "onboarding.step5Title", bodyKey: "onboarding.step5Body" },
];

export default function OnboardingWalkthrough() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(LS_KEY)) setVisible(true);
  }, []);

  function close() {
    localStorage.setItem(LS_KEY, "true");
    setVisible(false);
  }

  function next() {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else close();
  }

  if (!visible) return null;
  const s = STEPS[step];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "var(--card-bg, #16161a)", borderRadius: 20, padding: 32, maxWidth: 380, width: "100%", textAlign: "center", border: "1px solid var(--border)" }}>
        <div style={{ fontSize: 48 }}>{s.emoji}</div>
        <h2 style={{ color: "var(--text-h)", marginTop: 12 }}>{t(s.titleKey)}</h2>
        <p style={{ fontSize: 14, opacity: 0.75, lineHeight: 1.6, marginTop: 8 }}>{t(s.bodyKey)}</p>

        <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 20 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i === step ? "var(--accent)" : "var(--border)" }} />
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
          <button onClick={close} style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 13, textDecoration: "underline" }}>
            {t("onboarding.skip")}
          </button>
          <button onClick={next} style={{ padding: "10px 24px", borderRadius: 999, border: "none", background: "var(--accent)", color: "#000", fontWeight: 700, cursor: "pointer" }}>
            {step < STEPS.length - 1 ? t("onboarding.next") : t("onboarding.letsGo")}
          </button>
        </div>
      </div>
    </div>
  );
}
