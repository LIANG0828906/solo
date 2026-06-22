import { CSSProperties, useEffect, useRef, useState } from 'react';
import { Cell, CompassState, PathMarker, Position } from '../types';
import { positionKey } from '../maze/MazeGenerator';

interface GameBoardProps {
  maze: Cell[][];
  compassState: CompassState;
  markers: PathMarker[];
  cellSize?: number;
}

const MARKER_ICONS: Record<string, string> = {
  minecart: '⚒',
  chest: '💎',
  exit: '🚪',
};

const MARKER_COLORS: Record<string, string> = {
  minecart: '#ff9800',
  chest: '#f44336',
  exit: '#4caf50',
};

export function GameBoard({ maze, compassState, markers, cellSize = 56 }: GameBoardProps) {
  const [animatingCell, setAnimatingCell] = useState<string | null>(null);
  const animationTimeoutRef = useRef<number | null>(null);
  const prevPosRef = useRef<Position>(compassState.currentPosition);

  useEffect(() => {
    const prev = prevPosRef.current;
    const curr = compassState.currentPosition;
    if (prev.x !== curr.x || prev.y !== curr.y) {
      const key = positionKey(curr);
      setAnimatingCell(key);
      if (animationTimeoutRef.current) {
        window.clearTimeout(animationTimeoutRef.current);
      }
      animationTimeoutRef.current = window.setTimeout(() => {
        setAnimatingCell(null);
      }, 150);
      prevPosRef.current = { ...curr };
    }
  }, [compassState.currentPosition]);

  const { currentPosition, exploredCells, pathStack } = compassState;

  const pathSet = new Set(pathStack.map((p) => positionKey(p)));

  const boardStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${maze[0].length}, ${cellSize}px)`,
    gridTemplateRows: `repeat(${maze.length}, ${cellSize}px)`,
    gap: 0,
    padding: '24px',
    background: '#1a1a2e',
    borderRadius: '16px',
    position: 'relative',
    boxShadow:
      'inset 0 0 80px 40px rgba(255, 165, 0, 0.08), 0 8px 32px rgba(0, 0, 0, 0.5)',
  };

  return (
    <div style={boardStyle}>
      {maze.map((row) =>
        row.map((cell) => {
          const key = positionKey(cell);
          const isCurrent =
            currentPosition.x === cell.x && currentPosition.y === cell.y;
          const isExplored = exploredCells.has(key);
          const isOnPath = pathSet.has(key);
          const isAnimating = animatingCell === key;
          const marker = markers.find(
            (m) => m.position.x === cell.x && m.position.y === cell.y
          );

          const cellBg = cell.isExit
            ? 'linear-gradient(135deg, #2d5a3d 0%, #4caf50 50%, #81c784 100%)'
            : isAnimating
              ? '#4488cc40'
              : isOnPath
                ? '#3a3a52'
                : '#2a2a3a';

          const style: CSSProperties = {
            position: 'relative',
            width: cellSize,
            height: cellSize,
            boxSizing: 'border-box',
            background: cellBg,
            animation: cell.isExit ? 'exitGlow 2s ease-in-out infinite' : undefined,
            transition: 'background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            borderTop: cell.walls.top ? '4px solid #4a3020' : '4px solid transparent',
            borderRight: cell.walls.right
              ? '4px solid #4a3020'
              : '4px solid transparent',
            borderBottom: cell.walls.bottom
              ? '4px solid #4a3020'
              : '4px solid transparent',
            borderLeft: cell.walls.left
              ? '4px solid #4a3020'
              : '4px solid transparent',
          };

          return (
            <div key={key} style={style}>
              {isExplored && cell.isEntrance && (
                <div
                  style={{
                    position: 'absolute',
                    inset: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    color: '#ffa500',
                    fontWeight: 'bold',
                    opacity: 0.8,
                  }}
                >
                  入
                </div>
              )}

              {isExplored && cell.isExit && (
                <div
                  style={{
                    position: 'absolute',
                    inset: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                  }}
                >
                  🏁
                </div>
              )}

              {marker && isExplored && (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '18px',
                    filter: `drop-shadow(0 0 4px ${MARKER_COLORS[marker.type]})`,
                    zIndex: 2,
                  }}
                >
                  {MARKER_ICONS[marker.type]}
                </div>
              )}

              {isCurrent && (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: isAnimating
                      ? 'translate(-50%, -50%) scale(0.9)'
                      : 'translate(-50%, -50%) scale(1)',
                    transition:
                      'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                    width: cellSize * 0.6,
                    height: cellSize * 0.6,
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #5c9eff 0%, #2196f3 100%)',
                    boxShadow:
                      '0 0 16px rgba(92, 158, 255, 0.6), inset 0 -2px 4px rgba(0,0,0,0.2)',
                    zIndex: 3,
                    animation: isAnimating
                      ? undefined
                      : 'playerPulse 2s ease-in-out infinite',
                  }}
                />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
