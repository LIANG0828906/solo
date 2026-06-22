import { useEffect, useState } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { message } from 'antd';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PollDetail from './components/PollDetail';
import PollForm from './components/PollForm';
import VotePage from './components/VotePage';
import ThankYou from './components/ThankYou';
import { usePollStore } from './pollStore';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const initWebSocket = usePollStore((s) => s.initWebSocket);
  const fetchPolls = usePollStore((s) => s.fetchPolls);
  const [pageTitle, setPageTitle] = useState('仪表盘');
  const [shortCodeInput, setShortCodeInput] = useState('');
  const [isVoteRoute, setIsVoteRoute] = useState(false);
  const [isThankRoute, setIsThankRoute] = useState(false);

  useEffect(() => {
    initWebSocket();
    fetchPolls().catch(() => {});
  }, [initWebSocket, fetchPolls]);

  useEffect(() => {
    const p = location.pathname;
    setIsVoteRoute(p.startsWith('/vote/'));
    setIsThankRoute(p === '/thanks');
    if (p === '/' || p === '') setPageTitle('仪表盘');
    else if (p === '/create') setPageTitle('创建投票');
    else if (p.startsWith('/poll/')) setPageTitle('投票详情');
    else setPageTitle('QuickVote');
  }, [location]);

  const handleJoinByCode = () => {
    const code = shortCodeInput.trim().toUpperCase();
    if (code.length !== 6) {
      message.warning('请输入6位短码');
      return;
    }
    navigate(`/vote/${code}`);
    setShortCodeInput('');
  };

  if (isThankRoute) {
    return (
      <Routes>
        <Route path="/thanks" element={<ThankYou />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (isVoteRoute) {
    return (
      <Routes>
        <Route path="/vote/:shortCode" element={<VotePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <div className="qv-app">
      <div className="qv-layout">
        <Sidebar />
        <div className="qv-content">
          <div className="qv-topbar">
            <span className="qv-topbar-title">{pageTitle}</span>
            <div className="qv-topbar-spacer" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  value={shortCodeInput}
                  onChange={(e) => {
                    const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
                    setShortCodeInput(v);
                    if (v.length === 6) {
                      navigate(`/vote/${v}`);
                      setShortCodeInput('');
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleJoinByCode();
                  }}
                  placeholder="输入6位短码参与投票"
                  maxLength={6}
                  style={{
                    width: 200,
                    height: 36,
                    padding: '0 12px',
                    borderRadius: 18,
                    border: '1px solid rgba(255,255,255,0.4)',
                    background: 'rgba(255,255,255,0.15)',
                    color: '#fff',
                    outline: 'none',
                    fontSize: 13,
                    fontFamily: 'Menlo, Consolas, monospace',
                    letterSpacing: 1,
                  }}
                />
              </div>
            </div>
          </div>
          <div className="qv-main">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/create" element={<PollForm />} />
              <Route path="/poll/:id" element={<PollDetail />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
        <div className="qv-bottom-nav">
          <div
            className={`qv-bottom-nav-item ${location.pathname === '/' ? 'active' : ''}`}
            onClick={() => navigate('/')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <span>仪表盘</span>
          </div>
          <div
            className={`qv-bottom-nav-item ${location.pathname === '/create' ? 'active' : ''}`}
            onClick={() => navigate('/create')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>创建</span>
          </div>
          <div
            className="qv-bottom-nav-item"
            onClick={() => {
              const code = prompt('请输入6位短码：');
              if (code) navigate(`/vote/${code.trim().toUpperCase()}`);
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 21l-4.35-4.35" />
              <circle cx="11" cy="11" r="7" />
            </svg>
            <span>参与</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
