import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import PlantDetail from './components/PlantDetail';
import Calendar from './components/Calendar';
import { usePlantStore } from './store/plantStore';

const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: '我的植物', icon: '🌿' },
    { path: '/calendar', label: '养护日历', icon: '📅' }
  ];

  return (
    <nav style={styles.nav}>
      <div style={styles.navBrand}>
        <span style={styles.navIcon}>🌱</span>
        <span style={styles.navTitle}>PlantPal</span>
      </div>
      <div style={styles.navLinks}>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              ...styles.navLink,
              ...(location.pathname === item.path ? styles.navLinkActive : {})
            }}
          >
            <span style={styles.navLinkIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

const App = () => {
  const initStore = usePlantStore((state) => state.initStore);
  const isLoading = usePlantStore((state) => state.isLoading);

  useEffect(() => {
    initStore();
  }, [initStore]);

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>正在加载您的植物园...</p>
      </div>
    );
  }

  return (
    <Router>
      <div style={styles.appContainer}>
        <Navigation />
        <main style={styles.mainContent}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/plant/:id" element={<PlantDetail />} />
            <Route path="/calendar" element={<Calendar />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

const styles = {
  appContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: 'var(--primary-bg)'
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 32px',
    backgroundColor: 'var(--card-bg)',
    borderBottom: '2px solid var(--border-color)',
    boxShadow: '0 2px 8px rgba(107, 142, 35, 0.1)'
  },
  navBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  navIcon: {
    fontSize: '28px'
  },
  navTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: 'var(--primary-green)',
    letterSpacing: '-0.5px'
  },
  navLinks: {
    display: 'flex',
    gap: '8px'
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 20px',
    borderRadius: '10px',
    textDecoration: 'none',
    color: 'var(--text-secondary)',
    fontWeight: 500,
    transition: 'all 0.3s ease'
  },
  navLinkActive: {
    backgroundColor: 'rgba(107, 142, 35, 0.1)',
    color: 'var(--primary-green)'
  },
  navLinkIcon: {
    fontSize: '16px'
  },
  mainContent: {
    flex: 1,
    padding: '24px 32px',
    maxWidth: '1600px',
    width: '100%',
    margin: '0 auto'
  },
  loadingContainer: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--primary-bg)'
  },
  loadingSpinner: {
    width: '50px',
    height: '50px',
    border: '4px solid var(--light-green)',
    borderTop: '4px solid var(--primary-green)',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    marginTop: '16px',
    color: 'var(--text-secondary)',
    fontSize: '16px'
  }
};

export default App;
