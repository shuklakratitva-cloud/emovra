import { Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "./i18n/LanguageContext.jsx"; // NEW: Hindi/English language support
import LandingPage from "./pages/LandingPage";
import MindGuardApp from "./pages/MindGuardApp";
import Dashboard from "./pages/Dashboard"; // NEW: personalized dashboard, shown right after login
import PrivacyPolicy from "./pages/PrivacyPolicy"; // NEW: real, hosted privacy policy - needed for Google OAuth publishing
import TermsOfService from "./pages/TermsOfService"; // NEW: matching ToS page
import NotFound from "./pages/NotFound"; // NEW: replaces the silent redirect-to-home for unmatched URLs
// FIX: was importing AdminPanel, which calls a backend route
// (/api/alerts/all) that never existed - the working Admin.jsx (with
// working /api/admin/reds calls, filter tabs, WhatsApp/call buttons) was
// never actually wired into the router at all.
//
// NOTE: I'm assuming Admin.jsx lives at src/pages/Admin.jsx, matching where
// AdminPanel.jsx was (src/pages/AdminPanel.jsx). If Admin.jsx actually lives
// somewhere else in your project (e.g. src/components/Admin.jsx), just
// adjust this import path to match.
import AdminPanel from "./pages/Admin";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/" replace />;
  return children;
}

function AdminRoute({ children }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!token) return <Navigate to="/" replace />;
  if (user?.role !== 'admin') return <Navigate to="/app" replace />;
  return children;
}

export default function App() {
  return (
    <LanguageProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        {/* /app is public so Launch button works - MindGuardApp shows Login inside itself */}
        <Route path="/app" element={<MindGuardApp />} />

        {/* NEW: shown right after signup/login (Auth.jsx navigates here),
            before the person reaches the main app tabs.
            CHANGED: "/dashboard" -> "/dashboard/*" so Dashboard.jsx can own
            real sub-routes (/dashboard/mood, /dashboard/rituals, etc) - each
            sidebar button now opens an actual page with its own URL instead
            of just flipping internal state. */}
        <Route path="/dashboard/*" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        {/* NEW: public, real privacy policy page - no login required, since
            Google (and anyone else) needs to be able to reach it directly */}
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />

        <Route path="/admin" element={
          <AdminRoute>
            <AdminPanel />
          </AdminRoute>
        } />

        {/* FIX: was silently redirecting any unmatched URL to the homepage
            with zero explanation - now shows a real 404 page instead */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </LanguageProvider>
  );
}
