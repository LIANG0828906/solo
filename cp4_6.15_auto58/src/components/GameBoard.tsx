import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { Tile, Point, Difficulty } from '@/utils/matching';
import { canMatch, DIFFICULTY_CONFIG } from '@/utils/matching';
import './GameBoard.css';

interface GameBoardProps {
  tiles: Tile[];
  difficulty: Difficulty;
  isPaused: boolean;
  isGameOver: boolean;
  isVictory: boolean;
  onMatchSuccess: (tile1: Tile, tile2: Tile, path: Point[]) => void;
  onMatchFail: () => void;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  endX: number;
  endY: number;
  color: string;
  size: number;
}

interface VictoryParticle {
  id: string;
  x: number;
  y: number;
  endX: number;
  endY: number;
  color: string;
  size: number;
  rotation: number;
  delay: number;
}

const GameBoard: React.FC<GameBoardProps> = ({
  tiles,
  difficulty,
  isPaused,
  isGameOver,
  isVictory,
  onMatchSuccess,
  onMatchFail,
}) => {
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [shakingTiles, setShakingTiles] = useState<Set<string>>(new Set());
  const [particles, setParticles] = useState<Particle[]>([]);
  const [matchingTiles, setMatchingTiles] = useState<Set<string>>(new Set());
  const [boardSize, setBoardSize] = useState(480);
  const [victoryParticles, setVictoryParticles] = useState<VictoryParticle[]>([]);
  const prevVictoryRef = useRef(false);

  const config = DIFFICULTY_CONFIG[difficulty];
  const gridSize = config.gridSize;

  useEffect(() => {
    const updateSize = () => {
      const minDimension = Math.min(window.innerWidth * 0.6, window.innerHeight * 0.65);
      const size = Math.max(320, Math.min(640, minDimension));
      setBoardSize(size);
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const tileSize = useMemo(() => {
    const gap = 4;
    return (boardSize - gap * (gridSize + 1)) / gridSize;
  }, [boardSize, gridSize]);

  const boardTiles = useMemo(() => {
    const grid: (Tile | null)[][] = Array(gridSize)
      .fill(null)
      .map(() => Array(gridSize).fill(null));

    tiles.forEach((tile) => {
      if (tile.row < gridSize && tile.col < gridSize) {
        grid[tile.row][tile.col] = tile;
      }
    });

    return grid;
  }, [tiles, gridSize]);

  const createParticles = useCallback((x: number, y: number, color: string) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16 + Math.random() * 0.3;
      const distance = 50 + Math.random() * 30;
      newParticles.push({
        id: `${Date.now()}-${i}-${Math.random()}`,
        x,
        y,
        endX: x + Math.cos(angle) * distance,
        endY: y + Math.sin(angle) * distance,
        color,
        size: 4 + Math.random() * 6,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
    }, 700);
  }, []);

  const createVictoryParticles = useCallback(
    (centerX: number, centerY: number, boardWidth: number, boardHeight: number) => {
      const colors = [
        '#FF6B6B',
        '#FFD93D',
        '#6BCB77',
        '#4D96FF',
        '#9B59B6',
        '#FF9FF3',
        '#00D9FF',
        '#FFA502',
      ];
      const newParticles: VictoryParticle[] = [];
      const totalParticles = 120;
      const safeW = Math.max(80, boardWidth);
      const safeH = Math.max(80, boardHeight);

      for (let burst = 0; burst < 3; burst++) {
        for (let i = 0; i < totalParticles / 3; i++) {
          const angle = Math.random() * Math.PI * 2;
          const minDist = Math.min(safeW, safeH) * 0.1;
          const maxDist = Math.max(safeW, safeH) * 0.6;
          const distance = minDist + Math.random() * (maxDist - minDist);

          const offsetX = (Math.random() - 0.5) * safeW * 0.4;
          const offsetY = (Math.random() - 0.5) * safeH * 0.4;
          const startX = centerX + offsetX;
          const startY = centerY + offsetY;

          newParticles.push({
            id: `v-${Date.now()}-${burst}-${i}-${Math.random()}`,
            x: startX,
            y: startY,
            endX: startX + Math.cos(angle) * distance,
            endY: startY + Math.sin(angle) * distance,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 5 + Math.random() * 11,
            rotation: Math.random() * 720 - 360,
            delay: burst * 120 + Math.random() * 180,
          });
        }
      }
      setVictoryParticles((prev) => [...prev, ...newParticles]);
      setTimeout(() => {
        setVictoryParticles((prev) =>
          prev.filter((p) => !newParticles.find((np) => np.id === p.id))
        );
      }, 3000);
    },
    []
  );

  useEffect(() => {
    if (isVictory && !prevVictoryRef.current) {
      const boardEl = document.getElementById('game-board');
      if (boardEl) {
        const w = boardEl.clientWidth || boardSize;
        const h = boardEl.clientHeight || boardSize;
        const cx = w / 2;
        const cy = h / 2;
        setTimeout(() => createVictoryParticles(cx, cy, w, h), 50);
      }
    }
    prevVictoryRef.current = isVictory;
  }, [isVictory, boardSize, createVictoryParticles]);

  const handleTileClick = useCallback(
    (tile: Tile) => {
      if (isPaused || isGameOver || tile.matched) return;

      if (!selectedTile) {
        setSelectedTile(tile);
        return;
      }

      if (selectedTile.id === tile.id) {
        setSelectedTile(null);
        return;
      }

      const result = canMatch(selectedTile, tile, tiles, gridSize);

      if (result.matched) {
        setMatchingTiles(new Set([selectedTile.id, tile.id]));

        const rect1 = document.getElementById(`tile-${selectedTile.id}`)?.getBoundingClientRect();
        const boardRect = document.getElementById('game-board')?.getBoundingClientRect();
        if (rect1 && boardRect) {
          const x = rect1.left + rect1.width / 2 - boardRect.left;
          const y = rect1.top + rect1.height / 2 - boardRect.top;
          createParticles(x, y, tile.tileData.color);
        }
        const rect2 = document.getElementById(`tile-${tile.id}`)?.getBoundingClientRect();
        if (rect2 && boardRect) {
          const x = rect2.left + rect2.width / 2 - boardRect.left;
          const y = rect2.top + rect2.height / 2 - boardRect.top;
          createParticles(x, y, tile.tileData.color);
        }

        setTimeout(() => {
          onMatchSuccess(selectedTile, tile, result.path);
          setMatchingTiles(new Set());
        }, 400);
      } else {
        setShakingTiles(new Set([selectedTile.id, tile.id]));
        onMatchFail();
        setTimeout(() => {
          setShakingTiles(new Set());
        }, 300);
      }

      setSelectedTile(null);
    },
    [selectedTile, tiles, gridSize, isPaused, isGameOver, onMatchSuccess, onMatchFail, createParticles]
  );

  const renderTile = (tile: Tile | null, row: number, col: number) => {
    if (!tile || tile.matched) {
      return (
        <div
          key={`empty-${row}-${col}`}
          className="tile tile-empty"
          style={{ width: tileSize, height: tileSize }}
        />
      );
    }

    const isSelected = selectedTile?.id === tile.id;
    const isShaking = shakingTiles.has(tile.id);
    const isMatching = matchingTiles.has(tile.id);

    const tileClasses = [
      'tile',
      isSelected ? 'tile-selected' : '',
      isShaking ? 'tile-shake' : '',
      isMatching ? 'tile-match' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        key={tile.id}
        id={`tile-${tile.id}`}
        className={tileClasses}
        style={{
          width: tileSize,
          height: tileSize,
          backgroundColor: tile.tileData.color + '30',
        }}
        onClick={() => handleTileClick(tile)}
      >
        <div className="tile-content">
          {tile.tileData.imageUrl ? (
            <img
              src={tile.tileData.imageUrl}
              alt={tile.tileData.name}
              className="tile-image"
              draggable={false}
            />
          ) : (
            <span className="tile-emoji" style={{ fontSize: tileSize * 0.5 }}>
              {tile.tileData.emoji}
            </span>
          )}
        </div>
        {isSelected && <div className="tile-glow" style={{ borderColor: '#FFD700' }} />}
      </div>
    );
  };

  return (
    <div
      id="game-board"
      className={`game-board ${isGameOver && !isVictory ? 'board-grayscale' : ''}`}
      style={{ width: boardSize, height: boardSize }}
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            '--end-x': `${p.endX - p.x}px`,
            '--end-y': `${p.endY - p.y}px`,
          } as React.CSSProperties}
        />
      ))}

      {victoryParticles.map((p) => (
        <div
          key={p.id}
          className="victory-particle"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            '--end-x': `${p.endX - p.x}px`,
            '--end-y': `${p.endY - p.y}px`,
            '--rotation': `${p.rotation}deg`,
            animationDelay: `${p.delay}ms`,
          } as React.CSSProperties}
        />
      ))}

      <div
        className="board-grid"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, ${tileSize}px)`,
          gridTemplateRows: `repeat(${gridSize}, ${tileSize}px)`,
          gap: '4px',
        }}
      >
        {boardTiles.map((row, rowIndex) =>
          row.map((tile, colIndex) => renderTile(tile, rowIndex, colIndex))
        )}
      </div>

      {isVictory && (
        <div className="victory-overlay">
          <div className="victory-text">🎉 胜利！🎉</div>
          <div className="confetti-container">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className="confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  backgroundColor: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#9B59B6'][
                    Math.floor(Math.random() * 5)
                  ],
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;
