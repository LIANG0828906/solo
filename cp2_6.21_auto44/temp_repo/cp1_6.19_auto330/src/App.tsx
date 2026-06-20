import { useEffect, useState, useRef } from 'react';
import { useFootprintStore, User } from './store/footprintStore';
import ActivityPanel from './components/ActivityPanel';
import ChallengeBoard from './components/ChallengeBoard';
import ImpactDashboard from './components/ImpactDashboard';

const DEMO_USERS: User[] = [
  { id: 'user-1', name: '张三', avatar: '👤', points: 0 },
  { id: 'user-2', name: '李四', avatar: '👩', points: 0 },
  { id: 'user-3', name: '王五', avatar: '🧑', points: 0 },
];

function LeafIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75" />
    </svg>
  );
}

export default function App() {
  const { currentUser, connect, connected } = useFootprintStore();
  const [activeTab, setActiveTab] = useState<'footprint' | 'challenge'>('footprint');
  const [selectedUserId, setSelectedUserId] = useState('user-1');
  const [pointsBump, setPointsBump] = useState(false);
  const prevPointsRef = useRef(0);

  useEffect(() => {
    connect(selectedUserId);
    return () => {
      useFootprintStore.getState().disconnect();
    };
  }, [selectedUserId]);

  useEffect(() => {
    if (currentUser && currentUser.points !== prevPointsRef.current) {
      setPointsBump(true);
      const timer = setTimeout(() => setPointsBump(false), 300);
      prevPointsRef.current = currentUser.points;
      return () => clearTimeout(timer);
    }
  }, [currentUser?.points]);

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedUserId(e.target.value);
    useFootprintStore.getState().disconnect();
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-logo">
          <LeafIcon />
          <span>碳行者</span>
        </div>
        <div className="navbar-tabs">
          <button
            className={`navbar-tab ${activeTab === 'footprint' ? 'active' : ''}`}
            onClick={() => setActiveTab('footprint')}
          >
            🦶 足迹记录
          </button>
          <button
            className={`navbar-tab ${activeTab === 'challenge' ? 'active' : ''}`}
            onClick={() => setActiveTab('challenge')}
          >
            🏆 挑战广场
          </button>
        </div>
        <div className="navbar-user">
          <div className="navbar-user-info">
            <select
              value={selectedUserId}
              onChange={handleUserChange}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 6,
                color: '#fff',
                padding: '4px 8px',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              {DEMO_USERS.map((u) => (
                <option key={u.id} value={u.id} style={{ color: '#333' }}>
                  {u.avatar} {u.name}
                </option>
              ))}
            </select>
          </div>
          <div className="navbar-points">
            🌿 <span className={`points-value ${pointsBump ? 'bump' : ''}`}>
              {currentUser?.points ?? 0}
            </span> 积分
          </div>
          <span style={{ fontSize: '0.75rem', opacity: connected ? 1 : 0.5 }}>
            {connected ? '🟢' : '🔴'}
          </span>
        </div>
      </nav>

      <main className="main-content">
        {activeTab === 'footprint' ? (
          <div className="two-col">
            <ActivityPanel />
            <ImpactDashboard />
          </div>
        ) : (
          <ChallengeBoard />
        )}
      </main>
    </>
  );
}
