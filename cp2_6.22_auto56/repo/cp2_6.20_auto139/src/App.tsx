import { Routes, Route, useNavigate } from 'react-router-dom';
import { useRouteStore } from './stores/routeStore';
import { useTeamStore } from './stores/teamStore';
import RoutePlanner from './pages/RoutePlanner';
import TeamTracker from './pages/TeamTracker';
import JoinRoute from './pages/JoinRoute';
import { useState } from 'react';

export default function App() {
  const navigate = useNavigate();
  useRouteStore();
  useTeamStore();
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  const handleCreateRoute = () => {
    navigate('/planner');
  };

  const handleJoinRoute = () => {
    setShowJoinModal(true);
  };

  const handleConfirmJoin = () => {
    if (joinCode.trim()) {
      navigate(`/join/${joinCode.trim()}`);
      setShowJoinModal(false);
      setJoinCode('');
    }
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-left">
          <svg className="compass-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
          </svg>
          <span className="app-title">探险追踪</span>
        </div>
        <div className="navbar-right">
          <button className="nav-btn" onClick={handleCreateRoute}>
            创建路线
          </button>
          <button className="nav-btn" onClick={handleJoinRoute}>
            加入路线
          </button>
        </div>
      </nav>

      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>加入路线</h3>
            <p>请输入6位路线代码</p>
            <input
              type="text"
              className="modal-input"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              placeholder="ABC123"
            />
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setShowJoinModal(false)}>
                取消
              </button>
              <button className="modal-btn confirm" onClick={handleConfirmJoin}>
                加入
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="main-content">
        <Routes>
          <Route path="/" element={<RoutePlanner />} />
          <Route path="/planner" element={<RoutePlanner />} />
          <Route path="/planner/:routeId" element={<RoutePlanner />} />
          <Route path="/tracker/:routeId" element={<TeamTracker />} />
          <Route path="/join/:code" element={<JoinRoute />} />
        </Routes>
      </main>
    </div>
  );
}
