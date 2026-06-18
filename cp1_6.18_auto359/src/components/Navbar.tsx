import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Home } from 'lucide-react';
import { useStore } from '@/store';
import { getInitials } from '@/utils/colors';

export function Navbar() {
  const { user, logout } = useStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        <LayoutDashboard size={24} />
        <span>AgileFlow</span>
      </Link>

      {user && (
        <div className="navbar-user">
          <Link to="/" className="btn btn-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', padding: '8px 16px', minHeight: 'auto' }}>
            <Home size={16} />
            首页
          </Link>
          <div className="avatar" style={{ background: user.avatarGradient }}>
            {getInitials(user.nickname)}
          </div>
          <span style={{ fontWeight: 500 }}>{user.nickname}</span>
          <button onClick={handleLogout} className="btn btn-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', padding: '8px 16px', minHeight: 'auto' }}>
            <LogOut size={16} />
            退出
          </button>
        </div>
      )}
    </nav>
  );
}
