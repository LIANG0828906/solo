import { useState, useEffect } from 'react';
import { Vote } from '../api';
import ChartPanel from './ChartPanel';

interface VoteCardProps {
  vote: Vote;
  onVote: (voteId: string, optionId: string) => void;
  userId: string;
}

export default function VoteCard({ vote, onVote, userId }: VoteCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [now, setNow] = useState(Date.now());

  const isExpired = vote.deadline < now;
  const hasVoted = vote.options.some((opt) => opt.votes.includes(userId));

  useEffect(() => {
    if (isExpired) return;
    const id = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [isExpired]);

  const totalVoters = new Set(vote.options.flatMap((opt) => opt.votes)).size;
  const totalVotes = vote.options.reduce((sum, opt) => sum + opt.votes.length, 0);

  const remaining = vote.deadline - now;
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  let countdownText = '';
  if (!isExpired) {
    if (days > 0) {
      countdownText = `剩余 ${days}天${hours}时${minutes}分${seconds}秒`;
    } else {
      countdownText = `剩余 ${hours}时${minutes}分${seconds}秒`;
    }
  }

  const topOptions = vote.options.slice(0, 3);
  const extraCount = vote.options.length - 3;

  const stats = vote.options.map((opt) => ({
    optionId: opt.id,
    text: opt.text,
    count: opt.votes.length,
    percentage: totalVotes === 0 ? 0 : Math.round((opt.votes.length / totalVotes) * 10000) / 100,
  }));

  return (
    <div
      style={{
        position: 'relative',
        background: '#fff',
        borderRadius: 12,
        boxShadow: isExpired ? '0 2px 8px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.1)',
        padding: 24,
        cursor: isExpired ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'box-shadow 0.3s',
        opacity: isExpired ? 0.75 : 1,
      }}
      onMouseEnter={(e) => {
        if (!isExpired) {
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      }}
      onClick={() => {
        if (isExpired) setExpanded(!expanded);
      }}
    >
      {isExpired && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: '#FF5252',
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 4,
          }}
        >
          已截止
        </div>
      )}

      <div style={{ fontSize: 16, fontWeight: 600, color: '#1A237E' }}>
        {vote.title}
      </div>

      {!isExpired && !hasVoted && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {vote.options.map((option) => (
            <div
              key={option.id}
              onClick={(e) => {
                e.stopPropagation();
                onVote(vote.id, option.id);
              }}
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'background 0.2s',
                background: '#fff',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#F5F7FA';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fff';
              }}
            >
              {option.text}
            </div>
          ))}
        </div>
      )}

      {(hasVoted || isExpired) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(isExpired ? topOptions : vote.options).map((option) => {
            const count = option.votes.length;
            const pct = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
            return (
              <div key={option.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{option.text}</span>
                  <span style={{ fontSize: 13, color: '#666' }}>{count}票 {pct}%</span>
                </div>
                <div style={{ height: 8, background: '#E0E0E0', borderRadius: 4, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, #4FC3F7, #2196F3)',
                      width: `${pct}%`,
                      borderRadius: 4,
                      transition: 'width 0.5s ease-out',
                    }}
                  />
                </div>
              </div>
            );
          })}
          {isExpired && extraCount > 0 && (
            <div style={{ fontSize: 13, color: '#999', textAlign: 'center' }}>
              +{extraCount}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: '#888', marginTop: 4 }}>
        <span>{totalVoters}人参与</span>
        {isExpired ? (
          <span style={{ background: '#FF5252', color: '#fff', fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>已截止</span>
        ) : (
          <span>{countdownText}</span>
        )}
      </div>

      {isExpired && expanded && <ChartPanel stats={stats} />}
    </div>
  );
}
