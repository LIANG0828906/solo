import React, { useEffect, useState, useMemo } from 'react';
import { Position, PokemonData } from './types';
import { isAdjacent } from './BattleEngine';

interface BoardProps {
  playerPos: Position;
  aiPos: Position;
  playerPokemon: PokemonData;
  aiPokemon: PokemonData;
  onMove: (pos: Position) => void;
  isMovePhase: boolean;
}

const BOARD_SIZE = 8;
const CELL_SIZE = 45;
const GAP = 2;

export const Board: React.FC<BoardProps> = ({
  playerPos,
  aiPos,
  playerPokemon,
  aiPokemon,
  onMove,
  isMovePhase,
}) => {
  const [visibleCells, setVisibleCells] = useState<Set<number>>(new Set());

  const validMoves = useMemo(() => {
    if (!isMovePhase) return new Set<string>();
    const moves = new Set<string>();
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = playerPos.row + dr;
        const nc = playerPos.col + dc;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
          if (!(nr === aiPos.row && nc === aiPos.col)) {
            moves.add(`${nr},${nc}`);
          }
        }
      }
    }
    return moves;
  }, [isMovePhase, playerPos, aiPos]);

  useEffect(() => {
    setVisibleCells(new Set());
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
      timers.push(
        setTimeout(() => {
          setVisibleCells(prev => new Set(prev).add(i));
        }, i * 30)
      );
    }
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleCellClick = (row: number, col: number) => {
    if (!isMovePhase) return;
    if (validMoves.has(`${row},${col}`)) {
      onMove({ row, col });
    }
  };

  const gridWidth = BOARD_SIZE * CELL_SIZE + (BOARD_SIZE - 1) * GAP;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${BOARD_SIZE}, ${CELL_SIZE}px)`,
      gridTemplateRows: `repeat(${BOARD_SIZE}, ${CELL_SIZE}px)`,
      gap: `${GAP}px`,
      background: '#1E293B',
      padding: `${GAP}px`,
      borderRadius: '8px',
      width: `${gridWidth + GAP * 2}px`,
    }}>
      {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, idx) => {
        const row = Math.floor(idx / BOARD_SIZE);
        const col = idx % BOARD_SIZE;
        const isPlayer = row === playerPos.row && col === playerPos.col;
        const isAi = row === aiPos.row && col === aiPos.col;
        const isValid = validMoves.has(`${row},${col}`);
        const isVisible = visibleCells.has(idx);

        const isCorner = (row === 0 && col === 0) || (row === 7 && col === 7) ||
          (row === 0 && col === 7) || (row === 7 && col === 0);
        const isCenter = (row === 3 || row === 4) && (col === 3 || col === 4);
        let cellBg = '#334155';
        if (isCorner) cellBg = '#2D3A4A';
        if (isCenter) cellBg = '#3B4252';

        return (
          <div
            key={idx}
            onClick={() => handleCellClick(row, col)}
            style={{
              width: `${CELL_SIZE}px`,
              height: `${CELL_SIZE}px`,
              background: isValid ? '#4338CA' : cellBg,
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isValid ? 'pointer' : 'default',
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'scale(1)' : 'scale(0.5)',
              transition: 'opacity 0.3s, transform 0.3s, background 0.2s, filter 0.2s',
              position: 'relative',
            }}
            onMouseEnter={e => {
              if (isValid) {
                e.currentTarget.style.filter = 'brightness(1.2)';
                e.currentTarget.style.transform = 'translateY(-3px)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.filter = 'brightness(1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {isPlayer && (
              <PixelSprite color={playerPokemon.color} />
            )}
            {isAi && (
              <PixelSprite color={aiPokemon.color} />
            )}
          </div>
        );
      })}
    </div>
  );
};

const PixelSprite: React.FC<{ color: string }> = ({ color }) => {
  const size = 30;
  const pixelSize = 6;
  const grid = 5;

  const pattern = [
    [0, 1, 1, 1, 0],
    [1, 1, 1, 1, 1],
    [1, 0, 1, 0, 1],
    [1, 1, 1, 1, 1],
    [0, 1, 0, 1, 0],
  ];

  return (
    <div style={{
      width: `${size}px`,
      height: `${size}px`,
      display: 'grid',
      gridTemplateColumns: `repeat(${grid}, ${pixelSize}px)`,
      gridTemplateRows: `repeat(${grid}, ${pixelSize}px)`,
      imageRendering: 'pixelated',
      filter: `drop-shadow(0 0 4px ${color})`,
    }}>
      {pattern.flat().map((filled, idx) => (
        <div
          key={idx}
          style={{
            width: `${pixelSize}px`,
            height: `${pixelSize}px`,
            background: filled ? color : 'transparent',
          }}
        />
      ))}
    </div>
  );
};
