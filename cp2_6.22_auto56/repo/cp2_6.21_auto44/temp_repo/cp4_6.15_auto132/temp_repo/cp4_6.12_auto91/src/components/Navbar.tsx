import { Link, useLocation } from 'react-router-dom';
import { Music, BookOpen, Settings } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path === '/blog' && location.pathname.startsWith('/blog')) return true;
    if (path === '/admin' && location.pathname === '/admin') return true;
    return false;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 z-50 bg-gradient-to-r from-[#0f3460] to-[#16213e] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-white flex items-center gap-2">
          <Music className="w-7 h-7" />
          <span>Music Studio</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className={`flex items-center gap-2 transition-colors duration-200 ${
              isActive('/') ? 'text-[#4ecdc4]' : 'text-gray-300 hover:text-white'
            }`}
          >
            <Music className="w-5 h-5" />
            <span>曲目</span>
          </Link>
          <Link
            to="/blog"
            className={`flex items-center gap-2 transition-colors duration-200 ${
              isActive('/blog') ? 'text-[#4ecdc4]' : 'text-gray-300 hover:text-white'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span>博客</span>
          </Link>
          <Link
            to="/admin"
            className={`flex items-center gap-2 transition-colors duration-200 ${
              isActive('/admin') ? 'text-[#4ecdc4]' : 'text-gray-300 hover:text-white'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>后台</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
