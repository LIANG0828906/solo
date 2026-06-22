import React from 'react';
import { useGameStore, GameState } from './store';

export const UI: React.FC = () => {
  const state = useGameStore((s) => s.state);
  const score = useGameStore((s) => s.score);
  const lives = useGameStore((s) => s.lives);
  const bpm = useGameStore((s) => s.bpm);
  const progress = useGameStore((s) => s.progress);
  const flashRed = useGameStore((s) => s.flashRed);

  const livesDisplay = Array.from({ length: 3 }, (_, i) => (
    <span
      key={i}
      style={{
        color: i < lives ? '#FF6B6B' : '#333',
        fontSize: '1.2rem',
        margin: '0 2px',
        transition: 'color 0.2s',
      }}
    >
      ♥
    </span>
  ));

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 60,
          background: 'rgba(22, 33, 62, 0.8)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          zIndex: 10,
          fontFamily: '"Segoe UI", Arial, sans-serif',
        }}
      >
        <div
          style={{
            color: '#FFFFFF',
            fontSize: '1.2rem',
            fontWeight: 600,
            marginRight: 32,
            minWidth: 100,
          }}
        >
          {score}
        </div>
        <div style={{ marginRight: 32, display: 'flex', alignItems: 'center' }}>
          {livesDisplay}
        </div>
        <div
          style={{
            color: '#A0A0A0',
            fontSize: '0.9rem',
            marginRight: 32,
          }}
        >
          BPM: {bpm}
        </div>
        <div style={{ flex: 1 }} />
        {state === 'playing' && (
          <div style={{ color: '#A0A0A0', fontSize: '0.8rem' }}>ESC: Pause</div>
        )}
      </div>

      <div
        style={{
          position: 'absolute',
          top: 60,
          left: 0,
          right: 0,
          height: 1,
          background: '#16213E',
          zIndex: 10,
        }}
      >
        <div
          style={{
            height: '0.5px',
            width: `${progress * 100}%`,
            background: '#4ECDC4',
            transition: 'width 0.3s',
          }}
        />
      </div>

      {state === 'idle' && <StartOverlay />}
      {state === 'paused' && <PauseOverlay />}
      {state === 'gameover' && <GameOverOverlay score={score} />}

      {flashRed && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#FF000030',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        />
      )}
    </>
  );
};

const StartOverlay: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 20,
      background: 'rgba(26, 26, 46, 0.9)',
      fontFamily: '"Segoe UI", Arial, sans-serif',
    }}
  >
    <h1
      style={{
        color: '#4ECDC4',
        fontSize: '3rem',
        marginBottom: 16,
        fontWeight: 700,
        letterSpacing: 4,
      }}
    >
      RHYTHM RUNNER
    </h1>
    <p style={{ color: '#A0A0A0', fontSize: '1rem', marginBottom: 32 }}>
      Jump to the beat, dodge the obstacles!
    </p>
    <button
      id="start-btn"
      style={{
        background: '#4ECDC4',
        color: '#1A1A2E',
        border: 'none',
        padding: '14px 48px',
        fontSize: '1.2rem',
        fontWeight: 700,
        borderRadius: 8,
        cursor: 'pointer',
        letterSpacing: 2,
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.boxShadow = '0 0 20px #4ECDC480';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      START
    </button>
    <p style={{ color: '#666', fontSize: '0.85rem', marginTop: 16 }}>
      Press SPACE or ↑ to start and jump
    </p>
  </div>
);

const PauseOverlay: React.FC = () => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 20,
      background: 'rgba(26, 26, 46, 0.85)',
      fontFamily: '"Segoe UI", Arial, sans-serif',
    }}
  >
    <h2 style={{ color: '#FFE66D', fontSize: '2rem', marginBottom: 16 }}>PAUSED</h2>
    <p style={{ color: '#A0A0A0', fontSize: '1rem' }}>Press SPACE or ESC to resume</p>
  </div>
);

const GameOverOverlay: React.FC<{ score: number }> = ({ score }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 20,
      background: 'rgba(26, 26, 46, 0.9)',
      fontFamily: '"Segoe UI", Arial, sans-serif',
    }}
  >
    <h2
      style={{
        color: '#FF6B6B',
        fontSize: '2rem',
        marginBottom: 16,
        fontWeight: 700,
      }}
    >
      Game Over
    </h2>
    <p style={{ color: '#FFFFFF', fontSize: '1.2rem', marginBottom: 24 }}>
      Score: {score}
    </p>
    <button
      id="restart-btn"
      style={{
        background: '#FF6B6B',
        color: '#FFFFFF',
        border: 'none',
        padding: '12px 40px',
        fontSize: '1.1rem',
        fontWeight: 700,
        borderRadius: 8,
        cursor: 'pointer',
        letterSpacing: 1,
        transition: 'transform 0.15s',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      RESTART
    </button>
    <p style={{ color: '#666', fontSize: '0.85rem', marginTop: 12 }}>
      Press SPACE or ENTER to restart
    </p>
  </div>
);
