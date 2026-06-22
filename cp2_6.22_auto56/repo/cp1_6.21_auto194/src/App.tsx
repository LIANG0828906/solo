import React, { useEffect } from 'react';
import { EditorProvider, useEditor } from './context/EditorContext';
import { ToastProvider } from './components/Toast';
import StarCanvas from './components/StarCanvas';
import WriterPanel from './components/WriterPanel';
import StatsCard from './components/StatsCard';
import { DARK_COLORS, LIGHT_COLORS } from './constants';

const AppContent: React.FC = () => {
  const { theme } = useEditor();
  const colors = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;

  useEffect(() => {
    const root = document.documentElement;
    root.style.transition = 'background-color 0.4s ease';
    root.style.backgroundColor = colors.bg;
  }, [theme, colors.bg]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: colors.bg,
        transition: 'background-color 0.4s ease',
      }}
    >
      <StarCanvas />
      <WriterPanel />
      <StatsCard />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <EditorProvider>
        <AppContent />
      </EditorProvider>
    </ToastProvider>
  );
};

export default App;
