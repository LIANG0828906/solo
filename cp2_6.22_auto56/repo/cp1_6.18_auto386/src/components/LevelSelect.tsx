import React from 'react';
import { useGameStore } from '../store';
import { LEVELS } from '../levelManager';

export const LevelSelect: React.FC = () => {
  const { currentLevelIndex, completedLevels, selectLevel } = useGameStore();

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "Georgia, 'Times New Roman', serif",
        color: '#fff',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background:
            'radial-gradient(ellipse at center, rgba(78,205,196,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <h1
        style={{
          fontSize: 'clamp(36px, 6vw, 64px)',
          marginBottom: 12,
          letterSpacing: 8,
          color: '#FFFFFF',
          textShadow:
            '0 0 20px rgba(78,205,196,0.55), 0 0 40px rgba(78,205,196,0.3)',
          fontWeight: 700,
        }}
      >
        灵摆奇缘
      </h1>
      <p
        style={{
          color: 'rgba(255,255,255,0.65)',
          fontSize: 16,
          marginBottom: 48,
          letterSpacing: 3,
        }}
      >
        · 神秘物理解谜之旅 ·
      </p>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          width: 'min(90%, 320px)',
        }}
      >
        {LEVELS.map((lvl, idx) => {
          const isCompleted = completedLevels.includes(idx);
          const isCurrent = currentLevelIndex === idx;
          const isUnlocked = idx === 0 || completedLevels.includes(idx - 1);
          const disabled = !isUnlocked;

          return (
            <button
              key={lvl.id}
              onClick={() => !disabled && selectLevel(idx)}
              disabled={disabled}
              style={{
                width: '100%',
                height: 50,
                borderRadius: 10,
                border: isCurrent
                  ? '2px solid #4ECDC4'
                  : '1px solid rgba(255,255,255,0.12)',
                background: disabled
                  ? 'rgba(44,62,80,0.35)'
                  : isCurrent
                  ? 'rgba(52,73,94,0.95)'
                  : 'rgba(44,62,80,0.8)',
                color: disabled ? 'rgba(255,255,255,0.35)' : '#fff',
                display: 'flex',
                alignItems: 'center',
                padding: '0 20px',
                gap: 14,
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: 16,
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                letterSpacing: 1,
                boxShadow: isCurrent
                  ? '0 0 16px rgba(78,205,196,0.35)'
                  : 'none',
              }}
              onMouseEnter={(e) => {
                if (!disabled) {
                  e.currentTarget.style.background = 'rgba(52,73,94,0.95)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow =
                    '0 8px 24px rgba(0,0,0,0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!disabled) {
                  e.currentTarget.style.background = isCurrent
                    ? 'rgba(52,73,94,0.95)'
                    : 'rgba(44,62,80,0.8)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = isCurrent
                    ? '0 0 16px rgba(78,205,196,0.35)'
                    : 'none';
                }
              }}
            >
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  flexShrink: 0,
                  background: isCompleted
                    ? 'rgba(78,205,196,0.3)'
                    : disabled
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(255,215,0,0.2)',
                  border: `1.5px solid ${
                    isCompleted
                      ? '#4ECDC4'
                      : disabled
                      ? 'rgba(255,255,255,0.15)'
                      : '#FFD700'
                  }`,
                  color: isCompleted
                    ? '#4ECDC4'
                    : disabled
                    ? 'rgba(255,255,255,0.3)'
                    : '#FFD700',
                }}
              >
                {isCompleted ? '✓' : disabled ? '🔒' : idx + 1}
              </span>
              <span style={{ flex: 1, textAlign: 'left' }}>{lvl.name}</span>
            </button>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 50,
          color: 'rgba(255,255,255,0.45)',
          fontSize: 13,
          letterSpacing: 1,
          textAlign: 'center',
          maxWidth: 480,
          padding: '0 20px',
          lineHeight: 1.8,
        }}
      >
        玩法提示：在金色摆锤附近按住鼠标拖拽，松手后摆锤将获得初始速度，
        <br />
        利用摆动撞击机关、收集宝石，最终抵达金色终点区域通关。
      </div>
    </div>
  );
};
