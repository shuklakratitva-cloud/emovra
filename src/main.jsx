import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import * as Sentry from "@sentry/react"; // NEW: error monitoring

import App from "./App";
import "./index.css";
import { initTheme } from "./utils/applyTheme.js";
import ErrorBoundary from "./components/ErrorBoundary.jsx"; // NEW

// NEW: error monitoring - same pattern as the backend. Only activates if
// VITE_SENTRY_DSN is set at build time, so this is a no-op for anyone who
// hasn't set up a Sentry account yet. Add it as an environment variable in
// Cloudflare Pages' build settings once you have a DSN.
//
// Session Replay is included here too, but tuned for a mental-health app:
// normal sessions are NEVER recorded (replaysSessionSampleRate: 0), and even
// the replay captured on an actual error has all text, all inputs, and all
// media masked or blocked, so journal content, chat text, or images can
// never leave the browser.
if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
          dsn: import.meta.env.VITE_SENTRY_DSN,
          tracesSampleRate: 0.1,
          integrations: [
                  Sentry.replayIntegration({
                            maskAllText: true,
                            maskAllInputs: true,
                            blockAllMedia: true,
                  }),
                ],
          replaysSessionSampleRate: 0, // never record ordinary sessions - privacy first
          replaysOnErrorSampleRate: 1.0, // only capture a replay when something actually errors
    });
}

// NEW: applies Classic Black & Gold immediately (so there's never a flash
// of unstyled content), then swaps in the person's saved theme preference
// once fetched, if they're logged in and picked something else in Settings.
initTheme();

// FIX: ErrorBoundary existed in the codebase this whole time but was
// never actually wrapped around anything - meaning any unexpected
// rendering crash, anywhere in the app, showed a blank white screen with
// zero explanation. For a mental-health app, that's a real problem if it
// happens to someone during a hard moment. Now wraps the entire app, so a
// crash shows a calm "something went wrong, reload" message instead.
ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <ErrorBoundary>
              <BrowserRouter>
                      <App />
              </BrowserRouter>
        </ErrorBoundary>
    </React.StrictMode>
  );
</React.StrictMode>
