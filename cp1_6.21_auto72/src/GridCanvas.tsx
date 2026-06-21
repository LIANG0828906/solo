import React from 'react';
import type { SymmetryType } from './Toolbar';

interface GridCanvasProps {
  grid: (string | null)[][];
  onCellClick: (x: number, y: number) => void;
  symmetry: SymmetryType;
  cellSize: number;
  canvasRef: React.RefObject<HTMLDivElement | null>;
}

const GridCanvas: React.FC<GridCanvasProps> = ({
  grid,
  onCellClick,
  symmetry,
  cellSize,
  canvasRef,
}) => {
  const size = grid.length;
  const totalSize = size * cellSize;

  const containerStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    minWidth: 0,
  };

  const gridContainerStyle: React.CSSProperties = {
    position: 'relative',
    maxWidth: 600,
    maxHeight: 600,
    width: '100%',
    aspectRatio: '1 / 1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const getGridStyle = (): React.CSSProperties => {
    const scaledSize = Math.min(totalSize, 600);
    const scale = scaledSize / totalSize;
    return {
      position: 'relative',
      width: totalSize,
      height: totalSize,
      transform: `scale(${scale})`,
      transformOrigin: 'center center',
      display: 'grid',
      gridTemplateColumns: `repeat(${size}, ${cellSize}px)`,
      gridTemplateRows: `repeat(${size}, ${cellSize}px)`,
      backgroundColor: '#ffffff',
      border: '1px solid #e0e0e0',
    };
  };

  const getCellStyle = (cell: string | null): React.CSSProperties => ({
    width: cellSize,
    height: cellSize,
    backgroundColor: cell || 'transparent',
    border: 'none',
    boxShadow: 'inset -1px -1px 0 #e0e0e0, inset 1px 1px 0 #e0e0e0',
    cursor: 'pointer',
    transition: 'background-color 0.05s',
  });

  const guideLineBaseStyle: React.CSSProperties = {
    position: 'absolute',
    backgroundColor: '#cccccc',
    pointerEvents: 'none',
    opacity: symmetry !== 'none' ? 1 : 0,
    transition: 'opacity 0.3s ease',
    zIndex: 10,
  };

  const horizontalGuideStyle: React.CSSProperties = {
    ...guideLineBaseStyle,
    width: totalSize,
    height: 1,
    top: totalSize / 2,
    left: 0,
  };

  const verticalGuideStyle: React.CSSProperties = {
    ...guideLineBaseStyle,
    height: totalSize,
    width: 1,
    left: totalSize / 2,
    top: 0,
  };

  const showHorizontal = symmetry === 'horizontal' || symmetry === 'center';
  const showVertical = symmetry === 'vertical' || symmetry === 'center';

  return (
    <div style={containerStyle}>
      <div style={gridContainerStyle}>
        <div ref={canvasRef} style={getGridStyle()}>
          {grid.map((row, y) =>
            row.map((cell, x) => (
              <div
                key={`${x}-${y}`}
                style={getCellStyle(cell)}
                onClick={() => onCellClick(x, y)}
                onMouseDown={(e) => {
                  if (e.buttons === 1) {
                    e.preventDefault();
                  }
                }}
              />
            ))
          )}
          {showHorizontal && <div style={{ ...horizontalGuideStyle, opacity: symmetry !== 'none' ? 1 : 0 }} />}
          {showVertical && <div style={{ ...verticalGuideStyle, opacity: symmetry !== 'none' ? 1 : 0 }} />}
        </div>
      </div>
    </div>
  );
};

export default GridCanvas;
