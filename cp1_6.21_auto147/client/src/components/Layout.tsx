import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import DepartmentReport from './DepartmentReport';

const navItems = [
  { path: '/questionnaires', label: '问卷管理', icon: '📋' },
  { path: '/trainees', label: '学员管理', icon: '👥' }
];

export default function Layout() {
  const location = useLocation();
  const [showReport, setShowReport] = useState(true);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={sidebarStyle}>
        <div style={logoStyle}>
          <span style={{ fontSize: '24px' }}>📊</span>
        </div>
        <nav style={navStyle}>
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                ...navItemStyle,
                backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                color: isActive ? '#3B82F6' : '#64748B'
              })}
              title={item.label}
            >
              <span style={{ fontSize: '20px' }}>{item.icon}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={headerStyle}>
          <h1 style={titleStyle}>
            {navItems.find(n => location.pathname.startsWith(n.path))?.label || '培训追踪者'}
          </h1>
        </header>

        <div style={contentWrapperStyle}>
          {showReport && location.pathname === '/trainees' && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#334155' }}>部门完成率报告</h2>
                <button
                  onClick={() => setShowReport(false)}
                  style={{ fontSize: '12px', color: '#64748B', cursor: 'pointer', border: 'none', background: 'none' }}
                >
                  收起
                </button>
              </div>
              <DepartmentReport />
            </div>
          )}
          {!showReport && location.pathname === '/trainees' && (
            <div style={{ marginBottom: '16px' }}>
              <button
                onClick={() => setShowReport(true)}
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '6px 12px', minHeight: '32px' }}
              >
                展开报告
              </button>
            </div>
          )}
          <Outlet />
        </div>
      </main>
    </div>
  );
}

const sidebarStyle: React.CSSProperties = {
  width: '60px',
  backgroundColor: '#FFFFFF',
  borderRight: '1px solid #E2E8F0',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  paddingTop: '16px',
  position: 'sticky',
  top: 0,
  height: '100vh'
};

const logoStyle: React.CSSProperties = {
  width: '44px',
  height: '44px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '24px',
  borderRadius: '8px',
  backgroundColor: '#EFF6FF'
};

const navStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  width: '100%',
  padding: '0 8px'
};

const navItemStyle: React.CSSProperties = {
  width: '44px',
  height: '44px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '8px',
  textDecoration: 'none',
  transition: 'all 0.2s ease'
};

const headerStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderBottom: '2px solid #E2E8F0',
  padding: '20px 24px'
};

const titleStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 600,
  color: '#1E293B'
};

const contentWrapperStyle: React.CSSProperties = {
  flex: 1,
  padding: '24px',
  backgroundColor: '#F8FAFC',
  overflow: 'auto'
};
