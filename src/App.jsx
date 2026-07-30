import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import MindGuardApp from "./pages/MindGuardApp";
import Dashboard from "./pages/Dashboard"; // NEW: personalized dashboard, shown right after login
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
    <Routes>
      <Route path="/" element={<LandingPage />} />

      {/* /app is public so Launch button works - MindGuardApp shows Login inside itself */}
      <Route path="/app" element={<MindGuardApp />} />

      {/* NEW: shown right after signup/login (Auth.jsx navigates here),
          before the person reaches the main app tabs */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />

      <Route path="/admin" element={
        <AdminRoute>
          <AdminPanel />
        </AdminRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
