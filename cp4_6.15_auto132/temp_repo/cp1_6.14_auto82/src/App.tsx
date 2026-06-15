import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Generator from "@/pages/Generator";
import History from "@/pages/History";
import Navbar from "@/components/Navbar";

export default function App() {
  return (
    <Router>
      <Navbar />
      <main className="pt-16 min-h-screen">
        <Routes>
          <Route path="/" element={<Generator />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </main>
    </Router>
  );
}
