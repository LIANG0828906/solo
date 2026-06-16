import GameCanvas from './ui/GameCanvas';
import GameHud from './ui/GameHud';
import MainMenu from './ui/MainMenu';
import { useGameStore, type GameStore } from './store/gameStore';

export default function App() {
  const gameState = useGameStore((s: GameStore) => s.gameState);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        background: '#1a0f0a',
      }}
    >
      <GameCanvas />
      <GameHud />
      {gameState !== 'playing' && <MainMenu />}
    </div>
  );
}
