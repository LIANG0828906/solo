import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import UploadPage from "@/pages/UploadPage";
import TryOnPage from "@/pages/TryOnPage";
import WorksPage from "@/pages/WorksPage";
import { useClothingStore } from "@/store/useClothingStore";

function Navigation() {
  const { clothing } = useClothingStore();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-paper/95 backdrop-blur-sm border-b border-wood/10">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <span className="text-2xl">🧵</span>
          <span className="font-serif text-xl text-wood font-semibold">光阴缝纫铺</span>
        </a>
        <div className="flex items-center gap-6">
          <a
            href="/works"
            className="text-wood/70 hover:text-wood transition-colors text-sm font-medium"
          >
            作品社区
          </a>
          <a
            href="/upload"
            className="px-4 py-2 bg-rust text-white rounded-full text-sm font-medium btn-hover"
          >
            {clothing.imageUrl ? '继续改造' : '开始改造'}
          </a>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <Navigation />
      <main className="pt-16">
        <Routes>
          <Route path="/" element={<Navigate to="/upload" replace />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/tryon" element={<TryOnPage />} />
          <Route path="/works" element={<WorksPage />} />
          <Route path="*" element={<Navigate to="/upload" replace />} />
        </Routes>
      </main>
    </Router>
  );
}
