import { memo, useState, useEffect, useMemo } from 'react';
import { Trophy } from 'lucide-react';
import type { Idea } from '../../../shared/types';

interface VoteListProps {
  ideas: Idea[];
}

function VoteList({ ideas }: VoteListProps) {
  const [displayIdeas, setDisplayIdeas] = useState<Idea[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const sortedIdeas = useMemo(() => {
    return [...ideas].sort((a, b) => {
      const scoreA = a.upvotes - a.downvotes;
      const scoreB = b.upvotes - b.downvotes;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return b.upvotes - a.upvotes;
    });
  }, [ideas, tick]);

  useEffect(() => {
    setDisplayIdeas(sortedIdeas);
  }, [sortedIdeas]);

  const getRankClass = (idx: number) => {
    if (idx === 0) return 'gold';
    if (idx === 1) return 'silver';
    if (idx === 2) return 'bronze';
    return '';
  };

  const getScoreClass = (score: number) => {
    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return '';
  };

  return (
    <div className="vote-list-container">
      <div className="vote-list-header">
        <div className="vote-list-title">
          <Trophy size={18} />
          投票排行榜
        </div>
      </div>
      <div className="vote-list-scroll">
        {displayIdeas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💭</div>
            <div className="empty-state-text">暂无想法，快来发布第一个吧！</div>
          </div>
        ) : (
          displayIdeas.map((idea, idx) => {
            const score = idea.upvotes - idea.downvotes;
            return (
              <div
                key={idea.id}
                className={`vote-list-item ${getRankClass(idx)}`}
              >
                <div className={`rank-badge ${getRankClass(idx)}`}>{idx + 1}</div>
                <div className="vote-item-content">
                  <div className="vote-item-text">{idea.content}</div>
                  <div className="vote-item-meta">
                    {idea.author} · 👍{idea.upvotes} 👎{idea.downvotes}
                  </div>
                </div>
                <div className={`vote-score ${getScoreClass(score)}`}>
                  {score > 0 ? '+' : ''}
                  {score}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default memo(VoteList);
