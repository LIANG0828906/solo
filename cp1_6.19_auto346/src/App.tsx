import React, { useState, useEffect } from 'react';
import { BattlefieldCanvas } from './components/BattlefieldCanvas';
import { CommandPanel } from './components/CommandPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { startAISystem, stopAISystem } from './modules/ai';
import './index.css';

const App: React.FC = () => {
  const [mobileCommandOpen, setMobileCommandOpen] = useState(false);

  useEffect(() => {
    startAISystem();
    return () => stopAISystem();
  }, []);

  return (
    <div className="app-root">
      <HistoryPanel />
      <main className="main-content">
        <BattlefieldCanvas onOpenMobileCommand={() => setMobileCommandOpen(true)} />
      </main>
      <CommandPanel
        mobileOpen={mobileCommandOpen}
        onCloseMobile={() => setMobileCommandOpen(false)}
      />
    </div>
  );
};

export default App;
