// src/components/SupportResources.jsx
import React from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function SupportResources({ level, onClose }) {
  const { t } = useLanguage();
  const isHigh = level === 'high';

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 9999, padding: "20px"
    }}>
      <div style={{
        background: "#fff", maxWidth: "480px", width: "100%", borderRadius: "20px",
        padding: "28px", boxShadow: "0 20px 40px rgba(0,0,0,0.2)"
      }}>
        <h2 style={{ margin: "0 0 8px 0", fontSize: "20px" }}>
          {isHigh ? t("supportResources.headingHigh") : t("supportResources.headingLow")}
        </h2>

        <p style={{ margin: "0 0 16px 0", color: "#555", lineHeight: "1.6", fontSize: "14px" }}>
          {isHigh
            ? t("supportResources.bodyHigh")
            : t("supportResources.bodyLow")}
        </p>

        <div style={{ background: "#f9f5ff", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
          <h4 style={{ margin: "0 0 10px 0", fontSize: "14px" }}>{t("supportResources.immediateHelpIndia")}</h4>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <a href="tel:14416" style={btnPrimary}>
              {t("supportResources.callTeleManas", { number: "14416" })}
            </a>
            <a href="tel:18005990019" style={btnSecondary}>
              {t("supportResources.callKiran", { number: "1800-599-0019" })}
            </a>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <a href="tel:18602662345" style={btnSmall}>{t("supportResources.vandrevala", { number: "1860-2662-345" })}</a>
              <a href="tel:9152987821" style={btnSmall}>{t("supportResources.icall", { number: "9152987821" })}</a>
            </div>
          </div>

          <div style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <a href="https://findahelpline.org/countries/in" target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "#aa3bff" }}>{t("supportResources.moreHelplines", { site: "findahelpline.org" })}</a>
            <a href="https://telemanas.mohfw.gov.in" target="_blank" rel="noreferrer" style={{ fontSize: "12px", color: "#aa3bff" }}>{t("supportResources.chatTeleManas", { site: "telemanas.mohfw.gov.in" })}</a>
          </div>
        </div>

        <div style={{ background: "#fffbeb", borderRadius: "10px", padding: "12px", marginBottom: "18px" }}>
          <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.5" }}>
            <b>{t("supportResources.notReadyLead")}</b> {t("supportResources.notReadyText")}
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={onClose} style={btnPrimary}>{t("supportResources.continueJournaling")}</button>
          <button onClick={onClose} style={{ ...btnSecondary, background: "#fff" }}>{t("supportResources.close")}</button>
        </div>

        <p style={{ margin: "16px 0 0 0", fontSize: "11px", color: "#888", lineHeight: "1.4" }}>
          {t("supportResources.disclaimer")}
        </p>
      </div>
    </div>
  );
}

const btnPrimary = {
  display: "block", textAlign: "center", background: "#aa3bff", color: "#fff",
  padding: "12px", borderRadius: "10px", textDecoration: "none", fontWeight: "600",
  border: "none", cursor: "pointer", width: "100%"
};
const btnSecondary = {
  display: "block", textAlign: "center", background: "#f3f4f6", color: "#111",
  padding: "12px", borderRadius: "10px", textDecoration: "none", fontWeight: "500",
  border: "1px solid #e5e7eb", cursor: "pointer", width: "100%"
};
const btnSmall = {
  display: "block", textAlign: "center", background: "#fff", color: "#333",
  padding: "8px", borderRadius: "8px", textDecoration: "none", fontSize: "13px",
  border: "1px solid #ddd"
};
