import React from 'react';
import { PetEgg } from '../types';
import { elementColors, elementLabels } from '../data/eggs';
import './PetEggGrid.css';

interface PetEggGridProps {
  eggs: PetEgg[];
  selectedEggId: string | null;
  onSelectEgg: (egg: PetEgg) => void;
}

const PetEggGrid: React.FC<PetEggGridProps> = ({ eggs, selectedEggId, onSelectEgg }) => {
  const renderStars = (rarity: number) => {
    return Array.from({ length: rarity }, (_, i) => (
      <span key={i} className="star">
        ★
      </span>
    ));
  };

  const renderEggSVG = (egg: PetEgg) => {
    const colors = elementColors[egg.element];
    const isSelected = selectedEggId === egg.id;

    return (
      <svg viewBox="0 0 100 130" className="egg-svg">
        <defs>
          <linearGradient id={`egg-grad-${egg.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.from} />
            <stop offset="100%" stopColor={colors.to} />
          </linearGradient>
          <filter id={`glow-${egg.id}`}>
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <ellipse
          cx="50"
          cy="65"
          rx="35"
          ry="50"
          fill={`url(#egg-grad-${egg.id})`}
          filter={isSelected ? `url(#glow-${egg.id})` : undefined}
          className="egg-body"
        />
        <ellipse
          cx="50"
          cy="40"
          rx="20"
          ry="25"
          fill="rgba(255,255,255,0.3)"
          className="egg-highlight"
        />
        <ellipse
          cx="50"
          cy="65"
          rx="35"
          ry="50"
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="2"
          className="egg-border"
        />
      </svg>
    );
  };

  return (
    <div className="pet-egg-grid">
      <h2 className="grid-title">宠物蛋图鉴</h2>
      <div className="egg-grid">
        {eggs.map((egg) => (
          <div
            key={egg.id}
            className={`egg-card ${selectedEggId === egg.id ? 'selected' : ''}`}
            onClick={() => onSelectEgg(egg)}
          >
            <div className="egg-thumbnail">{renderEggSVG(egg)}</div>
            <div className="egg-info">
              <div className="egg-name">{egg.name}</div>
              <div className="egg-element" style={{ color: elementColors[egg.element].from }}>
                {elementLabels[egg.element]}属性
              </div>
              <div className="egg-rarity">{renderStars(egg.rarity)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PetEggGrid;
