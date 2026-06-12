import { Link, useLocation } from 'react-router-dom';
import { User } from '../api';
import './Navbar.css';

interface NavbarProps {
  user: User | null;
  onLogin: (userId: string) => void;
  onLogout: () => void;
}

const Navbar = ({ user, onLogin, onLogout }: NavbarProps) => {
  const location = useLocation();

  const handleDemoLogin = () => {
    onLogin('user-1');
  };

  const getBadgeClass = (points: number) => {
    if (points >= 200) return 'badge gold-badge';
    if (points >= 100) return 'badge silver-badge';
    return 'badge bronze-badge';
  };

  const getBadgeText = (points: number) => {
    if (points >= 200) return '金牌';
    if (points >= 100) return '银牌';
    return '铜牌';
  };

  return (
    <nav className="navbar">
      <div className="container nav-content">
        <Link to="/" className="logo">
          <span className="logo-icon">🎁</span>
          <span className="logo-text">邻里闲置</span>
        </Link>

        <div className="nav-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            首页
          </Link>
          {user && (
            <Link
              to="/publish"
              className={`nav-link ${location.pathname === '/publish' ? 'active' : ''}`}
            >
              发布
            </Link>
          )}
          {user && (
            <Link
              to="/profile"
              className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
            >
              我的
            </Link>
          )}
        </div>

        <div className="nav-user">
          {user ? (
            <div className="user-info">
              <div className="user-avatar">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.nickname} />
                ) : (
                  <span>{user.nickname?.[0] || 'U'}</span>
                )}
              </div>
              <div className="user-details">
                <span className="user-name">{user.nickname}</span>
                <div className={getBadgeClass(user.points)}>
                  {getBadgeText(user.points)} · {user.points}分
                </div>
              </div>
              <button className="logout-btn" onClick={onLogout}>
                退出
              </button>
            </div>
          ) : (
            <button className="login-btn" onClick={handleDemoLogin}>
              登录
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
