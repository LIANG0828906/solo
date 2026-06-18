import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Music, Plus, Grid3X3 } from 'lucide-react';
import Home from '@/pages/Home';
import Publish from '@/pages/Publish';
import Category from '@/pages/Category';

function NavBar() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: '音乐墙', icon: Music },
    { path: '/publish', label: '发布', icon: Plus },
    { path: '/category', label: '分类', icon: Grid3X3 },
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
      style={{
        background: 'rgba(13, 13, 26, 0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
            style={{
              background: 'linear-gradient(135deg, #FF6B6B, #6C5CE7)',
              boxShadow: '0 4px 20px rgba(108, 92, 231, 0.4)',
            }}
          >
            <Music className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-lg font-bold tracking-wide">
            节奏共鸣墙
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:scale-105"
                style={{
                  background: isActive
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'transparent',
                  color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                }}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <NavBar />
        <main className="pt-20 pb-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/publish" element={<Publish />} />
            <Route path="/category" element={<Category />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
