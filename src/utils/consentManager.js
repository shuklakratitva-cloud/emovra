export const LEGAL_CONSENT_TEXT = `VOLUNTARY CONSENT: I willingly provide my data to Emovra. I understand Emovra is NOT a medical provider, NOT a hospital, NOT therapy. I use it at my sole risk. Emovra has NO liability for any outcomes. I consent to essential cookies for login/security and functional cookies.`;
export const saveConsent = (type) => {
  const consentData = {
    type,
    timestamp: new Date().toISOString(),
    consentText: LEGAL_CONSENT_TEXT,
    consentVersion: "v1.0 - 26 July 2026"
  };
  localStorage.setItem("emovra_legal_consent", JSON.stringify(consentData));
  return consentData;
};
export const hasConsent = () => {
  return!!localStorage.getItem("emovra_legal_consent");
};
