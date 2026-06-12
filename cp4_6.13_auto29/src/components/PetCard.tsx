import React from 'react';
import { Pet } from '../types';
import { elementColors, elementLabels } from '../data/eggs';
import './PetCard.css';

interface PetCardProps {
  pet: Pet;
}

const PetCard: React.FC<PetCardProps> = ({ pet }) => {
  const colors = elementColors[pet.element];

  return (
    <div
      className="pet-card"
      style={{
        background: `linear-gradient(135deg, ${colors.from} 0%, ${colors.to} 100%)`,
      }}
    >
      <div className="pet-card-inner">
        <div className="pet-header">
          <h2 className="pet-name">{pet.name}</h2>
          <div className="pet-rarity">
            {Array.from({ length: pet.rarity }, (_, i) => (
              <span key={i} className="star">
                ★
              </span>
            ))}
          </div>
        </div>

        <div className="pet-element-badge">
          {elementLabels[pet.element]}属性
        </div>

        <div className="pet-sprite">
          <svg viewBox="0 0 120 140" className="pet-svg">
            <defs>
              <radialGradient id="pet-body-grad" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
              </radialGradient>
            </defs>
            <ellipse cx="60" cy="75" rx="45" ry="55" fill="url(#pet-body-grad)" />
            <circle cx="60" cy="75" r="50" fill="rgba(255,255,255,0.2)" />
            <ellipse cx="42" cy="65" rx="10" ry="12" fill="#fff" />
            <ellipse cx="78" cy="65" rx="10" ry="12" fill="#fff" />
            <circle cx="44" cy="67" r="5" fill="#333" />
            <circle cx="80" cy="67" r="5" fill="#333" />
            <circle cx="46" cy="65" r="2" fill="#fff" />
            <circle cx="82" cy="65" r="2" fill="#fff" />
            <path
              d="M 50 90 Q 60 100 70 90"
              stroke="#333"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            <ellipse cx="30" cy="85" rx="8" ry="5" fill="rgba(255,107,107,0.5)" />
            <ellipse cx="90" cy="85" rx="8" ry="5" fill="rgba(255,107,107,0.5)" />
          </svg>
        </div>

        <div className="pet-stats">
          <div className="stat-item">
            <span className="stat-label">心情</span>
            <div className="stat-bar">
              <div
                className="stat-fill mood-fill"
                style={{ width: `${pet.mood}%` }}
              />
            </div>
            <span className="stat-value">{pet.mood}%</span>
          </div>
        </div>

        <div className="pet-skill">
          <span className="skill-label">基础技能</span>
          <span className="skill-name">{pet.skill}</span>
        </div>

        <button className="explore-btn" onClick={() => {}}>
          探索
        </button>
      </div>
    </div>
  );
};

export default PetCard;
