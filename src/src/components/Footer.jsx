import { useLanguage } from "../i18n/LanguageContext.jsx";

export default function Footer(){
  const { t } = useLanguage();
  return (
    <footer style={{marginTop:40, padding:"24px 16px", borderTop:"1px solid var(--border)", textAlign:"center", fontSize:13, opacity:0.8}}>
      <p style={{margin:"0 0 8px", fontWeight:600}}>{t("footer.disclaimer")}</p>
      <p style={{margin:0, lineHeight:1.6}}>
        {t("footer.crisisPrefix")} — <b>Tele-MANAS: 14416</b> | <b>Kiran: 1800-599-0019</b> | <b>AASRA: 1800-233-3330</b>
        <br/> {t("footer.notAlone")}
      </p>
      <p style={{margin:"12px 0 0", fontSize:11, opacity:0.6}}>{t("footer.copyright", { year: new Date().getFullYear() })}</p>
      <p style={{margin:"8px 0 0", fontSize:10, opacity:0.4}}>{t("footer.medicalDisclaimer")}</p>
    </footer>
  )
}
