import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Detail from "@/pages/Detail";
import Toast from "@/components/Toast";
import { useStore } from "@/store";

export default function App() {
  const toast = useStore((s) => s.toast);
  const hideToast = useStore((s) => s.hideToast);

  return (
    <Router>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/recipe/:id" element={<Detail />} />
        </Routes>
        {toast.visible && <Toast message={toast.message} onClose={hideToast} />}
      </div>
    </Router>
  );
}
