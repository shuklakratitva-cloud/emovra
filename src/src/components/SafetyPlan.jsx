import React, { useState, useEffect } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const API = "https://emovra.onrender.com/api";
function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` };
}

const FIELDS = [
  { key: "warningSigns", labelKey: "safetyPlan.warningSignsLabel", placeholderKey: "safetyPlan.warningSignsPlaceholder", helperKey: "safetyPlan.warningSignsHelper" },
  { key: "copingStrategies", labelKey: "safetyPlan.copingStrategiesLabel", placeholderKey: "safetyPlan.copingStrategiesPlaceholder", helperKey: "safetyPlan.copingStrategiesHelper" },
  { key: "supportContacts", labelKey: "safetyPlan.supportContactsLabel", placeholderKey: "safetyPlan.supportContactsPlaceholder", helperKey: "safetyPlan.supportContactsHelper" },
  { key: "reasonsToLive", labelKey: "safetyPlan.reasonsToLiveLabel", placeholderKey: "safetyPlan.reasonsToLivePlaceholder", helperKey: "safetyPlan.reasonsToLiveHelper" },
];

export default function SafetyPlan() {
  const [values, setValues] = useState({ warningSigns: "", copingStrategies: "", supportContacts: "", reasonsToLive: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    fetch(`${API}/safety-plan`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => { if (d.success && d.plan) setValues({ warningSigns: d.plan.warningSigns, copingStrategies: d.plan.copingStrategies, supportContacts: d.plan.supportContacts, reasonsToLive: d.plan.reasonsToLive }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`${API}/safety-plan`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(values) });
      const data = await res.json();
      if (data.success) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    } catch {}
    setSaving(false);
  }

  if (loading) return null;

  const hasAnyContent = Object.values(values).some((v) => v.trim().length > 0);

  return (
    <div style={{ background: "var(--card-bg, #fff)", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px" }}>
      <h2>🛟 {t("safetyPlan.heading")}</h2>
      <p style={{ fontSize: 12, opacity: 0.7 }}>
        {t("safetyPlan.intro")} {hasAnyContent && t("safetyPlan.introExtra")}
      </p>

      {FIELDS.map((f) => (
        <div key={f.key} style={{ marginTop: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-h)" }}>{t(f.labelKey)}</label>
          <p style={{ fontSize: 11, opacity: 0.5, margin: "2px 0 6px" }}>{t(f.helperKey)}</p>
          <textarea
            value={values[f.key]}
            onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            placeholder={t(f.placeholderKey)}
            rows={3}
            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid var(--border)", background: "#0f0f11", color: "var(--text)" }}
          />
        </div>
      ))}

      <button onClick={save} disabled={saving} style={{ marginTop: 16, padding: "10px 22px", borderRadius: 999, border: "none", background: "var(--accent)", color: "#000", fontWeight: 700, cursor: "pointer" }}>
        {saving ? t("safetyPlan.saving") : t("safetyPlan.savePlan")}
      </button>
      {saved && <span style={{ marginLeft: 12, fontSize: 12, color: "#4ade80" }}>{t("safetyPlan.saved")} ✓</span>}
    </div>
  );
}
