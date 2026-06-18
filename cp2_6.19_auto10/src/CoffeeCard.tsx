import React from 'react';
import { CoffeeRecord } from './types';

interface CoffeeCardProps {
  record: CoffeeRecord;
  selected: boolean;
  onSelect: (id: string) => void;
  onClick: (id: string) => void;
  animationKey?: number;
}

const getScoreColor = (score: number): string => {
  const ratio = Math.max(0, Math.min(1, (score - 1) / 9));
  const r = Math.round(220 + (46 - 220) * ratio);
  const g = Math.round(80 + (160 - 80) * ratio);
  const b = Math.round(80 + (70 - 80) * ratio);
  return `rgb(${r}, ${g}, ${b})`;
};

const getGradientStyle = (score: number): React.CSSProperties => {
  const ratio = Math.max(0, Math.min(1, (score - 1) / 9));
  const r1 = Math.round(230 + (56 - 230) * ratio);
  const g1 = Math.round(100 + (180 - 100) * ratio);
  const b1 = Math.round(100 + (80 - 100) * ratio);
  const r2 = Math.round(200 + (34 - 200) * ratio);
  const g2 = Math.round(60 + (140 - 60) * ratio);
  const b2 = Math.round(60 + (60 - 60) * ratio);
  return {
    background: `linear-gradient(90deg, rgb(${r1}, ${g1}, ${b1}) 0%, rgb(${r2}, ${g2}, ${b2}) 100%)`,
  };
};

const CoffeeCard: React.FC<CoffeeCardProps> = ({
  record,
  selected,
  onSelect,
  onClick,
  animationKey,
}) => {
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleCheckboxChange = () => {
    onSelect(record.id);
  };

  const handleCardClick = () => {
    onClick(record.id);
  };

  return (
    <div
      className={`card ${animationKey !== undefined ? 'fade-in' : ''}`}
      onClick={handleCardClick}
      key={animationKey}
    >
      <div className="card-gradient-bar" style={getGradientStyle(record.overall)} />
      <div className="card-content">
        <input
          type="checkbox"
          className="card-checkbox"
          checked={selected}
          onChange={handleCheckboxChange}
          onClick={handleCheckboxClick}
        />
        <h3 className="card-name">{record.name}</h3>
        <p className="card-roaster">
          {record.roaster} · {record.brewingMethod}
        </p>
        <div className="card-aromas">
          {record.aromas.slice(0, 4).map((aroma) => (
            <span key={aroma} className="aroma-tag">
              {aroma}
            </span>
          ))}
          {record.aromas.length > 4 && (
            <span className="aroma-tag">+{record.aromas.length - 4}</span>
          )}
        </div>
        <div className="card-stats">
          <div className="card-stat-item">
            <div className="card-stat-label">酸度</div>
            <div className="card-stat-value">{record.acidity}</div>
          </div>
          <div className="card-stat-item">
            <div className="card-stat-label">醇厚</div>
            <div className="card-stat-value">{record.body}</div>
          </div>
          <div className="card-stat-item">
            <div className="card-stat-label">余韵</div>
            <div className="card-stat-value">{record.aftertaste}</div>
          </div>
          <div className="card-overall">
            <div
              className="card-overall-score"
              style={{ color: getScoreColor(record.overall) }}
            >
              {record.overall}
            </div>
            <div className="card-overall-label">整体</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoffeeCard;
