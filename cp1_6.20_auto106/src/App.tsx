import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { EventDetail } from "./pages/EventDetail";
import { Ticket } from "./pages/Ticket";
import { AdminLogin } from "./pages/AdminLogin";
import { CheckinManager } from "./pages/CheckinManager";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/event/:id" element={<EventDetail />} />
        <Route path="/ticket/:eventId/:registrationId" element={<Ticket />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/event/:id" element={<CheckinManager />} />
      </Routes>
    </Router>
  );
}
