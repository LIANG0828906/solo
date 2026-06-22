import { useEffect, useState, useRef } from 'react';
import { useGameStore } from './gameStore';

export default function StatusBar() {
  const {
    turn,
    turnDuration,
    turnStartTime,
    players,
    currentPlayerId,
    countdown,
    gameStatus,
    nextTurn,
  } = useGameStore();

  const [displayCountdown, setDisplayCountdown] = useState(turnDuration);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const updateCountdown = () => {
      if (gameStatus !== 'playing') return;

      const now = Date.now();
      const elapsed = (now - turnStartTime) / 1000;
      const remaining = Math.max(0, turnDuration - elapsed);
      const remainingSeconds = Math.ceil(remaining);

      setDisplayCountdown(remainingSeconds);

      if (remaining <= 0) {
        nextTurn();
      }
    };

    updateCountdown();

    intervalRef.current = window.setInterval(updateCountdown, 100);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [turnStartTime, turnDuration, gameStatus, nextTurn]);

  useEffect(() => {
    setDisplayCountdown(countdown);
  }, [countdown]);

  const currentPlayer = players.find((p) => p.id === currentPlayerId);

  const hpPercent = currentPlayer
    ? Math.max(0, (currentPlayer.hp / currentPlayer.maxHp) * 100)
    : 0;
  const energyPercent = currentPlayer
    ? Math.max(0, (currentPlayer.energy / currentPlayer.maxEnergy) * 100)
    : 0;

  const urgencyColor =
    displayCountdown <= 3
      ? '#FF0000'
      : displayCountdown <= 5
      ? '#FF4757'
      : '#E74C3C';
  const urgencyScale = displayCountdown <= 3 ? 1.15 : 1;
  const isFlashing =
    displayCountdown <= 5 && Math.floor(Date.now() / 500) % 2 === 0;

  return (
    <div
      style={{
        height: 60,
        backgroundColor: '#1A252F',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        borderBottom: '2px solid #1ABC9C',
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#7F8C8D' }}>回合</span>
          <span
            style={{
              color: '#1ABC9C',
              fontWeight: 'bold',
              fontSize: 24,
              textShadow: '0 0 10px rgba(26,188,156,0.5)',
            }}
          >
            {turn}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '6px 14px',
            backgroundColor: 'rgba(26,188,156,0.1)',
            borderRadius: 20,
            border: '1px solid rgba(26,188,156,0.3)',
          }}
        >
          <span style={{ fontSize: 13, color: '#BDC3C7' }}>当前玩家</span>
          <span style={{ fontSize: 22 }}>{currentPlayer?.emoji || '❓'}</span>
          <span style={{ color: '#1ABC9C', fontWeight: 600, fontSize: 15 }}>
            {currentPlayer?.name || '-'}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '4px 16px',
            backgroundColor: isFlashing ? 'rgba(231,76,60,0.2)' : 'rgba(0,0,0,0.2)',
            borderRadius: 8,
            border: `1px solid ${isFlashing ? 'rgba(231,76,60,0.6)' : 'rgba(255,255,255,0.1)'}`,
            transition: 'all 0.2s ease',
          }}
        >
          <span style={{ fontSize: 13, color: '#BDC3C7' }}>剩余时间</span>
          <span
            style={{
              color: urgencyColor,
              fontWeight: 'bold',
              fontSize: 28,
              minWidth: 48,
              textAlign: 'center',
              textShadow: displayCountdown <= 5 ? `0 0 15px ${urgencyColor}` : 'none',
              transform: `scale(${urgencyScale})`,
              transition: 'all 0.2s ease',
              lineHeight: 1,
            }}
          >
            {displayCountdown}
          </span>
          <span style={{ fontSize: 13, color: '#BDC3C7' }}>秒</span>

          <div
            style={{
              width: 100,
              height: 6,
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: 3,
              overflow: 'hidden',
              marginLeft: 8,
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${(displayCountdown / turnDuration) * 100}%`,
                backgroundColor: urgencyColor,
                transition: 'width 0.1s linear, background-color 0.2s ease',
                boxShadow: `0 0 8px ${urgencyColor}`,
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div
            style={{
              fontSize: 12,
              color: '#BDC3C7',
              display: 'flex',
              justifyContent: 'space-between',
              width: 220,
              alignItems: 'center',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>❤️</span>
              <span>生命值</span>
            </span>
            <span style={{ color: hpPercent > 30 ? '#E74C3C' : '#C0392B', fontWeight: 600 }}>
              {Math.ceil(currentPlayer?.hp || 0)} / {currentPlayer?.maxHp || 100}
            </span>
          </div>
          <div
            style={{
              width: 220,
              height: 22,
              backgroundColor: '#1A252F',
              borderRadius: 11,
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.15)',
              padding: 2,
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${hpPercent}%`,
                background: hpPercent > 30
                  ? 'linear-gradient(90deg, #C0392B, #E74C3C, #FF6B6B)'
                  : 'linear-gradient(90deg, #8B0000, #C0392B, #E74C3C)',
                borderRadius: 9,
                transition: 'width 0.3s ease',
                boxShadow: `0 0 10px rgba(231,76,60,${hpPercent / 100 * 0.6})`,
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 2,
                  left: 4,
                  right: 4,
                  height: 4,
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.4), rgba(255,255,255,0))',
                  borderRadius: 2,
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div
            style={{
              fontSize: 12,
              color: '#BDC3C7',
              display: 'flex',
              justifyContent: 'space-between',
              width: 220,
              alignItems: 'center',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>⚡</span>
              <span>能量</span>
            </span>
            <span style={{ color: '#3498DB', fontWeight: 600 }}>
              {Math.floor(currentPlayer?.energy || 0)} / {currentPlayer?.maxEnergy || 100}
            </span>
          </div>
          <div
            style={{
              width: 220,
              height: 22,
              backgroundColor: '#1A252F',
              borderRadius: 11,
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.15)',
              padding: 2,
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${energyPercent}%`,
                background: 'linear-gradient(90deg, #2980B9, #3498DB, #5DADE2)',
                borderRadius: 9,
                transition: 'width 0.3s ease',
                boxShadow: `0 0 10px rgba(52,152,219,${energyPercent / 100 * 0.6})`,
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 2,
                  left: 4,
                  right: 4,
                  height: 4,
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.4), rgba(255,255,255,0))',
                  borderRadius: 2,
                }}
              />
              {energyPercent >= 100 && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    animation: 'pulse 1s infinite',
                    borderRadius: 9,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
