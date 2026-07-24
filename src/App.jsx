import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import MindGuardApp from "./pages/MindGuardApp";
import AdminPanel from "./pages/AdminPanel"; // <-- NEW

// Simple protection
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/" replace />;
  return children;
}

function AdminRoute({ children }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!token) return <Navigate to="/" replace />;
  // if user role is not admin, push back to /app
  if (user?.role !== 'admin') return <Navigate to="/app" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      
      <Route path="/app" element={
        <ProtectedRoute>
          <MindGuardApp />
        </ProtectedRoute>
      } />

      {/* FIX FOR YOUR BLANK ADMIN PAGE */}
      <Route path="/admin" element={
        <AdminRoute>
          <AdminPanel />
        </AdminRoute>
      } />

      {/* Fallback - prevents blank page on unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}