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
  "cloudPrompts.prompt5",
  "cloudPrompts.prompt6",
  "cloudPrompts.prompt7",
  "cloudPrompts.prompt8",
  "cloudPrompts.prompt9",
  "cloudPrompts.prompt10",
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
      { id: 0, topPct: 8, size: 92, duration: 34, delay: 0 },
      { id: 1, topPct: 42, size: 68, duration: 42, delay: -16 },
      { id: 2, topPct: 68, size: 100, duration: 38, delay: -27 },
    ],
    []
  );

  function tapCloud(cloudId) {
    // FIX: this rerolled a random prompt on every tap, so tapping the same
    // cloud again swapped the thought out from under you mid-read - it
    // looked glitchy rather than intentional. Tapping a cloud that is
    // already showing its thought now just keeps it on screen longer; a
    // new thought only comes from a different cloud, or from waiting for
    // this one to drift away.
    const sameCloudAgain = active && active.cloudId === cloudId;
    if (!sameCloudAgain) {
      const textKey = CLOUD_PROMPT_KEYS[Math.floor(Math.random() * CLOUD_PROMPT_KEYS.length)];
      setActive({ cloudId, textKey });
      recordCalmMoment(0.5);
    }
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setActive(null), 4500);
  }

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2>☁️ {t("cloudPrompts.heading")}</h2>
      <p style={{ fontSize: 13, opacity: 0.7 }}>{t("cloudPrompts.subtitle")}</p>
      {/* FIX: the sky strip used to be almost transparent
          (rgba(157,193,224,0.16) fading to 0.04). Users can set a custom or
          AI-generated background image in Settings, and it showed straight
          through - so the clouds and the prompt sat on top of a photo and
          nothing was readable. It now paints its own opaque-enough sky. */}
      <div
        style={{
          position: "relative", height: 170, overflow: "hidden", borderRadius: 12, marginTop: 12,
          background:
            "linear-gradient(180deg, rgba(120,160,200,0.55), rgba(150,185,215,0.35))",
          border: "1px solid rgba(157,193,224,0.35)",
        }}
      >
        {clouds.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => tapCloud(c.id)}
            aria-label={t("cloudPrompts.hint")}
            style={{
              position: "absolute", top: `${c.topPct}%`, left: "-30%", width: c.size, height: c.size * 0.5,
              cursor: "pointer", padding: 0, border: "none", background: "transparent",
              borderRadius: 999,
              animation: `emovra-cloud-drift ${c.duration}s linear infinite`,
              animationDelay: `${c.delay}s`,
            }}
          >
            <CloudShape />
            {active && active.cloudId === c.id && (
              <div
                aria-live="polite"
                style={{
                  position: "absolute",
                  left: "50%",
                  transform: "translateX(-50%)",
                  // FIX: the thought used to be pinned above the cloud with
                  // translate(-50%,-100%). The strip has overflow:hidden, so
                  // for the cloud sitting at 8% the whole message rendered
                  // past the top edge and was clipped away - tapping it
                  // looked like nothing happened at all. It now sits BELOW
                  // clouds in the upper half and ABOVE clouds in the lower
                  // half, so it always has room inside the strip.
                  ...(c.topPct < 50
                    ? { top: "100%", marginTop: 8 }
                    : { bottom: "100%", marginBottom: 8 }),
                  background: "var(--card-bg, #fff)",
                  color: "var(--text-h)",
                  fontSize: 12.5,
                  fontWeight: 600,
                  padding: "8px 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(212,176,122,0.5)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                  width: "max-content",
                  maxWidth: 190,
                  textAlign: "center",
                  lineHeight: 1.4,
                  pointerEvents: "none",
                  animation: "emovra-cloud-fade 0.3s ease",
                }}
              >
                {t(active.textKey)}
              </div>
            )}
          </button>
        ))}

      </div>
      <p style={{ marginTop: 10, fontSize: 12, opacity: 0.5, textAlign: "center" }}>{t("cloudPrompts.hint")}</p>
      <style>{`
        @keyframes emovra-cloud-drift {
          0% { left: -30%; }
          100% { left: 115%; }
        }
        @keyframes emovra-cloud-fade {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        /* Constant drifting motion is the wrong default in a calming
           feature for anyone sensitive to it. Clouds still work - they just
           hold still. */
        @media (prefers-reduced-motion: reduce) {
          [style*="emovra-cloud-drift"] { animation: none !important; left: 20% !important; }
        }
      `}</style>
    </div>
  );
}
