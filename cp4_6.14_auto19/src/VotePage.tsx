import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import type { Poll } from './types';
import ResultsPanel from './ResultsPanel';

interface VotePageProps {
  poll: Poll;
  votedOptionId: string | null;
  deviceId: string;
  onVote: (pollId: string, optionId: string) => boolean;
  onEndPoll: (pollId: string) => boolean;
  onBack: () => void;
}

const pageStyles: React.CSSProperties = {
  minHeight: '100vh',
  padding: '40px 20px',
  maxWidth: '900px',
  margin: '0 auto',
};

const headerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '24px',
  flexWrap: 'wrap',
  gap: '12px',
};

const backBtnStyles: React.CSSProperties = {
  width: '44px',
  height: '44px',
  borderRadius: '12px',
  background: 'var(--bg-card)',
  border: '1px solid var(--border-color)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '20px',
  transition: 'all 200ms ease',
  color: 'var(--text-primary)',
  flexShrink: 0,
};

const pollCodeContainerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  background: 'var(--bg-card)',
  padding: '10px 18px',
  borderRadius: '12px',
  border: '1px solid var(--border-color)',
};

const pollCodeLabelStyles: React.CSSProperties = {
  fontSize: '13px',
  color: 'var(--text-muted)',
  fontWeight: 500,
};

const pollCodeValueStyles: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 700,
  letterSpacing: '0.15em',
  color: 'var(--accent-orange)',
  fontFamily: 'Space Grotesk, sans-serif',
};

const copyBtnStyles: React.CSSProperties = {
  padding: '6px 14px',
  fontSize: '13px',
  fontWeight: 600,
  background: 'rgba(59, 130, 246, 0.15)',
  color: 'var(--accent-blue)',
  borderRadius: '8px',
  transition: 'all 200ms ease',
};

const pollInfoCardStyles: React.CSSProperties = {
  background: 'var(--bg-card)',
  borderRadius: '20px',
  padding: '32px',
  border: '1px solid var(--border-color)',
  marginBottom: '24px',
  animation: 'fadeInUp 0.5s ease-out',
  position: 'relative',
};

const pollTitleStyles: React.CSSProperties = {
  fontSize: 'clamp(24px, 4vw, 36px)',
  fontWeight: 800,
  marginBottom: '12px',
  lineHeight: 1.2,
  background: 'linear-gradient(135deg, #f8fafc 0%, #94a3b8 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

const pollDescStyles: React.CSSProperties = {
  fontSize: '15px',
  color: 'var(--text-secondary)',
  lineHeight: 1.6,
  marginBottom: '16px',
};

const statusBadgeStyles: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 14px',
  borderRadius: '999px',
  fontSize: '13px',
  fontWeight: 600,
};

const optionsGridStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '16px',
  marginBottom: '24px',
};

const optionCardStyles: React.CSSProperties = {
  position: 'relative',
  background: 'var(--bg-card)',
  border: '2px solid var(--border-color)',
  borderRadius: '16px',
  padding: '24px',
  cursor: 'pointer',
  transition: 'transform 200ms ease, background 200ms ease, border-color 200ms ease, box-shadow 200ms ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  animation: 'fadeInUp 0.4s ease-out both',
  minHeight: '72px',
};

const selectedOptionStyles: React.CSSProperties = {
  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2))',
  borderColor: 'var(--success-start)',
  boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)',
};

const disabledOptionStyles: React.CSSProperties = {
  cursor: 'not-allowed',
  opacity: 0.7,
};

const optionTextStyles: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  flex: 1,
};

const checkIconStyles: React.CSSProperties = {
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  background: 'var(--success-start)',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '16px',
  fontWeight: 700,
  flexShrink: 0,
  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
};

const endBtnStyles: React.CSSProperties = {
  padding: '12px 24px',
  background: 'rgba(239, 68, 68, 0.15)',
  color: '#ef4444',
  fontSize: '14px',
  fontWeight: 600,
  borderRadius: '10px',
  transition: 'all 200ms ease',
};

const votedInfoStyles: React.CSSProperties = {
  padding: '14px 20px',
  background: 'rgba(16, 185, 129, 0.1)',
  border: '1px solid rgba(16, 185, 129, 0.3)',
  borderRadius: '12px',
  fontSize: '14px',
  color: 'var(--success-start)',
  fontWeight: 500,
  marginBottom: '16px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  animation: 'fadeInUp 0.3s ease-out',
};

