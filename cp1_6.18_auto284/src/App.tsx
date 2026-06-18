import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from './store/gameStore';
import GameBoard from './components/GameBoard';
import TimerBar from './components/TimerBar';
import LivesDisplay from './components/LivesDisplay';

const CSSAnimations = () => (
  <style>{`
    @keyframes boardShake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
      20%, 40%, 60%, 80% { transform: translateX(4px); }
    }

    @keyframes cellShake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-3px); background-color: #F44336 !important; }
      75% { transform: translateX(3px); background-color: #F44336 !important; }
    }

    @keyframes cellBurst {
      0% { transform: scale(1); }
      50% { transform: scale(0.85); }
      100% { transform: scale(1); }
    }

    @keyframes heartShrink {
      0% { transform: scale(1); opacity: 1; }
      100% { transform: scale(0); opacity: 0; }
    }

    @keyframes edgeFlash {
      0% { opacity: 0.3; }
      100% { opacity: 0; }
    }

    @keyframes gameOverIn {
      0% { opacity: 0; transform: scale(0.5); }
      100% { opacity: 1; transform: scale(1.0); }
    }

    @keyframes fadeIn {
      0% { opacity: 0; transform: translateY(10px); }
      100% { opacity: 1; transform: translateY(0); }
    }

    @keyframes pulseStart {
      0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(0, 229, 255, 0.5); }
      50% { transform: scale(1.03); box-shadow: 0 0 40px rgba(0, 229, 255, 0.8); }
    }
  `}</style>
);

