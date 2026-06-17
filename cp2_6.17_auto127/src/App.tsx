import React, { useEffect } from 'react';
import { initGame, useGameStore } from './store';
import StatusBar from './components/StatusBar';
import GameBoard from './components/GameBoard';
import TargetIndicator from './components/TargetIndicator';
import GameOverOverlay from './components/GameOverOverlay';
import './styles.css';

export const App: React.FC = () => {
  const phase = useGameStore((s) => s.phase);

  useEffect(() => {
    initGame();
    const store = useGameStore.getState();
    return () => {
      store._engine?.destroy();
    };
  }, []);

  if (phase === 'idle') {
    return (
      <div className="app-root">
        <div
          style={{
            textAlign: 'center',
            zIndex: 2,
          }}
        >
          <h1
            style={{
              fontSize: 48,
              fontWeight: 900,
              letterSpacing: 8,
              marginBottom: 12,
              background: 'linear-gradient(135deg, #00C8FF, #A855F7, #00FF88)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textTransform: 'uppercase',
            }}
          >
            PatternMatch
          </h1>
          <p
            style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: 14,
              letterSpacing: 3,
              marginBottom: 40,
            }}
          >
            快节奏图案匹配游戏 · 正在加载...
          </p>
          <div
            style={{
              width: 60,
              height: 60,
              margin: '0 auto',
              border: '4px solid rgba(0,200,255,0.15)',
              borderTopColor: '#00C8FF',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="app-root">
      <StatusBar />
      <GameBoard />
      <TargetIndicator />
      <GameOverOverlay />
    </div>
  );
};

export default App;
