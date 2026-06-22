import React, { useEffect } from 'react';
import { AppProvider, useApp } from './state/store';
import { TaskBoard } from './components/TaskBoard';
import { PomodoroTimer } from './components/PomodoroTimer';
import { StatsPanel } from './components/StatsPanel';
import { ThemeToggle } from './components/ThemeToggle';

const AppContent: React.FC = () => {
  const { state } = useApp();

  useEffect(() => {
    if (state.theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [state.theme]);

  return (
    <div className="app-container">
      <ThemeToggle />
      <div className="main-area">
        <PomodoroTimer />
        <TaskBoard />
      </div>
      <div className="stats-area">
        <StatsPanel />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
