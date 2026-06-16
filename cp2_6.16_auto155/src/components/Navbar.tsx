import { NavLink } from 'react-router-dom';

const navStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  height: 56,
  display: 'flex',
  alignItems: 'center',
  padding: '0 24px',
  background: 'rgba(255, 248, 240, 0.85)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  borderBottom: '1px solid rgba(212, 163, 115, 0.3)',
  zIndex: 100,
  gap: 32
};

const logoStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 20,
  fontWeight: 700,
  color: 'var(--text-primary)'
};

const linkStyle = (active: boolean): React.CSSProperties => ({
  fontSize: 15,
  fontWeight: active ? 600 : 500,
  color: active ? 'var(--accent)' : 'var(--text-secondary)',
  padding: '6px 0',
  borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
  transition: 'all 200ms ease-out'
});

export default function Navbar() {
  return (
    <nav style={navStyle}>
      <NavLink to="/" style={logoStyle}>
        <span style={{ fontSize: 24 }}>🍞</span>
        <span>BakeMate</span>
      </NavLink>
      <div style={{ display: 'flex', gap: 24 }}>
        <NavLink to="/" style={({ isActive }) => linkStyle(isActive)} end>
          主页
        </NavLink>
        <NavLink to="/recipes" style={({ isActive }) => linkStyle(isActive)}>
          所有食谱
        </NavLink>
      </div>
    </nav>
  );
}
