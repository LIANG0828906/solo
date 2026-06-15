import React, { useState, useCallback } from 'react';
import { PetEgg, LogEntry, HatchResult } from './types';
import { initialEggs } from './data/eggs';
import PetEggGrid from './components/PetEggGrid';
import HatchController from './components/HatchController';
import GrowthLog from './components/GrowthLog';
import './App.css';

type ViewMode = 'grid' | 'hatch';

const App: React.FC = () => {
  const [eggs] = useState<PetEgg[]>(initialEggs);
  const [selectedEgg, setSelectedEgg] = useState<PetEgg | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const handleSelectEgg = useCallback((egg: PetEgg) => {
    setSelectedEgg(egg);
    setViewMode('hatch');
  }, []);

  const handleBackToGrid = useCallback(() => {
    setViewMode('grid');
    setSelectedEgg(null);
  }, []);

  const handleHatchComplete = useCallback((result: HatchResult) => {
    if (result.success && result.pet) {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
        .getMinutes()
        .toString()
        .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      const newLog: LogEntry = {
        id: `log-${Date.now()}`,
        time: timeStr,
        message: `成功孵化了${result.pet.name}！`,
      };

      setLogs((prevLogs) => {
        const updated = [newLog, ...prevLogs];
        return updated.slice(0, 20);
      });
    }
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">🌴 宠物蛋孵化养成 🌴</h1>
        {viewMode === 'hatch' && (
          <button className="back-btn" onClick={handleBackToGrid}>
            ← 返回蛋库
          </button>
        )}
      </header>

      <main className="main-content">
        {viewMode === 'grid' ? (
          <PetEggGrid
            eggs={eggs}
            selectedEggId={selectedEgg?.id || null}
            onSelectEgg={handleSelectEgg}
          />
        ) : (
          <HatchController
            selectedEgg={selectedEgg}
            onHatchComplete={handleHatchComplete}
          />
        )}
      </main>

      <footer className="app-footer">
        <GrowthLog logs={logs} />
      </footer>
    </div>
  );
};

export default App;
