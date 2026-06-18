import { useState } from 'react';
import BookingView from './components/BookingView';
import MenuView from './components/MenuView';
import TrackingView from './components/TrackingView';

type TabType = 'booking' | 'menu' | 'tracking';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('booking');

  const tabs: { key: TabType; label: string }[] = [
    { key: 'booking', label: '座位地图' },
    { key: 'menu', label: '菜单' },
    { key: 'tracking', label: '追踪订单' }
  ];

  return (
    <div style={styles.appContainer}>
      <header style={styles.header}>
        <div style={styles.logo}>餐桌上的风景</div>
        <nav style={styles.nav}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              style={{
                ...styles.tabButton,
                ...(activeTab === tab.key ? styles.tabButtonActive : {})
              }}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              {activeTab === tab.key && <span style={styles.tabUnderline} />}
            </button>
          ))}
        </nav>
      </header>
      <main style={styles.mainContent}>
        {activeTab === 'booking' && <BookingView />}
        {activeTab === 'menu' && <MenuView />}
        {activeTab === 'tracking' && <TrackingView />}
      </main>
    </div>
  );
}

const styles = {
  appContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: '#2C3E50',
    color: '#ECF0F1'
  },
  header: {
    height: '60px',
    backgroundColor: '#1A252C',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    position: 'sticky' as const,
    top: 0,
    zIndex: 100
  },
  logo: {
    fontSize: '20px',
    fontWeight: 'bold' as const,
    color: '#E67E22'
  },
  nav: {
    display: 'flex',
    gap: '8px'
  },
  tabButton: {
    width: '120px',
    height: '60px',
    backgroundColor: 'transparent',
    color: '#ECF0F1',
    fontSize: '14px',
    position: 'relative' as const,
    transition: 'color 0.2s ease'
  },
  tabButtonActive: {
    color: '#E67E22',
    fontWeight: 'bold' as const
  },
  tabUnderline: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: '3px',
    backgroundColor: '#E67E22'
  },
  mainContent: {
    flex: 1,
    padding: '24px 0'
  }
};

export default App;
