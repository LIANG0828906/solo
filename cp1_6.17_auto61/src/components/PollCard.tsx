import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Poll, PreferenceType } from '../types';

interface PollCardProps {
  poll: Poll;
  onVote?: (preferences: Record<string, PreferenceType>) => void;
  memberId?: string;
  showVoting?: boolean;
}

const preferenceLabels: Record<PreferenceType, string> = {
  available: '可以',
  unavailable: '不行',
  preferred: '优先',
};

const preferenceColors: Record<PreferenceType, string> = {
  available: '#16a34a',
  unavailable: '#dc2626',
  preferred: '#2563eb',
};

function PreferenceButton({
  value,
  active,
  onClick,
}: {
  value: PreferenceType;
  active: boolean;
  onClick: () => void;
}) {
  const [animating, setAnimating] = useState(false);

  const handleClick = () => {
    setAnimating(true);
    onClick();
    setTimeout(() => setAnimating(false), 200);
  };

  const baseStyle: React.CSSProperties = {
    padding: '6px 16px',
    borderRadius: '6px',
    border: active ? 'none' : '1px solid #4b5563',
    background: active ? preferenceColors[value] : 'transparent',
    color: active ? '#fff' : '#9ca3af',
    fontSize: 'clamp(12px, 1.2vw, 14px)',
    fontWeight: 500,
    animation: animating ? 'bounceScale 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' : undefined,
    transition: 'all 0.3s ease',
  };

  return (
    <button style={baseStyle} onClick={handleClick}>
      {preferenceLabels[value]}
    </button>
  );
}

function MemberAvatar({
  name,
  avatar,
  voted,
}: {
  name: string;
  avatar: string;
  voted: boolean;
}) {
  return (
    <div
      title={name}
      style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: voted ? avatar : '#374151',
        opacity: voted ? 1 : 0.5,
        filter: voted ? 'none' : 'grayscale(100%)',
        border: voted ? '2px solid #16a34a' : '2px solid transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: 600,
        color: voted ? '#fff' : '#9ca3af',
        transition: 'all 0.3s ease',
        flexShrink: 0,
      }}
    >
      {voted ? name.charAt(0) : name.charAt(0)}
    </div>
  );
}

function PollCard({ poll, onVote, showVoting = false }: PollCardProps) {
  const [preferences, setPreferences] = useState<Record<string, PreferenceType>>({});

  const votedMemberIds = new Set(poll.votes.map((v) => v.memberId));

  const handlePreferenceClick = (optionId: string, value: PreferenceType) => {
    const newPrefs = { ...preferences, [optionId]: value };
    setPreferences(newPrefs);
  };

  const handleSubmit = () => {
    if (onVote && Object.keys(preferences).length > 0) {
      onVote(preferences);
    }
  };

  const allVoted = poll.options.every((opt) => preferences[opt.id]);

  return (
    <div
      style={{
        background: '#2a2a40',
        borderRadius: '12px',
        padding: '24px',
        transition: 'all 0.3s ease',
        boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.3)';
      }}
    >
      <div>
        <h3
          style={{
            fontSize: 'clamp(16px, 2vw, 20px)',
            fontWeight: 600,
            marginBottom: '8px',
            color: '#f3f4f6',
          }}
        >
          {poll.title}
        </h3>
        <p
          style={{
            fontSize: 'clamp(12px, 1.2vw, 14px)',
            color: '#9ca3af',
          }}
        >
          截止时间：{new Date(poll.deadline).toLocaleString('zh-CN')}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {poll.options.map((option) => (
          <div
            key={option.id}
            style={{
              padding: '12px',
              background: 'rgba(99, 102, 241, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(99, 102, 241, 0.2)',
            }}
          >
            <div
              style={{
                fontSize: 'clamp(13px, 1.3vw, 15px)',
                fontWeight: 500,
                marginBottom: showVoting ? '10px' : '0',
                color: '#e5e7eb',
              }}
            >
              {option.date} {option.startTime} - {option.endTime}
            </div>
            {showVoting && (
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['unavailable', 'available', 'preferred'] as PreferenceType[]).map(
                  (pref) => (
                    <PreferenceButton
                      key={pref}
                      value={pref}
                      active={preferences[option.id] === pref}
                      onClick={() => handlePreferenceClick(option.id, pref)}
                    />
                  )
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div>
        <p
          style={{
            fontSize: 'clamp(12px, 1.2vw, 14px)',
            color: '#9ca3af',
            marginBottom: '8px',
          }}
        >
          成员投票状态（{votedMemberIds.size}/{poll.members.length} 已投票）
        </p>
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          {poll.members.map((member) => (
            <MemberAvatar
              key={member.id}
              name={member.name}
              avatar={member.avatar}
              voted={votedMemberIds.has(member.id)}
            />
          ))}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginTop: 'auto',
          flexWrap: 'wrap',
        }}
      >
        {showVoting && onVote && (
          <button
            onClick={handleSubmit}
            disabled={!allVoted}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              color: '#fff',
              fontWeight: 500,
              fontSize: 'clamp(13px, 1.3vw, 15px)',
              flex: 1,
              minWidth: '120px',
            }}
          >
            提交投票
          </button>
        )}
        <Link
          to={`/schedule/${poll.shortId}`}
          style={{
            padding: '10px 24px',
            borderRadius: '8px',
            background: 'transparent',
            border: '1px solid #8b5cf6',
            color: '#8b5cf6',
            textDecoration: 'none',
            textAlign: 'center',
            fontWeight: 500,
            fontSize: 'clamp(13px, 1.3vw, 15px)',
            transition: 'all 0.3s ease',
            flex: 1,
            minWidth: '120px',
          }}
        >
          查看排期
        </Link>
      </div>
    </div>
  );
}

export default PollCard;
