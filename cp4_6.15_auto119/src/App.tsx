import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import WorkDetailPage from "@/pages/WorkDetailPage";
import Toast from "@/components/Toast";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/work/:id" element={<WorkDetailPage />} />
      </Routes>
      <Toast />
    </Router>
  );
}
