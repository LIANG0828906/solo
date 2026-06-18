import React, { useEffect, useState } from 'react';
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

  const [timeWarning, setTimeWarning] = useState(false);

  useEffect(() => {
    if (score !== displayScore) {
      const diff = score - displayScore;
      const step = Math.ceil(Math.abs(diff) / 10);
      const increment = diff > 0 ? step : -step;

      const animate = () => {
        const next = displayScore + increment;
        if ((increment > 0 && next >= score) || (increment < 0 && next <= score)) {
          setDisplayScore(score);
        } else {
          setDisplayScore(next);
        }
      };

      const interval = setInterval(animate, 10);
      return () => clearInterval(interval);
    }
  }, [score, displayScore, setDisplayScore]);

  useEffect(() => {
    const timer = setInterval(() => {
      decrementTime();
      eventBus.emit(EVENTS.TIME_UPDATED, { timeRemaining: timeRemaining - 1 });
    }, 1000);

    return () => clearInterval(timer);
  }, [decrementTime, timeRemaining]);

  useEffect(() => {
    if (timeRemaining <= 30 && timeRemaining > 0) {
      setTimeWarning(true);
    } else {
      setTimeWarning(false);
    }

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
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes timePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
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
            style={{
              fontSize: '36px',
              fontWeight: 800,
              color: '#00E5FF',
              textShadow: '0 0 15px rgba(0, 229, 255, 0.4)',
              fontFeatureSettings: 'tnum',
              fontVariantNumeric: 'tabular-nums',
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
          style={{
            fontSize: '42px',
            fontWeight: 800,
            color: timeWarning ? '#EF4444' : '#FFFFFF',
            textShadow: timeWarning
              ? '0 0 20px rgba(239, 68, 68, 0.6)'
              : 'none',
            animation: timeWarning ? 'timePulse 0.5s ease-in-out infinite' : 'none',
            fontFeatureSettings: 'tnum',
            fontVariantNumeric: 'tabular-nums',
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
