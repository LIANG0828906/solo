import React from 'react';
import { useTapestryStore, GRID_SIZE } from './store';

const Tapestry: React.FC = () => {
  const { grid, playbackGrid, setCellColor, isPlaying } = useTapestryStore();
  const displayGrid = isPlaying && playbackGrid ? playbackGrid : grid;

  const cellSize = 600 / GRID_SIZE;

  return (
    <div
      style={{
        width: 600,
        height: 600,
        display: 'grid',
        gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
        gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
        border: '2px solid #2D3436',
        backgroundColor: '#2D3436',
        padding: 0,
        boxSizing: 'border-box',
      }}
    >
      {displayGrid.map((color, index) => (
        <div
          key={index}
          onClick={() => setCellColor(index)}
          title={`单元格 ${index + 1}`}
          style={{
            width: cellSize,
            height: cellSize,
            backgroundColor: color,
            cursor: isPlaying ? 'default' : 'pointer',
            transition: 'transform 0.1s ease, opacity 0.1s ease, box-shadow 0.2s ease-out',
            boxSizing: 'border-box',
          }}
          onMouseEnter={(e) => {
            if (!isPlaying) {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.opacity = '0.85';
              e.currentTarget.style.boxShadow = '0 0 8px rgba(255,255,255,0.3)';
              e.currentTarget.style.position = 'relative';
              e.currentTarget.style.zIndex = '1';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.position = 'static';
            e.currentTarget.style.zIndex = '0';
          }}
        />
      ))}
    </div>
  );
};

export default Tapestry;
