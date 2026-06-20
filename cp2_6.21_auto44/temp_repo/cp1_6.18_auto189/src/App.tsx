import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import ShareView from "@/pages/ShareView";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/scene/:uuid" element={<ShareView />} />
      </Routes>
    </Router>
  );
}
