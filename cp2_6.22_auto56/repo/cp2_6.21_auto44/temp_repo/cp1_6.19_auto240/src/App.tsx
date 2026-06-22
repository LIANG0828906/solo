import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { CharacterPanel } from './components/CharacterPanel';
import { StoryPage } from './story/StoryPage';
import { OverviewPage } from './overview/OverviewPage';
import { ConflictHeatmap } from './analysis/ConflictHeatmap';
import { useAnalysisStore } from './store/useAnalysisStore';

function App() {
  const [currentPage, setCurrentPage] = useState('overview');
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { calculateConflictData } = useAnalysisStore();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    calculateConflictData();
  }, [calculateConflictData]);

  const renderPage = () => {
    switch (currentPage) {
      case 'overview':
        return <OverviewPage />;
      case 'story':
        return <StoryPage />;
      case 'characters':
        return (
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            <h1 style={{ margin: '0 0 20px 0', fontSize: '24px', color: '#2C3E50' }}>
              角色关系管理
            </h1>
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                border: '1px solid #E0E0E0',
                padding: '20px',
                height: 'calc(100vh - 140px)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <ConflictHeatmap />
            </div>
          </div>
        );
      default:
        return <OverviewPage />;
    }
  };

  const showCharacterPanel = !isMobile && (currentPage === 'overview' || currentPage === 'characters');

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        backgroundColor: '#F5F6FA',
        fontFamily:
          '"Noto Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflow: 'hidden',
      }}
    >
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        isMobile={isMobile}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          marginTop: isMobile ? '56px' : 0,
        }}
      >
        {renderPage()}
      </div>

      {showCharacterPanel && <CharacterPanel />}
    </div>
  );
}

export default App;
