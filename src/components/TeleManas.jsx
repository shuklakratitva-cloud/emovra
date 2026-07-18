// src/components/TeleManas.jsx

import React from "react";

export default function TeleManas() {
  const phoneNumber = "14416";
  const phoneNumberDial = "14416";
  const alternateNumber = "1-800-89-14416";
  const alternateDial = "18008914416";

  return (
    <div
      style={{
        background: "var(--card-bg, #fff7ed)",
        border: "2px solid #fb923c",
        borderRadius: "16px",
        padding: "24px",
        marginTop: "20px",
        boxShadow: "0 4px 12px rgba(0,0,0,.08)",
      }}
    >
      <h2>📞 Tele-MANAS Support</h2>

      <p>
        <strong>Tele-MANAS</strong> (Tele Mental Health Assistance and Networking Across States) is India's
        national mental health support service. If you're feeling overwhelmed, distressed, or need someone to
        talk to, trained mental health professionals are available to help.
      </p>

      <div style={{ background: "#ffffff", padding: "16px", borderRadius: "12px", margin: "20px 0" }}>
        <h3>☎ Helpline Numbers</h3>
        <p><strong>Primary:</strong> {phoneNumber}</p>
        <p><strong>Toll-Free:</strong> {alternateNumber}</p>

        <a
          href={`tel:${phoneNumberDial}`}
          style={{
            display: "inline-block",
            padding: "10px 20px",
            marginRight: "10px",
            background: "#2563eb",
            color: "#fff",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          📞 Call {phoneNumber}
        </a>

        <a
          href={`tel:${alternateDial}`}
          style={{
            display: "inline-block",
            padding: "10px 20px",
            background: "#16a34a",
            color: "#fff",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          📞 Call Toll-Free
        </a>
      </div>

      <h3>When should you reach out?</h3>
      <ul>
        <li>Feeling anxious or overwhelmed for a long time.</li>
        <li>Experiencing bullying or emotional abuse.</li>
        <li>Feeling lonely or hopeless.</li>
        <li>Having difficulty coping with stress.</li>
        <li>Having thoughts of self-harm or suicide.</li>
      </ul>

      <div style={{ background: "#fee2e2", border: "1px solid #ef4444", padding: "16px", borderRadius: "10px", marginTop: "20px" }}>
        <strong>⚠ Emergency Notice</strong>
        <p style={{ marginTop: "10px" }}>
          If someone is in immediate danger or has an urgent medical emergency, contact your local emergency
          services or go to the nearest hospital immediately. This app is designed to provide guidance and support,
          but it is <strong>not</strong> a replacement for professional medical care.
        </p>
      </div>

      <div style={{ marginTop: "20px", fontSize: "14px", color: "#555" }}>
        <strong>Privacy Note:</strong> Your journal entries, mood history, and analyses are stored locally in your
        browser unless you choose to share them.
      </div>
    </div>
  );
}