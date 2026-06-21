import { memo } from 'react';
import { TOWER_CONFIGS } from '../towerManager';
import type { Tower as TowerType } from '../types';

interface TowerProps {
  tower: TowerType;
  cellSize: number;
  onRemove: (towerId: string) => void;
}

const Tower = memo(function Tower({ tower, cellSize, onRemove }: TowerProps) {
  const config = TOWER_CONFIGS[tower.type];
  const centerX = tower.position.x * cellSize + cellSize / 2;
  const centerY = tower.position.y * cellSize + cellSize / 2;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove(tower.id);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="tower"
      style={{
        left: centerX,
        top: centerY,
      }}
      onContextMenu={handleContextMenu}
      onClick={handleClick}
      title={`${config.name} - 右键移除`}
    >
      <div
        className="tower-body"
        style={{ backgroundColor: config.color }}
      />
      <div className="tower-indicator" />
    </div>
  );
});

export default Tower;
