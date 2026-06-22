import { NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';

const Navbar = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navbarStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#FFFFFF',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 32px',
    zIndex: 1000,
  };

  const logoStyle: React.CSSProperties = {
    fontSize: isMobile ? 18 : 24,
    fontWeight: 'bold',
    color: '#5B9279',
    textDecoration: 'none',
  };

  const navLinksStyle: React.CSSProperties = {
    display: 'flex',
    gap: isMobile ? 12 : 24,
    alignItems: 'center',
  };

  const linkBaseStyle: React.CSSProperties = {
    fontSize: isMobile ? 14 : 16,
    color: '#2D3436',
    textDecoration: 'none',
    padding: '4px 0',
    position: 'relative',
    transition: 'color 0.2s ease',
  };

  const getLinkStyle = (isActive: boolean): React.CSSProperties => ({
    ...linkBaseStyle,
    color: isActive ? '#5B9279' : '#2D3436',
  });

  const getUnderlineStyle = (isActive: boolean): React.CSSProperties => ({
    position: 'absolute',
    bottom: -2,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#5B9279',
    transform: isActive ? 'scaleX(1)' : 'scaleX(0)',
    transition: 'transform 0.3s ease',
    transformOrigin: 'center',
  });

  return (
    <nav style={navbarStyle}>
      <NavLink to="/" style={logoStyle}>
        手工坊
      </NavLink>
      <div style={navLinksStyle}>
        <NavLink to="/" end>
          {({ isActive }) => (
            <span style={{ position: 'relative' }}>
              <span style={getLinkStyle(isActive)}>首页</span>
              <span style={getUnderlineStyle(isActive)} />
            </span>
          )}
        </NavLink>
        <NavLink to="/profile">
          {({ isActive }) => (
            <span style={{ position: 'relative' }}>
              <span style={getLinkStyle(isActive)}>我的</span>
              <span style={getUnderlineStyle(isActive)} />
            </span>
          )}
        </NavLink>
      </div>
    </nav>
  );
};

export default Navbar;
