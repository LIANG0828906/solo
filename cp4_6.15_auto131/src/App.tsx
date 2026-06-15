import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Card from "@/pages/Card";
import Community from "@/pages/Community";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/card" element={<Card />} />
        <Route path="/community" element={<Community />} />
      </Routes>
    </Router>
  );
}
