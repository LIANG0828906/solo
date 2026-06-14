import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import BookCatalogue from './modules/books/BookCatalogue';
import BookDetail from './modules/books/BookDetail';
import Login from './modules/auth/Login';
import Register from './modules/auth/Register';
import ReaderDashboard from './modules/reader/ReaderDashboard';
import BorrowReturn from './modules/reader/BorrowReturn';
import AdminPanel from './modules/admin/AdminPanel';
import OverdueNotifier from './modules/admin/OverdueNotifier';
import type { User } from './types';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  if (!token) return <Navigate to="/login" replace />;
  try {
    const user: User = JSON.parse(userStr || '{}');
    if (user.role !== 'admin') return <Navigate to="/" replace />;
  } catch {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<BookCatalogue />} />
        <Route path="/books/:id" element={<BookDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <ReaderDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/borrow-return"
          element={
            <ProtectedRoute>
              <BorrowReturn />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/notifications"
          element={
            <AdminRoute>
              <OverdueNotifier />
            </AdminRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
