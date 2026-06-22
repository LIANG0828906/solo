import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Menu, X, LogOut, User } from 'lucide-react';
import type { User as UserType } from '../types';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { setUser(null); }
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  const linkClass = (path: string) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] flex items-center ${
      isActive(path)
        ? 'bg-primary/20 text-accent'
        : 'text-gray-600 hover:bg-secondary/60 hover:text-accent'
    }`;

  const closeMobile = () => setMobileOpen(false);

  return (
    <nav className="navbar-glass fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 no-underline">
          <BookOpen className="w-7 h-7 text-accent" />
          <span className="text-lg font-bold text-accent">社区图书馆</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          <Link to="/" className={linkClass('/')}>首页</Link>
          {user && (
            <Link to="/dashboard" className={linkClass('/dashboard')}>我的借阅</Link>
          )}
          {user?.role === 'admin' && (
            <Link to="/admin" className={linkClass('/admin')}>管理员</Link>
          )}
        </div>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <User className="w-4 h-4" />
                {user.name}
              </span>
              <button
                onClick={handleLogout}
                className="btn-press flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-secondary/60"
              >
                <LogOut className="w-4 h-4" />
                退出
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="btn-press px-4 py-2 rounded-lg text-sm font-medium text-accent hover:bg-secondary/60"
              >
                登录
              </Link>
              <Link
                to="/register"
                className="btn-press px-4 py-2 rounded-lg text-sm font-medium bg-accent text-white hover:bg-accent/90"
              >
                注册
              </Link>
            </div>
          )}
        </div>

        <button
          className="md:hidden btn-press p-2 rounded-lg text-gray-600"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="mobile-menu md:hidden bg-white/95 shadow-lg border-t border-secondary/30">
          <div className="container mx-auto px-4 py-3 flex flex-col gap-1">
            <Link to="/" className={linkClass('/')} onClick={closeMobile}>首页</Link>
            {user && (
              <Link to="/dashboard" className={linkClass('/dashboard')} onClick={closeMobile}>我的借阅</Link>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin" className={linkClass('/admin')} onClick={closeMobile}>管理员</Link>
            )}
            <hr className="my-2 border-secondary/40" />
            {user ? (
              <>
                <span className="px-3 py-2 text-sm text-gray-500">{user.name}</span>
                <button
                  onClick={() => { handleLogout(); closeMobile(); }}
                  className="btn-press px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-secondary/60 text-left"
                >
                  退出登录
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={linkClass('/login')} onClick={closeMobile}>登录</Link>
                <Link to="/register" className={linkClass('/register')} onClick={closeMobile}>注册</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
