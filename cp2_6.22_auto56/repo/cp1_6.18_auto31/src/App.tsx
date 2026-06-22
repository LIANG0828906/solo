import GameCanvas from './GameCanvas';
import { ScoreDisplay, ComboDisplay, PauseButton, StartOverlay, ScorePanel } from './ui';
import { useGameStore } from './store';

export default function App() {
  const phase = useGameStore((s) => s.phase);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: '#0A0E27',
      }}
    >
      <GameCanvas />
      {phase !== 'idle' && phase !== 'gameover' && <ScoreDisplay />}
      {phase !== 'idle' && phase !== 'gameover' && <ComboDisplay />}
      {(phase === 'running' || phase === 'paused') && <PauseButton />}
      <StartOverlay />
      <ScorePanel />
    </div>
  );
}
