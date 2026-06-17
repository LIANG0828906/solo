import React, { useState, useEffect, useCallback } from 'react';
import Board from './components/Board';
import CardHand from './components/CardHand';
import { useGameStore } from './store/gameStore';

const App: React.FC = () => {
  const {
    playerGold,
    phase,
    turnCount,
    turnTimer,
    winner,
    updateTurnTimer,
    endTurn,
    resetGame,
    startPlacingPhase,
    tickParticles,
    finalizeBattle,
  } = useGameStore();

  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < 600 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 600);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (phase !== 'placing') return;

    const interval = setInterval(() => {
      const currentTimer = useGameStore.getState().turnTimer;
      if (currentTimer <= 1) {
        endTurn();
      } else {
        updateTurnTimer(currentTimer - 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, endTurn, updateTurnTimer]);

  useEffect(() => {
    const interval = setInterval(() => {
      tickParticles();
    }, 50);
    return () => clearInterval(interval);
  }, [tickParticles]);

  useEffect(() => {
    if (phase === 'enemyTurn') {
      const timer = setTimeout(() => {
        startPlacingPhase();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [phase, startPlacingPhase]);

  useEffect(() => {
    if (phase === 'battling') {
      const timer = setTimeout(() => {
        const state = useGameStore.getState();
        if (state.phase === 'battling') {
          finalizeBattle();
        }
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [phase, finalizeBattle]);

  const handleDragStart = useCallback((cardId: string) => {
    setDraggedCardId(cardId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedCardId(null);
  }, []);

  const getPhaseText = (): string => {
    switch (phase) {
      case 'placing':
        return '放置阶段';
      case 'battling':
        return '战斗阶段';
      case 'enemyTurn':
        return '敌方回合';
      case 'gameOver':
        return '游戏结束';
      default:
        return '';
    }
  };

  const isTimerLow = turnTimer <= 10 && phase === 'placing';

  return (
    <div
      className="app"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0B0C10 0%, #1F2833 100%)',
        color: '#ffffff',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <div
        className="game-container"
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: isSmallScreen ? '12px' : '20px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <div
          className="game-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: isSmallScreen ? '12px' : '20px',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div
            className="gold-display"
            style={{
              fontSize: isSmallScreen ? '16px' : '20px',
              color: '#FFD700',
              fontWeight: 'bold',
              textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>💰</span>
            <span>{playerGold} 金币</span>
          </div>

          <div
            className="turn-info"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <div
              className="turn-count"
              style={{
                fontSize: isSmallScreen ? '12px' : '14px',
                color: '#888',
              }}
            >
              第 {turnCount} 回合
            </div>
            <div
              className="phase-text"
              style={{
                fontSize: isSmallScreen ? '14px' : '16px',
                color: phase === 'placing' ? '#6C63FF' : '#FF6347',
                fontWeight: 'bold',
              }}
            >
              {getPhaseText()}
            </div>
          </div>

          <div
            className="turn-timer"
            style={{
              fontSize: isSmallScreen ? '14px' : '16px',
              color: isTimerLow ? '#FF0000' : '#FF6347',
              fontWeight: 'bold',
              animation: isTimerLow ? 'blink 0.8s ease-in-out infinite' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>⏱️</span>
            <span>{turnTimer}s</span>
          </div>
        </div>

        <div
          className="game-title"
          style={{
            textAlign: 'center',
            marginBottom: isSmallScreen ? '12px' : '16px',
          }}
        >
          <h1
            style={{
              fontSize: isSmallScreen ? '20px' : '28px',
              margin: 0,
              background: 'linear-gradient(135deg, #6C63FF 0%, #FFD700 50%, #FF4500 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: 'none',
              fontWeight: 900,
              letterSpacing: '2px',
            }}
          >
            ⚔️ ELEMENTAL CLASH ⚔️
          </h1>
          <div
            style={{
              fontSize: isSmallScreen ? '10px' : '12px',
              color: '#666',
              marginTop: '4px',
            }}
          >
            元素对决 · 魔法自动战斗卡牌
          </div>
        </div>

        <div
          className="board-wrapper"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isSmallScreen ? '8px 0' : '16px 0',
          }}
        >
          <div
            className="enemy-label"
            style={{
              color: '#FF4545',
              fontSize: isSmallScreen ? '11px' : '13px',
              fontWeight: 'bold',
              marginBottom: '8px',
              letterSpacing: '2px',
              opacity: 0.8,
            }}
          >
            ━━━ 敌方区域 ━━━
          </div>

          <Board
            draggedCardId={draggedCardId}
            onDragEnd={handleDragEnd}
          />

          <div
            className="player-label"
            style={{
              color: '#6C63FF',
              fontSize: isSmallScreen ? '11px' : '13px',
              fontWeight: 'bold',
              marginTop: '8px',
              letterSpacing: '2px',
              opacity: 0.8,
            }}
          >
            ━━━ 己方区域 ━━━
          </div>
        </div>

        <div
          className="action-buttons"
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: isSmallScreen ? '10px' : '16px',
            marginBottom: isSmallScreen ? '12px' : '16px',
            marginTop: isSmallScreen ? '8px' : '12px',
          }}
        >
          <button
            className="action-btn end-turn-btn"
            onClick={endTurn}
            disabled={phase !== 'placing'}
            style={{
              padding: isSmallScreen ? '10px 20px' : '12px 28px',
              fontSize: isSmallScreen ? '13px' : '15px',
              fontWeight: 'bold',
              color: '#fff',
              backgroundColor: phase === 'placing' ? '#6C63FF' : '#444',
              border: 'none',
              borderRadius: '12px',
              cursor: phase === 'placing' ? 'pointer' : 'not-allowed',
              transition:
                'background-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease',
              boxShadow:
                phase === 'placing'
                  ? '0 4px 15px rgba(108, 99, 255, 0.4)'
                  : 'none',
            }}
            onMouseEnter={(e) => {
              if (phase === 'placing') {
                e.currentTarget.style.backgroundColor = '#8B83FF';
                e.currentTarget.style.boxShadow =
                  '0 0 8px rgba(108, 99, 255, 0.6), 0 6px 20px rgba(108, 99, 255, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor =
                phase === 'placing' ? '#6C63FF' : '#444';
              e.currentTarget.style.boxShadow =
                phase === 'placing'
                  ? '0 4px 15px rgba(108, 99, 255, 0.4)'
                  : 'none';
            }}
            onMouseDown={(e) => {
              if (phase === 'placing') {
                e.currentTarget.style.transform = 'scale(0.95)';
              }
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ⚔️ 结束回合
          </button>

          <button
            className="action-btn reset-btn"
            onClick={resetGame}
            style={{
              padding: isSmallScreen ? '10px 20px' : '12px 28px',
              fontSize: isSmallScreen ? '13px' : '15px',
              fontWeight: 'bold',
              color: '#fff',
              backgroundColor: '#444',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              transition:
                'background-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#555';
              e.currentTarget.style.boxShadow =
                '0 0 8px rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#444';
              e.currentTarget.style.boxShadow = 'none';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            🔄 重新开始
          </button>
        </div>

        <CardHand
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          draggedCardId={draggedCardId}
        />

        <div
          className="game-tips"
          style={{
            textAlign: 'center',
            padding: isSmallScreen ? '8px' : '12px',
            fontSize: isSmallScreen ? '10px' : '12px',
            color: '#555',
            borderTop: '1px solid #2A2A2A',
          }}
        >
          💡 提示：拖拽卡牌到下方紫色区域放置精灵，每放置一张消耗 2 金币
        </div>
      </div>

      {phase === 'gameOver' && winner && (
        <div
          className="victory-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: '#000000CC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <div
            className="victory-modal"
            style={{
              textAlign: 'center',
              animation: 'scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <div
              className="victory-text"
              style={{
                fontSize: isSmallScreen ? '32px' : '48px',
                fontWeight: 'bold',
                color: '#FFD700',
                textShadow:
                  '0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 215, 0, 0.4)',
                marginBottom: '16px',
                letterSpacing: '4px',
              }}
            >
              {winner === 'player' ? '🏆 胜 利 🏆' : '💀 失 败 💀'}
            </div>
            <div
              className="victory-subtext"
              style={{
                fontSize: isSmallScreen ? '14px' : '18px',
                color: '#aaa',
                marginBottom: isSmallScreen ? '24px' : '32px',
              }}
            >
              {winner === 'player'
                ? '恭喜！你消灭了所有敌方精灵！'
                : '你的精灵全部阵亡了...'}
            </div>
            <div
              className="turn-summary"
              style={{
                fontSize: isSmallScreen ? '12px' : '14px',
                color: '#888',
                marginBottom: isSmallScreen ? '24px' : '32px',
              }}
            >
              共用时 {turnCount} 回合
            </div>
            <button
              className="play-again-btn"
              onClick={resetGame}
              style={{
                padding: isSmallScreen ? '12px 32px' : '16px 48px',
                fontSize: isSmallScreen ? '16px' : '20px',
                fontWeight: 'bold',
                color: '#fff',
                backgroundColor: '#6C63FF',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                transition:
                  'background-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease',
                boxShadow: '0 4px 20px rgba(108, 99, 255, 0.5)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#8B83FF';
                e.currentTarget.style.boxShadow =
                  '0 0 8px rgba(108, 99, 255, 0.6), 0 6px 25px rgba(108, 99, 255, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#6C63FF';
                e.currentTarget.style.boxShadow =
                  '0 4px 20px rgba(108, 99, 255, 0.5)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.95)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              🎮 再来一局
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes spriteShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(5px); }
          40% { transform: translateX(-5px); }
          60% { transform: translateX(5px); }
          80% { transform: translateX(-5px); }
        }

        .sprite-shake {
          animation: spriteShake 0.2s ease;
        }

        @keyframes fireBurn {
          0%, 100% {
            filter: brightness(1) hue-rotate(0deg);
          }
          50% {
            filter: brightness(1.2) hue-rotate(5deg);
          }
        }

        @keyframes waterWave {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        @keyframes natureGrow {
          0%, 100% {
            transform: scale(1) rotate(0deg);
          }
          50% {
            transform: scale(1.03) rotate(2deg);
          }
        }

        .sprite-fire:not(.sprite-appear):not(.sprite-shake) {
          animation: fireBurn 1.5s ease-in-out infinite;
        }

        .sprite-water:not(.sprite-appear):not(.sprite-shake) {
          animation: waterWave 2s ease-in-out infinite;
        }

        .sprite-nature:not(.sprite-appear):not(.sprite-shake) {
          animation: natureGrow 2.5s ease-in-out infinite;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }

        #root {
          min-height: 100vh;
        }
      `}</style>
    </div>
  );
};

export default App;
