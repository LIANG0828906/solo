import { useState, useEffect } from 'react';
import QAPage from './features/qa/QAPage';
import FeedbackDashboard from './features/qa/FeedbackDashboard';
import { useFeedbackStore } from './modules/feedback/feedbackStore';

type Page = 'qa' | 'admin';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('qa');
  const { feedbacks } = useFeedbackStore();

  useEffect(() => {
    useFeedbackStore.persist.rehydrate();
  }, []);

  return (
    <div style={styles.appContainer}>
      <nav style={styles.nav}>
        <div style={styles.navBrand}>
          <svg style={styles.brandIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <span style={styles.brandText}>智能手册问答</span>
        </div>
        <div style={styles.navLinks}>
          <button
            onClick={() => setCurrentPage('qa')}
            style={{
              ...styles.navButton,
              ...(currentPage === 'qa' ? styles.navButtonActive : {})
            }}
            className={`nav-button ${currentPage === 'qa' ? 'nav-button-active' : ''}`}
          >
            问答中心
          </button>
          <button
            onClick={() => setCurrentPage('admin')}
            style={{
              ...styles.navButton,
              ...(currentPage === 'admin' ? styles.navButtonActive : {}),
              ...styles.adminButton
            }}
            className={`nav-button ${currentPage === 'admin' ? 'nav-button-active' : ''}`}
          >
            管理后台
            {feedbacks.filter(f => f.status === 'pending').length > 0 && (
              <span style={styles.badge}>
                {feedbacks.filter(f => f.status === 'pending').length}
              </span>
            )}
          </button>
        </div>
      </nav>
      <main style={styles.main}>
        {currentPage === 'qa' ? <QAPage /> : <FeedbackDashboard />}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column'
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 32px',
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  navBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#2c3e50'
  },
  brandIcon: {
    width: '28px',
    height: '28px',
    color: '#3498db'
  },
  brandText: {
    fontSize: '18px',
    fontWeight: 600
  },
  navLinks: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  navButton: {
    padding: '8px 20px',
    border: 'none',
    borderRadius: '8px',
    background: 'transparent',
    color: '#7f8c8d',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 150ms ease',
    position: 'relative'
  },
  navButtonActive: {
    background: '#3498db',
    color: '#fff',
    boxShadow: '0 4px 12px rgba(52, 152, 219, 0.3)'
  },
  adminButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  badge: {
    background: '#e74c3c',
    color: '#fff',
    fontSize: '11px',
    padding: '2px 6px',
    borderRadius: '10px',
    minWidth: '18px',
    textAlign: 'center',
    fontWeight: 600
  },
  main: {
    flex: 1,
    padding: '24px 32px',
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto'
  }
};

export default App;
