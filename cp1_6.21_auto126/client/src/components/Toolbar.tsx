import React from 'react';
import { BlockType } from '../types';
import { TOOLBAR_BLOCKS, BLOCK_CONFIGS } from '../utils/blockTypes';

interface ToolbarProps {
  selectedBlock: BlockType;
  onSelectBlock: (type: BlockType) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ selectedBlock, onSelectBlock }) => {
  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '480px',
      maxWidth: '90%',
      height: '72px',
      borderRadius: '12px',
      background: 'rgba(30, 41, 59, 0.9)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      padding: '0 20px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      zIndex: 100
    }}>
      {TOOLBAR_BLOCKS.map((type) => {
        const config = BLOCK_CONFIGS[type];
        const isSelected = selectedBlock === type;
        return (
          <div
            key={type}
            onClick={() => onSelectBlock(type)}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '8px',
              background: config.color,
              opacity: config.opacity,
              cursor: 'pointer',
              border: isSelected ? '3px solid #FFEB3B' : '2px solid rgba(255, 255, 255, 0.1)',
              transition: 'all 0.2s ease',
              transform: 'translateY(0)',
              boxShadow: isSelected ? '0 0 16px rgba(255, 235, 59, 0.5)' : 'none',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {isSelected && (
              <div style={{
                position: 'absolute',
                bottom: '-24px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '12px',
                color: '#FFEB3B',
                whiteSpace: 'nowrap',
                fontWeight: 500
              }}>
                {config.name}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
