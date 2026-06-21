import { useState, useCallback } from 'react';
import type { Cell, Piece, PlayerId, TerrainType } from '../game/types';
import './GameBoard.css';

interface GameBoardProps {
  board: Cell[][];
  pieces: Piece[];
  currentPlayerId: PlayerId;
  yourPlayerId: PlayerId;
  selectedPieceId: string | null;
  onSelectPiece: (pieceId: string | null) => void;
  onMove: (pieceId: string, targetX: number, targetY: number) => void;
  isYourTurn: boolean;
}

const terrainLabels: Record<TerrainType, string> = {
  normal: '普通格',
  trap: '陷阱格 (-1分)',
  speed: '加速格 (+2分)',
};

export function GameBoard({
  board,
  pieces,
  currentPlayerId,
  yourPlayerId,
  selectedPieceId,
  onSelectPiece,
  onMove,
  isYourTurn,
}: GameBoardProps) {
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);

  const getPieceAt = useCallback(
    (x: number, y: number): Piece | undefined => {
      return pieces.find((p) => p.x === x && p.y === y);
    },
    [pieces],
  );

  const isValidMoveTarget = useCallback(
    (x: number, y: number): boolean => {
      if (!selectedPieceId || !isYourTurn) return false;
      const selectedPiece = pieces.find((p) => p.id === selectedPieceId);
      if (!selectedPiece) return false;
      if (selectedPiece.playerId !== yourPlayerId) return false;
      if (selectedPiece.playerId !== currentPlayerId) return false;

      const dx = Math.abs(x - selectedPiece.x);
      const dy = Math.abs(y - selectedPiece.y);
      return dx + dy === 1;
    },
    [selectedPieceId, pieces, yourPlayerId, currentPlayerId, isYourTurn],
  );

  const handleCellClick = (x: number, y: number) => {
    if (!isYourTurn) return;

    const piece = getPieceAt(x, y);

    if (piece && piece.playerId === yourPlayerId && piece.playerId === currentPlayerId) {
      onSelectPiece(selectedPieceId === piece.id ? null : piece.id);
      return;
    }

    if (selectedPieceId && isValidMoveTarget(x, y)) {
      onMove(selectedPieceId, x, y);
      onSelectPiece(null);
    }
  };

  const getCellClass = (cell: Cell) => {
    const classes = ['board-cell'];
    classes.push(`terrain-${cell.terrain}`);

    if (cell.owner) {
      classes.push(`owner-${cell.owner}`);
    }

    if (hoveredCell?.x === cell.x && hoveredCell?.y === cell.y) {
      classes.push('cell-hovered');
    }

    if (isValidMoveTarget(cell.x, cell.y)) {
      classes.push('valid-move');
    }

    return classes.join(' ');
  };

  if (board.length === 0) {
    return <div className="board-loading">加载中...</div>;
  }

  return (
    <div className="game-board-container">
      <div className="game-board">
        {board.map((row, y) =>
          row.map((cell, x) => {
            const piece = getPieceAt(x, y);
            const isSelected = piece && piece.id === selectedPieceId;
            const isYourPiece = piece && piece.playerId === yourPlayerId;
            const canSelect = isYourPiece && isYourTurn && piece.playerId === currentPlayerId;

            return (
              <div
                key={`${x}-${y}`}
                className={getCellClass(cell)}
                onClick={() => handleCellClick(x, y)}
                onMouseEnter={() => setHoveredCell({ x, y })}
                onMouseLeave={() => setHoveredCell(null)}
              >
                {cell.terrain === 'speed' && <div className="speed-glow" />}
                {cell.terrain === 'trap' && <div className="trap-pattern" />}

                {piece && (
                  <div
                    className={`piece piece-${piece.playerId} ${isSelected ? 'piece-selected' : ''} ${canSelect ? 'piece-selectable' : ''}`}
                  >
                    {isSelected && <div className="piece-glow" />}
                  </div>
                )}

                {hoveredCell?.x === x && hoveredCell?.y === y && (
                  <div className="cell-tooltip">
                    <span className="coord">
                      ({x}, {y})
                    </span>
                    <span className="terrain-label">{terrainLabels[cell.terrain]}</span>
                    {cell.owner && <span className="owner-label">已占领</span>}
                  </div>
                )}
              </div>
            );
          }),
        )}
      </div>
      <div className="board-coords">
        <span className="coord-hint">点击己方棋子选中，再点击相邻格子移动</span>
      </div>
    </div>
  );
}
