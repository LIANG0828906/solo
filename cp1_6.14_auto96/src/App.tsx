import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CellarPage from "@/pages/CellarPage";
import BottleDetailPage from "@/pages/BottleDetailPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CellarPage />} />
        <Route path="/bottle/:id" element={<BottleDetailPage />} />
      </Routes>
    </Router>
  );
}
