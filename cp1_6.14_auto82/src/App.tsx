import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Navbar from "@/components/Navbar";

export default function App() {
  return (
    <Router>
      <Navbar />
      <main className="pt-16 min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/history"
            element={
              <div className="container mx-auto px-4 py-12">
                <h1 className="section-title animate-fadeIn">历史记录</h1>
                <div className="divider-vintage" />
                <div className="card-vintage p-8 mt-6 animate-slideUp animation-delay-200">
                  <p className="text-ink/70 text-center font-serif italic text-lg">
                    暂无历史记录，快去创作你的第一张封面吧！
                  </p>
                </div>
              </div>
            }
          />
          <Route path="/other" element={<div className="text-center text-xl">Other Page - Coming Soon</div>} />
        </Routes>
      </main>
    </Router>
  );
}
