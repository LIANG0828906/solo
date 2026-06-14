import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RoomBoard from "@/pages/RoomBoard";
import RoomDetail from "@/pages/RoomDetail";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RoomBoard />} />
        <Route path="/rooms/:id" element={<RoomDetail />} />
      </Routes>
    </Router>
  );
}
