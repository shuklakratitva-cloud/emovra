import React, { useState, useRef, useMemo } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { recordCalmMoment } from "../utils/calmGarden.js";

// A small atmospheric piece for the Sanctuary: a few clouds drift slowly
// across a soft sky strip. Tapping one reveals a short grounding prompt,
// then it fades away on its own - nothing to complete, nothing to track.

const CLOUD_PROMPT_KEYS = [
  "cloudPrompts.prompt1",
  "cloudPrompts.prompt2",
  "cloudPrompts.prompt3",
  "cloudPrompts.prompt4",
];

function CloudShape() {
  return (
    <svg viewBox="0 0 120 60" width="100%" height="100%" style={{ display: "block", overflow: "visible" }}>
      <g fill="rgba(255,255,255,0.92)">
        <ellipse cx="35" cy="38" rx="28" ry="18" />
        <ellipse cx="65" cy="30" rx="24" ry="20" />
        <ellipse cx="90" cy="40" rx="22" ry="16" />
        <ellipse cx="55" cy="46" rx="40" ry="14" />
      </g>
    </svg>
  );
}

export default function CloudPrompts() {
  const { t } = useLanguage();
  const [active, setActive] = useState(null); // { cloudId, textKey }
  const hideTimer = useRef(null);

  const clouds = useMemo(
    () => [
      { id: 0, top: "8%", size: 92, duration: 34, delay: 0 },
      { id: 1, top: "42%", size: 68, duration: 42, delay: -16 },
      { id: 2, top: "68%", size: 100, duration: 38, delay: -27 },
    ],
    []
  );

  function tapCloud(cloudId) {
    const textKey = CLOUD_PROMPT_KEYS[Math.floor(Math.random() * CLOUD_PROMPT_KEYS.length)];
    setActive({ cloudId, textKey });
    recordCalmMoment(0.5);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setActive(null), 4500);
  }

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2>☁️ {t("cloudPrompts.heading")}</h2>
      <p style={{ fontSize: 13, opacity: 0.7 }}>{t("cloudPrompts.subtitle")}</p>
      <div
        style={{
          position: "relative", height: 170, overflow: "hidden", borderRadius: 12, marginTop: 12,
          background: "linear-gradient(180deg, rgba(157,193,224,0.16), rgba(157,193,224,0.04))",
        }}
      >
        {clouds.map((c) => (
          <div
            key={c.id}
            onClick={() => tapCloud(c.id)}
            style={{
              position: "absolute", top: c.top, left: "-30%", width: c.size, height: c.size * 0.5,
              cursor: "pointer",
              animation: `emovra-cloud-drift ${c.duration}s linear infinite`,
              animationDelay: `${c.delay}s`,
            }}
          >
            <CloudShape />
            {active && active.cloudId === c.id && (
              <div
                style={{
                  position: "absolute", top: -10, left: "50%", transform: "translate(-50%, -100%)",
                  background: "var(--card-bg, #fff)", color: "var(--text-h)", fontSize: 12, fontWeight: 600,
                  padding: "8px 12px", borderRadius: 10, boxShadow: "0 4px 10px rgba(0,0,0,0.18)",
                  maxWidth: 200, textAlign: "center", lineHeight: 1.4,
                  animation: "emovra-cloud-fade 0.3s ease",
                }}
              >
                {t(active.textKey)}
              </div>
            )}
          </div>
        ))}
      </div>
      <p style={{ marginTop: 10, fontSize: 12, opacity: 0.5, textAlign: "center" }}>{t("cloudPrompts.hint")}</p>
      <style>{`
        @keyframes emovra-cloud-drift {
          0% { left: -30%; }
          100% { left: 115%; }
        }
        @keyframes emovra-cloud-fade {
          0% { opacity: 0; transform: translate(-50%, -90%); }
          100% { opacity: 1; transform: translate(-50%, -100%); }
        }
      `}</style>
    </div>
  );
}
