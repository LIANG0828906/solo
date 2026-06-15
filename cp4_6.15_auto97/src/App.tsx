import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import BookList from '@/pages/BookList';
import BookDetail from '@/pages/BookDetail';
import Cart from '@/pages/Cart';
import OrderDetail from '@/pages/OrderDetail';
import OrderHistory from '@/pages/OrderHistory';
import Profile from '@/pages/Profile';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminBooks from '@/pages/AdminBooks';
import AdminBorrows from '@/pages/AdminBorrows';
import { useStore } from '@/store';

function RequireAuth({ children, requireAdmin = false }: { children: JSX.Element; requireAdmin?: boolean }) {
  const { user } = useStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

export default function App() {
  const { setUser } = useStore();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse saved user', e);
      }
    }
  }, [setUser]);

  return (
    <Router>
      <Navbar />
      <CartDrawer />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<BookList />} />
          <Route path="/book/:id" element={<BookDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/orders" element={
            <RequireAuth>
              <OrderHistory />
            </RequireAuth>
          } />
          <Route path="/order/:id" element={
            <RequireAuth>
              <OrderDetail />
            </RequireAuth>
          } />
          <Route path="/profile" element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          } />
          <Route path="/admin/dashboard" element={
            <RequireAuth requireAdmin>
              <AdminDashboard />
            </RequireAuth>
          } />
          <Route path="/admin/books" element={
            <RequireAuth requireAdmin>
              <AdminBooks />
            </RequireAuth>
          } />
          <Route path="/admin/borrows" element={
            <RequireAuth requireAdmin>
              <AdminBorrows />
            </RequireAuth>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </Router>
  );
}
