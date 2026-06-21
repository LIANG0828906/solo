import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import BoardPage from "@/pages/BoardPage";
import TimelinePage from "@/pages/TimelinePage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<BoardPage />} />
        <Route path="/timeline" element={<TimelinePage />} />
      </Routes>
    </Router>
  );
}
