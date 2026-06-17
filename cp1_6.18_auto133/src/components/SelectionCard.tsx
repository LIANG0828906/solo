import React, { useMemo } from 'react';
import { useSelectionStore } from '@/stores/selectionStore';
import type { Option } from '@/stores/selectionStore';

interface SelectionCardProps {
  option: Option;
  onVote: (optionId: string) => void;
}

const SelectionCard: React.FC<SelectionCardProps> = React.memo(
  ({ option, onVote }) => {
    const votedOptionId = useSelectionStore((s) => s.votedOptionId);
    const lockedOptionId = useSelectionStore((s) => s.lockedOptionId);
    const percentages = useSelectionStore((s) => s.percentages);

    const hasVoted = votedOptionId !== null;
    const isVotedByMe = votedOptionId === option.id;
    const isLocked = lockedOptionId !== null;
    const isLockedOption = lockedOptionId === option.id;

    const percentage = useMemo(
      () => Math.round((percentages[option.id] || 0) * 100),
      [percentages, option.id]
    );

    const handleClick = () => {
      if (hasVoted || isLocked) return;
      onVote(option.id);
    };

    return (
      <div
        className="selection-card"
        onClick={handleClick}
        style={{
          cursor: hasVoted || isLocked ? 'default' : 'pointer',
          opacity: isLocked && !isLockedOption ? 0.45 : 1,
          borderColor: isLockedOption
            ? '#6C63FF'
            : isVotedByMe
            ? '#6C63FF'
            : undefined,
        }}
      >
        <div className="card-content">
          <div className="card-title">{option.title}</div>
          <div className="card-desc">{option.description}</div>
        </div>

        {hasVoted && (
          <div className="progress-wrapper">
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="progress-label">{percentage}%</div>
          </div>
        )}
      </div>
    );
  }
);

SelectionCard.displayName = 'SelectionCard';

export default SelectionCard;
