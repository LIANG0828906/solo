import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ShopScene from './components/ShopScene';
import OrderPanel from './components/OrderPanel';
import DailyReport from './components/DailyReport';
import { statusApi, ShopStatus } from './api';

function Navigation() {
  const location = useLocation();
  const [status, setStatus] = useState<ShopStatus>({ reputation: 100, revenue: 0, dayNumber: 1 });

  useEffect(() => {
    statusApi.get().then(setStatus).catch(() => {});
  }, [location.pathname]);

  const navItems = [
    { path: '/', label: '🏪 花店大厅', desc: '进货·加工·展示' },
    { path: '/orders', label: '📋 接单台', desc: '顾客·订单·匹配' },
    { path: '/report', label: '📊 经营报告', desc: '数据·建议·导出' },
  ];

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      padding: '16px 32px',
      background: 'rgba(255, 248, 240, 0.92)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(232, 137, 158, 0.15)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '32px' }}>🌸</span>
        <div>
          <h1 style={{ fontSize: '22px', margin: 0, color: 'var(--color-pink-dark)' }}>花语小店</h1>
          <p style={{ fontSize: '12px', color: 'var(--color-text-light)', margin: 0 }}>第 {status.dayNumber} 个营业日</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px' }}>
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-button ${location.pathname === item.path ? 'active' : ''}`}
            style={{
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              lineHeight: 1.2,
              padding: '8px 20px',
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 600 }}>{item.label}</span>
            <span style={{ fontSize: '10px', opacity: 0.75, marginTop: '2px' }}>{item.desc}</span>
          </Link>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div style={{
          padding: '10px 18px',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, #A8D5BA, #6BB88A)',
          color: '#fff',
          fontSize: '13px',
          fontWeight: 600,
          boxShadow: 'var(--shadow-soft)',
        }}>
          💰 ¥{status.revenue.toFixed(0)}
        </div>
        <div style={{
          padding: '10px 18px',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, #FFD6E0, #E8899E)',
          color: '#fff',
          fontSize: '13px',
          fontWeight: 600,
          boxShadow: 'var(--shadow-soft)',
        }}>
          ⭐ 信誉 {status.reputation}
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <Navigation />
      <main style={{ paddingTop: '100px', minHeight: '100vh', width: '100%' }}>
        <Routes>
          <Route path="/" element={<ShopScene />} />
          <Route path="/orders" element={<OrderPanel />} />
          <Route path="/report" element={<DailyReport />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
