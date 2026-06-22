import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', label: '仪表盘', icon: 'dashboard' },
  { path: '/orders', label: '订单管理', icon: 'orders' },
  { path: '/fabrics', label: '面料库存', icon: 'fabrics' },
];

const iconPaths: Record<string, JSX.Element> = {
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  orders: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  fabrics: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
    </svg>
  ),
};

export default function NavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const handleNavClick = () => {
    setIsOpen(false);
  };

  return (
    <>
      <nav style={navStyle} className="desktop-only">
        <div style={logoStyle}>定制工坊</div>
        <div style={navItemsStyle}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              style={({ isActive }) => ({
                ...navItemStyle,
                ...(isActive || location.pathname === item.path
                  ? navItemActiveStyle
                  : {}),
              })}
            >
              <span style={iconWrapperStyle}>{iconPaths[item.icon]}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <div style={mobileHeaderStyle} className="mobile-only">
        <div style={logoStyle}>定制工坊</div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={hamburgerBtnStyle}
          aria-label="菜单"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {isOpen && (
        <nav style={mobileNavStyle} className="mobile-only">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              style={({ isActive }) => ({
                ...mobileNavItemStyle,
                ...(isActive || location.pathname === item.path
                  ? navItemActiveStyle
                  : {}),
              })}
            >
              <span style={iconWrapperStyle}>{iconPaths[item.icon]}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </>
  );
}

const navStyle: React.CSSProperties = {
  width: '200px',
  height: '100vh',
  backgroundColor: '#2C3E50',
  color: '#ECF0F1',
  display: 'flex',
  flexDirection: 'column',
  position: 'fixed',
  left: 0,
  top: 0,
  zIndex: 100,
};

const logoStyle: React.CSSProperties = {
  padding: '24px 20px',
  fontSize: '18px',
  fontWeight: 600,
  borderBottom: '1px solid rgba(255,255,255,0.1)',
};

const navItemsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  padding: '12px 0',
};

const navItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '14px 20px',
  color: '#ECF0F1',
  textDecoration: 'none',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  fontSize: '14px',
};

const navItemActiveStyle: React.CSSProperties = {
  backgroundColor: '#3498DB',
  color: '#FFFFFF',
};

const iconWrapperStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const mobileHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  backgroundColor: '#2C3E50',
  color: '#ECF0F1',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 100,
  height: '56px',
};

const hamburgerBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#ECF0F1',
  cursor: 'pointer',
  padding: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const mobileNavStyle: React.CSSProperties = {
  position: 'fixed',
  top: '56px',
  left: 0,
  right: 0,
  backgroundColor: '#2C3E50',
  color: '#ECF0F1',
  zIndex: 99,
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
};

const mobileNavItemStyle: React.CSSProperties = {
  ...navItemStyle,
  padding: '16px 20px',
};
