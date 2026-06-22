import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, Coffee, Users, Menu, X } from 'lucide-react';
import HomePage from '@/pages/Home';
import BrewPage from '@/pages/BrewPage';
import Community from '@/pages/Community';

function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: '我的', icon: Home },
    { path: '/brew/new', label: '冲煮', icon: Coffee },
    { path: '/community', label: '社区', icon: Users },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-logo">
          <Coffee size={24} style={{ color: '#e94560' }} />
          <span className="navbar-logo-text">Brew Journal</span>
        </div>

        <div className="navbar-desktop">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`navbar-link ${active ? 'active' : ''}`}
                style={{
                  color: active ? '#e94560' : '#aaa',
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <button
          className="navbar-mobile-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="navbar-mobile-menu">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`navbar-mobile-link ${active ? 'active' : ''}`}
                style={{
                  color: active ? '#e94560' : '#eee',
                  backgroundColor: active ? 'rgba(233, 69, 96, 0.1)' : 'transparent',
                }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/brew/new" element={<BrewPage />} />
            <Route path="/community" element={<Community />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
