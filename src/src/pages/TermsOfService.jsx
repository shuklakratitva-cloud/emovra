import { useNavigate } from "react-router-dom";

// NEW: real Terms of Service - Privacy Policy covered what data is
// collected and how it's handled; this covers the separate question of
// what using the service actually means - account responsibilities,
// what Emovra is and isn't, and the basic terms of using it.
export default function TermsOfService() {
  const navigate = useNavigate();
  const Section = ({ title, children }) => (
    <div style={{ marginTop: 28 }}>
      <h2 style={{ fontSize: 18, color: "#d4b07a", marginBottom: 8 }}>{title}</h2>
      <div style={{ fontSize: 14, lineHeight: 1.7, color: "#e8dcc6cc" }}>{children}</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0c", color: "#e8dcc6", padding: "40px 20px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <button onClick={() => navigate(-1)} style={{ background: "transparent", border: "1px solid rgba(212,197,160,0.3)", color: "#e8dcc6", padding: "8px 16px", borderRadius: 999, cursor: "pointer", fontSize: 12, marginBottom: 24 }}>
          ← Back
        </button>
        <h1 style={{ fontSize: 28, color: "#d4b07a" }}>Terms of Service</h1>
        <p style={{ fontSize: 12, opacity: 0.6 }}>Last updated: August 11, 2026</p>

        <Section title="What Emovra is - and isn't">
          <p>Emovra is a wellness and self-reflection tool for young people in India. It is <b>not</b> a hospital, a licensed medical provider, or a replacement for professional therapy or psychiatric care. If you are in crisis, call Tele-MANAS (14416), Kiran (1800-599-0019), or AASRA (1800-233-3330), or contact a trusted adult.</p>
        </Section>

        <Section title="Who can use Emovra">
          <p>Emovra collects an emergency contact at signup as a required safety feature, which assumes a parent or guardian is reachable. If you are using Emovra and are under the age appropriate for creating your own account under your local law, please have a parent or guardian assist with signup.</p>
        </Section>

        <Section title="Your account">
          <p>You're responsible for keeping your password private and for what happens under your account. Give us accurate signup information, especially your emergency contact - it exists specifically to reach someone who can help you in a crisis, and it only works if it's real and current.</p>
        </Section>

        <Section title="Acceptable use">
          <p>Use Emovra for your own genuine wellness reflection. Don't use it to harass others, impersonate someone else, submit someone else's private information without their consent (Shared Journal is opt-in for a reason), or attempt to interfere with or reverse-engineer the safety detection systems.</p>
        </Section>

        <Section title="No medical or crisis guarantee">
          <p>Emovra's AI risk detection is a support tool, not a diagnostic or monitoring service, and it can be wrong - it may miss something serious or flag something that isn't. It is not a substitute for calling a helpline or a trusted person directly in an actual emergency. Do not rely on Emovra as your only safety plan.</p>
        </Section>

        <Section title="Your content">
          <p>What you write stays yours. Your Personal Journal is never analyzed, read, or used for any purpose beyond storing it for you, encrypted, exactly as described in the Privacy Policy. Content you submit for risk analysis (Check-in, Voice &amp; Mood) is used only for the safety purposes described there.</p>
        </Section>

        <Section title="Changes to the service">
          <p>Emovra is an actively developed, independent project. Features may be added, changed, or removed over time as it improves. We'll keep the core safety commitments in the Privacy Policy - GREEN messages never saved, your Journal never analyzed - regardless of what else changes.</p>
        </Section>

        <Section title="Ending your account">
          <p>You can export or permanently delete your account and data at any time from Settings, no need to ask anyone's permission first.</p>
        </Section>

        <Section title="Contact">
          <p>Questions about these terms: <a href="mailto:shukla.kratitva@gmail.com" style={{ color: "#d4b07a" }}>shukla.kratitva@gmail.com</a></p>
        </Section>
      </div>
    </div>
  );
}
