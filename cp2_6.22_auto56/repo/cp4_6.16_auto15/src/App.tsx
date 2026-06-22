import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import MeetingEditor from "@/modules/meeting/MeetingEditor";
import TaskBoard from "@/modules/task/TaskBoard";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/meeting/new" element={<MeetingEditor />} />
        <Route path="/meeting/:id" element={<MeetingEditor />} />
        <Route path="/tasks" element={<TaskBoard />} />
      </Routes>
    </Router>
  );
}
