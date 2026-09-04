import React, { useEffect, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { getGardenState, subscribeCalmGarden, gardenStage } from "../utils/calmGarden.js";

function GardenScene({ stage }) {
  return (
    <svg viewBox="0 0 220 150" width="100%" height="170" style={{ display: "block" }}>
      <defs>
        <linearGradient id="ev-garden-soil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8a6b4a" />
          <stop offset="100%" stopColor="#5c452e" />
        </linearGradient>
        <radialGradient id="ev-garden-leaf" cx="35%" cy="25%" r="80%">
          <stop offset="0%" stopColor="#a9d18f" />
          <stop offset="100%" stopColor="#5c8f4f" />
        </radialGradient>
        <radialGradient id="ev-garden-bloom" cx="40%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#fbdce8" />
          <stop offset="100%" stopColor="#d9799f" />
        </radialGradient>
      </defs>

      <ellipse cx="110" cy="138" rx="95" ry="9" fill="url(#ev-garden-soil)" opacity="0.45" />

      {stage === 0 && <circle cx="110" cy="131" r="4" fill="#d4b07a" />}

      {stage >= 1 && (
        <g>
          <path d="M110,132 C110,120 106,113 110,101" stroke="#5c8f4f" strokeWidth="3" fill="none" strokeLinecap="round" />
          {stage === 1 && <ellipse cx="113" cy="101" rx="9" ry="6" fill="url(#ev-garden-leaf)" transform="rotate(-25 113 101)" />}
          {stage >= 2 && (
            <>
              <path d="M110,117 C102,113 96,117 93,109" stroke="#5c8f4f" strokeWidth="3" fill="none" strokeLinecap="round" />
              <ellipse cx="93" cy="109" rx="8" ry="5.5" fill="url(#ev-garden-leaf)" transform="rotate(-35 93 109)" />
              <path d="M110,110 C118,106 124,110 127,102" stroke="#5c8f4f" strokeWidth="3" fill="none" strokeLinecap="round" />
              <ellipse cx="127" cy="102" rx="8" ry="5.5" fill="url(#ev-garden-leaf)" transform="rotate(30 127 102)" />
            </>
          )}
        </g>
      )}

      {stage >= 3 && (
        <g>
          <circle cx="110" cy="95" r="10" fill="url(#ev-garden-bloom)" />
          <circle cx="110" cy="95" r="4" fill="#f6dfa8" />
        </g>
      )}

      {stage >= 4 && (
        <g>
          <path d="M78,132 C78,121 74,115 78,106" stroke="#5c8f4f" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <circle cx="78" cy="102" r="7" fill="url(#ev-garden-bloom)" />
          <circle cx="78" cy="102" r="2.6" fill="#f6dfa8" />
          <path d="M143,132 C143,120 148,112 143,103" stroke="#5c8f4f" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <circle cx="143" cy="99" r="7" fill="url(#ev-garden-bloom)" />
          <circle cx="143" cy="99" r="2.6" fill="#f6dfa8" />
        </g>
      )}
    </svg>
  );
}

const STAGE_KEYS = ["calmGarden.stage0", "calmGarden.stage1", "calmGarden.stage2", "calmGarden.stage3", "calmGarden.stage4"];

export default function CalmGarden() {
  const { t } = useLanguage();
  const [state, setState] = useState(getGardenState);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    return subscribeCalmGarden((next) => {
      setState(next);
      const last = next.log[next.log.length - 1];
      if (!last) return;
      const msg = last.minutes < 1
        ? t("calmGarden.grewShort")
        : t("calmGarden.grew", { minutes: Number.isInteger(last.minutes) ? last.minutes : last.minutes.toFixed(1) });
      setToast(msg);
      setTimeout(() => setToast(null), 5000);
    });
  }, [t]);

  const stage = gardenStage(state.moments || 0);

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2>🌱 {t("calmGarden.heading")}</h2>
      <p style={{ fontSize: 13, opacity: 0.7 }}>{t("calmGarden.subtitle")}</p>
      <div style={{ position: "relative", marginTop: 10 }}>
        <GardenScene stage={stage} />
        {toast && (
          <div
            style={{
              position: "absolute", top: 6, left: "50%", transform: "translateX(-50%)",
              background: "var(--accent)", color: "#000", fontSize: 12, fontWeight: 700,
              padding: "6px 14px", borderRadius: 999, boxShadow: "0 4px 10px rgba(0,0,0,0.18)",
              maxWidth: "88%", textAlign: "center",
            }}
          >
            {toast}
          </div>
        )}
      </div>
      <p style={{ textAlign: "center", fontSize: 13, fontWeight: 600, color: "var(--text-h)", marginTop: 6 }}>{t(STAGE_KEYS[stage])}</p>
      {state.moments > 0 && (
        <p style={{ textAlign: "center", fontSize: 12, opacity: 0.55, marginTop: 2 }}>
          {t("calmGarden.tally", { moments: state.moments, minutes: state.totalMinutes })}
        </p>
      )}
    </div>
  );
}
