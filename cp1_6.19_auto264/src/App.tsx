import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import ExchangePage from './pages/ExchangePage';
import DiaryPage from './pages/DiaryPage';
import { usePlantStore } from './store/plantStore';
import './App.css';

function App() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const fetchPlants = usePlantStore(s => s.fetchPlants);
  const fetchDiaryEntries = usePlantStore(s => s.fetchDiaryEntries);
  const fetchExchanges = usePlantStore(s => s.fetchExchanges);
  const plants = usePlantStore(s => s.plants);
  const diaryEntries = usePlantStore(s => s.diaryEntries);
  const exchangeRequests = usePlantStore(s => s.exchangeRequests);
  const currentUserId = usePlantStore(s => s.currentUserId);

  useEffect(() => {
    fetchPlants();
    fetchDiaryEntries();
    fetchExchanges();
  }, []);

  const myPlants = plants.filter(p => p.userId === currentUserId);
  const pendingCount = exchangeRequests.filter(r => r.status === 'pending' && r.toUserId === currentUserId).length;

  const navItems = [
    { to: '/', label: '我的花园' },
    { to: '/exchange', label: '待换花园' },
    { to: '/diary', label: '日记' }
  ];

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-logo">
          🌱 邻里换花
        </div>

        <button className="hamburger-btn" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? '✕' : '☰'}
        </button>

        <div className={`nav-items ${menuOpen ? 'open' : ''}`}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
              {item.to === '/exchange' && pendingCount > 0 && (
                <span className="nav-badge">{pendingCount}</span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="main-layout">
        <aside className="sidebar">
          <div className="sidebar-header">
            <div className="user-avatar">
              小明
            </div>
            <h3 className="user-name">小明的花园</h3>
          </div>

          <div className="stats-container">
            <div className="stat-badge">
              <div className="stat-circle stat-circle-green">
                <span className="stat-number">{myPlants.length}</span>
              </div>
              <span className="stat-label">植物总数</span>
            </div>

            <div className="stat-badge">
              <div className="stat-circle stat-circle-orange">
                <span className="stat-number">
                  {myPlants.filter(p => p.status === 'available').length}
                </span>
              </div>
              <span className="stat-label">待交换</span>
            </div>

            <div className="stat-badge">
              <div className="stat-circle stat-circle-blue">
                <span className="stat-number">{diaryEntries.length}</span>
              </div>
              <span className="stat-label">日记条目</span>
            </div>
          </div>

          <div className="exchange-timeline">
            <h4 className="timeline-title">交换历史</h4>
            <div className="timeline">
              {exchangeRequests
                .filter(r => r.status === 'exchanged')
                .sort((a, b) => new Date(b.exchangedAt || b.createdAt).getTime() - new Date(a.exchangedAt || a.createdAt).getTime())
                .slice(0, 5)
                .map(request => {
                  const colors = ['#3498DB', '#E74C3C', '#2ECC71', '#F39C12'];
                  const colorA = colors[Math.abs(request.fromUserId.charCodeAt(5)) % 4];
                  const colorB = colors[Math.abs(request.toUserId.charCodeAt(5)) % 4];
                  return (
                    <div key={request.id} className="timeline-item">
                      <div className="timeline-dot" />
                      <div className="timeline-card">
                        <div className="timeline-date">
                          {new Date(request.exchangedAt || request.createdAt).toLocaleDateString('zh-CN')}
                        </div>
                        <div className="timeline-participants">
                          <div className="timeline-avatars">
                            <div className="mini-avatar" style={{ backgroundColor: colorA }}>
                              {(request.fromOwnerName || 'A')[0]}
                            </div>
                            <span className="swap-arrow">⇄</span>
                            <div className="mini-avatar" style={{ backgroundColor: colorB }}>
                              {(request.toOwnerName || 'B')[0]}
                            </div>
                          </div>
                        </div>
                        <div className="timeline-plants">
                          {request.fromPlantName} ↔ {request.toPlantName}
                        </div>
                      </div>
                    </div>
                  );
                })}
              {exchangeRequests.filter(r => r.status === 'exchanged').length === 0 && (
                <p className="no-exchanges">暂无交换记录</p>
              )}
            </div>
          </div>
        </aside>

        <main className="content" key={location.pathname}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/exchange" element={<ExchangePage />} />
            <Route path="/diary" element={<DiaryPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
