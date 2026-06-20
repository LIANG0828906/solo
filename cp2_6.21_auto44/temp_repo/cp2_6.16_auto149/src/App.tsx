import React, { useRef, useEffect, useCallback } from 'react';
import { useGameStore } from './store/gameStore';
import { GameEngine } from './game/GameEngine';
import HUD from './ui/HUD';
import EventLog from './ui/EventLog';

const gameEngine = new GameEngine();

const comments = [
  'Qualified Navigator',
  'Stellar Hauler',
  'Space Veteran',
  'Iron Convoy Captain',
  'Warp Road Warrior',
  'Cosmic Courier',
  'Void Runner',
  'Nebula Drifter',
  'Starlane Survivor',
  'Asteroid Dodger',
];

const MenuScreen: React.FC = () => {
  const reset = useGameStore((s) => s.reset);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'rgba(11,13,23,0.92)',
        zIndex: 10,
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      <h1
        style={{
          fontSize: 52,
          fontWeight: 900,
          color: '#00ffaa',
          textShadow: '0 0 30px #00ffaa, 0 0 60px #006644',
          letterSpacing: 8,
          marginBottom: 12,
        }}
      >
        VOIDCONVOY
      </h1>
      <p style={{ color: '#C0C8D8', fontSize: 14, marginBottom: 40, letterSpacing: 3 }}>
        SPACE TRANSPORT SIMULATOR
      </p>
      <button
        onClick={() => {
          reset();
          gameEngine.start();
        }}
        style={{
          background: 'linear-gradient(135deg, #008866, #00ffaa)',
          color: '#0B0D17',
          border: 'none',
          padding: '14px 48px',
          fontSize: 16,
          fontWeight: 'bold',
          borderRadius: 6,
          cursor: 'pointer',
          letterSpacing: 2,
          transition: 'transform 0.2s',
        }}
        onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        LAUNCH
      </button>
      <div style={{ marginTop: 40, color: '#667788', fontSize: 11, lineHeight: 1.8, textAlign: 'center' }}>
        <div>WASD / Arrow Keys — Move</div>
        <div>Space — Activate Shield</div>
        <div>Deliver cargo across 5000 units of hostile space</div>
      </div>
    </div>
  );
};

const GameOverScreen: React.FC = () => {
  const { score, difficulty, reset } = useGameStore();
  const comment = comments[Math.floor(Math.random() * comments.length)];

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'rgba(0,0,0,0.85)',
        zIndex: 10,
        fontFamily: "'Segoe UI', sans-serif",
        animation: 'fadeInOverlay 0.5s ease-in',
      }}
    >
      <h2 style={{ color: '#ff4444', fontSize: 36, fontWeight: 900, letterSpacing: 4, marginBottom: 24, textShadow: '0 0 20px #ff4444' }}>
        CONVOY LOST
      </h2>
      <div style={{ color: '#C0C8D8', fontSize: 18, marginBottom: 8 }}>
        Score: <span style={{ color: '#00ffaa', fontWeight: 'bold' }}>{score}</span>
      </div>
      <div style={{ color: '#C0C8D8', fontSize: 14, marginBottom: 8 }}>
        Level: <span style={{ color: '#4488ff' }}>{difficulty}</span>
      </div>
      <div style={{ color: '#8899aa', fontSize: 13, fontStyle: 'italic', marginBottom: 32 }}>
        "{comment}"
      </div>
      <button
        onClick={() => {
          reset();
          gameEngine.start();
        }}
        style={{
          background: 'linear-gradient(135deg, #008866, #00ffaa)',
          color: '#0B0D17',
          border: 'none',
          padding: '12px 40px',
          fontSize: 15,
          fontWeight: 'bold',
          borderRadius: 6,
          cursor: 'pointer',
          letterSpacing: 2,
          transition: 'transform 0.2s',
        }}
        onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        RETRY
      </button>
      <style>{`
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

const VictoryScreen: React.FC = () => {
  const { score, difficulty, cargo, reset } = useGameStore();
  const comment = comments[Math.floor(Math.random() * comments.length)];

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'rgba(0,0,0,0.7)',
        zIndex: 10,
        fontFamily: "'Segoe UI', sans-serif",
        animation: 'fadeInOverlay 0.5s ease-in',
      }}
    >
      <h2 style={{ color: '#00ffaa', fontSize: 36, fontWeight: 900, letterSpacing: 4, marginBottom: 24, textShadow: '0 0 30px #00ffaa' }}>
        CONVOY DELIVERED
      </h2>
      <div style={{ color: '#C0C8D8', fontSize: 22, marginBottom: 12 }}>
        Score: <span style={{ color: '#00ffaa', fontWeight: 'bold', fontSize: 28 }}>{score}/1000</span>
      </div>
      <div style={{ color: '#C0C8D8', fontSize: 14, marginBottom: 8 }}>
        Level: <span style={{ color: '#4488ff' }}>{difficulty}</span>
      </div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        {cargo.map((item, i) => (
          <div key={i} style={{ textAlign: 'center', color: '#C0C8D8', fontSize: 12 }}>
            <div style={{ fontSize: 20 }}>
              {item.type === 'crystal' ? '💎' : item.type === 'ore' ? '🪨' : '🧬'}
            </div>
            <div>{Math.round(item.integrity)}%</div>
          </div>
        ))}
      </div>
      <div style={{ color: '#8899aa', fontSize: 13, fontStyle: 'italic', marginBottom: 32 }}>
        "{comment}"
      </div>
      <button
        onClick={() => {
          reset();
          gameEngine.start();
        }}
        style={{
          background: 'linear-gradient(135deg, #008866, #00ffaa)',
          color: '#0B0D17',
          border: 'none',
          padding: '12px 40px',
          fontSize: 15,
          fontWeight: 'bold',
          borderRadius: 6,
          cursor: 'pointer',
          letterSpacing: 2,
          transition: 'transform 0.2s',
        }}
        onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        NEW RUN
      </button>
      <style>{`
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phase = useGameStore((s) => s.phase);

  useEffect(() => {
    if (canvasRef.current) {
      gameEngine.init(canvasRef.current);
    }

    const handleResize = () => {
      gameEngine.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      gameEngine.stop();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const startGame = useCallback(() => {
    gameEngine.start();
  }, []);

  useEffect(() => {
    if (phase === 'playing') {
      gameEngine.start();
    }
  }, [phase]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#0B0D17' }}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />

      {phase === 'playing' && (
        <>
          <HUD />
          <EventLog />
        </>
      )}

      {phase === 'menu' && <MenuScreen />}
      {phase === 'gameover' && <GameOverScreen />}
      {phase === 'victory' && <VictoryScreen />}
    </div>
  );
};

export default App;
