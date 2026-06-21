import React from 'react';
import { UnitCard } from './UnitCard';
import type { Unit, Card } from '../types/game';
import { GRID_WIDTH, GRID_HEIGHT } from '../game/GameEngine';
import './Arena.css';

interface ArenaProps {
  units: Unit[];
  selectedCard: Card | null;
  selectedTargetId: string | null;
  onUnitClick: (unit: Unit) => void;
  playerSide: 'player' | 'opponent';
}

export const Arena: React.FC<ArenaProps> = ({
  units,
  selectedCard,
  selectedTargetId,
  onUnitClick,
  playerSide,
}) => {
  const getUnitAt = (x: number, y: number) => {
    return units.find((u) => u.position.x === x && u.position.y === y && u.hp > 0);
  };

  const isTargetable = (unit: Unit) => {
    if (!selectedCard) return false;

    const isEnemy = unit.owner !== playerSide;
    const isFriendly = unit.owner === playerSide;

    switch (selectedCard.type) {
      case 'attack':
        return isEnemy;
      case 'heal':
      case 'shield':
        return isFriendly;
      case 'debuff':
        return isEnemy;
      case 'utility':
        return false;
      default:
        return false;
    }
  };

  const renderGrid = () => {
    const rows = [];
    for (let y = 0; y < GRID_HEIGHT; y++) {
      const cells = [];
      for (let x = 0; x < GRID_WIDTH; x++) {
        const unit = getUnitAt(x, y);
        const isPlayerZone = y >= GRID_HEIGHT - 2;
        const isEnemyZone = y < 2;

        cells.push(
          <div
            key={`${x}-${y}`}
            className={`grid-cell ${isPlayerZone ? 'player-zone' : ''} ${isEnemyZone ? 'enemy-zone' : ''}`}
          >
            {unit && (
              <UnitCard
                unit={unit}
                isSelected={selectedTargetId === unit.id}
                isTargetable={isTargetable(unit)}
                onClick={() => onUnitClick(unit)}
              />
            )}
          </div>,
        );
      }
      rows.push(
        <div key={y} className="grid-row">
          {cells}
        </div>,
      );
    }
    return rows;
  };

  return (
    <div className="arena-container">
      <div className="enemy-label">敌方区域</div>
      <div className="arena-grid">
        {renderGrid()}
      </div>
      <div className="player-label">我方区域</div>
    </div>
  );
};
