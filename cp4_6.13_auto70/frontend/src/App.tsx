import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import SeatMap from './pages/SeatMap';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        加载中...
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        {user && <Navbar />}
        <main style={user ? { paddingTop: '60px', minHeight: '100vh' } : { minHeight: '100vh' }}>
          <div className="page-transition">
            <Routes>
              <Route path="/login" element={!user ? <Login /> : <Navigate to="/seats" />} />
              <Route path="/register" element={!user ? <Register /> : <Navigate to="/seats" />} />
              <Route path="/seats" element={user ? <SeatMap /> : <Navigate to="/login" />} />
              <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
              <Route
                path="/admin"
                element={user?.role === 'admin' ? <Admin /> : <Navigate to="/seats" />}
              />
              <Route path="*" element={<Navigate to={user ? '/seats' : '/login'} />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
};

export default App;
