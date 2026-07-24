import { Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import MindGuardApp from "./pages/MindGuardApp";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/app" element={<MindGuardApp />} />
    </Routes>
  );
}