import { ScorePanel } from './ui/ScorePanel';
import { GameBoard } from './ui/GameBoard';

export default function App() {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#1a1a2e',
        overflow: 'hidden',
      }}
    >
      <ScorePanel />
      <GameBoard />
    </div>
  );
}
