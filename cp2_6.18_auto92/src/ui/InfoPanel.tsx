import React, { useEffect, useState, useRef } from 'react';
import { useGameStore, UnlockedCard } from '../store/gameStore';
import { eventBus, EVENTS } from '../game/ConstellationEngine';

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

interface ThumbnailCardProps {
  card: UnlockedCard;
  onClick: () => void;
}

const ThumbnailCard: React.FC<ThumbnailCardProps> = ({ card, onClick }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div
      onClick={onClick}
      style={{
        width: '48px',
        height: '48px',
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        background: 'linear-gradient(135deg, #1A1B41 0%, #2D2F6E 100%)',
        border: '1px solid rgba(255, 215, 0, 0.3)',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 229, 255, 0.3)';
        e.currentTarget.style.borderColor = 'rgba(0, 229, 255, 0.6)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.3)';
      }}
    >
      {!isLoaded && (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #1A1B41 0%, #2D2F6E 100%)',
          }}
        >
          <div
            style={{
              width: '20px',
              height: '20px',
              border: '2px solid rgba(255, 215, 0, 0.3)',
              borderTopColor: '#FFD700',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        </div>
      )}
      <img
        src={card.image}
        alt={card.title}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
        onLoad={() => setIsLoaded(true)}
        draggable={false}
      />
    </div>
  );
};

export const InfoPanel: React.FC = () => {
  const {
    currentConstellation,
    score,
    displayScore,
    combo,
    timeRemaining,
    unlockedCards,
    setDisplayScore,
    decrementTime,
    openCardModal,
    setTimeRemaining,
    resetGame,
  } = useGameStore();

  const [timePulse, setTimePulse] = useState(false);
  const animationRef = useRef<number | null>(null);
  const prevScoreRef = useRef(displayScore);

  useEffect(() => {
    if (score !== displayScore) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      const startValue = prevScoreRef.current;
      const endValue = score;
      const duration = 100;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.round(startValue + (endValue - startValue) * easeProgress);

        setDisplayScore(currentValue);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          prevScoreRef.current = endValue;
          animationRef.current = null;
        }
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [score, setDisplayScore]);

  useEffect(() => {
    const timer = setInterval(() => {
      decrementTime();
      eventBus.emit(EVENTS.TIME_UPDATED, { timeRemaining: timeRemaining - 1 });

      setTimePulse(true);
      setTimeout(() => setTimePulse(false), 200);
    }, 1000);

    return () => clearInterval(timer);
  }, [decrementTime, timeRemaining]);

  useEffect(() => {
    if (timeRemaining <= 0) {
      setTimeRemaining(0);
    }
  }, [timeRemaining, setTimeRemaining]);

  const handleCardClick = (card: UnlockedCard) => {
    openCardModal(card);
  };

  const handleRestart = () => {
    resetGame();
  };

  const panelStyle: React.CSSProperties = {
    width: '260px',
    minWidth: '260px',
    height: '100%',
    background: 'rgba(15, 23, 42, 0.7)',
    backdropFilter: 'blur(12px)',
    borderRadius: '16px 0 0 16px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    boxSizing: 'border-box',
    animation: 'fadeIn 0.3s ease-out',
    borderLeft: '1px solid rgba(255, 215, 0, 0.1)',
    overflowY: 'auto',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '1.5px',
    textTransform: 'uppercase',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: '8px',
  };

  return (
    <div style={panelStyle}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes timeTick {
          0% { transform: scale(1); }
          30% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
        @keyframes scoreGlow {
          0% { text-shadow: 0 0 15px rgba(0, 229, 255, 0.4); }
          50% { text-shadow: 0 0 25px rgba(0, 229, 255, 0.8), 0 0 40px rgba(0, 229, 255, 0.4); }
          100% { text-shadow: 0 0 15px rgba(0, 229, 255, 0.4); }
        }
      `}</style>

      <div>
        <div style={sectionTitleStyle}>当前星座</div>
        <div
          style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#FFD700',
            textShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
            letterSpacing: '1px',
          }}
        >
          {currentConstellation?.name || '加载中...'}
        </div>
      </div>

      <div>
        <div style={sectionTitleStyle}>积分</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <div
            key={score}
            style={{
              fontSize: '36px',
              fontWeight: 800,
              color: '#00E5FF',
              textShadow: '0 0 15px rgba(0, 229, 255, 0.4)',
              fontFeatureSettings: 'tnum',
              fontVariantNumeric: 'tabular-nums',
              animation: score !== displayScore ? 'scoreGlow 0.2s ease-out' : 'none',
              transition: 'all 0.1s ease-out',
            }}
          >
            {displayScore.toLocaleString()}
          </div>
          {combo > 1 && (
            <div
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: '#FFD700',
                background: 'rgba(255, 215, 0, 0.15)',
                padding: '2px 8px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                animation: 'fadeIn 0.3s ease-out',
              }}
            >
              ×{(1 + combo * 0.2).toFixed(1)}
            </div>
          )}
        </div>
      </div>

      <div>
        <div style={sectionTitleStyle}>剩余时间</div>
        <div
          key={timeRemaining}
          style={{
            fontSize: '42px',
            fontWeight: 800,
            color: '#EF4444',
            textShadow: timeRemaining <= 30
              ? '0 0 20px rgba(239, 68, 68, 0.6)'
              : '0 0 10px rgba(239, 68, 68, 0.3)',
            animation: 'timeTick 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            fontFeatureSettings: 'tnum',
            fontVariantNumeric: 'tabular-nums',
            display: 'inline-block',
          }}
        >
          {formatTime(timeRemaining)}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <div style={sectionTitleStyle}>
          已解锁卡片 ({unlockedCards.length})
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            maxHeight: '100%',
            overflowY: 'auto',
            paddingRight: '4px',
          }}
        >
          {unlockedCards.length === 0 ? (
            <div
              style={{
                color: 'rgba(255, 255, 255, 0.3)',
                fontSize: '12px',
                fontStyle: 'italic',
                padding: '12px 0',
              }}
            >
              连接星座解锁故事卡片...
            </div>
          ) : (
            unlockedCards.map((card) => (
              <ThumbnailCard
                key={card.id}
                card={card}
                onClick={() => handleCardClick(card)}
              />
            ))
          )}
        </div>
      </div>

      {timeRemaining <= 0 && (
        <button
          onClick={handleRestart}
          style={{
            width: '100%',
            padding: '14px 20px',
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
            border: 'none',
            borderRadius: '12px',
            color: '#1A1B41',
            fontSize: '16px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.3)';
          }}
        >
          重新开始
        </button>
      )}

      <div
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          paddingTop: '16px',
          marginTop: 'auto',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.4)',
            lineHeight: 1.6,
            textAlign: 'center',
          }}
        >
          按住鼠标连接星星
          <br />
          匹配星座解锁神话故事
        </div>
      </div>
    </div>
  );
};

export default InfoPanel;
