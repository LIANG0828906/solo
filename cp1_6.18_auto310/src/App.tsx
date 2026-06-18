import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import OrderForm from './pages/OrderForm';
import { useOrderStore } from './store';

const App = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const fetchOrders = useOrderStore(state => state.fetchOrders);
  const location = useLocation();

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-content">
          <div className="nav-left">
            <i className="fas fa-paint-brush nav-icon"></i>
            <span className="nav-title">手工艺工作室订单管理</span>
          </div>
          <div className="nav-right">
            <span className="clock">{formatTime(currentTime)}</span>
          </div>
        </div>
        <div className="nav-tabs">
          <Link to="/" className={`nav-tab ${location.pathname === '/' ? 'active' : ''}`}>
            <i className="fas fa-th-large"></i>
            <span>订单看板</span>
          </Link>
          <Link to="/create" className={`nav-tab ${location.pathname === '/create' ? 'active' : ''}`}>
            <i className="fas fa-plus-circle"></i>
            <span>新建订单</span>
          </Link>
        </div>
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/create" element={<OrderForm />} />
        </Routes>
      </main>

      <style>{`
        .app {
          min-height: 100vh;
          background-color: #FFF8E1;
        }

        .navbar {
          background-color: #5D4037;
          color: #fff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .nav-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 32px;
        }

        .nav-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .nav-icon {
          font-size: 24px;
          color: #FFCCBC;
        }

        .nav-title {
          font-size: 20px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .clock {
          font-family: 'Courier New', monospace;
          font-size: 18px;
          color: #8D6E63;
          background-color: rgba(255, 255, 255, 0.1);
          padding: 8px 16px;
          border-radius: 6px;
        }

        .nav-tabs {
          display: flex;
          gap: 4px;
          padding: 0 32px;
          background-color: rgba(0, 0, 0, 0.1);
        }

        .nav-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          border-radius: 6px 6px 0 0;
          transition: all 0.2s ease;
        }

        .nav-tab:hover {
          color: #fff;
          background-color: rgba(255, 255, 255, 0.1);
        }

        .nav-tab.active {
          color: #5D4037;
          background-color: #FFF8E1;
        }

        .main-content {
          padding: 32px;
        }
      `}</style>
    </div>
  );
};

export default App;
