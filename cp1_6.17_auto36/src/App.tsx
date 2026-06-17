import { useEffect } from 'react';
import { GameBoard } from './GameBoard';
import { ControlPanel } from './ui/ControlPanel';
import { EventModal } from './ui/EventModal';
import { GameOverScreen } from './ui/GameOverScreen';
import { VictoryScreen } from './ui/VictoryScreen';
import { HistoryList } from './ui/HistoryList';
import { useGameStore } from './store/useGameStore';

function App() {
  const { startNewGame, updateElapsedTime, gameStatus } = useGameStore((state) => ({
    startNewGame: state.startNewGame,
    updateElapsedTime: state.updateElapsedTime,
    gameStatus: state.gameStatus,
  }));

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const timer = setInterval(() => {
      updateElapsedTime();
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStatus, updateElapsedTime]);

  return (
    <div className="app">
      <div className="dungeon-frame">
        <div className="brick-border brick-border-top" />
        <div className="brick-border brick-border-bottom" />
        <div className="brick-border brick-border-left" />
        <div className="brick-border brick-border-right" />

        <div className="game-container">
          <header className="game-header">
            <h1 className="game-title">地牢探索者 v1.0</h1>
          </header>

          <main className="game-main">
            <div className="game-content">
              <GameBoard />
              <ControlPanel />
            </div>
          </main>

          <HistoryList />
        </div>
      </div>

      <EventModal />
      <GameOverScreen />
      <VictoryScreen />
    </div>
  );
}

export default App;
