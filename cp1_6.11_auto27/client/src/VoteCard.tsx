import React, { memo } from 'react';

interface VoteOption {
  id: string;
  text: string;
  order: number;
}

interface VoteRecord {
  userId: string;
  nickname: string;
  optionId: string;
  timestamp: number;
}

interface Vote {
  id: string;
  title: string;
  description: string;
  options: VoteOption[];
  createdBy: string;
  creatorNickname: string;
  createdAt: number;
  ended: boolean;
  records: VoteRecord[];
}

interface VoteCardProps {
  vote: Vote;
  userId: string;
  onClick: () => void;
}

function getOptionStats(vote: Vote, optionId: string) {
  const count = vote.records.filter((r) => r.optionId === optionId).length;
  const total = vote.records.length;
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  return { count, pct };
}

const VoteCard: React.FC<VoteCardProps> = memo(({ vote, userId, onClick }) => {
  const totalVotes = vote.records.length;

  return (
    <div className={`vote-card${vote.ended ? ' ended' : ''}`} onClick={onClick}>
      {vote.ended && <span className="ended-badge">已结束</span>}
      <div className="card-title">{vote.title}</div>
      {vote.description && <div className="card-desc">{vote.description}</div>}
      <div className="total-votes">
        {totalVotes} 票 · {vote.creatorNickname} 发起
      </div>
      {vote.options
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((opt) => {
          const { count, pct } = getOptionStats(vote, opt.id);
          return (
            <div className="option-bar" key={opt.id}>
              <div className="option-header">
                <span className="option-text">{opt.text}</span>
                <span className="option-stats">
                  {count}票 · {pct}%
                </span>
              </div>
              <div className="progress-track">
                <div
                  className={`progress-fill${vote.ended ? ' ended' : ' active'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
    </div>
  );
});

VoteCard.displayName = 'VoteCard';

export default VoteCard;
