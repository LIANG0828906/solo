import { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useStore } from './store';
import Navbar from './Navbar';
import PortfolioManager from './PortfolioManager';
import StatsDashboard from './StatsDashboard';
import InboxPanel from './InboxPanel';
import ProjectBoard from './ProjectBoard';

function PageWrapper({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setShow(false);
    const t = setTimeout(() => setShow(true), 10);
    return () => clearTimeout(t);
  }, [location.pathname]);

  return (
    <div
      style={{
        ...styles.pageWrapper,
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.35s ease, transform 0.35s ease',
      }}
    >
      {children}
    </div>
  );
}

export default function App() {
  const hydrate = useStore((s) => s.hydrate);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    void hydrate().then(() => setHydrated(true));
  }, [hydrate]);

  if (!hydrated) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>加载中...</p>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <Navbar />
      <main style={styles.main}>
        <Routes>
          <Route path="/" element={<PageWrapper><StatsDashboard /></PageWrapper>} />
          <Route path="/dashboard" element={<PageWrapper><StatsDashboard /></PageWrapper>} />
          <Route path="/inbox" element={<PageWrapper><InboxPanel /></PageWrapper>} />
          <Route path="/portfolio" element={<PageWrapper><PortfolioManager /></PageWrapper>} />
          <Route path="/projects" element={<PageWrapper><ProjectBoard /></PageWrapper>} />
        </Routes>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  loading: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  spinner: {
    width: 48,
    height: 48,
    border: '4px solid #3a3a5c',
    borderTop: '4px solid #4facfe',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    color: '#a0a0b8',
    fontSize: 14,
  },
  main: {
    flex: 1,
    maxWidth: 1400,
    width: '100%',
    margin: '0 auto',
    padding: '32px 28px',
  },
  pageWrapper: {
    minHeight: 'calc(100vh - 140px)',
  },
};
