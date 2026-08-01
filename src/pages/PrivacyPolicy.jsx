import { useNavigate } from "react-router-dom";

// NEW: real, hosted privacy policy page - was previously only a short
// liability-disclaimer sentence shown in a cookie banner, with no actual
// standalone page or public URL. Needed for Google OAuth's app publishing
// step (Google checks for an actual privacy policy URL), and honestly
// just needed regardless of that - it describes what the app really does
// with data, not generic boilerplate.
export default function PrivacyPolicy() {
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
        <h1 style={{ fontSize: 28, color: "#d4b07a" }}>Privacy Policy</h1>
        <p style={{ fontSize: 12, opacity: 0.6 }}>Last updated: August 1, 2026</p>

        <Section title="What Emovra is">
          <p>Emovra is an AI-assisted mental wellness app for young people in India. It is <b>not</b> a hospital, licensed therapy, or a medical provider, and does not replace professional care. If you are in crisis, call Tele-MANAS (14416), Kiran (1800-599-0019), or AASRA (1800-233-3330).</p>
        </Section>

        <Section title="What we collect">
          <p>When you create an account: your name, email, age, a password (stored only as a one-way hash, never in readable form), and an emergency contact name and phone number (used only for the SOS feature).</p>
          <p style={{ marginTop: 8 }}>When you use the app: check-in text, voice recordings, and mood entries you submit for analysis; personal journal entries; optional profile customization (avatar photo, theme colors, birthday month/day).</p>
        </Section>

        <Section title="How your check-ins are handled">
          <p>Messages you submit for analysis (Check-in, Voice &amp; Mood) are processed by AI to assess risk level. Messages assessed as low-risk ("GREEN") are <b>never saved</b> to our servers at all. Messages assessed as higher-risk are encrypted and stored so support resources can be shown to you and, for a narrow category (school-related emotional abuse), so a trained admin can review it.</p>
        </Section>

        <Section title="Your personal Journal is different">
          <p>Entries in the Personal Journal tab are encrypted, <b>never analyzed by AI</b>, and never visible to an admin. This space is intentionally unmonitored.</p>
        </Section>

        <Section title="AI providers we use">
          <p>To analyze check-in text and voice, Emovra sends that content to Google Gemini and, as a backup, Groq. Google Sign-In (if you use it) shares your name, email, and a Google account identifier with us, governed by Google's own privacy policy for that exchange.</p>
        </Section>

        <Section title="Other services we rely on">
          <p>MongoDB Atlas (database hosting), Render (backend hosting), Cloudflare (frontend hosting), and Resend (transactional email, e.g. password-reset codes). Each has its own privacy practices governing infrastructure-level data handling.</p>
        </Section>

        <Section title="Cookies &amp; local storage">
          <p>Emovra uses your browser's local storage to keep you signed in (an authentication token) and to remember preferences. We don't use third-party advertising trackers.</p>
        </Section>

        <Section title="Children &amp; age">
          <p>Emovra asks for your age at signup because it's built for young people navigating mental health, and some features are age-aware. If you are a parent or guardian with concerns about a minor's use of this app, please reach out using the contact info below.</p>
        </Section>

        <Section title="Your choices">
          <p>You can edit your profile, delete individual journal entries, and clear your mood history at any time from within the app. To request full account deletion or ask what data is stored about you, contact us using the details below.</p>
        </Section>

        <Section title="Contact">
          <p>For privacy questions or data requests, contact: <b>shukla.kratitva@gmail.com</b></p>
        </Section>
      </div>
    </div>
  );
}
