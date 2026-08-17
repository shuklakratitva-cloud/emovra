import { useState, useEffect } from "react";
import { saveConsent, hasConsent, LEGAL_CONSENT_TEXT } from "../utils/consentManager";
import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function LegalCookieBanner() {
  const [show, setShow] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (!hasConsent()) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 99999, background: '#0a0a0a', borderTop: '1px solid #333', color: 'white', padding: '20px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <h3 style={{ margin: '0 0 8px 0' }}>{t("legalCookieBanner.heading")}</h3>
        <p style={{ fontSize: '13px', color: '#ccc', lineHeight: '1.5' }}>
          {t("legalCookieBanner.description")}
          {" "}<a href="/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: "#d4b07a" }}>{t("legalCookieBanner.privacyPolicyLink")}</a>
          {" "}{t("legalCookieBanner.orOur")} <a href="/terms-of-service" target="_blank" rel="noopener noreferrer" style={{ color: "#d4b07a" }}>{t("legalCookieBanner.termsOfServiceLink")}</a>
        </p>
        {showDetails && <pre style={{ fontSize: '11px', background: '#1a1a1a', padding: '12px', borderRadius: '6px', whiteSpace: 'pre-wrap', maxHeight: '150px', overflowY: 'auto' }}>{LEGAL_CONSENT_TEXT}</pre>}
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button onClick={() => setShowDetails(!showDetails)} style={{ background: 'transparent', color: '#ccc', border: '1px solid #444', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer' }}>{showDetails? t("legalCookieBanner.hide") : t("legalCookieBanner.readLegalText")}</button>
          <button onClick={() => { saveConsent("all"); setShow(false); }} style={{ background: 'white', color: 'black', padding: '8px 18px', borderRadius: '6px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>{t("legalCookieBanner.acceptAll")}</button>
        </div>
      </div>
    </div>
  );
}
