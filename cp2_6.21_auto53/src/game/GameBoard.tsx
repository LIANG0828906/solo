import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { getBlockCells } from './gravityEngine';
import { Block } from '../types';

const CELL_SIZE = 50;
const GRID_SIZE = 8;
const GRID_LINE_COLOR = '#333333';

const GameBoard: React.FC = () => {
  const blocks = useGameStore((state) => state.blocks);
  const obstacles = useGameStore((state) => state.obstacles);
  const targetArea = useGameStore((state) => state.targetArea);
  const rotateBlock = useGameStore((state) => state.rotateBlock);
  const isComplete = useGameStore((state) => state.isComplete);
  const showParticles = useGameStore((state) => state.showParticles);
  const hideParticles = useGameStore((state) => state.hideParticles);
  const nextLevel = useGameStore((state) => state.nextLevel);
  const currentLevel = useGameStore((state) => state.currentLevel);
  const totalLevels = useGameStore((state) => state.totalLevels);
  const gravityDirection = useGameStore((state) => state.gravityDirection);

  const boardSize = CELL_SIZE * GRID_SIZE;

  const obstacleSet = useMemo(() => {
    const set = new Set<string>();
    obstacles.forEach((o) => set.add(`${o.x},${o.y}`));
    return set;
  }, [obstacles]);

  const handleBlockClick = useCallback(
    (e: React.MouseEvent, blockId: string) => {
      e.stopPropagation();
      rotateBlock(blockId);
    },
    [rotateBlock]
  );

  interface Particle {
    id: number;
    x: number;
    y: number;
    angle: number;
    speed: number;
    size: number;
    opacity: number;
  }

  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!showParticles) {
      setParticles([]);
      return;
    }

    const cx = boardSize / 2;
    const cy = boardSize / 2;

    const initialParticles: Particle[] = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: cx,
      y: cy,
      angle: Math.random() * Math.PI * 2,
      speed: 2 + Math.random() * 3,
      size: 4 + Math.random() * 6,
      opacity: 1,
    }));

    setParticles(initialParticles);

    let frame = 0;
    const totalFrames = 62;

    const intervalId = setInterval(() => {
      frame++;
      if (frame >= totalFrames) {
        clearInterval(intervalId);
        return;
      }

      setParticles((prev) =>
        prev.map((p) => ({
          ...p,
          x: p.x + Math.cos(p.angle) * p.speed,
          y: p.y + Math.sin(p.angle) * p.speed,
          opacity: Math.max(0, 1 - frame / totalFrames),
        }))
      );
    }, 16);

    return () => {
      clearInterval(intervalId);
    };
  }, [showParticles, boardSize]);

  const handleNextLevel = () => {
    hideParticles();
    nextLevel();
  };

  const renderGrid = () => {
    const lines = [];
    for (let i = 0; i <= GRID_SIZE; i++) {
      lines.push(
        <line
          key={`h-${i}`}
          x1={0}
          y1={i * CELL_SIZE}
          x2={boardSize}
          y2={i * CELL_SIZE}
          stroke={GRID_LINE_COLOR}
          strokeWidth={1}
        />
      );
      lines.push(
        <line
          key={`v-${i}`}
          x1={i * CELL_SIZE}
          y1={0}
          x2={i * CELL_SIZE}
          y2={boardSize}
          stroke={GRID_LINE_COLOR}
          strokeWidth={1}
        />
      );
    }
    return lines;
  };

  const renderObstacles = () => {
    return obstacles.map((obs, index) => (
      <rect
        key={`obs-${index}`}
        x={obs.x * CELL_SIZE + 2}
        y={obs.y * CELL_SIZE + 2}
        width={CELL_SIZE - 4}
        height={CELL_SIZE - 4}
        fill="#2d3436"
        stroke="#636e72"
        strokeWidth={2}
        rx={3}
      />
    ));
  };

  const renderTargetArea = () => {
    const x = targetArea.x * CELL_SIZE;
    const y = targetArea.y * CELL_SIZE;
    const width = targetArea.width * CELL_SIZE;
    const height = targetArea.height * CELL_SIZE;

    return (
      <g className="target-area">
        <rect
          x={x + 2}
          y={y + 2}
          width={width - 4}
          height={height - 4}
          fill="rgba(255, 215, 0, 0.1)"
          stroke="#ffd700"
          strokeWidth={3}
          rx={4}
          className="target-border"
        />
        <rect
          x={x + 6}
          y={y + 6}
          width={width - 12}
          height={height - 12}
          fill="none"
          stroke="rgba(255, 215, 0, 0.5)"
          strokeWidth={1}
          rx={2}
          strokeDasharray="5,5"
        />
      </g>
    );
  };

  const renderBlock = (block: Block) => {
    const cells = getBlockCells(block);
    const isInTarget = cells.every(
      (cell) =>
        cell.x >= targetArea.x &&
        cell.x < targetArea.x + targetArea.width &&
        cell.y >= targetArea.y &&
        cell.y < targetArea.y + targetArea.height
    );

    return (
      <g
        key={block.id}
        onClick={(e) => handleBlockClick(e, block.id)}
        style={{ cursor: 'pointer' }}
        className="block-group"
      >
        {cells.map((cell, idx) => (
          <g key={`${block.id}-${idx}`}>
            <rect
              x={cell.x * CELL_SIZE + 3}
              y={cell.y * CELL_SIZE + 3}
              width={CELL_SIZE - 6}
              height={CELL_SIZE - 6}
              fill={block.color}
              stroke={isInTarget ? '#ffd700' : 'rgba(0,0,0,0.3)'}
              strokeWidth={isInTarget ? 2 : 1}
              rx={4}
              className="block-cell"
            />
            <rect
              x={cell.x * CELL_SIZE + 6}
              y={cell.y * CELL_SIZE + 6}
              width={CELL_SIZE - 18}
              height={CELL_SIZE - 18}
              fill="rgba(255,255,255,0.2)"
              rx={2}
            />
            <rect
              x={cell.x * CELL_SIZE + 8}
              y={cell.y * CELL_SIZE + 8}
              width={4}
              height={4}
              fill="rgba(255,255,255,0.4)"
              rx={1}
            />
          </g>
        ))}
      </g>
    );
  };

  const gravityArrow = () => {
    const cx = boardSize / 2;
    const cy = boardSize / 2;
    const arrowSize = 30;
    let rotation = 0;

    switch (gravityDirection) {
      case 'down':
        rotation = 0;
        break;
      case 'left':
        rotation = -90;
        break;
      case 'up':
        rotation = 180;
        break;
      case 'right':
        rotation = 90;
        break;
    }

    return (
      <g
        transform={`translate(${cx}, ${cy}) rotate(${rotation})`}
        className="gravity-indicator"
        style={{ pointerEvents: 'none' }}
      >
        <path
          d={`M ${-arrowSize / 2} ${-arrowSize / 2} L 0 ${arrowSize / 2} L ${arrowSize / 2} ${-arrowSize / 2} Z`}
          fill="rgba(255,255,255,0.1)"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={1}
        />
      </g>
    );
  };

  const renderParticles = () => {
    return particles.map((p) => (
      <circle
        key={p.id}
        cx={p.x}
        cy={p.y}
        r={p.size}
        fill="#FFD700"
        opacity={p.opacity}
      />
    ));
  };

  return (
    <div className="game-board-wrapper">
      <div className="game-board-container">
        <svg
          width={boardSize}
          height={boardSize}
          className="game-board"
          style={{
            minWidth: '400px',
            minHeight: '400px',
          }}
        >
          <defs>
            <style>{`
              .target-border {
                animation: pulse-border 0.8s ease-in-out infinite;
              }
              @keyframes pulse-border {
                0%, 100% {
                  stroke-opacity: 1;
                  stroke-width: 3;
                }
                50% {
                  stroke-opacity: 0.5;
                  stroke-width: 5;
                }
              }
              .block-cell {
                transition: transform 0.15s ease-out, x 0.15s ease-out, y 0.15s ease-out;
              }
              .block-group:hover .block-cell {
                filter: brightness(1.2);
              }
              .gravity-indicator {
                opacity: 0.3;
              }
            `}</style>
          </defs>

          <rect
            x={0}
            y={0}
            width={boardSize}
            height={boardSize}
            fill="#0f0f1a"
            rx={8}
          />

          {renderGrid()}
          {renderTargetArea()}
          {gravityArrow()}
          {renderObstacles()}
          {blocks.map(renderBlock)}
          {showParticles && renderParticles()}
        </svg>

        {isComplete && (
          <div className="complete-overlay">
            <div className="complete-modal">
              <h2 className="complete-title">🎉 关卡通过！</h2>
              <p className="complete-subtitle">
                第 {currentLevel + 1} 关完成
              </p>
              {currentLevel < totalLevels - 1 ? (
                <button className="next-level-btn" onClick={handleNextLevel}>
                  下一关 →
                </button>
              ) : (
                <div className="game-complete">
                  <p>🏆 恭喜你完成了所有关卡！</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameBoard;
