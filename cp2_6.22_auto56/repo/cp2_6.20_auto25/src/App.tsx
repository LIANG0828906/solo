import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "@/components/Navbar";
import GalleryPage from "@/pages/GalleryPage";
import UploadPage from "@/pages/UploadPage";
import AdminPage from "@/pages/AdminPage";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-surface font-body">
        <Navbar />
        <main className="pt-16">
          <Routes>
            <Route path="/" element={<GalleryPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
