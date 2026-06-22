import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import OrderBoard from './pages/OrderBoard';
import PartsInventory from './pages/PartsInventory';
import Dashboard from './pages/Dashboard';

const navItems = [
  { to: '/', label: '工单看板', icon: '📋' },
  { to: '/parts', label: '备件库存', icon: '📦' },
  { to: '/dashboard', label: '仪表盘', icon: '📊' }
];

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location, isMobile]);

  const sidebarStyle: React.CSSProperties = {
    position: isMobile ? 'fixed' : 'fixed',
    left: isMobile ? (sidebarOpen ? '0' : '-100%') : '0',
    top: isMobile ? '0' : '0',
    width: isMobile ? '250px' : '20%',
    minWidth: isMobile ? '0' : '200px',
    height: '100vh',
    backgroundColor: '#1a1a2e',
    color: '#ffffff',
    padding: '24px 16px',
    zIndex: 1000,
    transition: isMobile ? 'left 0.3s ease' : 'none',
    overflowY: 'auto',
    animation: isMobile && sidebarOpen ? 'slideInLeft 0.3s ease' : undefined
  };

  const mainStyle: React.CSSProperties = {
    marginLeft: isMobile ? '0' : '20%',
    minHeight: '100vh',
    backgroundColor: '#ffffff'
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
      {isMobile && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            zIndex: 999,
            borderBottom: '1px solid #e0e0e0'
          }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              padding: '8px 12px',
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer'
            }}
          >
            ☰
          </button>
          <span style={{ marginLeft: '12px', fontWeight: 'bold', fontSize: '16px' }}>维修工单系统</span>
        </div>
      )}

      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999
          }}
        />
      )}

      <aside style={sidebarStyle}>
        {!isMobile && (
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>🔧 维修工单系统</h1>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>协同管理平台</p>
          </div>
        )}

        {isMobile && (
          <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 'bold' }}>🔧 维修工单系统</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              style={{ backgroundColor: 'transparent', color: 'white', fontSize: '20px', border: 'none', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        )}

        <nav>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {navItems.map((item) => (
              <li key={item.to} style={{ marginBottom: '8px' }}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setSidebarOpen(false)}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    color: isActive ? '#ffffff' : 'rgba(255,255,255,0.75)',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: isActive ? '600' : '400',
                    backgroundColor: isActive ? 'rgba(102, 126, 234, 0.2)' : 'transparent',
                    borderLeft: isActive ? '3px solid #667eea' : '3px solid transparent',
                    transition: 'all 0.2s ease'
                  })}
                >
                  <span style={{ marginRight: '12px', fontSize: '18px' }}>{item.icon}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div style={{ marginTop: '40px', padding: '16px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6' }}>
            💡 提示：将工单卡片拖拽到不同状态区域可快速更新状态。
          </p>
        </div>
      </aside>

      <main style={mainStyle}>
        <div
          style={{
            position: isMobile ? 'sticky' : 'sticky',
            top: isMobile ? '60px' : '0',
            zIndex: 100,
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderBottom: '1px solid #e0e0e0',
            padding: isMobile ? '0' : '0 32px'
          }}
        >
          {!isMobile && (
            <div style={{ height: '60px', display: 'flex', alignItems: 'center', gap: '32px' }}>
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  style={({ isActive }) => ({
                    position: 'relative',
                    padding: '18px 0',
                    fontSize: '14px',
                    fontWeight: isActive ? '600' : '400',
                    color: isActive ? '#667eea' : '#666',
                    textDecoration: 'none',
                    transition: 'color 0.3s ease'
                  })}
                >
                  {({ isActive }) => (
                    <>
                      {item.label}
                      <span
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '3px',
                          backgroundColor: isActive ? '#667eea' : 'transparent',
                          borderRadius: '3px 3px 0 0',
                          transition: 'all 0.3s ease'
                        }}
                      />
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: isMobile ? '16px' : '32px', paddingTop: isMobile ? '16px' : '24px' }}>
          <Routes>
            <Route path="/" element={<OrderBoard />} />
            <Route path="/parts" element={<PartsInventory />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
