import React, { useState, useCallback, useRef } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Idea, VoteType } from '../../types';

dayjs.extend(relativeTime);

interface IdeaCardProps {
  idea: Idea;
  onVote: (ideaId: string, voteType: VoteType) => void;
  onClick?: () => void;
}

const voteConfig: Record<VoteType, { label: string; emoji: string; activeBg: string }> = {
  agree: { label: '赞成', emoji: '👍', activeBg: 'rgba(34, 197, 94, 0.4)' },
  disagree: { label: '反对', emoji: '👎', activeBg: 'rgba(239, 68, 68, 0.4)' },
  neutral: { label: '吃瓜', emoji: '🍉', activeBg: 'rgba(251, 191, 36, 0.4)' },
};

export const IdeaCard: React.FC<IdeaCardProps> = ({ idea, onVote, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const [bouncingVote, setBouncingVote] = useState<VoteType | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalVotes = idea.votes.agree + idea.votes.disagree + idea.votes.neutral;
  const isHot = idea.votes.agree >= 10;

  const handleVote = useCallback(
    (type: VoteType) => {
      setBouncingVote(type);
      onVote(idea.id, type);
      setTimeout(() => setBouncingVote(null), 300);
    },
    [idea.id, onVote]
  );

  const handleCardClick = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setDetailOpen(true);
    onClick?.();
  }, [onClick]);

  const handleCloseDetail = useCallback(() => {
    closeTimer.current = setTimeout(() => setDetailOpen(false), 50);
  }, []);

  return (
    <>
      <div
        className="fade-in"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={handleCardClick}
        style={{
          background: `linear-gradient(135deg, ${idea.bgColor} 0%, rgba(255,255,255,0.08) 100%)`,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '16px',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
          boxShadow: hovered
            ? '0 12px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(249,115,22,0.3)'
            : '0 4px 12px rgba(0,0,0,0.2)',
          breakInside: 'avoid',
          marginBottom: '16px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(135deg, ${idea.bgColor} 0%, transparent 60%)`,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isHot && (
                <span className="flame-icon" style={{ fontSize: '18px' }}>
                  🔥
                </span>
              )}
              <img
                src={idea.author.avatar}
                alt={idea.author.name}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.2)',
                  background: '#334155',
                }}
              />
              <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 500 }}>
                {idea.author.name}
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              {dayjs(idea.createdAt).fromNow()}
            </span>
          </div>

          <h3
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: '#f1f5f9',
              marginBottom: '6px',
              lineHeight: 1.4,
            }}
          >
            {idea.title}
          </h3>

          {idea.description && (
            <p
              style={{
                fontSize: '13px',
                color: '#94a3b8',
                lineHeight: 1.5,
                marginBottom: '12px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {idea.description}
            </p>
          )}

          {idea.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
              {idea.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: '2px 8px',
                    background: 'rgba(249, 115, 22, 0.2)',
                    border: '1px solid rgba(249, 115, 22, 0.3)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fdba74',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              gap: '6px',
              paddingTop: '10px',
              borderTop: '1px solid rgba(255,255,255,0.08)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {(Object.keys(voteConfig) as VoteType[]).map((type) => {
              const config = voteConfig[type];
              const isBouncing = bouncingVote === type;
              return (
                <button
                  key={type}
                  onClick={() => handleVote(type)}
                  className={isBouncing ? 'scale-bounce' : ''}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: hovered ? config.activeBg : 'rgba(255,255,255,0.05)',
                    color: '#e2e8f0',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    transition: 'all 0.2s ease',
                    fontWeight: 500,
                  }}
                >
                  <span>{config.emoji}</span>
                  <span>{idea.votes[type]}</span>
                </button>
              );
            })}
          </div>

          <div
            style={{
              marginTop: '8px',
              textAlign: 'center',
              fontSize: '11px',
              color: '#64748b',
            }}
          >
            共 {totalVotes} 票
          </div>
        </div>
      </div>

      {detailOpen && (
        <div
          onClick={handleCloseDetail}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          className="fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(30, 41, 59, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              position: 'relative',
            }}
          >
            <button
              onClick={handleCloseDetail}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '4px 8px',
              }}
            >
              ✕
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <img
                src={idea.author.avatar}
                alt={idea.author.name}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  border: '2px solid rgba(249, 115, 22, 0.4)',
                }}
              />
              <div>
                <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{idea.author.name}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  {dayjs(idea.createdAt).format('YYYY-MM-DD HH:mm')}
                </div>
              </div>
              {isHot && <span className="flame-icon" style={{ fontSize: '28px' }}>🔥</span>}
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#f8fafc', marginBottom: '12px' }}>
              {idea.title}
            </h2>

            {idea.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                {idea.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: '4px 12px',
                      background: 'rgba(249, 115, 22, 0.2)',
                      border: '1px solid rgba(249, 115, 22, 0.3)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#fdba74',
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <p style={{ color: '#cbd5e1', lineHeight: 1.7, fontSize: '14px', marginBottom: '24px', whiteSpace: 'pre-wrap' }}>
              {idea.description || '暂无详细描述'}
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
              }}
            >
              {(Object.keys(voteConfig) as VoteType[]).map((type) => {
                const config = voteConfig[type];
                return (
                  <div
                    key={type}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: config.activeBg,
                      border: '1px solid rgba(255,255,255,0.1)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>{config.emoji}</div>
                    <div style={{ fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
                      {config.label}
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#f8fafc' }}>
                      {idea.votes[type]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
