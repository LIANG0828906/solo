import { memo } from 'react';
import type { MazeGrid as MazeGridType, Point } from '../types';

interface MazeGridProps {
  maze: MazeGridType;
  cellSize: number;
  onCellClick: (position: Point, e: React.MouseEvent) => void;
  onCellRightClick: (position: Point, e: React.MouseEvent) => void;
  onCellDragStart: (position: Point, e: React.MouseEvent) => void;
  mazeKey: number;
}

const MazeGrid = memo(function MazeGrid({
  maze,
  cellSize,
  onCellClick,
  onCellRightClick,
  onCellDragStart,
  mazeKey,
}: MazeGridProps) {
  const width = maze[0]?.length || 0;
  const height = maze.length;
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);

  const getDistanceFromCenter = (x: number, y: number) => {
    const dx = x - centerX;
    const dy = y - centerY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const maxDistance = Math.max(
    getDistanceFromCenter(0, 0),
    getDistanceFromCenter(width - 1, 0),
    getDistanceFromCenter(0, height - 1),
    getDistanceFromCenter(width - 1, height - 1)
  );

  return (
    <div
      className="maze-grid"
      style={{
        gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${height}, ${cellSize}px)`,
      }}
    >
      {maze.map((row, y) =>
        row.map((cell, x) => {
          const isStart = x === 0 && y === 0;
          const isEnd = x === width - 1 && y === height - 1;
          const distance = getDistanceFromCenter(x, y);
          const animationDelay = (distance / maxDistance) * 0.3;

          const handleClick = (e: React.MouseEvent) => {
            e.preventDefault();
            onCellClick({ x, y }, e);
          };

          const handleContextMenu = (e: React.MouseEvent) => {
            e.preventDefault();
            onCellRightClick({ x, y }, e);
          };

          const handleMouseDown = (e: React.MouseEvent) => {
            if (e.button === 0) {
              onCellDragStart({ x, y }, e);
            }
          };

          return (
            <div
              key={`${mazeKey}-${x}-${y}`}
              className={`cell ${cell} ${isStart ? 'start' : ''} ${isEnd ? 'end' : ''}`}
              style={{
                animationDelay: `${animationDelay}s`,
              }}
              onClick={handleClick}
              onContextMenu={handleContextMenu}
              onMouseDown={handleMouseDown}
            >
              {isStart && <span className="cell-label">入口</span>}
              {isEnd && <span className="cell-label">出口</span>}
            </div>
          );
        })
      )}
    </div>
  );
});

export default MazeGrid;
