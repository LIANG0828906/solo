import { useState, useCallback } from 'react';
import { ModeSelect } from './components/ModeSelect';
import { GameBoard } from './GameBoard';
import type { GameMode } from './types';

type ViewMode = 'menu' | 'game';

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('menu');
  const [gameMode, setGameMode] = useState<GameMode>('single');

  const handleSelectMode = useCallback((mode: GameMode) => {
    setGameMode(mode);
    setViewMode('game');
  }, []);

  const handleBackToMenu = useCallback(() => {
    setViewMode('menu');
  }, []);

  return (
    <div className="app">
      {viewMode === 'menu' && (
        <ModeSelect onSelectMode={handleSelectMode} />
      )}
      {viewMode === 'game' && (
        <GameBoard
          mode={gameMode}
          onBackToMenu={handleBackToMenu}
        />
      )}
    </div>
  );
}

export default App;
