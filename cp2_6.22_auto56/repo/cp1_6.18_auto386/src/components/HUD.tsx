import React from 'react';
import { useGameStore } from '../store';
import { getLevelConfig } from '../levelManager';

export const HUD: React.FC = () => {
  const {
    currentLevelIndex,
    collectedGems,
    swingCount,
    timeRemaining,
    levelWon,
    completeLevel,
    selectLevel,
    setView,
  } = useGameStore();

  const cfg = getLevelConfig(currentLevelIndex);
  const remainingGems = Math.max(0, cfg.totalGems - collectedGems);
  const hasTimeLimit = !!cfg.timeLimit;
  const isLast = currentLevelIndex >= 4;

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          padding: '14px 18px',
          background: 'rgba(11,11,43,0.55)',
          backdropFilter: 'blur(6px)',
          borderRadius: 10,
          border: '1px solid rgba(78,205,196,0.25)',
          fontFamily: "Georgia, 'Times New Roman', serif",
          color: '#fff',
          fontSize: 15,
          lineHeight: 1.9,
          letterSpacing: 1,
          textShadow: '0 1px 2px rgba(0,0,0,0.6)',
          pointerEvents: 'none',
          transition: 'all 0.3s ease',
          minWidth: 180,
          zIndex: 5,
        }}
      >
        <div style={{ marginBottom: 4, color: '#FFD700', fontWeight: 700, letterSpacing: 2 }}>
          {cfg.name}
        </div>
        <div>
          💎 剩余宝石：<span style={{ color: '#FF6B6B', fontWeight: 600 }}>{remainingGems} / {cfg.totalGems}</span>
        </div>
        <div>
          🔄 摆动次数：<span style={{ color: '#4ECDC4', fontWeight: 600 }}>{swingCount}</span>
        </div>
        {hasTimeLimit && (
          <div>
            ⏱ 剩余时间：
            <span
              style={{
                color: timeRemaining < 5 ? '#FF6B6B' : '#45B7D1',
                fontWeight: 700,
                transition: 'color 0.3s ease',
              }}
            >
              {timeRemaining.toFixed(1)}s
            </span>
          </div>
        )}
      </div>

      {levelWon && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(11,11,43,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 10,
            animation: 'fadeIn 0.4s ease',
          }}
        >
          <div
            style={{
              padding: '40px 56px',
              borderRadius: 16,
              background:
                'linear-gradient(135deg, rgba(27,27,59,0.95) 0%, rgba(44,62,80,0.95) 100%)',
              border: '2px solid rgba(255,215,0,0.6)',
              boxShadow:
                '0 0 40px rgba(255,215,0,0.25), 0 20px 60px rgba(0,0,0,0.5)',
              textAlign: 'center',
              fontFamily: "Georgia, 'Times New Roman', serif",
              minWidth: 340,
            }}
          >
            <div
              style={{
                fontSize: 42,
                marginBottom: 10,
                letterSpacing: 8,
                color: '#FFD700',
                textShadow: '0 0 20px rgba(255,215,0,0.6)',
                fontWeight: 700,
              }}
            >
              关卡通过！
            </div>
            <div
              style={{
                color: 'rgba(255,255,255,0.7)',
                marginBottom: 30,
                fontSize: 15,
                letterSpacing: 1,
              }}
            >
              收集宝石 {collectedGems} / {cfg.totalGems}　·　摆动 {swingCount} 次
            </div>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
              {!isLast && (
                <button
                  onClick={() => {
                    selectLevel(currentLevelIndex + 1);
                  }}
                  style={btnStyle('#FFD700', '#0B0B2B')}
                  onMouseEnter={hoverStyle(true)}
                  onMouseLeave={hoverStyle(false)}
                >
                  下一关 →
                </button>
              )}
              <button
                onClick={() => {
                  completeLevel();
                  setView('menu');
                }}
                style={btnStyle('#4ECDC4', '#0B0B2B')}
                onMouseEnter={hoverStyle(true)}
                onMouseLeave={hoverStyle(false)}
              >
                返回菜单
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
};

function btnStyle(bg: string, color: string): React.CSSProperties {
  return {
    padding: '11px 26px',
    borderRadius: 8,
    border: 'none',
    background: bg,
    color,
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: 2,
    transition: 'all 0.3s ease',
    boxShadow: `0 4px 14px ${bg}55`,
  };
}

function hoverStyle(enter: boolean) {
  return (e: React.MouseEvent<HTMLButtonElement>) => {
    const t = e.currentTarget;
    if (enter) {
      t.style.transform = 'translateY(-2px) scale(1.03)';
      t.style.filter = 'brightness(1.1)';
    } else {
      t.style.transform = 'translateY(0) scale(1)';
      t.style.filter = 'brightness(1)';
    }
  };
}
