import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import Exchange from "@/pages/Exchange";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/exchange" element={<Exchange />} />
      </Routes>
    </Router>
  );
}
