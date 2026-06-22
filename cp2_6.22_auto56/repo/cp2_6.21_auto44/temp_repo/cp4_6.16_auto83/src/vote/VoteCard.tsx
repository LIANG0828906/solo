import React, { useState, useEffect } from 'react';
import { useVoteStore } from './store';
import type { Vote } from './types';
import { ICONS } from '../canvas/icons';

interface VoteCardProps {
  onVoteComplete?: () => void;
}

export const VoteCard: React.FC<VoteCardProps> = ({ onVoteComplete }) => {
  const { currentVote, castVote, hasVoted, votedOptionId, getResult } = useVoteStore();
  const [animatingOption, setAnimatingOption] = useState<string | null>(null);

  useEffect(() => {
    if (hasVoted && votedOptionId) {
      setAnimatingOption(votedOptionId);
      const timer = setTimeout(() => {
        setAnimatingOption(null);
        onVoteComplete?.();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [hasVoted, votedOptionId, onVoteComplete]);

  if (!currentVote) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        color: '#999',
        fontSize: '16px'
      }}>
        暂无投票数据
      </div>
    );
  }

  const result = getResult();

  return (
    <div
      className="animate-fade-in-up"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100%',
        padding: '24px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '36px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, #e0f2fe 0%, #fce7f3 50%, #fff1e6 100%)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.05)',
          border: '1px solid rgba(255,255,255,0.8)'
        }}
      >
        <div style={{
          textAlign: 'center',
          marginBottom: '8px'
        }}>
          <span style={{
            display: 'inline-block',
            padding: '4px 14px',
            background: 'rgba(255,255,255,0.7)',
            borderRadius: '20px',
            fontSize: '12px',
            color: '#666',
            fontWeight: 500
          }}>
            邀请码: {currentVote.inviteCode}
          </span>
        </div>

        <h1 style={{
          fontSize: '26px',
          fontWeight: 700,
          textAlign: 'center',
          marginBottom: '8px',
          color: '#1a1a1a',
          lineHeight: 1.3
        }}>
          {currentVote.title}
        </h1>

        {currentVote.description && (
          <p style={{
            fontSize: '14px',
            textAlign: 'center',
            color: '#666',
            marginBottom: '28px',
            lineHeight: 1.6
          }}>
            {currentVote.description}
          </p>
        )}

        {!currentVote.description && <div style={{ height: '28px' }} />}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {currentVote.options.map((option, index) => {
            const isVoted = votedOptionId === option.id;
            const isAnimating = animatingOption === option.id;
            const resultItem = result.items.find((i) => i.option.id === option.id);
            const progress = result.totalVotes > 0 ? (option.votes / result.totalVotes) : 0;

            return (
              <button
                key={option.id}
                onClick={() => {
                  if (!hasVoted) {
                    castVote(option.id);
                  }
                }}
                disabled={hasVoted && !isVoted}
                className={isAnimating ? '' : ''}
                style={{
                  position: 'relative',
                  width: '100%',
                  padding: '16px 20px',
                  borderRadius: '16px',
                  background: isVoted
                    ? `linear-gradient(135deg, ${option.color}dd 0%, ${option.color}aa 100%)`
                    : hasVoted
                      ? 'rgba(255,255,255,0.5)'
                      : 'rgba(255,255,255,0.85)',
                  border: `2px solid ${isVoted ? option.color : 'rgba(0,0,0,0.05)'}`,
                  cursor: hasVoted ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isAnimating ? 'scale(1.02)' : undefined,
                  boxShadow: isVoted
                    ? `0 4px 16px ${option.color}33`
                    : hasVoted ? 'none' : '0 2px 8px rgba(0,0,0,0.03)',
                  overflow: 'hidden',
                  textAlign: 'left'
                }}
              >
                {hasVoted && result.totalVotes > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${progress * 100}%`,
                      background: `${option.color}18`,
                      transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                      transitionDelay: `${index * 0.1}s`
                    }}
                  />
                )}

                <div
                  style={{
                    flexShrink: 0,
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: isVoted ? 'rgba(255,255,255,0.25)' : `${option.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1
                  }}
                  dangerouslySetInnerHTML={{
                    __html: ICONS[option.icon]?.(24, isVoted ? '#fff' : option.color) || ''
                  }}
                />

                <div style={{ flex: 1, zIndex: 1 }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: isVoted ? '#fff' : '#1a1a1a',
                    marginBottom: '2px'
                  }}>
                    {option.text}
                  </div>
                  {hasVoted && (
                    <div style={{
                      fontSize: '13px',
                      color: isVoted ? 'rgba(255,255,255,0.9)' : '#999'
                    }}>
                      {option.votes} 票 · {resultItem?.percentage || 0}%
                    </div>
                  )}
                </div>

                {isVoted && (
                  <div
                    style={{
                      position: 'relative',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1,
                      animation: isAnimating ? 'checkSpread 0.6s ease-out' : undefined
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {hasVoted && (
          <div
            className="animate-fade-in-up"
            style={{
              marginTop: '20px',
              padding: '14px 18px',
              background: 'rgba(255,255,255,0.6)',
              borderRadius: '12px',
              textAlign: 'center',
              fontSize: '14px',
              color: '#555'
            }}
          >
            <span style={{ marginRight: '6px' }}>🎉</span>
            投票完成！你可以进入画板自由涂鸦，表达你的想法
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#888' }}>
              共 {result.totalVotes} 人参与投票
            </div>
          </div>
        )}

        {!hasVoted && (
          <div style={{
            marginTop: '20px',
            textAlign: 'center',
            fontSize: '12px',
            color: '#888'
          }}>
            点击选项完成投票 · 投票后不可更改
          </div>
        )}
      </div>
    </div>
  );
};

export default VoteCard;
