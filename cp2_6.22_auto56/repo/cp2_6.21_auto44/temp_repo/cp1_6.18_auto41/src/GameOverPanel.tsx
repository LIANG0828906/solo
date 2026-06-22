import React from 'react';
import { Player } from './types';

interface GameOverPanelProps {
  winner: Player;
  finalScore: number;
  bestCombo: number;
  averageAccuracy: number;
  onRestart: () => void;
}

export const GameOverPanel: React.FC<GameOverPanelProps> = ({
  winner,
  finalScore,
  bestCombo,
  averageAccuracy,
  onRestart,
}) => {
  const winnerColor = winner === 'player1' ? '#4A90D9' : '#D94A4A';
  const winnerText = winner === 'player1' ? '蓝方' : '红方';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          width: '360px',
          height: '260px',
          backgroundColor: '#1A1E2E',
          borderRadius: '16px',
          padding: '30px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <h2
          style={{
            margin: 0,
            color: winnerColor,
            fontSize: '24px',
            fontWeight: 'bold',
            textShadow: `0 0 20px ${winnerColor}50`,
          }}
        >
          {winnerText}获胜！
        </h2>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
              最终得分
            </span>
            <span style={{ color: '#FFFFFF', fontSize: '18px', fontWeight: 'bold' }}>
              {Math.round(finalScore)}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
              最优连击
            </span>
            <span style={{ color: '#FFD700', fontSize: '18px', fontWeight: 'bold' }}>
              {bestCombo}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
              节奏准确率
            </span>
            <span style={{ color: '#00FF88', fontSize: '18px', fontWeight: 'bold' }}>
              {(averageAccuracy * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        <button
          onClick={onRestart}
          style={{
            width: '100%',
            height: '44px',
            backgroundColor: winnerColor,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: `0 4px 15px ${winnerColor}50`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = `0 6px 20px ${winnerColor}70`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = `0 4px 15px ${winnerColor}50`;
          }}
        >
          再来一局
        </button>
      </div>
    </div>
  );
};
