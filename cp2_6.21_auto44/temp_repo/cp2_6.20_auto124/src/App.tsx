import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import TimelinePage from "@/pages/TimelinePage";
import AchievementsPage from "@/pages/AchievementsPage";
import StatsPage from "@/pages/StatsPage";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#1a1d23] text-[#e0e0e0]">
        <Navbar />
        <main className="pt-20 pb-12 px-6 container mx-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/timeline" replace />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/achievements" element={<AchievementsPage />} />
            <Route path="/stats" element={<StatsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
