import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const distance = 50 + Math.random() * 20;
      newParticles.push({
        id: `${Date.now()}-${i}-${Math.random()}`,
        x,
        y,
        endX: x + Math.cos(angle) * distance,
        endY: y + Math.sin(angle) * distance,
        color,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
    }, 600);
  }, []);

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
            backgroundColor: p.color,
            '--end-x': `${p.endX - p.x}px`,
            '--end-y': `${p.endY - p.y}px`,
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
