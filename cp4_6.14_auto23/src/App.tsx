import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import ToastContainer from './components/ToastContainer';
import Login from './pages/Login';
import ActivityList from './ActivityList';
import CreateActivity from './CreateActivity';
import ActivityDetail from './ActivityDetail';
import UserProfile from './UserProfile';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useApp();
  const location = useLocation();
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <>{children}</>;
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Navbar />
      <div className="app-container">{children}</div>
    </>
  );
};

const AppInner = () => {
  return (
    <>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/activities"
          element={
            <ProtectedRoute>
              <Layout>
                <ActivityList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/activities/create"
          element={
            <ProtectedRoute>
              <Layout>
                <CreateActivity />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/activities/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <ActivityDetail />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <UserProfile />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/activities" replace />} />
        <Route path="*" element={
          <ProtectedRoute>
            <Layout>
              <div className="empty-state">
                <h2 style={{ marginBottom: 12 }}>404</h2>
                <p>页面未找到</p>
              </div>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
};

export default App;
