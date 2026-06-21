import React, { useState, useEffect, useCallback } from 'react';
import { getVote, submitVote, voteEventEmitter, Vote } from '@/utils/voteStore';

interface VotePanelProps {
  voteId: string;
  voterId: string;
  onViewResults: () => void;
}

const VotePanel: React.FC<VotePanelProps> = ({ voteId, voterId, onViewResults }) => {
  const [vote, setVote] = useState<Vote | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    const v = getVote(voteId);
    setVote(v);
  }, [voteId]);

  const handleVoteUpdate = useCallback(() => {
    const v = getVote(voteId);
    if (v) setVote({ ...v });
  }, [voteId]);

  useEffect(() => {
    const handler = () => handleVoteUpdate();
    voteEventEmitter.on('vote:updated', handler);
    return () => {
      voteEventEmitter.off('vote:updated', handler);
    };
  }, [handleVoteUpdate]);

  if (!vote) {
    return <div className="vote-panel"><p>未找到该投票</p></div>;
  }

  const handleSelect = (optionId: string) => {
    if (hasVoted) return;
    if (vote.isMultiChoice) {
      setSelectedOptions((prev) => {
        const next = new Set(prev);
        if (next.has(optionId)) next.delete(optionId);
        else next.add(optionId);
        return next;
      });
    } else {
      setSelectedOptions(new Set([optionId]));
    }
  };

  const handleSubmit = () => {
    if (selectedOptions.size === 0 || hasVoted) return;
    submitVote(voteId, Array.from(selectedOptions), voterId);
    setHasVoted(true);
    onViewResults();
  };

  return (
    <div className="vote-panel">
      <h2 className="vote-question">{vote.question}</h2>
      <p className="vote-type-hint">{vote.isMultiChoice ? '多选模式 · 可选择多项' : '单选模式 · 仅可选择一项'}</p>
      <div className="options-grid">
        {vote.options.map((opt) => {
          const isSelected = selectedOptions.has(opt.id);
          return (
            <div
              key={opt.id}
              className={`option-card ${isSelected ? 'selected' : ''}`}
              onClick={() => handleSelect(opt.id)}
            >
              <span className="option-text">{opt.text}</span>
              {vote.isMultiChoice && isSelected && (
                <span className="check-icon">✓</span>
              )}
            </div>
          );
        })}
      </div>
      <button
        className={`btn-primary btn-submit ${hasVoted ? 'voted' : ''}`}
        onClick={handleSubmit}
        disabled={hasVoted || selectedOptions.size === 0}
      >
        {hasVoted ? '已投票' : '提交投票'}
      </button>
    </div>
  );
};

export default VotePanel;
