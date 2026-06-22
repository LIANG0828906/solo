import React, { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import { SnippetPanel } from './components/SnippetPanel';
import { CodeEditor } from './components/CodeEditor';
import { RelationGraph } from './components/RelationGraph';
import './index.css';

const AppContent: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="app-layout">
      {isMobile && (
        <button
          className={`menu-toggle ${isPanelOpen ? 'open' : ''}`}
          onClick={() => setIsPanelOpen(!isPanelOpen)}
        >
          ☰
        </button>
      )}

      <div className={`panel-wrapper ${isMobile && isPanelOpen ? 'open' : ''} ${isMobile ? 'mobile' : ''}`}>
        <SnippetPanel />
      </div>

      {isMobile && isPanelOpen && (
        <div
          className="panel-overlay"
          onClick={() => setIsPanelOpen(false)}
        />
      )}

      <main className="main-content">
          <CodeEditor />
          <RelationGraph />
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
