import { GameBoard } from './components/GameBoard';
import { BattleUI } from './components/BattleUI';
import { HUD } from './components/HUD';
import { Inventory } from './components/Inventory';
import { useGameStore } from './gameStore';
import './App.css';

function App() {
  const { screenShake, damageVignette } = useGameStore();

  return (
    <div
      className={`app-root ${screenShake ? 'shake' : ''} ${damageVignette ? 'damaged' : ''}`}
    >
      {damageVignette && <div className="damage-vignette" />}
      <HUD />
      <Inventory />
      <GameBoard />
      <BattleUI />
      <div className="controls-hint">使用方向键 ↑↓←→ 或 WASD 移动</div>
    </div>
  );
}

export default App;
