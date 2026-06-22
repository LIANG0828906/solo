import { Link, useNavigate } from 'react-router-dom';
import { Coffee, LogIn, LogOut, Settings } from 'lucide-react';
import { useAuthStore } from '@/modules/auth/store/authStore';
import './NavBar.css';

export function NavBar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <Coffee className="navbar-icon" size={28} />
          <span className="navbar-title">FlavorFusion</span>
        </Link>

        <div className="navbar-actions">
          {user ? (
            <>
              {user.isOwner && (
                <Link to="/admin" className="navbar-admin-btn" title="店主后台">
                  <Settings size={20} />
                </Link>
              )}
              <span className="navbar-user">{user.nickname}</span>
              <button className="navbar-btn" onClick={handleLogout} title="退出登录">
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <Link to="/login" className="navbar-btn navbar-login-btn">
              <LogIn size={20} />
              <span>登录</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
