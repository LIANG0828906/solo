import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';

const navbarStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  height: '60px',
  background: 'rgba(59, 74, 107, 0.85)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 24px',
  zIndex: 100,
  boxShadow: '0 2px 20px rgba(0, 0, 0, 0.1)',
};

const logoStyle: React.CSSProperties = {
  color: 'white',
  fontSize: '1.25rem',
  fontWeight: 600,
  textDecoration: 'none',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
};

const navLinksStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '20px',
};

const navLinkStyle: React.CSSProperties = {
  color: 'rgba(255, 255, 255, 0.85)',
  textDecoration: 'none',
  fontWeight: 500,
  transition: 'color 0.2s ease',
  fontSize: '0.95rem',
};

const userSectionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const avatarStyle = (color: string): React.CSSProperties => ({
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  background: color,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontWeight: 600,
  fontSize: '0.875rem',
  border: '2px solid rgba(255, 255, 255, 0.3)',
});

const logoutBtnStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.15)',
  color: 'white',
  padding: '6px 14px',
  borderRadius: '6px',
  fontSize: '0.875rem',
  border: '1px solid rgba(255, 255, 255, 0.2)',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={navbarStyle}>
      <Link to="/dashboard" style={logoStyle}>
        <span style={{ fontSize: '1.5rem' }}>✎</span>
        <span>创意写作平台</span>
      </Link>

      {user && (
        <div style={navLinksStyle}>
          <Link to="/dashboard" style={navLinkStyle}>仪表盘</Link>
          <div style={userSectionStyle}>
            <div style={avatarStyle(user.avatarColor)}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem' }}>
              {user.name}
            </span>
            <button style={logoutBtnStyle} onClick={handleLogout}>
              退出
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
