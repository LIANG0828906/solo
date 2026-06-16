import React, { useEffect, useState } from 'react';
import { useGardenStore, PRESET_COLORS } from './store/gardenStore';
import GardenMap from './components/GardenMap';
import LogSheet from './components/LogSheet';
import StatsBoard from './components/StatsBoard';

const UserSetup: React.FC = () => {
  const setCurrentUser = useGardenStore((s) => s.setCurrentUser);
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setCurrentUser(name.trim(), color);
    }
  };

  return (
    <div className="user-setup-overlay">
      <div className="user-setup-card">
        <h2>🌿 欢迎来到 GroveCommons</h2>
        <p>加入社区花园，开始你的种植之旅</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>你的名字</label>
            <input
              type="text"
              placeholder="输入你的名字"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="form-group">
            <label>选择代表色</label>
            <div className="color-picker">
              {PRESET_COLORS.map((c) => (
                <div
                  key={c}
                  className={`color-swatch ${color === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 8 }}
            disabled={!name.trim()}
          >
            进入花园
          </button>
        </form>
      </div>
    </div>
  );
};

const MobileTabs: React.FC<{ activeTab: string; onTabChange: (tab: string) => void }> = ({
  activeTab,
  onTabChange,
}) => (
  <div className="mobile-tabs">
    <button
      className={`mobile-tab ${activeTab === 'map' ? 'active' : ''}`}
      onClick={() => onTabChange('map')}
    >
      🗺️ 花园地图
    </button>
    <button
      className={`mobile-tab ${activeTab === 'stats' ? 'active' : ''}`}
      onClick={() => onTabChange('stats')}
    >
      📊 统计看板
    </button>
  </div>
);

const App: React.FC = () => {
  const initialized = useGardenStore((s) => s.initialized);
  const initStore = useGardenStore((s) => s.initStore);
  const currentUserId = useGardenStore((s) => s.currentUserId);
  const users = useGardenStore((s) => s.users);
  const isLogPanelOpen = useGardenStore((s) => s.isLogPanelOpen);

  const [mobileTab, setMobileTab] = useState('map');

  useEffect(() => {
    initStore();
  }, [initStore]);

  if (!initialized) {
    return (
      <div className="loading-screen">
        🌿 加载中...
      </div>
    );
  }

  const currentUser = users.find((u) => u.id === currentUserId);

  if (!currentUserId || !currentUser) {
    return <UserSetup />;
  }

  return (
    <div className="app-container">
      <MobileTabs activeTab={mobileTab} onTabChange={setMobileTab} />
      <div className="main-area">
        <div className="app-header">
          <h1><span>🌿</span> GroveCommons</h1>
          <div className="user-badge">
            <div
              className="avatar"
              style={{ background: currentUser.color }}
            >
              {currentUser.initials}
            </div>
            {currentUser.name}
          </div>
        </div>
        <div style={{ position: 'relative', flex: 1, display: 'flex', overflow: 'hidden' }}>
          <GardenMap />
          <LogSheet />
        </div>
      </div>
      <div className={`sidebar ${mobileTab === 'stats' ? 'mobile-visible' : ''}`}>
        <StatsBoard />
      </div>
    </div>
  );
};

export default App;
