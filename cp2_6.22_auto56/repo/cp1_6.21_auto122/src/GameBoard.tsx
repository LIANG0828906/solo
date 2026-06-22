import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  Cell,
  ElementType,
  BOARD_SIZE,
  validatePath,
  getEliminationCells,
  eliminateCells,
  applyGravity,
  fillEmptyCells,
  calculateScore,
  calculateEnergy,
  MAX_ENERGY,
  isEmptyCell,
} from './GameEngine';

const CELL_SIZE = 60;
const CELL_GAP = 2;
const BOARD_PADDING = 8;

interface GameBoardProps {
  board: Cell[][];
  onScoreAdd: (points: number) => void;
  onEnergyAdd: (energy: number) => void;
  onBoardUpdate: (newBoard: Cell[][]) => void;
  onLevelUp: () => void;
  isPaused: boolean;
  level: number;
  energy: number;
  isLevelingUp: boolean;
}

interface PathState {
  cells: Cell[];
  isValid: boolean;
}

const ElementIcon: React.FC<{ element: ElementType; size?: number }> = ({ element, size = 30 }) => {
  const half = size / 2;

  switch (element) {
    case 'fire':
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <polygon
            points={`${half},2 ${size - 2},${size - 2} 2,${size - 2}`}
            fill="#EF4444"
            stroke="#DC2626"
            strokeWidth="1"
          />
          <polygon
            points={`${half},${size * 0.35} ${size * 0.7},${size - 4} ${size * 0.3},${size - 4}`}
            fill="#FCA5A5"
            opacity="0.6"
          />
        </svg>
      );
    case 'water':
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <path
            d={`M2,${half * 0.8} Q${half * 0.5},${half * 0.3} ${half},${half * 0.8} T${size - 2},${half * 0.8}`}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d={`M2,${half * 1.3} Q${half * 0.5},${half * 0.8} ${half},${half * 1.3} T${size - 2},${half * 1.3}`}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d={`M2,${half * 1.8} Q${half * 0.5},${half * 1.3} ${half},${half * 1.8} T${size - 2},${half * 1.8}`}
            fill="none"
            stroke="#60A5FA"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'wind':
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <path
            d={`M${half},${half} 
               m-${half * 0.7},0 
               a${half * 0.7},${half * 0.7} 0 1,1 ${half * 1.4},0 
               a${half * 0.5},${half * 0.5} 0 1,1 -${half * 1.0},0 
               a${half * 0.3},${half * 0.3} 0 1,1 ${half * 0.6},0`}
            fill="none"
            stroke="#22C55E"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'earth':
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <polygon
            points={`${half},2 ${size - 2},${half} ${half},${size - 2} 2,${half}`}
            fill="#F59E0B"
            stroke="#D97706"
            strokeWidth="1"
          />
          <polygon
            points={`${half},${size * 0.25} ${size * 0.75},${half} ${half},${size * 0.75} ${size * 0.25},${half}`}
            fill="#FCD34D"
            opacity="0.5"
          />
        </svg>
      );
    case 'moon':
      return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#E5E7EB" />
              <stop offset="100%" stopColor="#9CA3AF" />
            </radialGradient>
          </defs>
          <circle cx={half} cy={half} r={half * 0.75} fill="url(#moonGlow)" />
          <circle cx={half * 0.8} cy={half * 0.7} r={half * 0.15} fill="#9CA3AF" opacity="0.5" />
          <circle cx={half * 1.3} cy={half * 1.2} r={half * 0.1} fill="#9CA3AF" opacity="0.4" />
          <circle cx={half * 0.9} cy={half * 1.4} r={half * 0.08} fill="#9CA3AF" opacity="0.3" />
        </svg>
      );
    default:
      return null;
  }
};

const CellComponent: React.FC<{
  cell: Cell;
  isSelected: boolean;
  isEliminating: boolean;
  isAppearing: boolean;
  appearDelay: number;
  onMouseDown: () => void;
  onMouseEnter: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
}> = ({ cell, isSelected, isEliminating, isAppearing, appearDelay, onMouseDown, onMouseEnter, onTouchStart }) => {
  if (isEmptyCell(cell)) {
    return <div className="board-cell empty" />;
  }

  const cellClasses = [
    'board-cell',
    isSelected ? 'selected' : '',
    isEliminating ? 'eliminating' : '',
    isAppearing ? 'appearing' : '',
  ].filter(Boolean).join(' ');

  const style = isAppearing
    ? { animationDelay: `${appearDelay}ms` }
    : {};

  return (
    <div
      className={cellClasses}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onTouchStart={onTouchStart}
      style={style}
      data-row={cell.row}
      data-col={cell.col}
    >
      <div className="cell-element">
        <ElementIcon element={cell.element} size={30} />
      </div>
    </div>
  );
};

