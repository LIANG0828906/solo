import React from 'react';
import { useAppStore } from './store/useAppStore';
import BrewingPage from './pages/BrewingPage';
import CommunityPage from './pages/CommunityPage';
import ProfilePage from './pages/ProfilePage';

type Page = 'brewing' | 'community' | 'profile';

interface NavItem {
  key: Page;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'brewing', label: '冲煮记录', icon: '☕' },
  { key: 'community', label: '社区分享', icon: '🌍' },
  { key: 'profile', label: '个人中心', icon: '👤' },
];

const App: React.FC = () => {
  const { currentPage, setCurrentPage } = useAppStore();

  return (
    <div className="app-container">
      <nav className="app-nav">
        <div className="nav-brand">
          <span className="brand-icon">🫘</span>
          <span className="brand-text">手冲日记</span>
        </div>
        <div className="nav-items">
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              type="button"
              className={`nav-item ${currentPage === item.key ? 'active' : ''}`}
              onClick={() => setCurrentPage(item.key)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </div>
        <div className="nav-footer">
          <div className="user-avatar">U</div>
          <span className="user-name">咖啡爱好者</span>
        </div>
      </nav>

      <main className="app-main">
        {currentPage === 'brewing' && <BrewingPage />}
        {currentPage === 'community' && <CommunityPage />}
        {currentPage === 'profile' && <ProfilePage />}
      </main>
    </div>
  );
};

export default App;
