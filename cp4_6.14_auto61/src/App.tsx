import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./HomePage";
import DebateRoom from "./DebateRoom";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/debate/:id" element={<DebateRoom />} />
      </Routes>
    </Router>
  );
}
