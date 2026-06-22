import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import MarketList from '@/pages/MarketList';
import MarketDetail from '@/pages/MarketDetail';
import { useAppStore } from '@/store';

const App: React.FC = () => {
  const { sidebarOpen } = useAppStore();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        useAppStore.getState().toggleSidebar();
      } else if (!useAppStore.getState().sidebarOpen) {
        useAppStore.getState().toggleSidebar();
      }
    };

    if (window.innerWidth < 768 && sidebarOpen) {
      useAppStore.getState().toggleSidebar();
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={styles.app}>
      <Header />
      <div style={styles.main}>
        <Sidebar />
        <main
          style={{
            ...styles.content,
            marginLeft: sidebarOpen ? '230px' : '0',
          }}
        >
          <Routes>
            <Route path="/" element={<MarketList />} />
            <Route path="/market/:id" element={<MarketDetail />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--bg-primary)',
  },
  main: {
    flex: 1,
    display: 'flex',
    position: 'relative',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    transition: 'margin-left 300ms ease-out',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 'calc(100vh - 64px)',
  },
};

export default App;
