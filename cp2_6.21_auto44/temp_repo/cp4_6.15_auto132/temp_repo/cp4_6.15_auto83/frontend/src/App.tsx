import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import WelcomePage from "@/components/WelcomePage";
import PlaylistPage from "@/components/PlaylistPage";
import HistoryPage from "@/components/HistoryPage";
import Sidebar from "@/components/Sidebar";
import Player from "@/components/Player";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Sidebar />
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/playlist" element={<PlaylistPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
        <Player />
      </div>
    </Router>
  );
}