const App: React.FC = () => {
  const phase = useGameStore((s) => s.phase);
  const endReason = useGameStore((s) => s.endReason);
  const score = useGameStore((s) => s.score);
  const lives = useGameStore((s) => s.lives);
  const maxLives = useGameStore((s) => s.maxLives);
  const timeLeft = useGameStore((s) => s.timeLeft);
  const totalTime = useGameStore((s) => s.totalTime);
  const grid = useGameStore((s) => s.grid);
  const targetPattern = useGameStore((s) => s.targetPattern);
  const correctCount = useGameStore((s) => s.correctCount);
  const totalClicks = useGameStore((s) => s.totalClicks);
  const flashTrigger = useGameStore((s) => s.flashTrigger);
  const shakeTrigger = useGameStore((s) => s.shakeTrigger);
  const startGame = useGameStore((s) => s.startGame);
  const resetGame = useGameStore((s) => s.resetGame);

  const accuracy =
    totalClicks > 0 ? Math.round((correctCount / totalClicks) * 100) : 0;

  const [flashKey, setFlashKey] = useState(0);
  const prevFlashRef = useRef(flashTrigger);

  useEffect(() => {
    if (flashTrigger !== prevFlashRef.current) {
      prevFlashRef.current = flashTrigger;
      setFlashKey((k) => k + 1);
    }
  }, [flashTrigger]);

  const showOverlay = phase !== 'playing';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#0D0D0D',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <CSSAnimations />

      {flashTrigger > 0 && (
        <div
          key={`flash-${flashKey}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            zIndex: 999,
            boxShadow: 'inset 0 0 120px 20px #F44336',
            animation: 'edgeFlash 0.2s ease-out forwards',
          }}
        />
      )}

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '16px 24px',
          backgroundColor: '#00000080',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 10,
          borderBottom: '1px solid #2A2A2A',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              opacity: 0.7,
              letterSpacing: 1,
            }}
          >
            SCORE
          </div>
          <div
            style={{
              color: '#00E5FF',
              fontSize: 24,
              fontWeight: 800,
              fontFamily: 'Menlo, Consolas, monospace',
              textShadow: '0 0 12px rgba(0, 229, 255, 0.6)',
              minWidth: 70,
            }}
          >
            {score.toString().padStart(5, '0')}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <TimerBar timeLeft={timeLeft} totalTime={totalTime} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              opacity: 0.7,
              letterSpacing: 1,
            }}
          >
            LIVES
          </div>
          <LivesDisplay lives={lives} maxLives={maxLives} />
        </div>
      </div>

      <div
        style={{
          paddingTop: 80,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          width: '100%',
          flex: 1,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div
            style={{
              color: '#fff',
              fontSize: 12,
              opacity: 0.5,
              letterSpacing: 2,
              fontWeight: 500,
            }}
          >
            ◈ 能 量 矩 阵 ◈
          </div>
          <div
            style={{
              color: '#888',
              fontSize: 11,
              opacity: 0.7,
            }}
          >
            点亮虚线标记的蓝色单元格
          </div>
        </div>

        <GameBoard
          grid={grid}
          targetPattern={targetPattern}
          shakeTrigger={shakeTrigger}
        />
      </div>

      {showOverlay && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(13, 13, 13, 0.92)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            animation: phase === 'ended' ? 'fadeIn 0.4s ease' : 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 28,
              padding: '40px 56px',
              borderRadius: 16,
              backgroundColor: '#111111',
              border: '1px solid #2A2A2A',
              boxShadow: '0 0 60px rgba(0, 229, 255, 0.12)',
              minWidth: 340,
            }}
          >
            {phase === 'idle' ? (
              <>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      fontSize: 42,
                      fontWeight: 900,
                      color: '#00E5FF',
                      letterSpacing: 6,
                      textShadow: '0 0 20px rgba(0, 229, 255, 0.7)',
                    }}
                  >
                    能量矩阵
                  </div>
                  <div
                    style={{
                      color: '#888',
                      fontSize: 13,
                      opacity: 0.8,
                    }}
                  >
                    ENERGY MATRIX
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    alignItems: 'center',
                    color: '#aaa',
                    fontSize: 13,
                    lineHeight: 1.6,
                  }}
                >
                  <div>· 在 30 秒内匹配所有蓝色目标图案</div>
                  <div>· 每次正确匹配 +100 分</div>
                  <div>· 错误点击扣除 1 颗生命值</div>
                </div>

                <button
                  onClick={startGame}
                  style={{
                    padding: '14px 48px',
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#0D0D0D',
                    backgroundColor: '#00E5FF',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    letterSpacing: 2,
                    animation: 'pulseStart 1.8s ease-in-out infinite',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.transform =
                      'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.transform =
                      'scale(1)';
                  }}
                >
                  开 始 游 戏
                </button>
              </>
            ) : (
              <>
                <div
                  style={{
                    fontSize: 44,
                    fontWeight: 900,
                    color:
                      endReason === 'lives' ? '#F44336' : '#FFD700',
                    letterSpacing: 4,
                    textShadow:
                      endReason === 'lives'
                        ? '0 0 24px rgba(244, 67, 54, 0.8)'
                        : '0 0 24px rgba(255, 215, 0, 0.6)',
                    animation: 'gameOverIn 1s ease',
                  }}
                >
                  {endReason === 'lives' ? 'GAME OVER' : 'TIME UP'}
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    width: '100%',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderRadius: 8,
                      backgroundColor: '#0D0D0D',
                      border: '1px solid #2A2A2A',
                    }}
                  >
                    <span style={{ color: '#888', fontSize: 13 }}>总 分</span>
                    <span
                      style={{
                        color: '#00E5FF',
                        fontSize: 22,
                        fontWeight: 800,
                        fontFamily: 'Menlo, Consolas, monospace',
                        textShadow: '0 0 10px rgba(0, 229, 255, 0.6)',
                      }}
                    >
                      {score}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderRadius: 8,
                      backgroundColor: '#0D0D0D',
                      border: '1px solid #2A2A2A',
                    }}
                  >
                    <span style={{ color: '#888', fontSize: 13 }}>
                      正确率
                    </span>
                    <span
                      style={{
                        color: accuracy >= 60 ? '#4CAF90' : '#FFD700',
                        fontSize: 22,
                        fontWeight: 800,
                        fontFamily: 'Menlo, Consolas, monospace',
                      }}
                    >
                      {accuracy}%
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderRadius: 8,
                      backgroundColor: '#0D0D0D',
                      border: '1px solid #2A2A2A',
                      gap: 24,
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: '#888', fontSize: 11 }}>
                        正确数
                      </span>
                      <span
                        style={{
                          color: '#4CAF90',
                          fontSize: 16,
                          fontWeight: 700,
                        }}
                      >
                        {correctCount}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: '#888', fontSize: 11 }}>
                        总点击
                      </span>
                      <span
                        style={{
                          color: '#888',
                          fontSize: 16,
                          fontWeight: 700,
                        }}
                      >
                        {totalClicks}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: '#888', fontSize: 11 }}>
                        剩余生命
                      </span>
                      <span
                        style={{
                          color: '#FF6B6B',
                          fontSize: 16,
                          fontWeight: 700,
                        }}
                      >
                        {lives}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={resetGame}
                  style={{
                    marginTop: 4,
                    padding: '14px 48px',
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#0D0D0D',
                    backgroundColor: '#00E5FF',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    letterSpacing: 2,
                    transition: 'all 0.2s ease',
                    boxShadow: '0 0 20px rgba(0, 229, 255, 0.5)',
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.transform =
                      'scale(1.05)';
                    (e.target as HTMLButtonElement).style.boxShadow =
                      '0 0 32px rgba(0, 229, 255, 0.8)';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.transform =
                      'scale(1)';
                    (e.target as HTMLButtonElement).style.boxShadow =
                      '0 0 20px rgba(0, 229, 255, 0.5)';
                  }}
                >
                  重 新 开 始
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
