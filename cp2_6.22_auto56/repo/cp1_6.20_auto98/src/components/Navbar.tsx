import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-content">
        <Link to="/" className="logo">
          <span>🍳</span>
          <span>美食菜谱</span>
        </Link>

        <div className="nav-links">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            首页
          </Link>
          {user && (
            <Link to="/my-recipes" className={`nav-link ${isActive('/my-recipes') ? 'active' : ''}`}>
              我的菜谱
            </Link>
          )}
          {user && (
            <Link to="/favorites" className={`nav-link ${isActive('/favorites') ? 'active' : ''}`}>
              收藏夹
            </Link>
          )}
        </div>

        <div className="nav-user">
          {user ? (
            <>
              <Link to="/create-recipe" className="btn btn-primary">
                + 创建菜谱
              </Link>
              <img src={user.avatar} alt={user.username} className="user-avatar" />
              <span style={{ fontWeight: 500, fontSize: '14px' }}>{user.username}</span>
              <button className="btn-text" onClick={handleLogout}>
                退出
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline">
                登录
              </Link>
              <Link to="/register" className="btn btn-primary">
                注册
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
