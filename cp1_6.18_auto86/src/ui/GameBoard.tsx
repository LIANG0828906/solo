import { useMemo } from 'react';
import { useGameStore } from '../store/useGameStore';
import {
  getHexPolygonPoints,
  hexToPixel,
} from '../game/hexUtils';
import type { HexCell, RuneColor } from '../game/types';

const RUNE_COLOR_MAP: Record<RuneColor, string> = {
  red: '#FF4757',
  blue: '#3742FA',
  yellow: '#FFD93D',
  green: '#6BCB77',
};

export default function GameBoard() {
  const { state, handleCellClick, aiThinking } = useGameStore();
  const { grid, hexSize, tracks, players, currentTurn, gameOver } = state;

  const { viewBox, offsetX, offsetY } = useMemo(() => {
    const gridWidth = grid[0]?.length || 10;
    const gridHeight = grid.length || 10;

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    for (let r = 0; r < gridHeight; r++) {
      for (let q = 0; q < gridWidth; q++) {
        const p = hexToPixel({ q, r }, hexSize);
        minX = Math.min(minX, p.x - hexSize);
        minY = Math.min(minY, p.y - hexSize);
        maxX = Math.max(maxX, p.x + hexSize);
        maxY = Math.max(maxY, p.y + hexSize);
      }
    }

    const padding = hexSize;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;
    const offsetX = -minX + padding;
    const offsetY = -minY + padding;

    return { viewBox: `0 0 ${width} ${height}`, offsetX, offsetY };
  }, [grid, hexSize]);

  const handleClick = (cell: HexCell) => {
    if (aiThinking || gameOver) return;
    if (currentTurn !== 'player') return;
    handleCellClick(cell.coord);
  };

  return (
    <div className="game-board-container">
      <svg viewBox={viewBox} className="game-board-svg">
        <defs>
          <radialGradient id="lavaGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFA500" className="lava-stop-1" />
            <stop offset="50%" stopColor="#FF6347" className="lava-stop-2" />
            <stop offset="100%" stopColor="#FF4500" className="lava-stop-3" />
          </radialGradient>

          <filter id="playerGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="aiGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="runeGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g transform={`translate(${offsetX}, ${offsetY})`}>
          {grid.map((row) =>
            row.map((cell) => {
              const p = hexToPixel(cell.coord, hexSize);
              const points = getHexPolygonPoints(p, hexSize);
              const isClickable =
                !aiThinking &&
                !gameOver &&
                currentTurn === 'player';

              return (
                <g
                  key={`cell-${cell.coord.q}-${cell.coord.r}`}
                  onClick={() => handleClick(cell)}
                  style={{ cursor: isClickable ? 'pointer' : 'default' }}
                >
                  <polygon
                    points={points}
                    fill={
                      cell.terrain === 'lava'
                        ? 'url(#lavaGradient)'
                        : cell.terrain === 'crack'
                          ? '#2A1A1A'
                          : cell.isBase
                            ? '#1E3A2F'
                            : '#222238'
                    }
                    stroke="#4A4A6A"
                    strokeWidth="1"
                    className="hex-cell"
                  />

                  {cell.terrain === 'crack' && (
                    <polyline
                      points={generateCrackPoints(p, hexSize)}
                      fill="none"
                      stroke="#FF4500"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  )}

                  {cell.isBase && (
                    <polygon
                      points={generateStarPoints(p, hexSize * 0.55, 5)}
                      fill={cell.baseOwner === 'player' ? '#6BCB77' : '#FF6B6B'}
                      stroke="#FFFFFF"
                      strokeWidth="1"
                    />
                  )}

                  {cell.hasRune && cell.runeColor && (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={hexSize * 0.35}
                      fill={RUNE_COLOR_MAP[cell.runeColor]}
                      filter="url(#runeGlow)"
                      className="rune-dot"
                    />
                  )}
                </g>
              );
            }),
          )}

          {tracks.map((track, i) => {
            const from = hexToPixel(track.from, hexSize);
            const to = hexToPixel(track.to, hexSize);
            return (
              <line
                key={`track-${i}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={track.owner === 'player' ? '#8B4513' : '#AAAAAA'}
                strokeWidth="3"
                strokeLinecap="round"
              />
            );
          })}

          {(['player', 'ai'] as const).map((owner) => {
            const cart = players[owner].cart;
            const p = hexToPixel(cart.position, hexSize);
            return (
              <circle
                key={`cart-${owner}`}
                cx={p.x}
                cy={p.y}
                r={10}
                fill={owner === 'player' ? '#4ECDC4' : '#FF6B6B'}
                filter={owner === 'player' ? 'url(#playerGlow)' : 'url(#aiGlow)'}
                className="cart-dot"
                style={{
                  transition: 'cx 0.3s ease, cy 0.3s ease',
                }}
              />
            );
          })}

          {(['player', 'ai'] as const).map((owner) => {
            const cart = players[owner].cart;
            if (!cart.carrying) return null;
            const p = hexToPixel(cart.position, hexSize);
            return (
              <circle
                key={`carry-${owner}`}
                cx={p.x}
                cy={p.y - 15}
                r={5}
                fill={RUNE_COLOR_MAP[cart.carrying]}
                style={{
                  transition: 'cx 0.3s ease, cy 0.3s ease',
                }}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}

function generateCrackPoints(
  center: { x: number; y: number },
  size: number,
): string {
  const points: string[] = [];
  const startX = center.x - size * 0.6;
  const startY = center.y;
  points.push(`${startX},${startY}`);

  let x = startX;
  let y = startY;
  const segments = 6;
  const segLen = (size * 1.2) / segments;

  for (let i = 0; i < segments; i++) {
    x += segLen;
    y += (Math.random() - 0.5) * size * 0.3;
    points.push(`${x},${y}`);
  }

  return points.join(' ');
}

function generateStarPoints(
  center: { x: number; y: number },
  outerR: number,
  points: number,
): string {
  const innerR = outerR * 0.4;
  const result: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI / points) * i - Math.PI / 2;
    result.push(`${center.x + r * Math.cos(angle)},${center.y + r * Math.sin(angle)}`);
  }
  return result.join(' ');
}
