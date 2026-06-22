import { Routes, Route } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import WardrobePage from "@/pages/WardrobePage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/wardrobe" element={<WardrobePage />} />
    </Routes>
  );
}
