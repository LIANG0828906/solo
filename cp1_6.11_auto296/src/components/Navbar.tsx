
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useStore';
import { AuthModal } from './AuthModal';
import './Navbar.css';

export function Navbar() {
  const user = useAppStore(state => state.user);
  const logout = useAppStore(state => state.logout);
  const [showAuth, setShowAuth] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-left">
          <Link to="/" className="logo">
            <span className="logo-seal">藏</span>
            <span className="logo-text">文玩核桃阁</span>
          </Link>
          
          <div className="nav-links">
            <Link to="/" className="nav-link">文玩柜架</Link>
            <Link to="/market" className="nav-link">交易市场</Link>
          </div>
        </div>

        <div className="navbar-right">
          {user ? (
            <div className="user-section">
              <Link to="/profile" className="user-info">
                <span className="user-seal">印</span>
                <span className="username">{user.username}</span>
              </Link>
              <span className="balance">
                <span className="balance-icon">💰</span>
                {user.balance} 文
              </span>
              <button className="logout-btn" onClick={handleLogout}>
                退出
              </button>
            </div>
          ) : (
            <button 
              className="btn-brush login-btn"
              onClick={() => setShowAuth(true)}
            >
              登录 / 注册
            </button>
          )}
        </div>
      </nav>

      <AuthModal 
        isOpen={showAuth} 
        onClose={() => setShowAuth(false)} 
      />
    </>
  );
}
