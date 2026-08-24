import { useEffect } from "react";
import LegalCookieBanner from "../components/LegalCookieBanner";
import LanguageToggle from "../components/LanguageToggle";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const ZEN_IMAGE = "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop";
const EMOVRA_LOGO = "/emovra-logo.png";

export default function LandingPage() {
  const { t, lang } = useLanguage();
  const goApp = () => (window.location.href = "/app");
  const goTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 75, behavior: 'smooth' });
  };

  useEffect(() => {
    document.body.style.background = "#09090b";
  }, []);

  return (
    <div style={{ minHeight:'100vh', background:'#0a0a0c', color:'#e8dcc6', fontFamily:'Inter, sans-serif' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .serif{font-family:'Instrument Serif',serif}
        .tracking-mini{letter-spacing:0.18em;text-transform:uppercase;font-size:9px}
        html{scroll-behavior:smooth} @media(max-width:900px){.landing-nav{display:none !important} .hero-grid{grid-template-columns:1fr !important} .features-grid{grid-template-columns:1fr !important} .hero-image-card{display:none !important}}
      `}} />

      <a href="#main-content" style={{ position:'absolute', left:'-9999px', top:0, background:'#d4c5a0', color:'#000', padding:'8px 16px', zIndex:9999 }} onFocus={e=>e.target.style.left='10px'} onBlur={e=>e.target.style.left='-9999px'}>{lang === "hi" ? "मुख्य सामग्री पर जाएं" : "Skip to main content"}</a>

      <header style={{ height:72, borderBottom:'0.5px solid rgba(212,197,160,0.15)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 32px', position:'sticky', top:0, background:'rgba(10,10,12,0.92)', backdropFilter:'blur(20px)', zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, cursor:'pointer' }} onClick={goTop}>
          <img src={EMOVRA_LOGO} alt="EMOVRA" style={{ height:52, width:'auto', objectFit:'contain' }} />
          <div style={{ display:'flex', flexDirection:'column', lineHeight:1.1 }}>
            <span className="serif" style={{ fontSize:18, fontWeight:600, letterSpacing:'0.12em', color:'#e8dcc6' }}>EMOVRA</span>
            <span style={{ fontSize:9, letterSpacing:'0.18em', textTransform:'uppercase', color:'rgba(212,197,160,0.7)', marginTop:2 }}>
              {t("brand.tagline")}
            </span>
          </div>
        </div>

        <nav aria-label="Main navigation" className="landing-nav" style={{ display:'flex', gap:28, fontSize:13, color:'rgba(232,220,198,0.6)' }}>
          <span onClick={goTop} style={{ color:'#d4c5a0', borderBottom:'1px solid #d4c5a0', cursor:'pointer' }}>{t("nav.home")}</span>
          <span onClick={()=>scrollTo('about')} style={{cursor:'pointer'}}>{t("nav.about")}</span>
          <span onClick={()=>scrollTo('features')} style={{cursor:'pointer'}}>{t("nav.features")}</span>
          <span onClick={()=>scrollTo('science')} style={{cursor:'pointer'}}>{t("nav.science")}</span>
          <span onClick={()=>scrollTo('journal')} style={{cursor:'pointer'}}>{t("nav.journal")}</span>
          <span onClick={()=>scrollTo('support')} style={{cursor:'pointer'}}>{t("nav.contact")}</span>
        </nav>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <LanguageToggle />
          <button onClick={goApp} style={{ border:'0.5px solid rgba(212,197,160,0.4)', background:'transparent', color:'#d4c5a0', padding:'8px 20px', borderRadius:999, fontSize:12, cursor:'pointer' }}>{t("nav.getStarted")}</button>
        </div>
      </header>

      <main id="main-content">
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'50px 32px', display:'grid', gridTemplateColumns:'1.1fr 0.9fr', gap:50, alignItems:'center' }} className="hero-grid">
          <div>
            <h1 className="serif" style={{ fontSize:'54px', lineHeight:1.05, fontWeight:400, color:'#e8dcc6', margin:0 }}>{t("hero.title1")}<br/>{t("hero.title2")}</h1>
            <p style={{ marginTop:20, color:'rgba(232,220,198,0.65)', fontSize:13.5, lineHeight:1.6, maxWidth:480, fontWeight:300 }}>
              {t("hero.subtitle")}
            </p>
            <div style={{ marginTop:28, display:'flex', gap:14 }}>
              <button onClick={goApp} style={{ background:'#d4b07a', color:'#000', border:0, padding:'12px 28px', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer' }}>{t("hero.begin")}</button>
              <button onClick={()=>scrollTo('features')} style={{ background:'transparent', border:'0.5px solid rgba(212,197,160,0.3)', color:'#d4c5a0', padding:'12px 28px', borderRadius:8, fontSize:12, cursor:'pointer' }}>{t("hero.learnMore")}</button>
            </div>

            <div style={{ marginTop:32, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, borderTop:'0.5px solid rgba(255,255,255,0.08)', paddingTop:20 }}>
              <div style={{ borderRight:'0.5px solid rgba(255,255,255,0.08)', paddingRight:12 }}>
                <div style={{ display:'flex', gap:8 }}><span>🛡</span><div><div style={{ fontSize:12, fontWeight:500 }}>{t("feature.private.title")}</div><div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:2 }}>{t("feature.private.desc")}</div></div></div>
              </div>
              <div style={{ borderRight:'0.5px solid rgba(255,255,255,0.08)', paddingRight:12, paddingLeft:4 }}>
                <div style={{ display:'flex', gap:8 }}><span>🧠</span><div><div style={{ fontSize:12, fontWeight:500 }}>{t("feature.therapist.title")}</div><div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:2 }}>{t("feature.therapist.desc")}</div></div></div>
              </div>
              <div style={{ paddingLeft:4 }}>
                <div style={{ display:'flex', gap:8 }}><span>🍃</span><div><div style={{ fontSize:12, fontWeight:500 }}>{t("feature.daily.title")}</div><div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:2 }}>{t("feature.daily.desc")}</div></div></div>
              </div>
            </div>

            <div style={{ marginTop:28, display:'flex', gap:40, borderTop:'0.5px solid rgba(255,255,255,0.08)', paddingTop:16 }}>
              <div><div style={{ fontSize:16, fontWeight:600 }}>• 98%</div><div style={{ fontSize:10, color:'rgba(255,255,255,0.4)' }}>{t("stats.stress")}</div></div>
              <div><div style={{ fontSize:16, fontWeight:600 }}>• 4.9/5</div><div style={{ fontSize:10, color:'rgba(255,255,255,0.4)' }}>{t("stats.rating")}</div></div>
            </div>
          </div>

          <div style={{ background:'rgba(15,15,17,0.6)', border:'0.5px solid rgba(212,197,160,0.25)', borderRadius:16, padding:16, height:460 }} className="hero-image-card">
            <div style={{ borderRadius:12, overflow:'hidden', height:260 }}><img src={ZEN_IMAGE} alt="zen" style={{ width:'100%', height:'100%', objectFit:'cover' }} /></div>
            <div style={{ textAlign:'center', marginTop:20 }}>
              <div className="tracking-mini" style={{ color:'#d4c5a0' }}>{t("session.tag")}</div>
              <div style={{ marginTop:22, fontSize:11, color:'rgba(255,255,255,0.4)' }}>{t("session.sub")}</div>
              <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:10 }}><div style={{ flex:1, height:1, background:'rgba(212,197,160,0.15)' }}><div style={{ width:'60%', height:'100%', background:'#d4c5a0' }}></div></div><div style={{ fontSize:10, color:'#d4c5a0' }}>∿∿∿</div></div>
              <button onClick={goApp} style={{ marginTop:18, background:'transparent', border:0, color:'#d4c5a0', fontSize:12, cursor:'pointer' }}>{t("session.start")}</button>
            </div>
          </div>
        </div>

        <div id="features" style={{ maxWidth:1280, margin:'0 auto', padding:'80px 32px', borderTop:'0.5px solid rgba(212,197,160,0.12)', background:'radial-gradient(600px at 20% 0%, rgba(212,197,160,0.06), transparent)' }}>
          <div className="tracking-mini" style={{ color:'#d4c5a0' }}>{t("features.tag")}</div>
          <h2 className="serif" style={{ fontSize:36, marginTop:10 }}>{t("features.title")}</h2>
          <div style={{ marginTop:24, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }} className="features-grid">
            <div style={{ background:'rgba(18,18,20,0.9)', border:'0.5px solid rgba(212,197,160,0.15)', borderRadius:12, padding:18 }}><div style={{ fontWeight:600 }}>{t("features.emotion.title")}</div><p style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:6 }}>{t("features.emotion.desc")}</p></div>
            <div style={{ background:'rgba(18,18,20,0.9)', border:'0.5px solid rgba(212,197,160,0.15)', borderRadius:12, padding:18 }}><div style={{ fontWeight:600 }}>{t("features.private2.title")}</div><p style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:6 }}>{t("features.private2.desc")}</p></div>
            <div style={{ background:'rgba(18,18,20,0.9)', border:'0.5px solid rgba(212,197,160,0.15)', borderRadius:12, padding:18 }}><div style={{ fontWeight:600 }}>{t("features.sos.title")}</div><p style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginTop:6 }}>{t("features.sos.desc")}</p></div>
          </div>
        </div>

        <div id="science" style={{ maxWidth:1280, margin:'0 auto', padding:'80px 32px', borderTop:'0.5px solid rgba(212,197,160,0.12)' }}>
          <div className="tracking-mini" style={{ color:'#d4c5a0' }}>{t("science.tag")}</div>
          <h2 className="serif" style={{ fontSize:32, marginTop:10 }}>{t("science.title")}</h2>
          <p style={{ color:'rgba(255,255,255,0.45)', fontSize:13, maxWidth:500, marginTop:10 }}>{t("science.desc")}</p>
        </div>

        <div id="journal" style={{ maxWidth:1280, margin:'0 auto', padding:'80px 32px', borderTop:'0.5px solid rgba(212,197,160,0.12)' }}>
          <div className="tracking-mini" style={{ color:'#d4c5a0' }}>{t("journal.tag")}</div>
          <h2 className="serif" style={{ fontSize:32, marginTop:10 }}>{t("journal.title")}</h2>
          <button onClick={goApp} style={{ marginTop:16, background:'#d4b07a', color:'#000', border:0, padding:'10px 20px', borderRadius:999, fontSize:12, cursor:'pointer' }}>{t("journal.open")}</button>
        </div>

        <div id="about" style={{ maxWidth:1280, margin:'0 auto', padding:'80px 32px', borderTop:'0.5px solid rgba(212,197,160,0.12)', textAlign:'center' }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:16 }}>
            <img src={EMOVRA_LOGO} alt="EMOVRA" style={{ height:68, width:'auto', objectFit:'contain' }} />
          </div>
          <div className="tracking-mini" style={{ color:'#d4c5a0' }}>{t("about.tag")}</div>
          <h2 className="serif" style={{ fontSize:36, marginTop:10 }}>{t("about.title")}</h2>
          <p style={{ color:'rgba(255,255,255,0.45)', maxWidth:520, margin:'12px auto', fontSize:13 }}>{t("about.desc")}</p>
        </div>

        <div id="support" style={{ maxWidth:1280, margin:'0 auto', padding:'50px 32px', borderTop:'0.5px solid rgba(212,197,160,0.12)', background:'rgba(18,18,20,0.4)', textAlign:'center' }}>
          <div className="tracking-mini" style={{ color:'#d4c5a0' }}>{t("support.tag")}</div>
          <h2 className="serif" style={{ fontSize:32, marginTop:10 }}>{t("support.title")}</h2>
          <div style={{ display:'flex', justifyContent:'center', gap:16, marginTop:24, flexWrap:'wrap' }}>
            <a href="tel:9999773355" style={{ background:'#d4b07a', color:'#000', padding:'12px 20px', borderRadius:999, textDecoration:'none', fontWeight:700, fontSize:13 }}>📞 9999773355</a>
            <a href="mailto:shukla.kratitva@gmail.com" style={{ border:'0.5px solid rgba(212,197,160,0.3)', color:'#d4c5a0', padding:'12px 20px', borderRadius:999, textDecoration:'none', fontWeight:600, fontSize:13 }}>✉ shukla.kratitva@gmail.com</a>
          </div>
          <div style={{ marginTop:30, display:'flex', justifyContent:'space-between' }} className="tracking-mini">
            <span style={{ color:'rgba(255,255,255,0.25)', display:'flex', alignItems:'center', gap:8 }}><img src={EMOVRA_LOGO} alt="logo" style={{ height:24, width:'auto' }} /> © 2026 EMOVRA</span>
            <span onClick={goApp} style={{ cursor:'pointer', color:'rgba(255,255,255,0.5)' }}>{t("footer.launch")}</span>
          </div>
        </div>
      </main>

      <LegalCookieBanner />
    </div>
  );
}
