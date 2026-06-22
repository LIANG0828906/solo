import React, { useEffect } from 'react';
import { TimelineBoard } from './TimelineBoard';
import { TimeStream } from './TimeStream';
import { StatusBar } from './components/StatusBar';
import { StatsPanel } from './components/StatsPanel';
import { NotificationBar } from './components/NotificationBar';
import { useWebSocket } from './useWebSocket';
import { useAppStore } from './store';
import { taskApi } from './api';

const App: React.FC = () => {
  useWebSocket();
  const setTasks = useAppStore((state) => state.setTasks);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const tasks = await taskApi.getTasks();
        setTasks(tasks);
      } catch (error) {
        console.error('Failed to load tasks:', error);
      }
    };
    loadTasks();
  }, [setTasks]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: 'radial-gradient(ellipse at center, #1A1A3A 0%, #0F0F23 100%)'
      }}
    >
      <NotificationBar />
      <StatusBar />

      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TimeStream />
        <TimelineBoard />
      </div>

      <StatsPanel />
    </div>
  );
};

export default App;