export const GameBoard: React.FC<GameBoardProps> = ({
  board,
  onScoreAdd,
  onEnergyAdd,
  onBoardUpdate,
  onLevelUp,
  isPaused,
  level,
  energy,
  isLevelingUp,
}) => {
  const [path, setPath] = useState<PathState>({ cells: [], isValid: false });
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [eliminatingCells, setEliminatingCells] = useState<Set<string>>(new Set());
  const [appearingCells, setAppearingCells] = useState<Map<string, number>>(new Map());
  const boardRef = useRef<HTMLDivElement>(null);
  const lastCellRef = useRef<Cell | null>(null);
  const pathRef = useRef<PathState>(path);
  const isDraggingRef = useRef(isDragging);

  useEffect(() => {
    pathRef.current = path;
  }, [path]);

  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  const getCellFromEvent = useCallback((clientX: number, clientY: number): Cell | null => {
    if (!boardRef.current) return null;

    const rect = boardRef.current.getBoundingClientRect();
    const x = clientX - rect.left - BOARD_PADDING;
    const y = clientY - rect.top - BOARD_PADDING;

    const cellTotal = CELL_SIZE + CELL_GAP;
    const col = Math.floor(x / cellTotal);
    const row = Math.floor(y / cellTotal);

    if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
      return board[row][col];
    }
    return null;
  }, [board]);

  const handleMouseDown = useCallback((cell: Cell) => {
    if (isPaused || isAnimating || isLevelingUp) return;
    if (isEmptyCell(cell)) return;

    setIsDragging(true);
    setPath({ cells: [cell], isValid: false });
    lastCellRef.current = cell;
  }, [isPaused, isAnimating, isLevelingUp]);

  const handleMouseEnter = useCallback((cell: Cell) => {
    if (!isDraggingRef.current || isPaused || isAnimating || isLevelingUp) return;
    if (isEmptyCell(cell)) return;

    setPath(prev => {
      const lastCell = prev.cells[prev.cells.length - 1];
      if (!lastCell) return prev;

      const existingIndex = prev.cells.findIndex(c => c.id === cell.id);
      if (existingIndex !== -1) {
        if (existingIndex === prev.cells.length - 2) {
          return {
            ...prev,
            cells: prev.cells.slice(0, -1),
          };
        }
        return prev;
      }

      const newPath = [...prev.cells, cell];
      const isValid = validatePath(newPath);

      return {
        cells: isValid ? newPath : prev.cells,
        isValid,
      };
    });
  }, [isPaused, isAnimating, isLevelingUp]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current) return;

    const cell = getCellFromEvent(e.clientX, e.clientY);
    if (cell && cell.id !== lastCellRef.current?.id) {
      handleMouseEnter(cell);
      lastCellRef.current = cell;
    }
  }, [getCellFromEvent, handleMouseEnter]);

  const handleMouseUp = useCallback(() => {
    if (!isDraggingRef.current) return;
    setIsDragging(false);

    const currentPath = pathRef.current;
    if (currentPath.isValid && currentPath.cells.length >= 3) {
      executeElimination(currentPath.cells);
    }

    setPath({ cells: [], isValid: false });
    lastCellRef.current = null;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent, cell: Cell) => {
    e.preventDefault();
    handleMouseDown(cell);
  }, [handleMouseDown]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();

    const touch = e.touches[0];
    const cell = getCellFromEvent(touch.clientX, touch.clientY);
    if (cell && cell.id !== lastCellRef.current?.id) {
      handleMouseEnter(cell);
      lastCellRef.current = cell;
    }
  }, [getCellFromEvent, handleMouseEnter]);

  const handleTouchEnd = useCallback(() => {
    handleMouseUp();
  }, [handleMouseUp]);

  const executeElimination = useCallback((pathCells: Cell[]) => {
    if (isAnimating) return;
    setIsAnimating(true);

    const cellsToEliminate = getEliminationCells(pathCells, board);

    for (let i = 0; i < cellsToEliminate.length; i++) {
      const cell = cellsToEliminate[i];
      setTimeout(() => {
        setEliminatingCells(prev => {
          const next = new Set(prev);
          next.add(cell.id);
          return next;
        });
      }, i * 150);
    }

    const eliminationDelay = cellsToEliminate.length * 150 + 200;

    setTimeout(() => {
      const eliminatedBoard = eliminateCells(board, cellsToEliminate);
      const { newBoard: gravityBoard, fallDistances } = applyGravity(eliminatedBoard);
      const { newBoard: filledBoard, newCells: newlyCreated } = fillEmptyCells(gravityBoard, level);

      const appearDelays = new Map<string, number>();
      fallDistances.forEach((distance, id) => {
        appearDelays.set(id, distance * 30);
      });
      newlyCreated.forEach(cell => {
        const delay = (cell.row + 1) * 30;
        appearDelays.set(cell.id, delay);
      });

      setEliminatingCells(new Set());
      setAppearingCells(appearDelays);
      onBoardUpdate(filledBoard);

      const scoreGain = calculateScore(cellsToEliminate.length, 1);
      const energyGain = calculateEnergy(cellsToEliminate.length);

      onScoreAdd(scoreGain);
      onEnergyAdd(energyGain);

      setTimeout(() => {
        setAppearingCells(new Map());
        setIsAnimating(false);

        if (energy + energyGain >= MAX_ENERGY) {
          onLevelUp();
        }
      }, 500);
    }, eliminationDelay);
  }, [board, isAnimating, level, energy, onScoreAdd, onEnergyAdd, onBoardUpdate, onLevelUp]);

  useEffect(() => {
    const moveHandler = (e: MouseEvent) => handleMouseMove(e);
    const upHandler = () => handleMouseUp();
    const touchMoveHandler = (e: TouchEvent) => handleTouchMove(e);
    const touchEndHandler = () => handleTouchEnd();

    window.addEventListener('mousemove', moveHandler);
    window.addEventListener('mouseup', upHandler);
    window.addEventListener('touchmove', touchMoveHandler, { passive: false });
    window.addEventListener('touchend', touchEndHandler);

    return () => {
      window.removeEventListener('mousemove', moveHandler);
      window.removeEventListener('mouseup', upHandler);
      window.removeEventListener('touchmove', touchMoveHandler);
      window.removeEventListener('touchend', touchEndHandler);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  const boardWidth = BOARD_SIZE * CELL_SIZE + (BOARD_SIZE - 1) * CELL_GAP + BOARD_PADDING * 2;

  const renderPathLine = () => {
    if (path.cells.length < 2) return null;

    const points = path.cells.map(cell => {
      const x = BOARD_PADDING + cell.col * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
      const y = BOARD_PADDING + cell.row * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
      return `${x},${y}`;
    }).join(' ');

    const pathColor = path.isValid ? '#6366F1' : '#64748B';

    return (
      <svg
        className="path-svg"
        width={boardWidth}
        height={boardWidth}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      >
        <polyline
          points={points}
          fill="none"
          stroke={pathColor}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.8"
        />
        {path.cells.map((cell, i) => {
          const x = BOARD_PADDING + cell.col * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
          const y = BOARD_PADDING + cell.row * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
          return (
            <circle
              key={cell.id}
              cx={x}
              cy={y}
              r="6"
              fill={path.isValid ? '#818CF8' : '#94A3B8'}
              opacity={i / path.cells.length * 0.5 + 0.5}
            />
          );
        })}
      </svg>
    );
  };

  return (
    <div
      className={`game-board ${isLevelingUp ? 'level-up-flash' : ''}`}
      ref={boardRef}
      style={{
        width: boardWidth,
        height: boardWidth,
      }}
    >
      {board.map((row, rowIndex) => (
        <div key={rowIndex} className="board-row">
          {row.map((cell) => (
            <CellComponent
              key={cell.id}
              cell={cell}
              isSelected={path.cells.some(c => c.id === cell.id)}
              isEliminating={eliminatingCells.has(cell.id)}
              isAppearing={appearingCells.has(cell.id)}
              appearDelay={appearingCells.get(cell.id) || 0}
              onMouseDown={() => handleMouseDown(cell)}
              onMouseEnter={() => handleMouseEnter(cell)}
              onTouchStart={(e) => handleTouchStart(e, cell)}
            />
          ))}
        </div>
      ))}
      {renderPathLine()}
    </div>
  );
};
