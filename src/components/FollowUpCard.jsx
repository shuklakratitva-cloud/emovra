import { useEffect, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import { API_BASE as API } from "../config/api.js";

// The day-after check-back for a student who disclosed something at RED
// level. Shown at the top of the Check-in tab, because that is where they
// already are when they open the app.
//
// Three things this deliberately does NOT do:
//   - It never says what they wrote, or that they were "flagged". It reads
//     as someone remembering to ask, not as a system reporting back at them.
//   - There is no free-text box. A text field here would collect crisis
//     disclosures through a path with no risk analysis behind it, so
//     something serious could be typed and simply stored.
//   - Answering "worse" is not reported anywhere automatically. It offers
//     the ways to reach a human; the student decides. An honest answer must
//     not feel like pulling an alarm on yourself, or it stops being honest.
export default function FollowUpCard() {
  const { t } = useLanguage();
  const [followUp, setFollowUp] = useState(null);
  const [showSupport, setShowSupport] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${API}/follow-up/due`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.success && d.followUp) setFollowUp(d.followUp);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  async function respond(response) {
    if (!followUp || saving) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/follow-up/${followUp._id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ response }),
      });
      const data = await res.json();
      if (data.success) {
        setDone(true);
        setShowSupport(!!data.showSupport);
      }
    } catch {
      // Offline or backend asleep: close the card rather than trapping the
      // student in a prompt they can't answer. The record stays pending
      // server-side and will simply come back next time.
      setDone(true);
    }
    setSaving(false);
  }

  async function dismiss() {
    if (!followUp) return;
    setFollowUp(null);
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API}/follow-up/${followUp._id}/dismiss`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // The card is already hidden locally; if the dismiss never reaches
      // the server the follow-up simply reappears next visit, which is the
      // safer failure for a wellbeing check-in.
    }
  }

  if (!followUp) return null;

  const card = {
    background: "var(--card-bg, #fff)",
    border: "1px solid rgba(212,176,122,0.45)",
    padding: "20px 22px",
    borderRadius: 16,
    marginBottom: 18,
    boxShadow: "0 4px 12px rgba(0,0,0,.06)",
  };
  const choice = {
    padding: "9px 18px", borderRadius: 999, cursor: "pointer", fontSize: 13,
    border: "1px solid var(--border)", background: "transparent", color: "var(--text)",
  };

  if (done) {
    return (
      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{t("followUp.thanks")}</div>
        {showSupport && (
          <div style={{ marginTop: 12, fontSize: 13, lineHeight: 1.6 }}>
            <p style={{ margin: "0 0 10px" }}>{t("followUp.worseBody")}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <a href="tel:14416" style={{ ...choice, textDecoration: "none", display: "inline-block" }}>
                📞 {t("followUp.telemanas")}
              </a>
              <a href="tel:18005990019" style={{ ...choice, textDecoration: "none", display: "inline-block" }}>
                📞 {t("followUp.kiran")}
              </a>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{t("followUp.heading")}</div>
          <p style={{ fontSize: 13, opacity: 0.8, margin: "6px 0 0", lineHeight: 1.6 }}>
            {t("followUp.body")}
          </p>
        </div>
        <button
          onClick={dismiss}
          aria-label={t("followUp.notNow")}
          style={{ background: "transparent", border: "none", color: "var(--text)", opacity: 0.45, cursor: "pointer", fontSize: 18, lineHeight: 1 }}
        >
          ×
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
        <button onClick={() => respond("better")} disabled={saving} style={choice}>
          {t("followUp.better")}
        </button>
        <button onClick={() => respond("same")} disabled={saving} style={choice}>
          {t("followUp.same")}
        </button>
        <button onClick={() => respond("worse")} disabled={saving} style={choice}>
          {t("followUp.worse")}
        </button>
      </div>
    </div>
  );
}
