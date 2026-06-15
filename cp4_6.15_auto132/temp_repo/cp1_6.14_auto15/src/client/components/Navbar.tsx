import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Music2,
  Search,
  User,
  LogOut,
  Menu,
  X,
  Plus,
} from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function Navbar() {
  const { user, logout } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const showSearch = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    setIsMenuOpen(false);
    navigate('/');
  };

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-wood-700 to-wood-800 backdrop-blur transition-shadow duration-300 ${
        scrolled ? 'shadow-lg shadow-black/20' : 'shadow-md shadow-black/10'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 text-white">
            <Music2 className="w-7 h-7" />
            <span className="font-serif text-xl font-semibold tracking-wide">乐音社</span>
          </Link>

          {showSearch && (
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索乐器..."
                  className="w-full pl-10 pr-4 py-2 bg-transparent border border-white/40 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/70 focus:ring-1 focus:ring-white/30 transition-all"
                />
              </div>
            </form>
          )}

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link
                  to="/publish"
                  className="flex items-center gap-1.5 px-4 py-2 bg-transparent text-forest-300 border border-forest-400/50 rounded-lg hover:bg-white hover:text-forest-600 transition-all duration-200 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>发布乐器</span>
                </Link>

                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-wood-600 text-white font-medium hover:bg-wood-500 transition-colors"
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.nickname}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : user.nickname ? (
                      <span>{getInitial(user.nickname)}</span>
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-xl border border-wood-100 py-1 animate-fade-in">
                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-left text-wood-800 hover:bg-wood-50 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        <span>个人中心</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>退出登录</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="px-5 py-2 bg-white text-wood-700 rounded-lg font-medium hover:bg-wood-50 transition-colors"
              >
                登录
              </Link>
            )}
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-wood-800/95 backdrop-blur border-t border-white/10 animate-fade-in">
          <div className="px-4 py-4 space-y-3">
            {showSearch && (
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索乐器..."
                    className="w-full pl-10 pr-4 py-2 bg-transparent border border-white/40 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/70 transition-all"
                  />
                </div>
              </form>
            )}

            {user ? (
              <>
                <Link
                  to="/publish"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 w-full px-4 py-2.5 bg-transparent text-forest-300 border border-forest-400/50 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>发布乐器</span>
                </Link>

                <div className="pt-2 border-t border-white/10">
                  <div className="flex items-center gap-3 px-2 py-2">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-wood-600 text-white font-medium">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.nickname}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : user.nickname ? (
                        <span>{getInitial(user.nickname)}</span>
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                    </div>
                    <div className="text-white">
                      <div className="font-medium">{user.nickname}</div>
                      <div className="text-xs text-white/60">{user.username}</div>
                    </div>
                  </div>
                </div>

                <Link
                  to="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>个人中心</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>退出登录</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-center w-full px-4 py-2.5 bg-white text-wood-700 rounded-lg font-medium hover:bg-wood-50 transition-colors"
              >
                登录
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
