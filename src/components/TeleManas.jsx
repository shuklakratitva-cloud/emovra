import React from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function TeleManas() {
  const { t } = useLanguage();
  const phoneNumber = "14416";
  const phoneNumberDial = "14416";
  const alternateNumber = "1-800-89-14416";
  const alternateDial = "18008914416";

  return (
    <div
      style={{
        background: "var(--card-bg)",
        border: "2px solid #fb923c",
        borderRadius: "16px",
        padding: "24px",
        marginTop: "20px",
        boxShadow: "0 4px 12px rgba(0,0,0,.08)",
        color: "var(--text)"
      }}
    >
      <h2 style={{color:"var(--text)"}}>{t("teleManas.heading")}</h2>

      <p style={{color:"var(--text)", lineHeight:1.6}}>
        <strong>Tele-MANAS</strong> {t("teleManas.introRest")}
      </p>

            <div className="helpline-box" style={{ background: "var(--card-bg)", border:"1px solid var(--border)", padding: "16px", borderRadius: "12px", margin: "20px 0" }}>
        <h3 style={{color:"var(--text)", margin:"0 0 8px 0"}}>{t("teleManas.helplineNumbersHeading")}</h3>
        <p style={{color:"var(--muted)", margin:"4px 0"}}><strong style={{color:"var(--text)"}}>{t("teleManas.primaryLabel")}</strong> {phoneNumber}</p>
        <p style={{color:"var(--muted)", margin:"4px 0 12px 0"}}><strong style={{color:"var(--text)"}}>{t("teleManas.tollFreeLabel")}</strong> {alternateNumber}</p>

        <a href={`tel:${phoneNumberDial}`} style={{ display: "inline-block", padding: "10px 20px", marginRight: "10px", background: "#2563eb", color: "#fff", borderRadius: "8px", textDecoration: "none", fontWeight: "bold" }}>
          {t("teleManas.callNumber", { number: phoneNumber })}
        </a>
        <a href={`tel:${alternateDial}`} style={{ display: "inline-block", padding: "10px 20px", background: "#16a34a", color: "#fff", borderRadius: "8px", textDecoration: "none", fontWeight: "bold" }}>
          {t("teleManas.callTollFree")}
        </a>
      </div>

      <h3 style={{color:"var(--text)"}}>{t("teleManas.whenToReachOut")}</h3>
      <ul style={{color:"var(--text)"}}>
        <li>{t("teleManas.bullet1")}</li>
        <li>{t("teleManas.bullet2")}</li>
        <li>{t("teleManas.bullet3")}</li>
        <li>{t("teleManas.bullet4")}</li>
        <li>{t("teleManas.bullet5")}</li>
      </ul>

      <div style={{ background: "#fee2e2", border: "1px solid #fecaca", padding: "16px", borderRadius: "10px", marginTop: "20px", color:"#7f1d1d" }}>
        <strong>{t("teleManas.emergencyNoticeLabel")}</strong>
        <p style={{ marginTop: "10px", color:"#7f1d1d" }}>
          {t("teleManas.emergencyNoticeTextBefore")}<strong>{t("teleManas.emergencyNoticeNot")}</strong>{t("teleManas.emergencyNoticeTextAfter")}
        </p>
      </div>

      <div style={{ marginTop: "20px", fontSize: "14px", color: "var(--muted)" }}>
        <strong style={{color:"var(--text)"}}>{t("teleManas.privacyNoteLabel")}</strong> {t("teleManas.privacyNoteText")}
      </div>
    </div>
  );
}
