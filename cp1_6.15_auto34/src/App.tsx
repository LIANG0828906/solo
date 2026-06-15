import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { MapPage } from "@/pages/MapPage";
import { DetailPage } from "@/pages/DetailPage";
import { EditorPage } from "@/pages/EditorPage";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <Routes location={location} key={location.key}>
      <Route path="/" element={<MapPage />} />
      <Route path="/location/:locationId" element={<DetailPage />} />
      <Route path="/diary/new" element={<EditorPage />} />
      <Route path="/diary/:diaryId" element={<EditorPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}
