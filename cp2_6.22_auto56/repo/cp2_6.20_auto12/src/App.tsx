import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CreatePoll from "@/pages/CreatePoll";
import VotePoll from "@/pages/VotePoll";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CreatePoll />} />
        <Route path="/poll/:id" element={<VotePoll />} />
      </Routes>
    </Router>
  );
}
