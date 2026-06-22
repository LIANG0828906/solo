import { Link, useLocation } from 'react-router-dom';
import { useOrderStore } from '../store/useOrderStore';
import './NavBar.css';

export default function NavBar() {
  const location = useLocation();
  const user = useOrderStore((state) => state.user);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="navbar glass">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span className="logo-icon">🤝</span>
          <span className="logo-text">拼单吧</span>
        </Link>

        <div className="nav-links">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            首页
          </Link>
          <Link to="/history" className={`nav-link ${isActive('/history') ? 'active' : ''}`}>
            历史记录
          </Link>
        </div>

        <div className="nav-user">
          <img src={user.avatar} alt={user.name} className="user-avatar" />
          <span className="user-name">{user.name}</span>
        </div>
      </div>
    </nav>
  );
}
