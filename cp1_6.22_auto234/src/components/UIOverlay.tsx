import React from 'react';

interface UIOverlayProps {
  elapsedTime: number;
  timeLimit: number;
  steps: number;
  maxSteps: number;
  isRunning: boolean;
  isPaused: boolean;
  isWon: boolean;
  isLost: boolean;
  stars: number;
  levelName: string;
  levelDescription: string;
  onReset: () => void;
  onPause: () => void;
  onResume: () => void;
  onBackToLevels: () => void;
  onNextLevel: () => void;
  hasNextLevel: boolean;
}

const Star: React.FC<{ filled: boolean; delay: number }> = ({ filled, delay }) => (
  <svg
    width={48}
    height={48}
    viewBox="0 0 24 24"
    style={{
      animation: filled ? `starPop 0.4s ease ${delay}s both` : 'none',
    }}
  >
    <polygon
      points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
      fill={filled ? '#F59E0B' : '#E5E7EB'}
      stroke={filled ? '#D97706' : '#D1D5DB'}
      strokeWidth={1}
    />
  </svg>
);

export const UIOverlay: React.FC<UIOverlayProps> = ({
  elapsedTime,
  timeLimit,
  steps,
  maxSteps,
  isRunning,
  isPaused,
  isWon,
  isLost,
  stars,
  levelName,
  levelDescription,
  onReset,
  onPause,
  onResume,
  onBackToLevels,
  onNextLevel,
  hasNextLevel,
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const remainingTime = Math.max(0, timeLimit - elapsedTime);
  const timeWarning = remainingTime <= 30;

  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        <div
          style={{
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <button
            onClick={onBackToLevels}
            style={{
              padding: '8px 16px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #D1D5DB',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              color: '#374151',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#F3F4F6';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#FFFFFF';
            }}
          >
            ← 关卡选择
          </button>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{levelName}</span>
            <span style={{ fontSize: 12, color: '#6B7280' }}>{levelDescription}</span>
          </div>
        </div>

        <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={timeWarning ? '#DC2626' : '#DC2626'} strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
            <span
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: timeWarning ? '#DC2626' : '#DC2626',
                fontFamily: 'monospace',
                minWidth: 56,
                textAlign: 'center',
              }}
            >
              {formatTime(remainingTime)}
            </span>
          </div>

          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #E5E7EB',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={2}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
            <span
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#2563EB',
                fontFamily: 'monospace',
                minWidth: 56,
                textAlign: 'center',
              }}
            >
              {steps}/{maxSteps}
            </span>
          </div>

          {isRunning && (
            <button
              onClick={onPause}
              style={{
                padding: '8px 14px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #D1D5DB',
                borderRadius: 6,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 13,
                fontWeight: 500,
                color: '#374151',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = '#F3F4F6';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = '#FFFFFF';
              }}
            >
              ⏸ 暂停
            </button>
          )}

          <button
            onClick={onReset}
            style={{
              padding: '8px 14px',
              backgroundColor: '#EF4444',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 13,
              fontWeight: 500,
              color: '#FFFFFF',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#DC2626';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = '#EF4444';
            }}
          >
            ↻ 重置
          </button>
        </div>
      </div>

      {isPaused && !isWon && !isLost && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '40px 56px',
              borderRadius: 16,
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ fontSize: 32, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>游戏暂停</div>
            <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 32 }}>休息一下，准备好继续挑战</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={onResume}
                style={{
                  padding: '12px 28px',
                  backgroundColor: '#2563EB',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#1D4ED8';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#2563EB';
                }}
              >
                ▶ 继续游戏
              </button>
              <button
                onClick={onBackToLevels}
                style={{
                  padding: '12px 28px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D1D5DB',
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#374151',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#F3F4F6';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#FFFFFF';
                }}
              >
                返回关卡
              </button>
            </div>
          </div>
        </div>
      )}

      {isLost && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <div
            style={{
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 64,
                fontWeight: 'bold',
                color: '#FFFFFF',
                marginBottom: 24,
                textShadow: '0 4px 20px rgba(0,0,0,0.3)',
              }}
            >
              挑战失败
            </div>
            <div style={{ fontSize: 18, color: '#E5E7EB', marginBottom: 32 }}>
              {remainingTime <= 0 ? '时间耗尽了' : '小球掉出了画布'}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={onReset}
                style={{
                  padding: '14px 32px',
                  backgroundColor: '#EF4444',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 600,
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#DC2626';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#EF4444';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }}
              >
                ↻ 重新挑战
              </button>
              <button
                onClick={onBackToLevels}
                style={{
                  padding: '14px 32px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: 8,
                  fontSize: 16,
                  fontWeight: 600,
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  backdropFilter: 'blur(4px)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.2)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.1)';
                }}
              >
                返回关卡
              </button>
            </div>
          </div>
        </div>
      )}

      {isWon && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '48px 64px',
              borderRadius: 20,
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              animation: 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              minWidth: 360,
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>
              🎉 关卡完成！
            </div>
            <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>
              {levelName}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 28 }}>
              <Star filled={stars >= 1} delay={0.1} />
              <Star filled={stars >= 2} delay={0.25} />
              <Star filled={stars >= 3} delay={0.4} />
            </div>

            <div
              style={{
                display: 'flex',
                gap: 32,
                justifyContent: 'center',
                marginBottom: 32,
                padding: '16px 24px',
                backgroundColor: '#F9FAFB',
                borderRadius: 12,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>用时</span>
                <span style={{ fontSize: 24, fontWeight: 'bold', color: '#DC2626', fontFamily: 'monospace' }}>
                  {formatTime(elapsedTime)}
                </span>
              </div>
              <div style={{ width: 1, backgroundColor: '#E5E7EB' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>步数</span>
                <span style={{ fontSize: 24, fontWeight: 'bold', color: '#2563EB', fontFamily: 'monospace' }}>
                  {steps}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={onBackToLevels}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D1D5DB',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#374151',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#F3F4F6';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#FFFFFF';
                }}
              >
                关卡选择
              </button>
              <button
                onClick={onReset}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D1D5DB',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#374151',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#F3F4F6';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#FFFFFF';
                }}
              >
                再玩一次
              </button>
              {hasNextLevel && (
                <button
                  onClick={onNextLevel}
                  style={{
                    padding: '12px 28px',
                    backgroundColor: '#2563EB',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = '#1D4ED8';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = '#2563EB';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  }}
                >
                  下一关 →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes starPop {
          0% { opacity: 0; transform: scale(0) rotate(-180deg); }
          60% { transform: scale(1.2) rotate(10deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
      `}</style>
    </>
  );
};
