import React, { useState } from 'react';
import type { Requirement } from '../api';

interface RequirementCardProps {
  requirement: Requirement;
  onClick: () => void;
  index: number;
}

const RequirementCard: React.FC<RequirementCardProps> = ({
  requirement,
  onClick,
  index,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div
      className="requirement-card"
      onClick={onClick}
      style={{
        animationDelay: `${index * 0.05}s`,
      }}
    >
      <div className="card-image-wrapper">
        {!imageLoaded && <div className="card-image-skeleton" />}
        <img
          src={requirement.pet_avatar}
          alt={requirement.pet_name}
          className={`card-image ${imageLoaded ? 'loaded' : ''}`}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
        />
        <div className="card-budget-tag">
          ¥{requirement.daily_budget.toFixed(0)}/天
        </div>
      </div>
      <div className="card-content">
        <div className="card-header">
          <h3 className="card-title">{requirement.pet_name}</h3>
          <span className="card-breed-tag">{requirement.pet_breed}</span>
        </div>
        <div className="card-dates">
          {formatDate(requirement.start_date)} - {formatDate(requirement.end_date)}
        </div>
        <div className="card-personality">
          {requirement.pet_personality.slice(0, 3).map((trait) => (
            <span key={trait} className="personality-tag">
              {trait}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RequirementCard;
