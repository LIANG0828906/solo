import { memo } from 'react';
import { useGame } from '../context/GameContext';
import { Cell as CellType, PLANET_ICONS, SHIP_ICONS } from '../types/game';
import './GameBoard.css';

const Cell = memo(function Cell({
  cell,
  isSelected,
  isValidMove,
  isValidAttack,
  isAnimating,
  onClick,
}: {
  cell: CellType;
  isSelected: boolean;
  isValidMove: boolean;
  isValidAttack: boolean;
  isAnimating: boolean;
  onClick: () => void;
}) {
  const planetIcon = cell.planet ? PLANET_ICONS[cell.planet] : null;
  const playerShips = cell.ships;

  const getPlanetColor = () => {
    if (!cell.planet) return '';
    switch (cell.planet) {
      case 'neutral':
        return 'opacity-60';
      case 'friendly1':
        return 'text-blue-400';
      case 'friendly2':
        return 'text-red-400';
      case 'enemy1':
        return 'text-red-500';
      case 'enemy2':
        return 'text-blue-500';
      default:
        return '';
    }
  };

  return (
    <div
      className={`
        game-cell relative flex flex-col items-center justify-center
        transition-all duration-200 cursor-pointer
        ${isSelected ? 'selected' : ''}
        ${isValidMove ? 'valid-move' : ''}
        ${isValidAttack ? 'valid-attack' : ''}
        ${isAnimating ? 'attacking' : ''}
        ${cell.isBase ? 'base' : ''}
      `}
      onClick={onClick}
    >
      {planetIcon && (
        <span className={`text-2xl ${getPlanetColor()}`}>{planetIcon}</span>
      )}

      {playerShips.length > 0 && (
        <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-0.5">
          {playerShips.slice(0, 3).map((ship, idx) => (
            <div
              key={ship.id}
              className={`
                text-lg transition-all duration-200
                ${ship.player === 1 ? 'player1-ship' : 'player2-ship'}
                ${ship.hasMoved && ship.hasAttacked ? 'opacity-50' : ''}
              `}
              style={{ transform: `translateY(${idx * -2}px)` }}
            >
              {SHIP_ICONS[ship.type]}
            </div>
          ))}
          {playerShips.length > 3 && (
            <span className="text-xs text-white">+{playerShips.length - 3}</span>
          )}
        </div>
      )}

      {isSelected && <div className="selection-ring" />}

      {cell.isBase && (
        <div className="absolute top-0.5 right-0.5 text-xs font-bold text-yellow-400">
          基地
        </div>
      )}
    </div>
  );
});

const GameBoard = memo(function GameBoard() {
  const { state, selectCell } = useGame();

  if (!state) {
    return <div className="text-white text-center">加载中...</div>;
  }

  const { board, selectedCell, validMoves, validAttacks, animatingCell } = state;

  const isValidMove = (x: number, y: number) =>
    validMoves.some(m => m.x === x && m.y === y);

  const isValidAttack = (x: number, y: number) =>
    validAttacks.some(a => a.x === x && a.y === y);

  const isSelected = (x: number, y: number) =>
    selectedCell?.x === x && selectedCell?.y === y;

  const isAnimating = (x: number, y: number) =>
    animatingCell?.x === x && animatingCell?.y === y;

  return (
    <div className="game-board-container">
      <div className="game-board">
        {board.map((row, y) =>
          row.map((cell, x) => (
            <Cell
              key={`${x}-${y}`}
              cell={cell}
              isSelected={isSelected(x, y)}
              isValidMove={isValidMove(x, y)}
              isValidAttack={isValidAttack(x, y)}
              isAnimating={isAnimating(x, y)}
              onClick={() => selectCell(x, y)}
            />
          ))
        )}

        {selectedCell && validMoves.length > 0 && (
          <svg className="move-lines" viewBox="0 0 280 280">
            {validMoves.map((move, idx) => (
              <line
                key={idx}
                x1={selectedCell.x * 70 + 35}
                y1={selectedCell.y * 70 + 35}
                x2={move.x * 70 + 35}
                y2={move.y * 70 + 35}
                className="move-line"
              />
            ))}
          </svg>
        )}
      </div>
    </div>
  );
});

export default GameBoard;
