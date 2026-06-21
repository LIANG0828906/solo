import React, { memo, useCallback } from 'react';
import type { BoardState, Player } from './types';

interface GameBoardProps {
  board: BoardState;
  winningCells: Set<string>;
  lastMove: { row: number; col: number; player: Player } | null;
  shrinkingCell: { row: number; col: number } | null;
  disabled: boolean;
  onCellClick: (row: number, col: number) => void;
}

const cellKey = (row: number, col: number): string => `${row}-${col}`;

const GameBoard: React.FC<GameBoardProps> = memo(function GameBoard({
  board,
  winningCells,
  lastMove,
  shrinkingCell,
  disabled,
  onCellClick,
}) {
  const handleClick = useCallback(
    (row: number, col: number) => {
      if (!disabled && !board[row][col]) {
        onCellClick(row, col);
      }
    },
    [board, disabled, onCellClick]
  );

  const isLastMove = (row: number, col: number): boolean => {
    return lastMove !== null && lastMove.row === row && lastMove.col === col;
  };

  const isShrinking = (row: number, col: number): boolean => {
    return shrinkingCell !== null && shrinkingCell.row === row && shrinkingCell.col === col;
  };

  return (
    <div className="board" role="grid" aria-label="3x3游戏棋盘">
      {board.map((row, rowIdx) =>
        row.map((cell, colIdx) => {
          const key = cellKey(rowIdx, colIdx);
          const isWinning = winningCells.has(key);
          const cellDisabled = disabled || cell !== null;
          const shrink = isShrinking(rowIdx, colIdx);
          const last = isLastMove(rowIdx, colIdx);

          let pixelClassName = 'pixel-fill';
          if (cell) {
            pixelClassName += ` ${cell}`;
            if (shrink) {
              pixelClassName += ' shrink';
            } else if (last) {
              pixelClassName += ' place';
              pixelClassName += cell === 'player1' ? ' glow-player1' : ' glow-player2';
            }
          }

          return (
            <div
              key={key}
              role="gridcell"
              className={`cell${isWinning ? ' winning' : ''}${cellDisabled ? ' disabled' : ''}`}
              onClick={() => handleClick(rowIdx, colIdx)}
              aria-label={`格子 行${rowIdx + 1} 列${colIdx + 1}${cell ? ` 已放置${cell === 'player1' ? '玩家1' : '玩家2'}` : ' 空格'}`}
              aria-disabled={cellDisabled}
            >
              {cell && (
                <div className="pixel-block">
                  <div className={pixelClassName} />
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
});

export default GameBoard;
