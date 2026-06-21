import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CreatePoll from "@/pages/CreatePoll";
import VotePage from "@/pages/VotePage";
import ResultsDashboard from "@/pages/ResultsDashboard";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<CreatePoll />} />
      <Route path="/poll/:id" element={<VotePage />} />
      <Route path="/poll/:id/results" element={<ResultsDashboard />} />
    </Routes>
  );
}
