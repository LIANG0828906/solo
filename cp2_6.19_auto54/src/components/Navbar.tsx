import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { BookOpen, LogIn, User } from 'lucide-react';
import { useAuthStore } from '../modules/user/UserManager';
import { LoginPanel } from '../modules/user/LoginPanel';
import { NotificationCenter } from '../modules/user/NotificationCenter';

export function Navbar() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const currentUser = useAuthStore((state) => state.currentUser);
  const isAdmin = useAuthStore((state) => state.isAdmin());
  const logout = useAuthStore((state) => state.logout);
  const location = useLocation();

  const handleLoginClick = () => {
    setIsLoginOpen(true);
  };

  const navLinks = [
    { to: '/', label: '图书浏览', show: true },
    { to: '/exchange/history', label: '借阅记录', show: !!currentUser },
    { to: '/admin/books', label: '图书管理', show: isAdmin },
    { to: '/profile', label: '个人中心', show: !!currentUser && !isAdmin },
  ];

  return (
    <>
      <nav className="navbar">
        <div className="navbar-logo">
          <BookOpen size={24} />
          <span>独立书店交换平台</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="navbar-links">
            {navLinks.filter((link) => link.show).map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={`navbar-link ${location.pathname === link.to ? 'active' : ''}`}
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="navbar-user">
            {currentUser ? (
              <>
                <NotificationCenter />
                <span className="user-name">
                  <User size={16} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                  {currentUser.name}
                </span>
                <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={logout}>
                  退出
                </button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={handleLoginClick}>
                <LogIn size={16} />
                登录
              </button>
            )}
          </div>
        </div>
      </nav>

      <LoginPanel
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />
    </>
  );
}
