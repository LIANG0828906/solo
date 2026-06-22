import { useState, useRef } from 'react';
import type { Dragon } from '../../shared/types';
import { dataService } from './DataService';
import DragonAvatar3D from './DragonAvatar3D';
import './DragonCard.css';

interface DragonCardProps {
  dragon: Dragon;
  isSelected?: boolean;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent, dragon: Dragon) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  showStats?: boolean;
  size?: 'small' | 'medium' | 'large';
  index?: number;
}

export default function DragonCard({
  dragon,
  isSelected = false,
  onClick,
  onDragStart,
  onDragEnd,
  isDragging = false,
  showStats = true,
  size = 'medium',
  index,
}: DragonCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const elementColors = dataService.getElementColors(dragon.element);
  const rarityGradient = dataService.getRarityGradient(dragon.rarity);
  const rarityName = dataService.getRarityName(dragon.rarity);
  const elementName = dataService.getElementName(dragon.element);

  const sizeClasses = {
    small: 'w-24 h-32',
    medium: 'w-36 h-48',
    large: 'w-48 h-64',
  };

  const avatarSizes = {
    small: 60,
    medium: 90,
    large: 120,
  };

  return (
    <div
      ref={cardRef}
      className={`dragon-card ${sizeClasses[size]} ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        background: rarityGradient,
        '--glow-color': elementColors.glow,
        '--primary-color': elementColors.primary,
      } as React.CSSProperties}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      draggable={!!onDragStart}
      onDragStart={(e) => onDragStart?.(e, dragon)}
      onDragEnd={onDragEnd}
    >
      <div className="dragon-card-inner">
        {index !== undefined && (
          <div className="card-index">{index + 1}</div>
        )}

        <div className="card-header">
          <span className="element-badge" style={{ backgroundColor: elementColors.primary }}>
            {elementName}
          </span>
          <span className="rarity-badge">{rarityName}</span>
        </div>

        <div className="avatar-container">
          <div className="avatar-glow" style={{ background: elementColors.glow }} />
          <DragonAvatar3D
            color={dragon.avatarColor}
            element={dragon.element}
            size={avatarSizes[size]}
            autoRotate={isHovered || isSelected}
          />
        </div>

        <div className="card-body">
          <h3 className="dragon-name">{dragon.name}</h3>

          {showStats && size !== 'small' && (
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">生命</span>
                <span className="stat-value">{dragon.baseStats.hp}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">攻击</span>
                <span className="stat-value">{dragon.baseStats.attack}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">防御</span>
                <span className="stat-value">{dragon.baseStats.defense}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">速度</span>
                <span className="stat-value">{dragon.baseStats.speed}</span>
              </div>
            </div>
          )}
        </div>

        {size === 'large' && (
          <div className="skills-list">
            {dragon.skills.map((skill) => (
              <div key={skill.id} className="skill-item">
                <span className="skill-name">{skill.name}</span>
                <span className="skill-damage">倍率: {skill.damageMultiplier}x</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="dragon-card-border" />
    </div>
  );
}
