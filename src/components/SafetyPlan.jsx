import React, { useState, useEffect } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

import { API_BASE as API } from "../config/api.js";
function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  };
}

const FIELDS = [
  {
    key: "warningSigns",
    labelKey: "safetyPlan.warningSignsLabel",
    placeholderKey: "safetyPlan.warningSignsPlaceholder",
    helperKey: "safetyPlan.warningSignsHelper",
  },
  {
    key: "copingStrategies",
    labelKey: "safetyPlan.copingStrategiesLabel",
    placeholderKey: "safetyPlan.copingStrategiesPlaceholder",
    helperKey: "safetyPlan.copingStrategiesHelper",
  },
  {
    key: "supportContacts",
    labelKey: "safetyPlan.supportContactsLabel",
    placeholderKey: "safetyPlan.supportContactsPlaceholder",
    helperKey: "safetyPlan.supportContactsHelper",
  },
  {
    key: "reasonsToLive",
    labelKey: "safetyPlan.reasonsToLiveLabel",
    placeholderKey: "safetyPlan.reasonsToLivePlaceholder",
    helperKey: "safetyPlan.reasonsToLiveHelper",
  },
];

export default function SafetyPlan() {
  const [values, setValues] = useState({
    warningSigns: "",
    copingStrategies: "",
    supportContacts: "",
    reasonsToLive: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);
  // FIX: four always-open textareas made this the tallest card in the
  // Journal tab, so everything below it was a long scroll away - and a
  // safety plan is mostly written once and then re-read, not re-typed.
  // It opens as a short summary when one already exists, and Edit brings
  // the form back. Null until the plan loads, so we can decide from the
  // fetched content rather than flashing the form open first.
  const [editing, setEditing] = useState(null);
  const { t } = useLanguage();

  useEffect(() => {
    fetch(`${API}/safety-plan`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.plan)
          setValues({
            warningSigns: d.plan.warningSigns,
            copingStrategies: d.plan.copingStrategies,
            supportContacts: d.plan.supportContacts,
            reasonsToLive: d.plan.reasonsToLive,
          });
        // Start collapsed only if there is actually a plan to collapse;
        // a first-time user still gets the form open in front of them.
        const filled = d.success && d.plan &&
          [d.plan.warningSigns, d.plan.copingStrategies, d.plan.supportContacts, d.plan.reasonsToLive]
            .some((v) => (v || "").trim().length > 0);
        setEditing(!filled);
      })
      .catch(() => {})
      .finally(() => {
        setEditing((e) => (e === null ? true : e));
        setLoading(false);
      });
  }, []);

  // FIX: this used to do nothing at all on a failed save - no success
  // branch AND an empty catch, so the button just stopped showing
  // "Saving..." with zero feedback either way. Someone who just wrote
  // down their warning signs/coping strategies/reasons to live during a
  // hard moment had no way to know whether it actually saved. Now shows
  // an explicit error on failure instead of silently doing nothing.
  async function save() {
    setSaving(true);
    setSaveError(false);
    try {
      const res = await fetch(`${API}/safety-plan`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
      setEditing(false);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setSaveError(true);
      }
    } catch {
      setSaveError(true);
    }
    setSaving(false);
  }

  if (loading) return null;

  const hasAnyContent = Object.values(values).some((v) => v.trim().length > 0);

  return (
    <div
      style={{
        background: "var(--card-bg, #fff)",
        padding: "24px",
        borderRadius: "16px",
        boxShadow: "0 4px 12px rgba(0,0,0,.08)",
        marginTop: "20px",
      }}
    >
      <h2>🛟 {t("safetyPlan.heading")}</h2>
      <p style={{ fontSize: 12, opacity: 0.7 }}>
        {t("safetyPlan.intro")} {hasAnyContent && t("safetyPlan.introExtra")}
      </p>

      {!editing ? (
        <div style={{ marginTop: 14 }}>
          {FIELDS.filter((f) => (values[f.key] || "").trim()).map((f) => (
            <div key={f.key} style={{ marginTop: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-h)" }}>{t(f.labelKey)}</div>
              {/* One line each, clamped. The full text is one tap away in
                  Edit - the point of the collapsed view is to be re-readable
                  at a glance, not to reproduce the whole plan. */}
              <div
                style={{
                  fontSize: 13, opacity: 0.85, marginTop: 2, whiteSpace: "pre-wrap",
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {values[f.key]}
              </div>
            </div>
          ))}
          <button
            onClick={() => { setEditing(true); setSaved(false); setSaveError(false); }}
            style={{
              marginTop: 14, padding: "8px 20px", borderRadius: 999,
              border: "1px solid var(--border)", background: "transparent",
              color: "var(--text)", fontWeight: 600, fontSize: 13, cursor: "pointer",
            }}
          >
            {t("safetyPlan.edit")}
          </button>
          {saved && (
            <span style={{ marginLeft: 12, fontSize: 12, color: "#4ade80" }}>
              {t("safetyPlan.saved")} ✓
            </span>
          )}
        </div>
      ) : (
      <>
      {FIELDS.map((f) => (
        <div key={f.key} style={{ marginTop: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "var(--text-h)" }}>
            {t(f.labelKey)}
          </label>
          <p style={{ fontSize: 11, opacity: 0.5, margin: "2px 0 6px" }}>{t(f.helperKey)}</p>
          <textarea
            value={values[f.key]}
            onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            placeholder={t(f.placeholderKey)}
            rows={3}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "#0f0f11",
              color: "var(--text)",
            }}
          />
        </div>
      ))}

      <button
        onClick={save}
        disabled={saving}
        style={{
          marginTop: 16,
          padding: "10px 22px",
          borderRadius: 999,
          border: "none",
          background: "var(--accent)",
          color: "#000",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        {saving ? t("safetyPlan.saving") : t("safetyPlan.savePlan")}
      </button>
      {saved && (
        <span style={{ marginLeft: 12, fontSize: 12, color: "#4ade80" }}>
          {t("safetyPlan.saved")} ✓
        </span>
      )}
      {saveError && (
        <span style={{ marginLeft: 12, fontSize: 12, color: "#f87171" }}>
          {t("journal.couldNotSave")}
        </span>
      )}
      </>
      )}
    </div>
  );
}
