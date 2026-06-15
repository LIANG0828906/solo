import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import BookDetail from "@/pages/BookDetail";
import Admin from "@/pages/Admin";
import { NotificationContainer } from "@/components/Notification";
import { useAppStore } from "@/store";

export default function App() {
  const { notifications, removeNotification } = useAppStore();

  return (
    <Router>
      <NotificationContainer notifications={notifications} onClose={removeNotification} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/books/:id" element={<BookDetail />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/other" element={<div className="text-center text-xl">Other Page - Coming Soon</div>} />
      </Routes>
    </Router>
  );
}
