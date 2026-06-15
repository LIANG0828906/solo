import React, { memo } from 'react';
import { Cell } from './gameLogic';

interface GridProps {
  grid: Cell[][];
  onCellClick: (row: number, col: number) => void;
  onCellRightClick: (row: number, col: number) => void;
  disabled: boolean;
  gameStatus: 'selecting' | 'playing' | 'won' | 'lost';
  skillMode: boolean;
}

const getNumberColor = (num: number): string => {
  switch (num) {
    case 1: return '#4a9eff';
    case 2: return '#4ade80';
    case 3: return '#fb923c';
    default: return '#e0e0e0';
  }
};

const getNumberGlow = (num: number): string => {
  switch (num) {
    case 1: return '0 0 8px rgba(74, 158, 255, 0.6)';
    case 2: return '0 0 8px rgba(74, 222, 128, 0.6)';
    case 3: return '0 0 8px rgba(251, 146, 60, 0.6)';
    default: return 'none';
  }
};

const CellComponent: React.FC<{
  cell: Cell;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  disabled: boolean;
  skillMode: boolean;
}> = memo(({ cell, onClick, onContextMenu, disabled, skillMode }) => {
  const baseClasses = 'cell flex items-center justify-center font-bold select-none transition-all duration-150 relative overflow-visible';

  const getCellClasses = (): string => {
    let classes = baseClasses;

    if (cell.isRevealed) {
      classes += ' cell-revealed';
    } else {
      classes += ' cell-hidden';
      if (!disabled) {
        classes += ' cursor-pointer hover:bg-gray-600';
      }
    }

    if (cell.isBurning) {
      classes += ' cell-burning';
    }

    if (cell.isRippling) {
      classes += ' cell-rippling';
    }

    if (skillMode && !cell.isRevealed && !disabled) {
      classes += ' skill-target';
    }

    return classes;
  };

  const getNumberClass = (num: number): string => {
    if (num === 1) return 'num-1';
    if (num === 2) return 'num-2';
    if (num === 3) return 'num-3';
    return '';
  };

  const renderCellContent = () => {
    if (cell.isRevealed) {
      if (cell.isMine) {
        return <span className="mine-icon">☠️</span>;
      }
      if (cell.adjacentMines > 0) {
        return (
          <span
            className={`cell-number ${getNumberClass(cell.adjacentMines)}`}
          >
            {cell.adjacentMines}
          </span>
        );
      }
      return null;
    }

    if (cell.isMarked) {
      return <span className="flag-icon">🚩</span>;
    }

    return null;
  };

  return (
    <div
      className={getCellClasses()}
      onClick={disabled ? undefined : onClick}
      onContextMenu={disabled ? undefined : onContextMenu}
      style={{
        animationDelay: cell.animationDelay ? `${cell.animationDelay}ms` : '0ms',
      }}
    >
      {cell.isSuspected && !cell.isRevealed && (
        <div className="suspect-border">
          <svg viewBox="0 0 100 100" className="suspect-svg">
            <rect
              x="2"
              y="2"
              width="96"
              height="96"
              fill="none"
              stroke="#ef4444"
              strokeWidth="3"
              strokeDasharray="8 4"
              className="suspect-dash"
            />
          </svg>
        </div>
      )}
      {renderCellContent()}
    </div>
  );
});

CellComponent.displayName = 'CellComponent';

const Grid: React.FC<GridProps> = ({
  grid,
  onCellClick,
  onCellRightClick,
  disabled,
  gameStatus,
  skillMode,
}) => {
  const handleContextMenu = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    onCellRightClick(row, col);
  };

  return (
    <div
      className={`grid-container ${gameStatus === 'lost' ? 'grid-shake' : ''}`}
    >
      {grid.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <CellComponent
            key={cell.id}
            cell={cell}
            onClick={() => onCellClick(rowIndex, colIndex)}
            onContextMenu={(e) => handleContextMenu(e, rowIndex, colIndex)}
            disabled={disabled}
            skillMode={skillMode}
          />
        ))
      )}
    </div>
  );
};

export default memo(Grid);
