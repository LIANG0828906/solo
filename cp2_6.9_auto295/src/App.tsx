import { useState, useCallback } from 'react';
import type { Tea, Snack } from './types';
import TeaRack from './components/TeaRack';
import SnackRack from './components/SnackRack';
import TeaBrewing from './components/TeaBrewing';
import TastingPanel from './components/TastingPanel';

export default function App() {
  const [selectedTea, setSelectedTea] = useState<Tea | null>(null);
  const [selectedSnacks, setSelectedSnacks] = useState<Snack[]>([]);
  const [showTastingPanel, setShowTastingPanel] = useState(false);
  const [leftMenuOpen, setLeftMenuOpen] = useState(false);
  const [rightMenuOpen, setRightMenuOpen] = useState(false);

  const handleTeaSelect = useCallback((tea: Tea) => {
    setSelectedTea(tea);
    setLeftMenuOpen(false);
  }, []);

  const handleSnackSelect = useCallback((snack: Snack) => {
    setSelectedSnacks(prev => {
      const exists = prev.find(s => s.id === snack.id);
      if (exists) {
        return prev.filter(s => s.id !== snack.id);
      }
      return [...prev, snack];
    });
  }, []);

  const handleBrewingComplete = useCallback(() => {
    setShowTastingPanel(true);
    setRightMenuOpen(false);
  }, []);

  const handleTastingClose = useCallback(() => {
    setShowTastingPanel(false);
  }, []);

  return (
    <div className="tea-house">
      <button
        className={`menu-toggle left ${leftMenuOpen ? 'active' : ''}`}
        onClick={() => setLeftMenuOpen(!leftMenuOpen)}
      >
        茶
      </button>
      <button
        className={`menu-toggle right ${rightMenuOpen ? 'active' : ''}`}
        onClick={() => setRightMenuOpen(!rightMenuOpen)}
      >
        点
      </button>

      <div className="main-layout">
        <aside className={`side-panel tea-rack-panel ${leftMenuOpen ? 'open' : ''}`}>
          <TeaRack
            onTeaSelect={handleTeaSelect}
            selectedTea={selectedTea}
          />
        </aside>

        <main className="center-panel">
          <TeaBrewing
            selectedTea={selectedTea}
            selectedSnacks={selectedSnacks}
            onBrewingComplete={handleBrewingComplete}
          />
        </main>

        <aside className={`side-panel snack-rack-panel ${rightMenuOpen ? 'open' : ''}`}>
          <SnackRack
            onSnackSelect={handleSnackSelect}
            selectedSnacks={selectedSnacks}
          />
        </aside>
      </div>

      <TastingPanel
        isOpen={showTastingPanel}
        selectedTea={selectedTea}
        selectedSnacks={selectedSnacks}
        onClose={handleTastingClose}
      />
    </div>
  );
}
