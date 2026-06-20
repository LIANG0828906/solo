import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import WorkshopPage from "@/pages/WorkshopPage";
import VotePage from "@/pages/VotePage";
import TaskBoardPage from "@/pages/TaskBoardPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/workshop/:id" element={<WorkshopPage />} />
        <Route path="/workshop/:id/vote" element={<VotePage />} />
        <Route path="/workshop/:id/tasks" element={<TaskBoardPage />} />
      </Routes>
    </Router>
  );
}