const VotePage: React.FC<VotePageProps> = ({
  poll,
  votedOptionId,
  deviceId,
  onVote,
  onEndPoll,
  onBack,
}) => {
  const [localPoll, setLocalPoll] = useState<Poll>(poll);
  const [localVotedId, setLocalVotedId] = useState<string | null>(votedOptionId);
  const [copied, setCopied] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const voteStartTimeRef = useRef<number>(0);

  useEffect(() => {
    setLocalPoll(poll);
  }, [poll]);

  useEffect(() => {
    setLocalVotedId(votedOptionId);
  }, [votedOptionId]);

  useEffect(() => {
    setIsCreator(poll.creatorDeviceId === deviceId);
  }, [poll.creatorDeviceId, deviceId]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'team_polls') {
        try {
          const polls = JSON.parse(e.newValue || '{}');
          if (polls[localPoll.id]) {
            setLocalPoll(polls[localPoll.id]);
          }
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [localPoll.id]);

  const handleVote = useCallback((optionId: string) => {
    if (localVotedId || localPoll.isEnded) return;
    if (localPoll.deadline && Date.now() > localPoll.deadline) return;

    voteStartTimeRef.current = performance.now();

    const success = onVote(localPoll.id, optionId);
    if (success) {
      setLocalVotedId(optionId);
      setLocalPoll((prev) => ({
        ...prev,
        options: prev.options.map((o) =>
          o.id === optionId ? { ...o, votes: o.votes + 1 } : o
        ),
      }));

      const endTime = performance.now();
      console.log(`[投票刷新延迟] ${(endTime - voteStartTimeRef.current).toFixed(2)}ms`);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#f97316', '#3b82f6', '#10b981', '#fbbf24'],
      });
    }
  }, [localPoll, localVotedId, onVote]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(localPoll.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = localPoll.id;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEndPoll = () => {
    if (!isCreator || localPoll.isEnded) return;
    if (window.confirm('确定要结束投票吗？结束后将无法再接收新的投票。')) {
      onEndPoll(localPoll.id);
      setLocalPoll((prev) => ({ ...prev, isEnded: true, endedAt: Date.now() }));
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#fbbf24', '#f97316', '#f8fafc'],
      });
    }
  };

  const isExpired = localPoll.deadline ? Date.now() > localPoll.deadline : false;
  const canVote = !localVotedId && !localPoll.isEnded && !isExpired;

  const statusBadge = (() => {
    if (localPoll.isEnded) {
      return {
        style: { ...statusBadgeStyles, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' },
        text: '● 已结束',
      };
    }
    if (isExpired) {
      return {
        style: { ...statusBadgeStyles, background: 'rgba(100, 116, 139, 0.2)', color: 'var(--text-secondary)' },
        text: '● 已截止',
      };
    }
    return {
      style: { ...statusBadgeStyles, background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success-start)' },
      text: '● 进行中',
    };
  })();

  const totalVotes = localPoll.options.reduce((sum, o) => sum + o.votes, 0);

  return (
    <div style={pageStyles}>
      <div style={headerStyles}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            style={backBtnStyles}
            onClick={onBack}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-card-hover)';
              e.currentTarget.style.borderColor = 'var(--accent-blue)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-card)';
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          >
            ←
          </button>
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>投票详情</h2>
        </div>

        <div style={pollCodeContainerStyles}>
          <div>
            <div style={pollCodeLabelStyles}>投票码</div>
            <div style={pollCodeValueStyles}>{localPoll.id}</div>
          </div>
          <button
            style={copyBtnStyles}
            onClick={copyCode}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.25)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {copied ? '✓ 已复制' : '复制'}
          </button>
        </div>
      </div>

      <div style={pollInfoCardStyles}>
        <h1 style={pollTitleStyles}>{localPoll.title}</h1>
        {localPoll.description && <p style={pollDescStyles}>{localPoll.description}</p>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <span style={statusBadge.style}>{statusBadge.text}</span>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            共 {totalVotes} 票 · {localPoll.options.length} 个选项
          </span>
          {localPoll.deadline && (
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              ⏰ 截止：{new Date(localPoll.deadline).toLocaleString('zh-CN')}
            </span>
          )}
        </div>
      </div>

      {localVotedId && (
        <div style={votedInfoStyles}>
          <span>✅</span>
          <span>你已成功投票！感谢参与决策。</span>
        </div>
      )}

      <div style={optionsGridStyles} className="vote-options-grid">
        {localPoll.options.map((option, index) => {
          const isSelected = localVotedId === option.id;
          const isDisabled = !canVote;

          let cardStyle = { ...optionCardStyles, animationDelay: `${index * 0.06}s` };
          if (isSelected) cardStyle = { ...cardStyle, ...selectedOptionStyles };
          if (isDisabled && !isSelected) cardStyle = { ...cardStyle, ...disabledOptionStyles };

          return (
            <div
              key={option.id}
              style={cardStyle}
              className="option-card"
              onClick={() => !isDisabled && handleVote(option.id)}
              onMouseDown={(e) => {
                if (!isDisabled) {
                  e.currentTarget.style.transform = 'scale(0.95)';
                }
              }}
              onMouseUp={(e) => {
                if (!isDisabled) {
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isDisabled) {
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
              onTouchStart={(e) => {
                if (!isDisabled) {
                  e.currentTarget.style.transform = 'scale(0.95)';
                }
              }}
              onTouchEnd={(e) => {
                if (!isDisabled) {
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
              onMouseEnter={(e) => {
                if (!isDisabled && !isSelected) {
                  e.currentTarget.style.borderColor = 'var(--accent-blue)';
                  e.currentTarget.style.background = 'var(--bg-card-hover)';
                }
              }}
            >
              <span style={optionTextStyles}>{option.text}</span>
              {isSelected && <div style={checkIconStyles}>✓</div>}
            </div>
          );
        })}
      </div>

      <ResultsPanel poll={localPoll} />

      {isCreator && !localPoll.isEnded && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
          <button
            style={endBtnStyles}
            onClick={handleEndPoll}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            ⏹ 结束投票
          </button>
        </div>
      )}
    </div>
  );
};

export default VotePage;
