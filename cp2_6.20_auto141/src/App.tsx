import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import EditorPage from "@/pages/EditorPage";
import ArenaPage from "@/pages/ArenaPage";
import LeaderboardPage from "@/pages/LeaderboardPage";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/editor" replace />} />
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/arena" element={<ArenaPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}
