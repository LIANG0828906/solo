import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import BatchList from './pages/BatchList';
import BatchDetail from './pages/BatchDetail';
import AddBatch from './pages/AddBatch';
import Login from './pages/Login';
import Register from './pages/Register';
import PublicBatchDetail from './pages/PublicBatchDetail';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#6B4F3A' }}>加载中...</div>;
  }

  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/public/batch/:id" element={<PublicBatchDetail />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <BatchList />
          </PrivateRoute>
        }
      />
      <Route
        path="/batch/:id"
        element={
          <PrivateRoute>
            <BatchDetail />
          </PrivateRoute>
        }
      />
      <Route
        path="/batch/add"
        element={
          <PrivateRoute>
            <AddBatch />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
