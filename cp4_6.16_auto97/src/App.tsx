import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import HomePage from "@/pages/HomePage";
import ChallengePage from "@/pages/ChallengePage";
import { useStore } from "@/store";

export default function App() {
  const loadPersistedData = useStore(s => s.loadPersistedData);

  useEffect(() => {
    loadPersistedData();
  }, [loadPersistedData]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/challenge/:id" element={<ChallengePage />} />
      </Routes>
    </Router>
  );
}
