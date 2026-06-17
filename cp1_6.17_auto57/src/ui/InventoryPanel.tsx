import React, { useState } from 'react';
import { Item } from '../types';
import { RARITY_COLORS, DIMENSIONS, COLORS } from '../utils/constants';

interface InventoryPanelProps {
  items: Item[];
}

const InventoryPanel: React.FC<InventoryPanelProps> = ({ items }) => {
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);

  const totalCells = DIMENSIONS.INVENTORY_ROWS * DIMENSIONS.INVENTORY_COLS;
  const cells = Array.from({ length: totalCells }, (_, i) => items[i] || null);

  const getRarityColor = (rarity: string): string => {
    return RARITY_COLORS[rarity] || RARITY_COLORS.common;
  };

  return (
    <div
      style={{
        backgroundColor: COLORS.INVENTORY_BG,
        borderRadius: '8px',
        padding: '12px',
        width: DIMENSIONS.INVENTORY_PANEL_WIDTH,
      }}
    >
      <div
        style={{
          color: COLORS.TEXT,
          fontSize: '14px',
          marginBottom: '8px',
          textAlign: 'center',
          fontFamily: 'inherit',
        }}
      >
        背包
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${DIMENSIONS.INVENTORY_COLS}, 1fr)`,
          gridTemplateRows: `repeat(${DIMENSIONS.INVENTORY_ROWS}, 1fr)`,
          gap: `${DIMENSIONS.GRID_GAP}px`,
        }}
      >
        {cells.map((item, index) => (
          <div
            key={index}
            style={{
              position: 'relative',
              aspectRatio: '1',
              border: `2px solid ${COLORS.GRID_BORDER}`,
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: item ? 'pointer' : 'default',
              transition: 'transform 0.15s ease',
              transform: hoveredCell === index ? 'scale(1.1)' : 'scale(1)',
              zIndex: hoveredCell === index ? 10 : 1,
              backgroundColor: item ? '#1E293B' : 'transparent',
              boxShadow: item ? `inset 0 0 0 1px ${getRarityColor(item.rarity)}` : 'none',
            }}
            onMouseEnter={() => item && setHoveredCell(index)}
            onMouseLeave={() => setHoveredCell(null)}
          >
            {item ? (
              <>
                <span
                  style={{
                    fontSize: '20px',
                    userSelect: 'none',
                  }}
                >
                  {item.icon}
                </span>
                {hoveredCell === index && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '110%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: '#FFFFFF',
                      color: '#000000',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      boxShadow: '0 4px 12px #00000040',
                      minWidth: '140px',
                      zIndex: 100,
                      pointerEvents: 'none',
                      fontSize: '11px',
                      lineHeight: '1.5',
                      fontFamily: 'inherit',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 'bold',
                        marginBottom: '4px',
                        color: getRarityColor(item.rarity),
                        fontSize: '12px',
                      }}
                    >
                      {item.name}
                    </div>
                    <div style={{ marginBottom: '4px', color: '#4B5563' }}>
                      {item.description}
                    </div>
                    {Object.entries(item.stats).map(([key, value]) => (
                      <div key={key} style={{ color: '#1F2937' }}>
                        {key === 'attack' && '攻击力'}
                        {key === 'defense' && '防御力'}
                        {key === 'health' && '生命值'}
                        : +{value}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div
                style={{
                  color: COLORS.GRID_BORDER,
                  fontSize: '10px',
                  opacity: 0.5,
                }}
              >
                ·
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InventoryPanel;
