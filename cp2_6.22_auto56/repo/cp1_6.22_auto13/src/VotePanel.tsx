import React, { useState, useEffect } from 'react';
import { Vote } from './types';

interface VotePanelProps {
  vote: Vote;
  isHost: boolean;
  onSubmitVote: (submission: { selectedOptionIds?: string[]; rating?: number }) => void;
  onEndVote: () => void;
}

const VotePanel: React.FC<VotePanelProps> = ({ vote, isHost, onSubmitVote }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    setSelectedIds([]);
    setRating(0);
    setHasVoted(false);
  }, [vote.id]);

  const handleOptionClick = (optionId: string) => {
    if (!vote.isActive || isHost) return;

    if (vote.type === 'single') {
      setSelectedIds([optionId]);
    } else if (vote.type === 'multiple') {
      setSelectedIds(prev =>
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    }
  };

  const handleStarClick = (value: number) => {
    if (!vote.isActive || isHost) return;
    setRating(value);
  };

  const handleSubmit = () => {
    if (isSubmitting || hasVoted || !vote.isActive || isHost) return;

    setIsSubmitting(true);
    if (vote.type === 'rating') {
      onSubmitVote({ rating });
    } else {
      onSubmitVote({ selectedOptionIds: [...selectedIds] });
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setHasVoted(true);
    }, 500);
  };

  const totalVotes = vote.type === 'rating'
    ? (vote.ratingResults?.reduce((sum, r) => sum + r.count, 0) || 0)
    : vote.results.reduce((sum, r) => sum + r.count, 0);

  const canSubmit = vote.isActive && !isHost && !hasVoted && !isSubmitting && (
    vote.type === 'rating' ? rating > 0 : selectedIds.length > 0
  );

  const typeLabel = vote.type === 'single' ? '单选题' : vote.type === 'multiple' ? '多选题' : '评分题';

  return (
    <div>
      <span className="vote-type-badge">{typeLabel}</span>
      <h3 className="vote-question">{vote.question}</h3>

      {!vote.isActive && (
        <div className="final-result-banner">
          <div className="final-result-text">投票已结束</div>
          <div className="total-votes">共 {totalVotes} 人参与</div>
        </div>
      )}

      {vote.type === 'rating' ? (
        <div>
          <div className="rating-container">
            {[1, 2, 3, 4, 5].map(star => (
              <span
                key={star}
                className={`rating-star ${
                  (hoverRating || rating) >= star ? 'active' : ''
                } ${!vote.isActive || isHost ? 'disabled' : ''}`}
                onClick={() => handleStarClick(star)}
                onMouseEnter={() => vote.isActive && !isHost && setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              >
                ★
              </span>
            ))}
          </div>
          {vote.ratingResults && (
            <div style={{ marginTop: '16px' }}>
              {vote.ratingResults.map(r => {
                const percentage = totalVotes > 0 ? (r.count / totalVotes) * 100 : 0;
                return (
                  <div
                    key={r.rating}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '8px',
                      padding: '8px 12px',
                      background: 'var(--light-gray)',
                      borderRadius: 'var(--radius-sm)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        background: 'linear-gradient(90deg, rgba(255, 140, 66, 0.2), rgba(255, 140, 66, 0.05))',
                        width: `${percentage}%`,
                        transition: 'width 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                      }}
                    />
                    <span style={{ flex: 1, fontWeight: '500', position: 'relative', zIndex: 1 }}>
                      {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                    </span>
                    <span style={{ fontWeight: '600', color: 'var(--primary-blue)', position: 'relative', zIndex: 1 }}>
                      {r.count} 票
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', minWidth: '40px', textAlign: 'right', position: 'relative', zIndex: 1 }}>
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="options-list">
          {vote.options.map(option => {
            const result = vote.results.find(r => r.optionId === option.id);
            const count = result?.count || 0;
            const percentage = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
            const isSelected = selectedIds.includes(option.id);

            return (
              <div
                key={option.id}
                className={`option-item ${isSelected ? 'selected' : ''} ${(!vote.isActive || isHost || hasVoted) ? 'disabled' : ''}`}
                onClick={() => handleOptionClick(option.id)}
              >
                {totalVotes > 0 && (
                  <div className="option-bar" style={{ width: `${percentage}%` }} />
                )}
                <div className={vote.type === 'single' ? 'option-radio' : 'option-checkbox'} />
                <span className="option-text">{option.text}</span>
                <span className="option-count">{count} 票</span>
              </div>
            );
          })}
        </div>
      )}

      {vote.isActive && !isHost && (
        <button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {isSubmitting && <span className="spinner"></span>}
          {isSubmitting ? '提交中...' : hasVoted ? '已提交' : '提交投票'}
        </button>
      )}

      {vote.isActive && (
        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
          已参与：{totalVotes} 人
        </div>
      )}
    </div>
  );
};

export default VotePanel;
