import { useState } from 'react';
import DiscoverPage from './components/DiscoverPage';
import CheckinPage from './components/CheckinPage';
import BuddyPage from './components/BuddyPage';
import PlanPage from './components/PlanPage';
import ToastContainer from './components/ToastContainer';

type TabType = 'discover' | 'checkin' | 'buddy' | 'plan';

interface TabConfig {
  key: TabType;
  label: string;
  icon: string;
  mobileOnly?: boolean;
}

const TABS: TabConfig[] = [
  { key: 'discover', label: '发现', icon: '🔍' },
  { key: 'checkin', label: '打卡', icon: '📅' },
  { key: 'buddy', label: '伙伴', icon: '👥' },
  { key: 'plan', label: '计划', icon: '📋', mobileOnly: true },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('discover');

  const renderPage = () => {
    switch (activeTab) {
      case 'discover':
        return <DiscoverPage />;
      case 'checkin':
        return <CheckinPage />;
      case 'buddy':
        return <BuddyPage />;
      case 'plan':
        return <PlanPage />;
      default:
        return <DiscoverPage />;
    }
  };

  const desktopTabs = TABS.filter(t => !t.mobileOnly);
  const mobileTabs = TABS;

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-brand">🎯 SkillBuddy</div>
        <div className="navbar-tabs">
          {desktopTabs.map(tab => (
            <button
              key={tab.key}
              className={`navbar-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div style={{ width: 80 }}></div>
      </nav>

      <main className="content-area">{renderPage()}</main>

      <div className="bottom-tabs">
        {mobileTabs.map(tab => (
          <button
            key={tab.key}
            className={`bottom-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <div className="bottom-tab-icon">{tab.icon}</div>
            <div>{tab.label}</div>
          </button>
        ))}
      </div>

      <ToastContainer />
    </div>
  );
}
