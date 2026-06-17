import React, { useState, useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { Material, Rarity } from '../../types';
import { easeTransition } from './AnimationManager';

const RARITY_COLORS: Record<Rarity, string> = {
  common: '#A0A0A0',
  rare: '#4A90D9',
  epic: '#9B59B6',
  legendary: '#F1C40F',
};

interface MaterialCardProps {
  material: Material;
  count: number;
  onClick: () => void;
}

const MaterialCard: React.FC<MaterialCardProps> = ({ material, count, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>) => {
    if (count <= 0) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('materialId', material.id);
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const cardStyle: React.CSSProperties = {
    position: 'relative',
    width: 80,
    height: 100,
    borderRadius: 8,
    border: `2px solid ${RARITY_COLORS[material.rarity]}`,
    backgroundColor: '#2D2D44',
    boxShadow: isHovered
      ? `0 6px 16px rgba(0,0,0,0.4), 0 0 12px ${RARITY_COLORS[material.rarity]}50`
      : '0 2px 8px rgba(0,0,0,0.3)',
    transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
    opacity: count <= 0 || isDragging ? 0.5 : 1,
    cursor: count > 0 ? 'pointer' : 'not-allowed',
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    ...easeTransition(['transform', 'box-shadow', 'opacity']),
  };

  const emojiStyle: React.CSSProperties = {
    fontSize: 32,
    lineHeight: 1,
  };

  const nameStyle: React.CSSProperties = {
    fontSize: 12,
    color: '#E0E0E0',
    fontWeight: 500,
  };

  const badgeStyle: React.CSSProperties = {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: '50%',
    backgroundColor: '#E74C3C',
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
    ...easeTransition('transform'),
    transform: isHovered ? 'scale(1.1)' : 'scale(1)',
  };

  return (
    <button
      style={cardStyle}
      onClick={count > 0 ? onClick : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      draggable={count > 0}
      disabled={count <= 0}
    >
      <span style={emojiStyle}>{material.emoji}</span>
      <span style={nameStyle}>{material.name}</span>
      <span style={badgeStyle}>{count}</span>
    </button>
  );
};

interface InventoryPanelProps {
  isMobile?: boolean;
}

const InventoryPanel: React.FC<InventoryPanelProps> = ({ isMobile = false }) => {
  const { materials, inventory, addToCrucible } = useGameStore();

  const materialList = useMemo(() => {
    return materials
      .map((m) => {
        const item = inventory.find((i) => i.materialId === m.id);
        return { material: m, count: item?.count || 0 };
      })
      .filter((x) => x.count > 0);
  }, [materials, inventory]);

  if (isMobile) {
    const containerStyle: React.CSSProperties = {
      width: '100%',
      overflowX: 'auto',
      padding: '12px 8px',
      backgroundColor: '#1E1E32',
      borderTop: '1px solid #3A3A5C',
    };

    const scrollContentStyle: React.CSSProperties = {
      display: 'flex',
      gap: 12,
      paddingRight: 8,
      minWidth: 'max-content',
    };

    return (
      <div style={containerStyle}>
        <div style={scrollContentStyle}>
          {materialList.map(({ material, count }) => (
            <MaterialCard
              key={material.id}
              material={material}
              count={count}
              onClick={() => addToCrucible(material.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    padding: 16,
    backgroundColor: '#1E1E32',
    borderRadius: 12,
    minWidth: 380,
    height: 'fit-content',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 600,
    color: '#FFFFFF',
    margin: 0,
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
  };

  const emptyStyle: React.CSSProperties = {
    color: '#888888',
    fontSize: 14,
    textAlign: 'center',
    padding: '24px 0',
  };

  return (
    <div style={containerStyle}>
      <h3 style={titleStyle}>材料仓库</h3>
      {materialList.length === 0 ? (
        <div style={emptyStyle}>暂无材料</div>
      ) : (
        <div style={gridStyle}>
          {materialList.map(({ material, count }) => (
            <MaterialCard
              key={material.id}
              material={material}
              count={count}
              onClick={() => addToCrucible(material.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default InventoryPanel;
