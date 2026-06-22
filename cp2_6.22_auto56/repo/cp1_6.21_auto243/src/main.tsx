import React from 'react';
import ReactDOM from 'react-dom/client';
import { GameEngine, GameState } from './GameCore/gameEngine';
import { HUD } from './UI/hud';
import { EvolutionPanel } from './UI/evolutionPanel';

interface GameOverPanelProps {
  state: GameState;
  onReset: () => void;
}

const GameOverPanel: React.FC<GameOverPanelProps> = ({ state, onReset }) => {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0, 0, 0, 0.6)',
      zIndex: 100,
      animation: 'fadeIn 0.3s ease-out',
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.9); }
          70% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div style={{
        width: 420,
        background: '#1A202C',
        borderRadius: 16,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
        boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(79, 209, 197, 0.1)',
        animation: 'popIn 0.4s ease-out',
      }}>
        <div style={{
          fontSize: 24,
          fontWeight: 700,
          color: '#E53E3E',
          letterSpacing: 2,
        }}>
          细胞凋亡
        </div>

        <div style={{
          fontSize: 48,
          fontWeight: 800,
          color: '#4FD1C5',
          lineHeight: 1,
          textShadow: '0 0 20px rgba(79, 209, 197, 0.4)',
        }}>
          {state.score}
        </div>
        <span style={{ color: '#718096', fontSize: 13, marginTop: -12 }}>最终得分</span>

        <div style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 12,
        }}>
          <StatCard label="吞噬球体" value={state.orbsEaten} color="#F6AD55" />
          <StatCard label="击败敌人" value={state.enemiesKilled} color="#E53E3E" />
          <StatCard label="存活时间" value={`${state.survivalTime}s`} color="#4FD1C5" />
        </div>

        <button
          onClick={onReset}
          style={{
            width: '100%',
            padding: '14px 0',
            borderRadius: 12,
            border: 'none',
            background: '#4FD1C5',
            color: '#1A202C',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            letterSpacing: 2,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#38B2AC';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(79, 209, 197, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#4FD1C5';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          再来一局
        </button>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number | string; color: string }> = ({ label, value, color }) => (
  <div style={{
    background: '#2D3748',
    borderRadius: 8,
    padding: '12px 8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  }}>
    <span style={{ color, fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
      {value}
    </span>
    <span style={{ color: '#718096', fontSize: 11 }}>{label}</span>
  </div>
);

interface AppProps {
  engine: GameEngine;
}

const App: React.FC<AppProps> = ({ engine }) => {
  const [gameState, setGameState] = React.useState<GameState>(engine.getState());

  React.useEffect(() => {
    const unsubscribe = engine.subscribe((state) => {
      setGameState(state);
    });
    return unsubscribe;
  }, [engine]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <HUD state={gameState} />
      {!gameState.gameOver && <EvolutionPanel state={gameState} onPurchase={(id) => engine.purchaseUpgrade(id)} />}
      {gameState.gameOver && <GameOverPanel state={gameState} onReset={() => engine.reset()} />}
    </div>
  );
};

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const engine = new GameEngine(canvas);
engine.start();

const root = ReactDOM.createRoot(document.getElementById('ui-root')!);
root.render(<App engine={engine} />);
