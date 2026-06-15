import React, { useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';

const GameOverlay: React.FC = () => {
  const gamePhase = useGameStore((s) => s.gamePhase);
  const depth = useGameStore((s) => s.depth);
  const maxDepth = useGameStore((s) => s.maxDepth);
  const turn = useGameStore((s) => s.turn);
  const collectedParts = useGameStore((s) => s.collectedParts);

  const handleRestart = useCallback(() => {
    window.location.reload();
  }, []);

  if (gamePhase !== 'gameover' && gamePhase !== 'victory') return null;

  const isVictory = gamePhase === 'victory';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(2, 12, 27, 0.92)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        animation: 'fadeIn 0.5s ease-out',
      }}
    >
      <div
        className="glass-panel glow-panel"
        style={{
          padding: 48,
          maxWidth: 500,
          width: '90%',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 72,
            marginBottom: 16,
            animation: 'float 3s ease-in-out infinite',
          }}
        >
          {isVictory ? '🏆' : '💀'}
        </div>

        <h1
          style={{
            fontSize: 32,
            fontWeight: 800,
            marginBottom: 8,
            background: isVictory
              ? 'linear-gradient(135deg, #64ffda, #48bb78)'
              : 'linear-gradient(135deg, #f56565, #9f7aea)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {isVictory ? '探索成功！' : '任务失败'}
        </h1>

        <p
          style={{
            fontSize: 14,
            color: '#8892b0',
            lineHeight: 1.6,
            marginBottom: 28,
          }}
        >
          {isVictory
            ? `你驾驶修复完成的潜水艇，成功下潜至 ${depth} 米的深海沟最深处，揭开了深海的神秘面纱！`
            : '潜艇受损，探索任务失败。深海的秘密仍在等待下一位勇敢的探索者...'}
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            marginBottom: 28,
            padding: 20,
            borderRadius: 12,
            backgroundColor: 'rgba(16, 42, 67, 0.5)',
            border: '1px solid rgba(100, 255, 218, 0.15)',
          }}
        >
          <StatCell
            label="探索回合"
            value={`${turn}`}
            icon="🔄"
          />
          <StatCell
            label="收集部件"
            value={`${collectedParts.length + (9 - useGameStore.getState().repairSlots.filter(s => !s.filled).length)}`}
            icon="🎒"
          />
          <StatCell
            label={isVictory ? '最终深度' : '到达深度'}
            value={`${depth}m`}
            icon="🌊"
          />
        </div>

        {isVictory && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 6,
              marginBottom: 24,
              fontSize: 24,
            }}
          >
            {['🐙', '🐟', '🦀', '🐠', '🦑', '🐚'].map((e, i) => (
              <span
                key={i}
                style={{
                  animation: `float 2s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                }}
              >
                {e}
              </span>
            ))}
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={handleRestart}
          style={{ padding: '12px 32px', fontSize: 16 }}
        >
          🔄 重新开始
        </button>
      </div>
    </div>
  );
};

const StatCell: React.FC<{ label: string; value: string; icon: string }> = ({ label, value, icon }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
    <span style={{ fontSize: 20 }}>{icon}</span>
    <span
      style={{
        fontSize: 18,
        fontWeight: 700,
        fontFamily: 'monospace',
        color: '#64ffda',
      }}
    >
      {value}
    </span>
    <span style={{ fontSize: 10, color: '#5a6a85' }}>{label}</span>
  </div>
);

export default GameOverlay;
