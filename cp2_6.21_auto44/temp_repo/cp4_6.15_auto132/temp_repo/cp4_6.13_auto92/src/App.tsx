import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import CourseWall from '@/pages/CourseWall';
import CourseDetail from '@/pages/CourseDetail';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import { useAuth } from '@/hooks/useAuth';

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '20px' }}>
        加载中...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1, paddingTop: '24px', paddingBottom: '48px' }}>
        <div className="container">
          <Routes>
            <Route path="/" element={<CourseWall />} />
            <Route path="/course/:id" element={<CourseDetail />} />
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
            <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
      <footer style={{
        background: '#8B5E3C',
        color: '#fff',
        textAlign: 'center',
        padding: '24px 0',
        marginTop: 'auto',
      }}>
        <p>© 2024 手工坊社区 - 让手作温暖生活</p>
      </footer>
    </div>
  );
};

export default App;
