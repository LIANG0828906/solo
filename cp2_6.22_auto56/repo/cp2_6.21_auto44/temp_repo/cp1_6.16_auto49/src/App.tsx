import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProjectStoreProvider, useProjectStore } from '@/stores/projectStore';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import ProjectDetail from '@/pages/ProjectDetail';
import '@/index.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { state } = useProjectStore();
  const isLoggedIn = state.currentUserId !== null;

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/project/:id"
        element={
          <ProtectedRoute>
            <ProjectDetail />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <ProjectStoreProvider>
      <Router>
        <AppRoutes />
      </Router>
    </ProjectStoreProvider>
  );
}
