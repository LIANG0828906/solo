import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { StoneColor, Position, Move, RippleEffect, BlinkingStone } from '@/types';
import { BOARD_SIZE, getStarPoints } from '@/utils/gameLogic';

interface GoBoardProps {
  board: StoneColor[][];
  moveHistory: Move[];
  currentMoveIndex?: number;
  onPlace?: (pos: Position) => void;
  interactive?: boolean;
  scale?: number;
  showMoveNumbers?: boolean;
  blinkingStones?: BlinkingStone[];
  onRippleComplete?: (id: string) => void;
}

const CELL_SIZE = 28;
const STONE_SIZE = 26;
const BOARD_PADDING = 30;

export const GoBoard: React.FC<GoBoardProps> = ({
  board,
  moveHistory,
  currentMoveIndex = -1,
  onPlace,
  interactive = true,
  scale = 1,
  showMoveNumbers = true,
  blinkingStones = [],
  onRippleComplete,
}) => {
  const [ripples, setRipples] = useState<RippleEffect[]>([]);
  const boardRef = useRef<HTMLDivElement>(null);

  const boardPixelSize = (BOARD_SIZE - 1) * CELL_SIZE * scale;
  const totalSize = boardPixelSize + BOARD_PADDING * 2;

  const starPoints = useMemo(() => getStarPoints(), []);

  const visibleMoves = useMemo(() => {
    const endIndex = currentMoveIndex >= 0 ? currentMoveIndex : moveHistory.length - 1;
    return moveHistory.slice(0, endIndex + 1);
  }, [moveHistory, currentMoveIndex]);

  const lastMove = visibleMoves[visibleMoves.length - 1];

  const addRipple = useCallback((x: number, y: number, color: StoneColor) => {
    const id = uuidv4();
    setRipples(prev => [...prev, { id, x, y, color }]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
      onRippleComplete?.(id);
    }, 600);
  }, [onRippleComplete]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !onPlace) return;

    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left - BOARD_PADDING;
    const clickY = e.clientY - rect.top - BOARD_PADDING;

    const gridX = Math.round(clickX / (CELL_SIZE * scale));
    const gridY = Math.round(clickY / (CELL_SIZE * scale));

    if (gridX >= 0 && gridX < BOARD_SIZE && gridY >= 0 && gridY < BOARD_SIZE) {
      onPlace({ x: gridX, y: gridY });
    }
  }, [interactive, onPlace, scale]);

  useEffect(() => {
    if (lastMove && interactive) {
      setTimeout(() => {
        addRipple(lastMove.position.x, lastMove.position.y, lastMove.color);
      }, 50);
    }
  }, [lastMove?.moveNumber, interactive, addRipple]);

  const getStonePosition = (x: number, y: number) => ({
    left: `${BOARD_PADDING + x * CELL_SIZE * scale}px`,
    top: `${BOARD_PADDING + y * CELL_SIZE * scale}px`,
  });

  const colLabels = 'ABCDEFGHJKLMNOPQRST'.split('');
  const rowLabels = Array.from({ length: BOARD_SIZE }, (_, i) => BOARD_SIZE - i);

  const isBlinking = (x: number, y: number) =>
    blinkingStones.some(s => s.position.x === x && s.position.y === y);

  return (
    <div
      className="go-board-container"
      style={{ width: totalSize, height: totalSize }}
    >
      <div
        ref={boardRef}
        className="go-board"
        style={{
          width: boardPixelSize,
          height: boardPixelSize,
          cursor: interactive ? 'crosshair' : 'default',
        }}
        onClick={handleClick}
      >
        <svg
          width={boardPixelSize}
          height={boardPixelSize}
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        >
          {Array.from({ length: BOARD_SIZE }).map((_, i) => (
            <React.Fragment key={i}>
              <line
                x1={i * CELL_SIZE * scale}
                y1={0}
                x2={i * CELL_SIZE * scale}
                y2={boardPixelSize}
                stroke="#c9a86a"
                strokeWidth="1"
              />
              <line
                x1={0}
                y1={i * CELL_SIZE * scale}
                x2={boardPixelSize}
                y2={i * CELL_SIZE * scale}
                stroke="#c9a86a"
                strokeWidth="1"
              />
            </React.Fragment>
          ))}
        </svg>

        {starPoints.map((point, i) => (
          <div
            key={`star-${i}`}
            className="star-point"
            style={{
              left: `${BOARD_PADDING + point.x * CELL_SIZE * scale}px`,
              top: `${BOARD_PADDING + point.y * CELL_SIZE * scale}px`,
              width: `${8 * scale}px`,
              height: `${8 * scale}px`,
            }}
          />
        ))}

        {colLabels.map((label, i) => (
          <React.Fragment key={`col-${label}`}>
            <div
              className="coord-label top"
              style={{
                left: `${BOARD_PADDING + i * CELL_SIZE * scale}px`,
                top: `${10}px`,
                fontSize: `${12 * scale}px`,
              }}
            >
              {label}
            </div>
            <div
              className="coord-label bottom"
              style={{
                left: `${BOARD_PADDING + i * CELL_SIZE * scale}px`,
                bottom: `${10}px`,
                fontSize: `${12 * scale}px`,
              }}
            >
              {label}
            </div>
          </React.Fragment>
        ))}

        {rowLabels.map((label, i) => (
          <React.Fragment key={`row-${label}`}>
            <div
              className="coord-label left"
              style={{
                left: `${12}px`,
                top: `${BOARD_PADDING + i * CELL_SIZE * scale}px`,
                fontSize: `${12 * scale}px`,
              }}
            >
              {label}
            </div>
            <div
              className="coord-label right"
              style={{
                right: `${12}px`,
                top: `${BOARD_PADDING + i * CELL_SIZE * scale}px`,
                fontSize: `${12 * scale}px`,
              }}
            >
              {label}
            </div>
          </React.Fragment>
        ))}

        {board.map((row, y) =>
          row.map((stone, x) => {
            if (!stone) return null;
            const move = visibleMoves.find(
              m => m.position.x === x && m.position.y === y
            );
            const blinking = isBlinking(x, y);

            return (
              <div
                key={`stone-${x}-${y}`}
                className={`stone ${stone} ${blinking ? 'blinking-stone' : ''}`}
                style={{
                  ...getStonePosition(x, y),
                  width: `${STONE_SIZE * scale}px`,
                  height: `${STONE_SIZE * scale}px`,
                  fontSize: `${10 * scale}px`,
                }}
              >
                {showMoveNumbers && move && (
                  <span style={{ zIndex: 2 }}>{move.moveNumber}</span>
                )}
              </div>
            );
          })
        )}

        {ripples.map(ripple => (
          <div
            key={ripple.id}
            className={`ink-ripple ${ripple.color || 'black'}`}
            style={{
              left: `${BOARD_PADDING + ripple.x * CELL_SIZE * scale}px`,
              top: `${BOARD_PADDING + ripple.y * CELL_SIZE * scale}px`,
              width: `${60 * scale}px`,
              height: `${60 * scale}px`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </div>
    </div>
  );
};
