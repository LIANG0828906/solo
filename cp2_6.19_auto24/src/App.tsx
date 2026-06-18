import React, { useEffect, useState } from 'react';
import { useFeedbackStore } from './modules/feedback/store/feedbackStore';
import Navbar from './shared/components/Navbar';
import MeetingList from './modules/meetings/components/MeetingList';
import FeedbackForm from './modules/feedback/components/FeedbackForm';
import MeetingDashboard from './modules/analytics/components/MeetingDashboard';

const App: React.FC = () => {
  const { currentView, currentMeetingId, mobileMenuOpen } = useFeedbackStore();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayView, setDisplayView] = useState(currentView);

  useEffect(() => {
    if (currentView !== displayView || currentMeetingId !== null) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setDisplayView(currentView);
        setIsTransitioning(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [currentView, currentMeetingId]);

  const renderContent = () => {
    if (currentView === 'detail' && currentMeetingId) {
      return <MeetingDashboard meetingId={currentMeetingId} />;
    }
    if (currentView === 'create') {
      return <FeedbackForm />;
    }
    return <MeetingList />;
  };

  return (
    <div style={styles.app}>
      <Navbar />
      {mobileMenuOpen && <div style={styles.overlay} onClick={() => useFeedbackStore.getState().toggleMobileMenu()} />}
      <main
        style={{
          ...styles.main,
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? 'translateY(8px)' : 'translateY(0)',
          transition: 'opacity 300ms ease, transform 300ms ease',
        }}
      >
        {renderContent()}
      </main>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    background: 'var(--color-bg)',
    position: 'relative',
  },
  main: {
    marginLeft: '240px',
    minHeight: '100vh',
    transition: 'all 0.3s ease',
    willChange: 'opacity, transform',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.4)',
    zIndex: 140,
    backdropFilter: 'blur(2px)',
    animation: 'fadeIn 0.2s ease',
  },
};

const globalStyles = `
  @media (max-width: 1024px) {
    main {
      margin-left: 0 !important;
      padding-top: 76px;
    }
  }
  
  * {
    -webkit-tap-highlight-color: transparent;
  }
  
  button:focus-visible,
  input:focus-visible,
  textarea:focus-visible,
  select:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
  }
  
  input:focus,
  textarea:focus,
  select:focus {
    border-color: #2563eb !important;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15) !important;
  }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = globalStyles;
document.head.appendChild(styleSheet);

export default App;
