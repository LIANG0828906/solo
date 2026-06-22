import React, { useState, useEffect } from 'react';
import { FeedbackProvider, useFeedbackContext } from '@/context/FeedbackContext';
import FeedbackPanel from '@/components/FeedbackPanel';
import TrendDashboard from '@/components/TrendDashboard';

const NotificationToast: React.FC = () => {
  const { notification } = useFeedbackContext();
  if (!notification) return null;
  return (
    <div className={`notification-toast ${notification.visible ? 'visible' : 'hidden'}`}>
      <span className="notification-icon">📢</span>
      <span className="notification-text">{notification.message}</span>
    </div>
  );
};

const AppInner: React.FC = () => {
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setIsMobilePanelOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const togglePanel = () => setIsMobilePanelOpen((prev) => !prev);
  const closePanel = () => setIsMobilePanelOpen(false);

  return (
    <div className="app-root">
      <div className="app-layout">
        {!isMobile && (
          <FeedbackPanel isMobileOpen={false} onClose={closePanel} />
        )}
        {isMobile && (
          <FeedbackPanel isMobileOpen={isMobilePanelOpen} onClose={closePanel} />
        )}
        <TrendDashboard onTogglePanel={togglePanel} />
      </div>
      <NotificationToast />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <FeedbackProvider>
      <AppInner />
    </FeedbackProvider>
  );
};

export default App;
