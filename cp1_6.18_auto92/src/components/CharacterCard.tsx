import React, { useRef, useState } from 'react';
import { Character, FACTION_COLORS, FACTION_LABELS } from '../types';
import { useCharacterStore } from '../stores/characterStore';

interface CharacterCardProps {
  character: Character;
  isSelected?: boolean;
  onClick?: () => void;
  showDetails?: boolean;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  isSelected = false,
  onClick,
  showDetails = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const selectCharacter = useCharacterStore((s) => s.selectCharacter);
  const transferInventoryItem = useCharacterStore((s) => s.transferInventoryItem);
  const selectedCharacterId = useCharacterStore((s) => s.selectedCharacterId);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      selectCharacter(character.id);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('inventory-item')) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const itemId = e.dataTransfer.getData('inventory-item');
    const fromId = e.dataTransfer.getData('from-character');
    if (itemId && fromId && fromId !== character.id) {
      const success = transferInventoryItem(fromId, character.id, itemId);
      if (success) {
        setDraggedItem(itemId);
        setTimeout(() => setDraggedItem(null), 300);
      }
    }
  };

  return (
    <div
      ref={cardRef}
      className={`character-card ${isSelected ? 'selected' : ''} ${isDragOver ? 'drag-over' : ''}`}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-character-id={character.id}
    >
      <div className="card-avatar">
        {character.avatar ? (
          <img src={character.avatar} alt={character.name} />
        ) : (
          <div
            className="avatar-placeholder"
            style={{ backgroundColor: FACTION_COLORS[character.faction] }}
          >
            {character.name.charAt(0)}
          </div>
        )}
        <div
          className="faction-dot"
          style={{ backgroundColor: FACTION_COLORS[character.faction] }}
          title={FACTION_LABELS[character.faction]}
        />
      </div>
      <div className="card-info">
        <div className="card-name">{character.name}</div>
        {showDetails ? (
          <div className="card-details">
            <span className="card-age">{character.age}岁</span>
            <span className="card-faction">{FACTION_LABELS[character.faction]}</span>
          </div>
        ) : (
          <div className="card-tags">
            {character.personality.slice(0, 2).map((tag) => (
              <span key={tag} className="card-tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      {draggedItem && <div className="particle-explosion" />}
    </div>
  );
};

export default CharacterCard;
