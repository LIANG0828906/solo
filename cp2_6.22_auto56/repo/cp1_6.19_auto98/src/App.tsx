import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaInbox, FaThLarge, FaChartLine } from 'react-icons/fa';
import { FeedbackProvider } from './store/feedbackReducer';
import FeedbackCapture from './components/FeedbackCapture';
import FeedbackBoard from './components/FeedbackBoard';
import TrendChart from './components/TrendChart';

type ModuleKey = 'capture' | 'board' | 'trend';

const NAV_ITEMS: { key: ModuleKey; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'capture', label: '反馈收录', Icon: FaInbox },
  { key: 'board', label: '反馈看板', Icon: FaThLarge },
  { key: 'trend', label: '趋势分析', Icon: FaChartLine },
];

function AppContent() {
  const [active, setActive] = useState<ModuleKey>('capture');

  const renderModule = () => {
    switch (active) {
      case 'capture':
        return <FeedbackCapture key="capture" />;
      case 'board':
        return <FeedbackBoard key="board" />;
      case 'trend':
        return <TrendChart key="trend" />;
    }
  };

  return (
    <div className="app-shell">
      <style>{globalStyles}</style>

      <nav className="sidebar">
        <div className="logo">
          <div className="logo-icon">
            <FaChartLine />
          </div>
          <div className="logo-text">
            <div className="logo-title">FeedbackLab</div>
            <div className="logo-sub">用户反馈可视化</div>
          </div>
        </div>

        <ul className="nav-list">
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.key;
            const Icon = item.Icon;
            return (
              <li key={item.key} className="nav-item">
                <button
                  className={`nav-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setActive(item.key)}
                >
                  <span className="nav-icon">
                    <Icon />
                  </span>
                  <span className="nav-label">{item.label}</span>
                  <span className="nav-underline" />
                </button>
              </li>
            );
          })}
        </ul>

        <div className="sidebar-footer">
          <span className="footer-version">v1.0.0</span>
        </div>
      </nav>

      <nav className="mobile-nav">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.key;
          const Icon = item.Icon;
          return (
            <button
              key={item.key}
              className={`mobile-nav-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActive(item.key)}
              title={item.label}
            >
              <Icon />
            </button>
          );
        })}
      </nav>

      <main className="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="module-wrap"
          >
            {renderModule()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function App() {
  return (
    <FeedbackProvider>
      <AppContent />
    </FeedbackProvider>
  );
}

export default App;

const globalStyles = `
*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body,
#root {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
    "Hiragino Sans GB", "Microsoft YaHei", Roboto, Helvetica, Arial, sans-serif;
  background: #FFFFFF;
  color: #2C3E50;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size: 14px;
  line-height: 1.5;
}

button {
  font-family: inherit;
  cursor: pointer;
}

input,
textarea,
select {
  font-family: inherit;
}

.app-shell {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: #FFFFFF;
}

.sidebar {
  width: 220px;
  flex-shrink: 0;
  background: #2C3E50;
  color: white;
  display: flex;
  flex-direction: column;
  position: relative;
}

.sidebar::after {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 1px;
  background: #ECF0F1;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.logo-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #1ABC9C, #16A085);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: white;
  flex-shrink: 0;
}

.logo-title {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
}

.logo-sub {
  font-size: 11px;
  color: rgba(255,255,255,0.5);
  margin-top: 2px;
}

.nav-list {
  list-style: none;
  padding: 12px 12px;
  margin: 0;
  flex: 1;
}

.nav-item {
  margin-bottom: 4px;
}

.nav-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.7);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  position: relative;
  transition: background 0.2s ease-out, color 0.2s ease-out;
  position: relative;
  overflow: hidden;
}

.nav-btn:hover {
  background: rgba(255,255,255,0.06);
  color: white;
}

.nav-btn.active {
  background: rgba(26,188,156,0.15);
  color: white;
}

.nav-icon {
  font-size: 14px;
  width: 20px;
  text-align: center;
}

.nav-label {
  flex: 1;
  text-align: left;
}

.nav-underline {
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 8px;
  height: 2px;
  background: linear-gradient(90deg, #1ABC9C, #3498DB);
  border-radius: 1px;
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform 0.2s ease-out;
}

.nav-btn.active .nav-underline {
  transform: scaleX(1);
}

.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(255,255,255,0.08);
}

.footer-version {
  font-size: 11px;
  color: rgba(255,255,255,0.3);
}

.mobile-nav {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: #2C3E50;
  z-index: 100;
  align-items: center;
  justify-content: space-around;
  padding: 0 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

.mobile-nav-btn {
  width: 48px;
  height: 48px;
  background: transparent;
  border: none;
  color: rgba(255,255,255,0.6);
  border-radius: 10px;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease-out;
  position: relative;
}

.mobile-nav-btn.active {
  color: white;
  background: rgba(26,188,156,0.2);
}

.mobile-nav-btn.active::after {
  content: '';
  position: absolute;
  bottom: 4px;
  left: 14px;
  right: 14px;
  height: 2px;
  background: #1ABC9C;
  border-radius: 1px;
  transition: transform 0.2s ease-out;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  min-width: 0;
}

.module-wrap {
  min-height: 100%;
}

@media (max-width: 768px) {
  .sidebar {
    display: none;
  }

  .mobile-nav {
    display: flex;
  }

  .main-content {
    padding-top: 56px;
  }

  .app-shell {
    flex-direction: column;
  }
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #D5DBDF;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #BDC3C7;
}
`;
