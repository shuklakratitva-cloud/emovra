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
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN, tracesSampleRate: 0.1 });
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
