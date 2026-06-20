import { useGameStore } from './store/useGameStore';
import GameBoard from './ui/GameBoard';
import UIPanel from './ui/UIPanel';
import VictoryModal from './ui/VictoryModal';
import './App.css';

export default function App() {
  const { state } = useGameStore();
  const { players } = state;

  return (
    <div className="app-root">
      <header className="game-header">
        <h1 className="game-title">符文矿车</h1>
        <div className="score-bar">
          <div className="score-item player-score">
            <span className="score-label">玩家</span>
            <span className="score-value">{players.player.score}</span>
          </div>
          <div className="score-divider">VS</div>
          <div className="score-item ai-score">
            <span className="score-label">AI</span>
            <span className="score-value">{players.ai.score}</span>
          </div>
        </div>
      </header>

      <main className="game-main">
        <UIPanel />
        <div className="board-wrapper">
          <GameBoard />
        </div>
      </main>

      <VictoryModal />
    </div>
  );
}
