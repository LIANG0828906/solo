import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { FosterFamily } from '../api';

interface Props {
  family: FosterFamily;
}

const FosterCard: React.FC<Props> = ({ family }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/foster/${family.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const fullStars = Math.floor(family.rating);
  const hasHalf = family.rating - fullStars >= 0.5;

  return (
    <div
      className="foster-card"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className="foster-card-header">
        <img
          src={family.avatar}
          alt={family.name}
          className="foster-avatar"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><rect width="60" height="60" fill="%23ddd"/><text x="50%" y="55%" font-size="14" fill="%23999" text-anchor="middle" font-family="sans-serif">头像</text></svg>';
          }}
        />
        <div>
          <div className="foster-name">{family.name}</div>
          {family.verified && (
            <span className="foster-verified">✓ 已认证</span>
          )}
        </div>
      </div>

      <p className="foster-description">{family.description}</p>

      <div className="foster-tags">
        {family.petTypes.map((type) => (
          <span key={type} className="foster-tag">
            {type}
          </span>
        ))}
      </div>

      <div className="foster-rate">
        <div>
          <span className="foster-rate-amount">¥{family.dailyRate}</span>
          <span className="foster-rate-unit"> /天</span>
        </div>
        <div className="foster-rating">
          <span>
            {'★'.repeat(fullStars)}
            {hasHalf ? '☆' : ''}
          </span>
          <span>{family.rating.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
};

export default FosterCard;
