import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useShallow } from 'zustand/react/shallow';

export const GameOverModal: React.FC = () => {
  const { winner, resetGame, phase } = useGameStore(
    useShallow((s) => ({
      winner: s.winner,
      resetGame: s.resetGame,
      phase: s.phase,
    }))
  );

  const [visible, setVisible] = useState(false);
  const [scale, setScale] = useState(0.8);

  useEffect(() => {
    if (phase === 'game_over' && winner) {
      const t1 = setTimeout(() => setVisible(true), 50);
      const t2 = setTimeout(() => setScale(1), 100);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else {
      setVisible(false);
      setScale(0.8);
    }
  }, [phase, winner]);

  if (phase !== 'game_over' || !winner) return null;

  const isVictory = winner === 'player';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: visible ? 'rgba(0, 0, 0, 0.7)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        transition: 'background 0.3s ease',
      }}
    >
      <div
        style={{
          background: '#2D2D44',
          borderRadius: 16,
          padding: '40px 60px',
          color: 'white',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          transform: `scale(${scale})`,
          transition: 'transform 0.3s ease-out',
          minWidth: 280,
        }}
      >
        <div
          style={{
            fontSize: 32,
            fontWeight: 'bold',
            marginBottom: 16,
            color: isVictory ? '#4CAF50' : '#F44336',
          }}
        >
          {isVictory ? '胜利！' : '失败！'}
        </div>
        <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 28 }}>
          {isVictory ? '恭喜你击败了对手！' : '再接再厉，下次一定能赢！'}
        </div>
        <button
          onClick={resetGame}
          style={{
            padding: '12px 32px',
            fontSize: 16,
            fontWeight: 'bold',
            background: isVictory ? '#4CAF50' : '#E74C3C',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = `0 0 12px ${isVictory ? 'rgba(76, 175, 80, 0.6)' : 'rgba(231, 76, 60, 0.6)'}`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          再来一局
        </button>
      </div>
    </div>
  );
};
