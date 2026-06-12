import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import PlantList from './pages/PlantList';
import OrderPage from './pages/OrderPage';
import CareRecords from './pages/CareRecords';
import InventoryAdmin from './pages/InventoryAdmin';
import HomePage from './pages/HomePage';
import { Plant, CareRecord as CareRecordType } from './types';

export default function App() {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [careAlert, setCareAlert] = useState<string[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('admin') === '1') {
      setIsAdmin(true);
    }
  }, [location]);

  useEffect(() => {
    fetchCareAlerts();
  }, []);

  const fetchCareAlerts = async () => {
    try {
      const res = await fetch('/api/plants');
      const data: Plant[] = await res.json();
      setPlants(data);
      const alerts: string[] = [];
      const now = new Date();

      data.forEach(plant => {
        if (plant.last_watered) {
          const nextWater = new Date(plant.last_watered);
          nextWater.setDate(nextWater.getDate() + plant.water_cycle_days);
          const diffDays = Math.ceil((nextWater.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays <= 2) {
            alerts.push(`${plant.name} 还有${diffDays <= 0 ? '已' : diffDays + '天'}需要浇水`);
          }
        } else {
          alerts.push(`${plant.name} 尚未记录浇水，建议尽快养护`);
        }

        if (plant.last_fertilized) {
          const nextFertilize = new Date(plant.last_fertilized);
          nextFertilize.setMonth(nextFertilize.getMonth() + 1);
          const diffDays = Math.ceil((nextFertilize.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays <= 2) {
            alerts.push(`${plant.name} 还有${diffDays <= 0 ? '已' : diffDays + '天'}需要施肥`);
          }
        }
      });

      setCareAlert(alerts);
    } catch (e) {
      console.error(e);
    }
  };

  const navItems = isAdmin
    ? [
        { path: '/', label: '首页', icon: '🏠' },
        { path: '/plants', label: '植物浏览', icon: '🌿' },
        { path: '/orders', label: '订单管理', icon: '📋' },
        { path: '/inventory', label: '库存管理', icon: '📦' },
        { path: '/care', label: '养护记录', icon: '💧' },
      ]
    : [
        { path: '/', label: '首页', icon: '🏠' },
        { path: '/plants', label: '植物浏览', icon: '🌿' },
        { path: '/orders', label: '我的订单', icon: '📋' },
      ];

  return (
    <div className="app">
      {careAlert.length > 0 && (
        <div className="top-alert">
          <span>⚠️</span>
          <span>{careAlert.slice(0, 2).join(' | ')}{careAlert.length > 2 ? ` 等${careAlert.length}项提醒` : ''}</span>
        </div>
      )}

      {isAdmin ? (
        <div className="admin-layout">
          <nav className="sidebar">
            <div className="sidebar-logo">
              <span className="logo-icon">🌱</span>
              <span className="logo-text">绿意管理</span>
            </div>
            <div className="sidebar-menu">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  <span className="sidebar-label">{item.label}</span>
                </Link>
              ))}
            </div>
            <div className="sidebar-footer">
              <button className="btn btn-secondary full-width" onClick={() => {
                setIsAdmin(false);
                window.location.href = '/';
              }}>
                退出管理
              </button>
            </div>
          </nav>

          <main className="admin-main">
            <div className="main-content">
              <Routes>
                <Route path="/" element={<HomePage isAdmin={isAdmin} />} />
                <Route path="/plants" element={<PlantList isAdmin={isAdmin} />} />
                <Route path="/orders" element={<OrderPage isAdmin={isAdmin} />} />
                <Route path="/inventory" element={<InventoryAdmin />} />
                <Route path="/care" element={<CareRecords plants={plants} />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>
          </main>

          <nav className="mobile-tabbar">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`tabbar-item ${location.pathname === item.path ? 'active' : ''}`}
              >
                <span className="tabbar-icon">{item.icon}</span>
                <span className="tabbar-label">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      ) : (
        <>
          <header className="public-header">
            <div className="header-inner">
              <Link to="/" className="logo">
                <span className="logo-icon">🌱</span>
                <span className="logo-text">绿意植物租赁</span>
              </Link>
              <nav className="header-nav">
                {navItems.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`header-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                  >
                    {item.label}
                  </Link>
                ))}
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setIsAdmin(true);
                    window.location.href = '/?admin=1';
                  }}
                >
                  🔐 管理后台
                </button>
              </nav>
            </div>
          </header>

          <div className="main-content">
            <Routes>
              <Route path="/" element={<HomePage isAdmin={isAdmin} />} />
              <Route path="/plants" element={<PlantList isAdmin={isAdmin} />} />
              <Route path="/orders" element={<OrderPage isAdmin={isAdmin} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>

          <nav className="mobile-tabbar">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`tabbar-item ${location.pathname === item.path ? 'active' : ''}`}
              >
                <span className="tabbar-icon">{item.icon}</span>
                <span className="tabbar-label">{item.label}</span>
              </Link>
            ))}
          </nav>
        </>
      )}
    </div>
  );
}
