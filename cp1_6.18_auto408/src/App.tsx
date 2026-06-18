import GameCanvas from '@/components/GameCanvas';
import HUD from '@/components/HUD';
import VictoryScreen from '@/components/VictoryScreen';

export default function App() {
  return (
    <div className="app">
      <div className="game-wrapper">
        <GameCanvas />
        <HUD />
        <VictoryScreen />
      </div>
    </div>
  );
}
