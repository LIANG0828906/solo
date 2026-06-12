import { Outlet, NavLink, Link } from 'react-router-dom';
import { useState } from 'react';

const logoSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 64 64" fill="none">
  <path d="M12 16c0-2.2 1.8-4 4-4h32c2.2 0 4 1.8 4 4v28c0 2.2-1.8 4-4 4H16c-2.2 0-4-1.8-4-4V16z" 
        stroke="white" stroke-width="3" fill="none"/>
  <path d="M16 16v28h32V16" stroke="white" stroke-width="2" fill="none"/>
  <path d="M20 24h24v4H20z" fill="white"/>
  <path d="M20 32h16v4H20z" fill="white"/>
</svg>`;

const menuItems = [
  { path: '/admin/orders', label: '订单看板', icon: '📋' },
  { path: '/admin/inventory', label: '库存管理', icon: '📦' },
  { path: '/admin/tools', label: '工具管理', icon: '🔧' },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        style={{
          width: '200px',
          backgroundColor: '#4A2F1A',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.2s ease-out',
        }}
      >
        <div
          style={{
            padding: '20px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div dangerouslySetInnerHTML={{ __html: logoSvg }} />
          <span style={{ fontWeight: 600, fontSize: '16px' }}>匠艺后台</span>
        </div>

        <nav style={{ flex: 1, padding: '16px 0' }}>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 20px',
                color: 'white',
                fontSize: '14px',
                position: 'relative',
                transition: 'all 0.2s ease-out',
                backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                opacity: isActive ? 1 : 0.8,
              })}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'rgba(255,255,255,0.05)';
              }}
              onMouseLeave={(e) => {
                const isActive = window.location.pathname === item.path;
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = isActive
                  ? 'rgba(255,255,255,0.1)'
                  : 'transparent';
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '4px',
                  backgroundColor: '#FFD54F',
                  display: window.location.pathname === item.path ? 'block' : 'none',
                }}
              />
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Link
            to="/"
            style={{
              display: 'block',
              textAlign: 'center',
              padding: '8px',
              fontSize: '13px',
              opacity: 0.7,
              transition: 'opacity 0.2s ease-out',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.opacity = '0.7';
            }}
          >
            ← 返回前台
          </Link>
        </div>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            backgroundColor: 'white',
            borderBottom: '1px solid #E8DCC8',
          }}
        >
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#333' }}>工作室管理后台</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '14px' }}>
            <span>👤</span>
            <span>工作室主</span>
          </div>
        </header>

        <div style={{ flex: 1, overflow: 'auto', padding: '24px', backgroundColor: '#FDF8F0' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
