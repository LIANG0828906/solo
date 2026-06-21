import { NavLink } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navItems = [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/history', label: '历史趋势', icon: '📊' },
  ];

  return (
    <aside
      className="sidebar"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: '220px',
        background: 'var(--bg-sidebar)',
        borderRadius: '0 12px 12px 0',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
        transition: 'transform 0.3s ease',
      }}
    >
      <div style={{ padding: '0 20px 24px' }}>
        <div
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span style={{ fontSize: '28px' }}>🥗</span>
          <span>营养追踪</span>
        </div>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
          Nutrition Tracker
        </p>
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 20px',
              margin: '0 8px',
              color: isActive ? 'white' : 'rgba(255,255,255,0.6)',
              background: isActive ? 'rgba(78, 205, 196, 0.2)' : 'transparent',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: isActive ? 600 : 400,
              transition: 'all 0.2s',
              textDecoration: 'none',
            })}
            onMouseEnter={(e) => {
              const target = e.currentTarget;
              target.style.background = 'rgba(78, 205, 196, 0.15)';
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget;
              if (!target.classList.contains('active')) {
                target.style.background = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: '18px' }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.4)',
        }}
      >
        <p>基于 WHO 标准推荐</p>
        <p style={{ marginTop: '4px' }}>v1.0.0</p>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sidebar {
            transform: ${isOpen ? 'translateX(0)' : 'translateX(-100%)'};
          }
        }
      `}</style>
    </aside>
  );
}
