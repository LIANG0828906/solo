import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import ComponentPalette from './components/ComponentPalette';
import ComponentRenderer from './components/ComponentRenderer';
import SnapshotManager from './components/SnapshotManager';

function AppShell() {
  const { state } = useApp();
  const isDark = state.theme === 'dark';

  return (
    <div
      className={`h-screen w-screen overflow-hidden flex flex-col font-sans transition-colors duration-500 ${
        isDark ? 'text-slate-100' : 'text-slate-800'
      }`}
      style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
    >
      <SnapshotManager />
      <div className="flex-1 flex overflow-hidden">
        <ComponentPalette />
        <ComponentRenderer />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
