import React from 'react';
import { motion } from 'framer-motion';
import {
  TILE_SIZE,
  MAP_WIDTH,
  MAP_HEIGHT,
  TILE_COLORS,
  TileType,
  ORE_COLORS,
  ORE_SHAPES,
  OreParticle,
  MiningAnimation,
  Player,
} from '../utils/gameLogic';

interface GameMapProps {
  map: TileType[][];
  player: Player;
  particles: OreParticle[];
  miningAnimations: MiningAnimation[];
  now: number;
  playerOffset: { x: number; y: number };
}

const GameMap: React.FC<GameMapProps> = ({
  map,
  player,
  particles,
  miningAnimations,
  now,
  playerOffset,
}) => {
  const viewportWidth = MAP_WIDTH * TILE_SIZE;
  const viewportHeight = MAP_HEIGHT * TILE_SIZE;

  const renderOreShape = (type: keyof typeof ORE_SHAPES, x: number, y: number, size: number = 8) => {
    const color = ORE_COLORS[type];
    const shape = ORE_SHAPES[type];

    switch (shape) {
      case 'square':
        return (
          <rect
            x={x - size / 2}
            y={y - size / 2}
            width={size}
            height={size}
            fill={color}
            rx={1}
          />
        );
      case 'triangle':
        return (
          <polygon
            points={`${x},${y - size / 2} ${x - size / 2},${y + size / 2} ${x + size / 2},${y + size / 2}`}
            fill={color}
          />
        );
      case 'circle':
        return <circle cx={x} cy={y} r={size / 2} fill={color} />;
      case 'diamond':
        return (
          <polygon
            points={`${x},${y - size / 2} ${x + size / 2},${y} ${x},${y + size / 2} ${x - size / 2},${y}`}
            fill={color}
          />
        );
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: viewportWidth,
        height: viewportHeight,
        background: 'linear-gradient(180deg, #212121 0%, #37474F 100%)',
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5)',
      }}
    >
      <svg
        width={viewportWidth}
        height={viewportHeight}
        style={{ display: 'block' }}
      >
        {map.map((row, y) =>
          row.map((tile, x) => (
            <g key={`tile-${x}-${y}`}>
              <rect
                x={x * TILE_SIZE}
                y={y * TILE_SIZE}
                width={TILE_SIZE}
                height={TILE_SIZE}
                fill={TILE_COLORS[tile]}
              />
              {(tile === TileType.COAL ||
                tile === TileType.IRON ||
                tile === TileType.GOLD ||
                tile === TileType.DIAMOND) && (
                <g>
                  {renderOreShape(
                    tile === TileType.COAL
                      ? 'coal'
                      : tile === TileType.IRON
                      ? 'iron'
                      : tile === TileType.GOLD
                      ? 'gold'
                      : 'diamond',
                    x * TILE_SIZE + TILE_SIZE / 2,
                    y * TILE_SIZE + TILE_SIZE / 2,
                    10
                  )}
                </g>
              )}
            </g>
          ))
        )}

        {miningAnimations.map((anim) => {
          const elapsed = (now - anim.startTime) / anim.duration;
          if (elapsed >= 1) return null;

          const cx = anim.tileX * TILE_SIZE + TILE_SIZE / 2;
          const cy = anim.tileY * TILE_SIZE + TILE_SIZE / 2;

          if (elapsed < 0.5) {
            const crackProgress = elapsed * 2;
            return (
              <g key={anim.id}>
                <line
                  x1={cx - TILE_SIZE / 2 + 4}
                  y1={cy - TILE_SIZE / 2 + 4}
                  x2={cx + TILE_SIZE / 2 - 4}
                  y2={cy + TILE_SIZE / 2 - 4}
                  stroke="white"
                  strokeWidth={2}
                  opacity={crackProgress}
                />
                <line
                  x1={cx + TILE_SIZE / 2 - 4}
                  y1={cy - TILE_SIZE / 2 + 4}
                  x2={cx - TILE_SIZE / 2 + 4}
                  y2={cy + TILE_SIZE / 2 - 4}
                  stroke="white"
                  strokeWidth={2}
                  opacity={crackProgress}
                />
              </g>
            );
          } else {
            const fragProgress = (elapsed - 0.5) * 2;
            const frags = [
              { dx: -8, dy: -8 },
              { dx: 8, dy: -8 },
              { dx: -8, dy: 8 },
              { dx: 8, dy: 8 },
            ];
            return (
              <g key={anim.id}>
                {frags.map((f, i) => (
                  <rect
                    key={i}
                    x={cx + f.dx * fragProgress - 4}
                    y={cy + f.dy * fragProgress - 4}
                    width={8}
                    height={8}
                    fill="#5D4037"
                    opacity={1 - fragProgress}
                    rx={1}
                  />
                ))}
              </g>
            );
          }
        })}

        {particles.map((p) => {
          const scatterDuration = 200;
          const collectDuration = 400;
          const totalElapsed = now - p.startTime;

          let px: number, py: number, opacity: number, scale: number;

          if (totalElapsed < scatterDuration) {
            const t = totalElapsed / scatterDuration;
            px = p.startX + p.scatterOffsetX * t;
            py = p.startY + p.scatterOffsetY * t;
            opacity = 1;
            scale = 1;
          } else if (totalElapsed < scatterDuration + collectDuration) {
            const t = (totalElapsed - scatterDuration) / collectDuration;
            const easeT = t * t * (3 - 2 * t);
            const scatterX = p.startX + p.scatterOffsetX;
            const scatterY = p.startY + p.scatterOffsetY;
            px = scatterX + (player.x - scatterX) * easeT;
            py = scatterY + (player.y - scatterY) * easeT;
            opacity = 1 - t * 0.3;
            scale = 1 - t * 0.3;
          } else {
            return null;
          }

          return (
            <g key={p.id} opacity={opacity}>
              <g transform={`translate(${px}, ${py}) scale(${scale})`}>
                {renderOreShape(p.type, 0, 0, 10)}
              </g>
            </g>
          );
        })}

        <motion.g
          animate={{
            x: player.x + playerOffset.x,
            y: player.y + playerOffset.y,
          }}
          transition={{ duration: 0, ease: 'linear' }}
        >
          <circle cx={0} cy={0} r={12} fill="#FFD54F" stroke="#F9A825" strokeWidth={2} />
          <circle cx={0} cy={-8} r={7} fill="#FF9800" stroke="#E65100" strokeWidth={1.5} />
          <circle cx={-4} cy={-2} r={2} fill="#3E2723" />
          <circle cx={4} cy={-2} r={2} fill="#3E2723" />
        </motion.g>
      </svg>
    </div>
  );
};

export default GameMap;
