import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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

function CircleRevealOverlay() {
  const { circleReveal, setCircleReveal } = useStore();

  useEffect(() => {
    if (circleReveal.active) {
      const timer = setTimeout(() => {
        setCircleReveal({ active: false });
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [circleReveal.active, setCircleReveal]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: circleReveal.active ? 'auto' : 'none',
        zIndex: 9999,
        background: 'transparent',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: `${circleReveal.y}px`,
          left: `${circleReveal.x}px`,
          borderRadius: '50%',
          background: circleReveal.color,
          transform: 'translate(-50%, -50%)',
          transition: circleReveal.active
            ? 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1), height 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease, box-shadow 0.3s ease'
            : 'none',
          width: circleReveal.active ? '400vmax' : '0vmax',
          height: circleReveal.active ? '400vmax' : '0vmax',
          opacity: circleReveal.active ? 1 : 0,
          boxShadow: circleReveal.active ? '0 0 100px rgba(198, 123, 61, 0.5)' : 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: `${circleReveal.y}px`,
          left: `${circleReveal.x}px`,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${circleReveal.color} 0%, #FDF8F0 70%, #FDF8F0 100%)`,
          transform: 'translate(-50%, -50%)',
          width: circleReveal.active ? '400vmax' : '0vmax',
          height: circleReveal.active ? '400vmax' : '0vmax',
          opacity: circleReveal.active ? 1 : 0,
          transition: circleReveal.active
            ? 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.15s, height 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.15s, opacity 0.5s ease 0.15s'
            : 'none',
        }}
      />
    </div>
  );
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
      <CircleRevealOverlay />
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
