import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import HabitList from "@/modules/habits/HabitList";
import RecordPanel from "@/modules/habits/RecordPanel";
import StatsView from "@/modules/stats/StatsView";
import ChallengeBoard from "@/modules/community/ChallengeBoard";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/habits" replace />} />
          <Route path="/habits" element={<HabitList />} />
          <Route path="/record" element={<RecordPanel />} />
          <Route path="/stats" element={<StatsView />} />
          <Route path="/community" element={<ChallengeBoard />} />
        </Routes>
      </Layout>
    </Router>
  );
}
