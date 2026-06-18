import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Login from '@/pages/Login';
import Bookshelf from '@/pages/Bookshelf';
import BookDetail from '@/pages/BookDetail';
import Events from '@/pages/Events';
import Community from '@/pages/Community';
import { useAuthStore } from '@/store/authStore';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const isLoginPage = location.pathname === '/login' || location.pathname === '/register';

  if (!isAuthenticated && !isLoginPage) {
    return <Navigate to="/login" replace />;
  }

  if (isLoginPage) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="pt-[60px]">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="min-h-[calc(100vh-60px)] transition-all duration-300 md:ml-[240px]">
          <div className="p-6">
            <Routes>
              <Route path="/" element={<Navigate to="/books" replace />} />
              <Route path="/books" element={<Bookshelf />} />
              <Route path="/books/:id" element={<BookDetail />} />
              <Route path="/events" element={<Events />} />
              <Route path="/community" element={<Community />} />
              <Route path="*" element={<Navigate to="/books" replace />} />
            </Routes>
          </div>
        </main>
      </div>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
