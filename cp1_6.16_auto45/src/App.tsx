import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/Layout";
import HomePage from "@/pages/HomePage";
import EventDetail from "@/pages/EventDetail";
import TicketPage from "@/pages/TicketPage";
import ArtistDashboard from "@/pages/ArtistDashboard";
import ArtistCheckin from "@/pages/ArtistCheckin";
import AdminPanel from "@/pages/AdminPanel";
import LoginPage from "@/pages/LoginPage";
import { useAuthStore } from "@/stores/authStore";

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/event/:id" element={<EventDetail />} />
          <Route path="/tickets" element={<TicketPage />} />
          <Route
            path="/artist/dashboard"
            element={
              <ProtectedRoute roles={["artist"]}>
                <ArtistDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/artist/checkin/:id"
            element={
              <ProtectedRoute roles={["artist"]}>
                <ArtistCheckin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/artist/analytics/:id"
            element={
              <ProtectedRoute roles={["artist"]}>
                <ArtistDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/artist/events/create"
            element={
              <ProtectedRoute roles={["artist"]}>
                <ArtistDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
