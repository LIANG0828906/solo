import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Flower2 } from 'lucide-react';
import Home from '@/pages/Home';
import Builder from '@/pages/Builder';
import OrderPage from '@/pages/OrderPage';
import OrderConfirm from '@/pages/OrderConfirm';

function NavBar() {
  const location = useLocation();

  const links = [
    { to: '/', label: '首页' },
    { to: '/builder', label: '创建花束' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-rose-100">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-rose-500 hover:text-rose-600 transition-colors">
          <Flower2 size={28} />
          <span className="font-display text-xl font-semibold text-gray-800">花间小筑</span>
        </Link>
        <div className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
                ${
                  location.pathname === link.to
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-gray-500 hover:bg-rose-50 hover:text-rose-500'
                }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="mt-16 py-8 text-center text-gray-300 text-sm border-t border-rose-50">
      <p className="font-display">🌸 花间小筑 · 社区花店在线订购平台</p>
    </footer>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-b from-rose-50 via-cream-50 to-sage-50">
        <NavBar />
        <main className="container mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/builder" element={<Builder />} />
            <Route path="/order" element={<OrderPage />} />
            <Route path="/order/:id" element={<OrderConfirm />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
