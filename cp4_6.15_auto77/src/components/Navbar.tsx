import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface NavbarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  showSearch?: boolean;
}

export default function Navbar({ searchValue, onSearchChange, showSearch = true }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-40 ${
          scrolled ? 'navbar-solid' : 'navbar-glass bg-white/60'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <i className="fas fa-seedling text-olive-600 text-xl"></i>
            <span className="font-bold text-olive-700 font-merriweather text-lg desktop-only">
              绿植社区
            </span>
          </Link>

          {showSearch && (
            <div className="flex-1 max-w-md">
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                <input
                  type="text"
                  placeholder="搜索植物名称..."
                  value={searchValue || ''}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-card bg-beige-100 border border-olive-100 focus:outline-none focus:ring-2 focus:ring-olive-400 focus:border-transparent text-sm transition-all"
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              to="/profile"
              className="w-10 h-10 rounded-full bg-gradient-to-br from-olive-400 to-olive-600 flex items-center justify-center text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <i className="fas fa-user"></i>
            </Link>
          </div>
        </div>
      </nav>

      <nav className="mobile-only fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-lg">
        <div className="flex items-center justify-around h-16">
          <button
            onClick={() => navigate('/')}
            className={`flex flex-col items-center gap-1 px-4 py-2 ${
              location.pathname === '/' ? 'text-olive-600' : 'text-gray-400'
            }`}
          >
            <i className="fas fa-home text-lg"></i>
            <span className="text-xs">首页</span>
          </button>
          <button
            onClick={() => navigate('/profile')}
            className={`flex flex-col items-center gap-1 px-4 py-2 ${
              location.pathname === '/profile' ? 'text-olive-600' : 'text-gray-400'
            }`}
          >
            <i className="fas fa-user text-lg"></i>
            <span className="text-xs">我的</span>
          </button>
        </div>
      </nav>
    </>
  );
}
