import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Layout from "@/components/Layout";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/arena" element={<div className="text-center text-xl py-20">竞技场 - Coming Soon</div>} />
          <Route path="/leaderboard" element={<div className="text-center text-xl py-20">排行榜 - Coming Soon</div>} />
        </Routes>
      </Layout>
    </Router>
  );
}
