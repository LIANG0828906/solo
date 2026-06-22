import React, { useState } from 'react';
import { EvaluationIndicator } from '../../shared/types';

interface Props {
  indicator: EvaluationIndicator;
  score: number | null;
  onScoreChange: (indicatorId: string, score: number) => void;
}

const scoreColors: Record<number, string> = {
  1: '#EF4444',
  2: '#F59E0B',
  3: '#EAB308',
  4: '#84CC16',
  5: '#22C55E',
};

const scoreLabels: Record<number, string> = {
  1: '很差',
  2: '较差',
  3: '一般',
  4: '良好',
  5: '优秀',
};

const ScorePanel: React.FC<Props> = ({ indicator, score, onScoreChange }) => {
  const [animatingScore, setAnimatingScore] = useState<number | null>(null);

  const handleClick = (value: number) => {
    setAnimatingScore(value);
    onScoreChange(indicator.id, value);
    setTimeout(() => setAnimatingScore(null), 300);
  };

  return (
    <div
      className={`score-panel ${score ? `glow-${score}` : ''}`}
      id={`indicator-${indicator.id}`}
    >
      <div className="indicator-header">
        <div className="indicator-title">
          <span className="indicator-name">{indicator.name}</span>
          <span className="indicator-weight">权重 {indicator.weight}%</span>
        </div>
        <p className="indicator-description">{indicator.description}</p>
      </div>
      <div className="rating-group">
        {[1, 2, 3, 4, 5].map((value) => (
          <label
            key={value}
            className="radio-label"
            style={{ '--color': scoreColors[value] } as React.CSSProperties}
          >
            <input
              type="radio"
              name={`indicator-${indicator.id}`}
              value={value}
              checked={score === value}
              onChange={() => handleClick(value)}
              className="radio-input"
            />
            <span
              className={`radio-circle ${score === value ? 'selected' : ''} ${
                animatingScore === value ? 'ripple' : ''
              }`}
            >
              <span className="radio-inner"></span>
            </span>
            <span className="radio-text" style={{ color: scoreColors[value] }}>
              {scoreLabels[value]} ({value})
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default ScorePanel;
