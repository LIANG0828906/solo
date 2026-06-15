import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { LogOut, Map, ClipboardList } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = useAppStore((s) => s.currentUser);
  const logout = useAppStore((s) => s.logout);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!currentUser) return null;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-user">👋 你好，{currentUser.name}</div>
        <div className="navbar-links">
          <Link to="/preference" className={`navbar-link ${isActive('/preference') ? 'active' : ''}`}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ClipboardList size={16} />
              偏好填写
            </span>
          </Link>
          <Link to="/office-map" className={`navbar-link ${isActive('/office-map') ? 'active' : ''}`}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Map size={16} />
              办公室地图
            </span>
          </Link>
          <button className="navbar-link" onClick={handleLogout} title="退出登录">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <LogOut size={16} />
              退出
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}
