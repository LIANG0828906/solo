import { useState } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import WorkersPage from './pages/WorkersPage';
import ShiftsPage from './pages/ShiftsPage';
import SalesPage from './pages/SalesPage';

const navItems = [
  { path: '/dashboard', label: '仪表盘', icon: '🏰' },
  { path: '/workers', label: '员工管理', icon: '⚜️' },
  { path: '/shifts', label: '排班表', icon: '📜' },
  { path: '/sales', label: '销售录入', icon: '💰' },
];

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <div
        style={{
          position: sidebarOpen ? 'fixed' : 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 40,
          display: sidebarOpen ? 'block' : 'none',
        }}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        style={{
          width: '260px',
          minWidth: '260px',
          background: 'linear-gradient(180deg, #3d2817 0%, #2a1a0f 100%)',
          borderRight: '2px solid rgba(201, 168, 76, 0.3)',
          padding: '24px 0',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
          boxShadow: '4px 0 20px rgba(0,0,0,0.4)',
        }}
        className="sidebar"
      >
        <style>{`
          @media (min-width: 1025px) {
            .sidebar { transform: translateX(0) !important; }
          }
        `}</style>

        <div style={{ padding: '0 24px 28px', borderBottom: '1px solid rgba(201, 168, 76, 0.2)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #C9A84C 0%, #E8C56D 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px', boxShadow: '0 4px 15px rgba(201,168,76,0.4)',
            }}>
              🍺
            </div>
            <div>
              <h1 style={{
                color: '#E8C56D',
                fontFamily: 'Cinzel, serif',
                fontSize: '18px',
                fontWeight: 700,
                lineHeight: 1.2,
              }}>
                Fantasy
              </h1>
              <p style={{ color: '#C9A84C', fontSize: '13px', fontFamily: 'Cinzel, serif' }}>
                Tavern
              </p>
            </div>
          </div>
          <p style={{ marginTop: '14px', fontSize: '12px', color: 'rgba(232,213,183,0.6)', fontStyle: 'italic' }}>
            "愿每一位冒险者都能找到归属"
          </p>
        </div>

        <nav style={{ padding: '0 16px' }}>
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              style={{ marginBottom: '8px' }}
              onClick={() => setSidebarOpen(false)}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={{ position: 'absolute', bottom: '24px', left: '24px', right: '24px', paddingTop: '20px', borderTop: '1px solid rgba(201,168,76,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'rgba(46,74,46,0.3)', borderRadius: '10px', border: '1px solid rgba(46,74,46,0.5)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #C9A84C, #E8C56D)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              👑
            </div>
            <div>
              <div style={{ color: '#E8C56D', fontSize: '13px', fontWeight: 700 }}>酒馆老板</div>
              <div style={{ color: 'rgba(232,213,183,0.6)', fontSize: '11px' }}>管理员权限</div>
            </div>
          </div>
        </div>
      </aside>

      <div style={{
        flex: 1,
        marginLeft: '0',
        transition: 'margin-left 0.3s ease',
        minWidth: 0,
      }}
      className="main-content"
      >
        <style>{`
          @media (min-width: 1025px) {
            .main-content { margin-left: 260px !important; }
          }
        `}</style>

        <header style={{
          padding: '16px 24px',
          background: 'rgba(42, 26, 15, 0.9)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(201, 168, 76, 0.2)',
          position: 'sticky',
          top: 0,
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="btn"
              style={{ padding: '8px 14px', fontSize: '18px' }}
            >
              ☰
            </button>
            <div style={{ display: 'none' }}>{/* 响应式占位 */}</div>
            <style>{`
              @media (min-width: 1025px) {
                .mobile-menu-btn { display: none !important; }
              }
            `}</style>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              padding: '8px 16px',
              background: 'rgba(201, 168, 76, 0.1)',
              border: '1px solid rgba(201, 168, 76, 0.3)',
              borderRadius: '20px',
              color: '#C9A84C',
              fontSize: '13px',
            }}>
              🕐 {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
            </div>
          </div>
        </header>

        <main style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/workers" element={<WorkersPage />} />
            <Route path="/shifts" element={<ShiftsPage />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>

        <footer style={{
          padding: '24px',
          textAlign: 'center',
          color: 'rgba(232, 213, 183, 0.4)',
          fontSize: '12px',
          borderTop: '1px solid rgba(201, 168, 76, 0.15)',
          marginTop: '40px',
        }}>
          <p style={{ fontFamily: 'Cinzel, serif', color: '#C9A84C', marginBottom: '6px', opacity: 0.6 }}>
            ⚜ Fantasy Tavern Management System ⚜
          </p>
          <p>中世纪奇幻酒馆员工排班与销售统计应用</p>
        </footer>
      </div>
    </div>
  );
}
