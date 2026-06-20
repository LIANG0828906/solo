import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import PartyDetailPage from "@/pages/PartyDetailPage";
import Toast from "@/components/Toast";
import { usePartyStore } from "@/stores/partyStore";

export default function App() {
  const initActivities = usePartyStore((s) => s.initActivities);
  const initUserMaterials = usePartyStore((s) => s.initUserMaterials);

  useEffect(() => {
    initActivities();
    initUserMaterials();
  }, [initActivities, initUserMaterials]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/party/:id" element={<PartyDetailPage />} />
      </Routes>
      <Toast />
    </Router>
  );
}
