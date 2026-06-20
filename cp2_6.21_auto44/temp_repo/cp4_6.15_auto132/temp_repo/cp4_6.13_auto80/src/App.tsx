import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store';
import Login from './pages/Login';
import Home from './pages/Home';
import Exchange from './pages/Exchange';

function App() {
  const { token, fetchProfile } = useAppStore();

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token, fetchProfile]);

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!token) {
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exchange/:id"
          element={
            <ProtectedRoute>
              <Exchange />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
