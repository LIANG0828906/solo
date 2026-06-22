import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Package, LogOut, User, Plus, Search as SearchIcon } from 'lucide-react';
import { useAuthStore } from '@/modules/auth/store';
import RatingStars from './RatingStars';

interface NavbarProps {
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  showSearch?: boolean;
}

export default function Navbar({ searchValue, onSearchChange, showSearch = true }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { currentUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/login');
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-40 transition-all duration-300"
      style={{
        backgroundColor: scrolled ? 'rgba(255,255,255,0.95)' : '#FFFFFF',
        backdropFilter: scrolled ? 'blur(8px)' : 'none',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-lg"
            style={{ backgroundColor: '#E67E22' }}
          >
            <Package size={20} />
          </div>
          <span className="text-xl font-bold" style={{ color: '#2C3E50' }}>
            SwapBazaar
          </span>
        </Link>

        {showSearch && (
          <div className="flex-1 max-w-xl relative">
            <SearchIcon
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary/40"
            />
            <input
              type="text"
              placeholder="搜索物品标题或描述..."
              value={searchValue || ''}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-secondary/10 bg-bg/50 focus:bg-white focus:border-primary/50 transition-all text-sm"
            />
          </div>
        )}

        <div className="flex-1" />

        {currentUser ? (
          <>
            {location.pathname !== '/create' && (
              <button
                onClick={() => navigate('/create')}
                className="hidden sm:flex items-center gap-1.5 text-white px-4 py-2 rounded-full font-medium text-sm transition-all hover:brightness-110"
                style={{ backgroundColor: '#E67E22' }}
              >
                <Plus size={18} />
                <span>发布物品</span>
              </button>
            )}

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-secondary/5 transition-colors"
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xl bg-primary/10 border-2 border-primary/30"
                >
                  {currentUser.avatar}
                </div>
                <span className="hidden sm:block text-sm font-medium text-secondary">
                  {currentUser.name}
                </span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-card-hover py-2 fade-in">
                  <div className="px-4 py-3 border-b border-secondary/5">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{currentUser.avatar}</span>
                      <div>
                        <div className="font-medium text-sm">{currentUser.name}</div>
                        <RatingStars rating={currentUser.rating} size="sm" />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      navigate('/profile');
                      setMenuOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-bg flex items-center gap-2"
                  >
                    <User size={16} className="text-primary" />
                    <span>个人面板</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-bg flex items-center gap-2 text-red-500"
                  >
                    <LogOut size={16} />
                    <span>退出登录</span>
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm font-medium text-secondary hover:text-primary transition-colors"
            >
              登录
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-4 py-2 rounded-full text-white text-sm font-medium transition-all hover:brightness-110"
              style={{ backgroundColor: '#E67E22' }}
            >
              注册
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
