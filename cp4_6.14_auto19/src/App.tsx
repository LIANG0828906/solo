import React, { useState, useEffect, useCallback } from 'react';
import type { Poll, PollOption, VoteRecord, View } from './types';
import CreatePoll from './CreatePoll';
import VotePage from './VotePage';

const POLLS_KEY = 'team_polls';
const VOTES_KEY = 'team_votes';
const DEVICE_KEY = 'device_id';

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function generateDeviceId(): string {
  const existing = localStorage.getItem(DEVICE_KEY);
  if (existing) return existing;
  const id = 'dev_' + generateId() + generateId();
  localStorage.setItem(DEVICE_KEY, id);
  return id;
}

function generatePollId(existingIds: Set<string>): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = '';
  do {
    id = '';
    for (let i = 0; i < 6; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (existingIds.has(id));
  return id;
}

function loadPolls(): Record<string, Poll> {
  try {
    const raw = localStorage.getItem(POLLS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function savePolls(polls: Record<string, Poll>): void {
  localStorage.setItem(POLLS_KEY, JSON.stringify(polls));
}

function loadVotes(): VoteRecord[] {
  try {
    const raw = localStorage.getItem(VOTES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveVotes(votes: VoteRecord[]): void {
  localStorage.setItem(VOTES_KEY, JSON.stringify(votes));
}

const homeStyles: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px 20px',
};

const heroStyles: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '48px',
  animation: 'fadeInUp 0.6s ease-out',
};

const heroTitleStyles: React.CSSProperties = {
  fontSize: 'clamp(36px, 6vw, 64px)',
  fontWeight: 800,
  lineHeight: 1.1,
  marginBottom: '16px',
  background: 'linear-gradient(135deg, #f8fafc 0%, #94a3b8 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

const heroAccentStyles: React.CSSProperties = {
  background: 'linear-gradient(135deg, #f97316 0%, #3b82f6 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

const heroSubStyles: React.CSSProperties = {
  fontSize: 'clamp(16px, 2vw, 20px)',
  color: 'var(--text-secondary)',
  maxWidth: '520px',
  margin: '0 auto',
};

const cardContainerStyles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '24px',
  width: '100%',
  maxWidth: '720px',
};

const cardStyles: React.CSSProperties = {
  background: 'var(--bg-card)',
  borderRadius: '20px',
  padding: '32px',
  border: '1px solid var(--border-color)',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  transition: 'transform 300ms ease, border-color 300ms ease, box-shadow 300ms ease',
  animation: 'fadeInUp 0.6s ease-out both',
  position: 'relative',
  overflow: 'hidden',
};

const cardIconStyles: React.CSSProperties = {
  width: '56px',
  height: '56px',
  borderRadius: '14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '28px',
  marginBottom: '8px',
};

const cardTitleStyles: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 700,
  color: 'var(--text-primary)',
};

const cardDescStyles: React.CSSProperties = {
  fontSize: '14px',
  color: 'var(--text-secondary)',
  lineHeight: 1.6,
};

const inputStyles: React.CSSProperties = {
  width: '100%',
  padding: '14px 18px',
  background: 'rgba(15, 23, 42, 0.6)',
  border: '2px solid var(--border-color)',
  borderRadius: '12px',
  color: 'var(--text-primary)',
  fontSize: '18px',
  fontWeight: 600,
  letterSpacing: '0.15em',
  textAlign: 'center',
  textTransform: 'uppercase',
  transition: 'border-color 200ms ease',
};

const buttonStyles: React.CSSProperties = {
  width: '100%',
  padding: '14px 24px',
  background: 'var(--accent-orange)',
  color: 'white',
  fontSize: '16px',
  fontWeight: 600,
  borderRadius: '12px',
  transition: 'all 200ms ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
};

const blueButtonStyles: React.CSSProperties = {
  ...buttonStyles,
  background: 'var(--accent-blue)',
};

const errorTextStyles: React.CSSProperties = {
  color: '#ef4444',
  fontSize: '13px',
  textAlign: 'center',
  minHeight: '18px',
};

const App: React.FC = () => {
  const [view, setView] = useState<View>({ name: 'home' });
  const [deviceId] = useState<string>(generateDeviceId);
  const [polls, setPolls] = useState<Record<string, Poll>>(() => loadPolls());
  const [votes, setVotes] = useState<VoteRecord[]>(() => loadVotes());
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    savePolls(polls);
  }, [polls]);

  useEffect(() => {
    saveVotes(votes);
  }, [votes]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === POLLS_KEY) setPolls(loadPolls());
      if (e.key === VOTES_KEY) setVotes(loadVotes());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const createPoll = useCallback((title: string, description: string, optionTexts: string[], deadline: number | null): string => {
    const existingIds = new Set(Object.keys(polls));
    const id = generatePollId(existingIds);
    const options: PollOption[] = optionTexts.map((text) => ({
      id: generateId(),
      text: text.trim(),
      votes: 0,
    }));
    const newPoll: Poll = {
      id,
      title: title.trim(),
      description: description.trim(),
      options,
      deadline,
      createdAt: Date.now(),
      endedAt: null,
      isEnded: false,
      creatorDeviceId: deviceId,
    };
    setPolls((prev) => ({ ...prev, [id]: newPoll }));
    return id;
  }, [polls, deviceId]);

  const submitVote = useCallback((pollId: string, optionId: string): boolean => {
    const hasVoted = votes.some((v) => v.pollId === pollId && v.deviceId === deviceId);
    if (hasVoted) return false;

    const poll = polls[pollId];
    if (!poll || poll.isEnded) return false;
    if (poll.deadline && Date.now() > poll.deadline) return false;

    const record: VoteRecord = {
      pollId,
      optionId,
      deviceId,
      timestamp: Date.now(),
    };

    setVotes((prev) => [...prev, record]);
    setPolls((prev) => {
      const p = prev[pollId];
      if (!p) return prev;
      return {
        ...prev,
        [pollId]: {
          ...p,
          options: p.options.map((o) =>
            o.id === optionId ? { ...o, votes: o.votes + 1 } : o
          ),
        },
      };
    });
    return true;
  }, [polls, votes, deviceId]);

  const endPoll = useCallback((pollId: string): boolean => {
    const poll = polls[pollId];
    if (!poll || poll.creatorDeviceId !== deviceId || poll.isEnded) return false;
    setPolls((prev) => ({
      ...prev,
      [pollId]: {
        ...prev[pollId],
        isEnded: true,
        endedAt: Date.now(),
      },
    }));
    return true;
  }, [polls, deviceId]);

  const hasVoted = useCallback((pollId: string): string | null => {
    const r = votes.find((v) => v.pollId === pollId && v.deviceId === deviceId);
    return r ? r.optionId : null;
  }, [votes, deviceId]);

  const handleJoin = () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      setJoinError('请输入投票码');
      return;
    }
    if (!polls[code]) {
      setJoinError('投票码无效，请检查后重试');
      return;
    }
    setJoinError('');
    setView({ name: 'vote', pollId: code });
  };

  if (view.name === 'create') {
    return (
      <CreatePoll
        onCreate={(title, description, options, deadline) => {
          const id = createPoll(title, description, options, deadline);
          setView({ name: 'vote', pollId: id });
        }}
        onBack={() => setView({ name: 'home' })}
      />
    );
  }

  if (view.name === 'vote') {
    const poll = polls[view.pollId];
    if (!poll) {
      return (
        <div style={homeStyles}>
          <div style={{ ...cardStyles, maxWidth: '400px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '12px' }}>投票不存在</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              该投票码无效或已被删除
            </p>
            <button
              style={buttonStyles}
              onClick={() => setView({ name: 'home' })}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(249,115,22,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              返回首页
            </button>
          </div>
        </div>
      );
    }
    return (
      <VotePage
        poll={poll}
        votedOptionId={hasVoted(poll.id)}
        deviceId={deviceId}
        onVote={submitVote}
        onEndPoll={endPoll}
        onBack={() => setView({ name: 'home' })}
      />
    );
  }

  return (
    <div style={homeStyles}>
      <div style={heroStyles}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗳️</div>
        <h1 style={heroTitleStyles}>
          团队投票<span style={heroAccentStyles}>决策工具</span>
        </h1>
        <p style={heroSubStyles}>
          高效、透明地完成团队集体决策。创建投票、实时查看趋势、一键分享结果。
        </p>
      </div>

      <div style={cardContainerStyles}>
        <div
          style={{ ...cardStyles, animationDelay: '0.1s' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = 'var(--accent-orange)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(249,115,22,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ ...cardIconStyles, background: 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(249,115,22,0.05))' }}>
            ✨
          </div>
          <h3 style={cardTitleStyles}>创建投票</h3>
          <p style={cardDescStyles}>
            发起新的团队投票，自定义选项、设置截止时间，生成专属投票码分享给成员。
          </p>
          <button
            style={buttonStyles}
            onClick={() => setView({ name: 'create' })}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(249,115,22,0.3)';
              e.currentTarget.style.background = 'var(--accent-orange-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.background = 'var(--accent-orange)';
            }}
          >
            <span>🚀</span>
            <span>开始创建</span>
          </button>
        </div>

        <div
          style={{ ...cardStyles, animationDelay: '0.2s' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = 'var(--accent-blue)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(59,130,246,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ ...cardIconStyles, background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.05))' }}>
            🎯
          </div>
          <h3 style={cardTitleStyles}>参与投票</h3>
          <p style={cardDescStyles}>
            输入团队分享的6位投票码，参与决策并实时查看投票结果趋势。
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              style={inputStyles}
              type="text"
              placeholder="输入投票码"
              maxLength={6}
              value={joinCode}
              onChange={(e) => {
                setJoinCode(e.target.value.toUpperCase());
                if (joinError) setJoinError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleJoin();
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-blue)';
                e.currentTarget.style.animation = 'breathe 2s infinite alternate';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.animation = 'none';
              }}
            />
            <div style={errorTextStyles}>{joinError}</div>
            <button
              style={blueButtonStyles}
              onClick={handleJoin}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59,130,246,0.3)';
                e.currentTarget.style.background = 'var(--accent-blue-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.background = 'var(--accent-blue)';
              }}
            >
              <span>🔑</span>
              <span>进入投票</span>
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '60px', color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>
        <p>团队决策 · 实时透明 · 高效协作</p>
      </div>
    </div>
  );
};

export default App;
