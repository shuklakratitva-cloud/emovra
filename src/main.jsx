import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";
import { initTheme } from "./utils/applyTheme.js"; // NEW

// NEW: applies Classic Black & Gold immediately (so there's never a flash
// of unstyled content), then swaps in the person's saved theme preference
// once fetched, if they're logged in and picked something else in Settings.
initTheme();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
