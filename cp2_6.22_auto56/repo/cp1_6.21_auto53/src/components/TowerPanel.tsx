import { memo } from 'react';
import { TOWER_CONFIGS } from '../towerManager';
import type { TowerType } from '../types';

interface TowerPanelProps {
  position: { x: number; y: number };
  onSelect: (type: TowerType) => void;
  onClose: () => void;
  selectedType: TowerType | null;
  cellSize: number;
}

const TowerPanel = memo(function TowerPanel({
  position,
  onSelect,
  onClose,
  selectedType,
  cellSize,
}: TowerPanelProps) {
  const centerX = position.x * cellSize + cellSize / 2;
  const centerY = position.y * cellSize;

  const towerTypes: TowerType[] = ['arrow', 'cannon', 'magic'];
  const towerIcons: Record<TowerType, string> = {
    arrow: '🏹',
    cannon: '💣',
    magic: '✨',
  };

  const handleSelect = (type: TowerType, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(type);
  };

  return (
    <div
      className="tower-panel"
      style={{
        left: centerX,
        top: centerY,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {towerTypes.map((type) => (
        <button
          key={type}
          className={`tower-option ${selectedType === type ? 'selected' : ''}`}
          style={{ backgroundColor: TOWER_CONFIGS[type].color }}
          onClick={(e) => handleSelect(type, e)}
          title={TOWER_CONFIGS[type].name}
          onMouseDown={(e) => e.preventDefault()}
        >
          {towerIcons[type]}
        </button>
      ))}
      <button
        className="tower-option"
        style={{ backgroundColor: '#D94A4A' }}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        onMouseDown={(e) => e.preventDefault()}
        title="取消"
      >
        ✕
      </button>
    </div>
  );
});

export default TowerPanel;
