import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import FrontendModule from "@/modules/frontend/FrontendModule";
import AdminModule from "@/modules/admin/AdminModule";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FrontendModule />} />
        <Route path="/album/:id" element={<FrontendModule />} />
        <Route path="/admin" element={<AdminModule />} />
      </Routes>
    </Router>
  );
}
