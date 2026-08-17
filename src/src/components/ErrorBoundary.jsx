import React from "react";
import * as Sentry from "@sentry/react"; // NEW: error monitoring
import { translations } from "../i18n/translations.js";

// FIX: rewrote the fallback UI - the old version said "Check console (F12)
// for details," which is developer language, not something a distressed
// person mid-crisis should be looking at. This is the absolute last-resort
// screen for the whole app, so it now also keeps the crisis helplines
// visible even when everything else has broken - the one thing that
// should never disappear, no matter what crashed.
//
// NOTE: this is a class component (React error boundaries must be classes),
// so it can't use the useLanguage() hook. Instead it reads the stored
// language preference directly from localStorage and does the same
// lookup/fallback the LanguageContext does, without needing the provider.
function errT(key) {
  let lang = "en";
  try {
    lang = localStorage.getItem("emovra_lang") || "en";
  } catch {}
  return translations[lang]?.[key] ?? translations.en[key] ?? key;
}

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("App crashed:", error, info);
    if (import.meta.env.VITE_SENTRY_DSN) Sentry.captureException(error, { extra: info }); // NEW
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100vh", background: "#0a0a0c", color: "#e8dcc6", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui" }}>
          <div style={{ maxWidth: 440, textAlign: "center" }}>
            <h2 style={{ margin: "0 0 8px" }}>{errT("errorBoundary.title")}</h2>
            <p style={{ opacity: 0.75, fontSize: 14, lineHeight: 1.6 }}>
              {errT("errorBoundary.message")}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: "10px 24px", borderRadius: 999, border: "none", background: "#d4b07a", color: "#000", fontWeight: 700, cursor: "pointer", marginTop: 16 }}
            >
              {errT("errorBoundary.reload")}
            </button>

            <div style={{ marginTop: 28, paddingTop: 20, borderTop: "0.5px solid rgba(212,197,160,0.2)" }}>
              <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 6px" }}>
                {errT("errorBoundary.crisisPrompt")}
              </p>
              <p style={{ fontSize: 13, lineHeight: 1.8, margin: 0 }}>
                <b>Tele-MANAS: 14416</b> &nbsp;|&nbsp; <b>Kiran: 1800-599-0019</b> &nbsp;|&nbsp; <b>AASRA: 1800-233-3330</b>
              </p>
            </div>

            <button
              onClick={() => this.setState((s) => ({ showDetails: !s.showDetails }))}
              style={{ marginTop: 20, background: "transparent", border: "none", color: "rgba(232,220,198,0.4)", fontSize: 11, cursor: "pointer", textDecoration: "underline" }}
            >
              {this.state.showDetails ? errT("errorBoundary.hideDetails") : errT("errorBoundary.showDetails")}
            </button>
            {this.state.showDetails && (
              <p style={{ marginTop: 8, fontSize: 11, opacity: 0.5, wordBreak: "break-word" }}>{this.state.error?.message}</p>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
