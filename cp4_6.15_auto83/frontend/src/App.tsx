import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import WelcomePage from "@/components/WelcomePage";
import PlaylistPage from "@/components/PlaylistPage";
import HistoryPage from "@/components/HistoryPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/playlist" element={<PlaylistPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
    </Router>
  );
}
