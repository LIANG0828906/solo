import React, { useState, useEffect } from 'react';
import MapView from './components/MapView';
import RoutePanel from './components/RoutePanel';
import { useRouteStore } from './store/useRouteStore';
import { Menu, X, Mountain } from 'lucide-react';

const App: React.FC = () => {
  const isPanelExpanded = useRouteStore((state) => state.isPanelExpanded);
  const togglePanel = useRouteStore((state) => state.togglePanel);
  const fetchGearList = useRouteStore((state) => state.fetchGearList);
  const points = useRouteStore((state) => state.points);
  const route = useRouteStore((state) => state.route);

  useEffect(() => {
    fetchGearList();
  }, [fetchGearList]);

  return (
    <div style={styles.appContainer}>
      <header style={styles.header}>
        <div style={styles.logo}>
          <Mountain size={28} color="#2E7D32" />
          <span style={styles.logoText}>TrailPlanner</span>
        </div>
        <button
          onClick={togglePanel}
          style={styles.panelToggle}
          className="mobile-only"
        >
          {isPanelExpanded ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      <div style={styles.mainContent}>
        <div style={styles.mapContainer}>
          <MapView />
        </div>
        <div
          style={{
            ...styles.panelContainer,
            transform: isPanelExpanded ? 'translateX(0)' : 'translateX(100%)',
          }}
          className={isPanelExpanded ? 'panel-expanded' : 'panel-collapsed'}
        >
          <RoutePanel />
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-only {
            display: flex !important;
          }
          .panel-container {
            position: absolute !important;
            right: 0;
            top: 56px;
            bottom: 0;
            width: 85% !important;
            max-width: 360px;
            z-index: 100;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            box-shadow: -4px 0 20px rgba(0,0,0,0.1);
          }
          .panel-expanded {
            transform: translateX(0) !important;
          }
          .map-container {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    fontFamily: "'Inter', sans-serif",
  },
  header: {
    height: 56,
    background: 'white',
    borderBottom: '1px solid #e8e4dc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    zIndex: 10,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontFamily: "'Montserrat', sans-serif",
    fontWeight: 800,
    fontSize: 20,
    color: '#2E7D32',
    letterSpacing: -0.5,
  },
  panelToggle: {
    display: 'none',
    width: 36,
    height: 36,
    borderRadius: 8,
    border: 'none',
    background: '#f5f2ed',
    color: '#6D4C41',
    cursor: 'pointer',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    position: 'relative',
    overflow: 'hidden',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    width: '70%',
  },
  panelContainer: {
    width: '30%',
    minWidth: 340,
    maxWidth: 420,
    background: '#FAF8F5',
    borderLeft: '1px solid #e8e4dc',
    overflowY: 'auto',
    overflowX: 'hidden',
    transition: 'transform 0.3s ease',
  },
};

export default App;
