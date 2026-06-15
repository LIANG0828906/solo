import React, { useMemo } from 'react';
import MosaicTile, { MosaicTileData } from './MosaicTile';
import { ColorScheme, getComplementaryColor } from './colorSchemes';

interface MosaicGridProps {
  scheme: ColorScheme;
  animKey: string;
}

const GRID_SIZE = 500;
const MIN_TILES = 35;
const MAX_TILES = 48;
const MIN_SIZE = 20;
const MAX_SIZE = 80;
const GAP = 2;

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function pickWeighted<T extends string>(weights: Record<T, number>): T {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [key, w] of entries) {
    r -= w;
    if (r <= 0) return key;
  }
  return entries[0][0];
}

type ShapeKey = 'triangle' | 'quadrilateral' | 'pentagon';
const shapeToSides: Record<ShapeKey, 3 | 4 | 5> = {
  triangle: 3,
  quadrilateral: 4,
  pentagon: 5,
};

function generateTiles(scheme: ColorScheme): MosaicTileData[] {
  const tiles: MosaicTileData[] = [];
  const maxAttempts = 2400;
  const targetTiles = Math.floor(rand(MIN_TILES, MAX_TILES + 1));
  let attempts = 0;

  while (tiles.length < targetTiles && attempts < maxAttempts) {
    attempts++;
    const size = rand(MIN_SIZE, MAX_SIZE);
    const half = size / 2 + GAP;
    const x = rand(half + 4, GRID_SIZE - half - 4);
    const y = rand(half + 4, GRID_SIZE - half - 4);

    let overlap = false;
    for (const t of tiles) {
      const dx = x - t.x;
      const dy = y - t.y;
      const minDist = half + t.size / 2 + GAP;
      if (dx * dx + dy * dy < minDist * minDist) {
        overlap = true;
        break;
      }
    }
    if (overlap) continue;

    const shapeKey = pickWeighted<ShapeKey>(
      scheme.shapeWeights as unknown as Record<ShapeKey, number>,
    );
    const sides = shapeToSides[shapeKey];
    const gradientPair = scheme.gradients[Math.floor(Math.random() * scheme.gradients.length)];
    const reverse = Math.random() < 0.5;
    const colorStart = reverse ? gradientPair[1] : gradientPair[0];
    const colorEnd = reverse ? gradientPair[0] : gradientPair[1];
    const baseColor = scheme.primary[Math.floor(Math.random() * scheme.primary.length)];

    tiles.push({
      id: `tile-${tiles.length}-${Math.random().toString(36).slice(2, 7)}`,
      x,
      y,
      size,
      sides,
      rotation: rand(0, 360),
      colorStart,
      colorEnd,
      gradientAngle: rand(0, 360),
      glowColor: getComplementaryColor(baseColor),
      glowIntensity: scheme.glowIntensity,
      iconType: scheme.icon,
    });
  }

  if (tiles.length < MIN_TILES) {
    let extraAttempts = 0;
    while (tiles.length < MIN_TILES && extraAttempts < 1200) {
      extraAttempts++;
      const size = rand(MIN_SIZE, Math.min(MAX_SIZE, MIN_SIZE + 25));
      const half = size / 2 + GAP;
      const x = rand(half + 2, GRID_SIZE - half - 2);
      const y = rand(half + 2, GRID_SIZE - half - 2);

      let overlap = false;
      for (const t of tiles) {
        const dx = x - t.x;
        const dy = y - t.y;
        const minDist = half + t.size / 2 + GAP;
        if (dx * dx + dy * dy < minDist * minDist) {
          overlap = true;
          break;
        }
      }
      if (overlap) continue;

      const shapeKey = pickWeighted<ShapeKey>(
        scheme.shapeWeights as unknown as Record<ShapeKey, number>,
      );
      const sides = shapeToSides[shapeKey];
      const gradientPair = scheme.gradients[Math.floor(Math.random() * scheme.gradients.length)];
      const baseColor = scheme.primary[Math.floor(Math.random() * scheme.primary.length)];

      tiles.push({
        id: `tile-extra-${tiles.length}-${Math.random().toString(36).slice(2, 7)}`,
        x,
        y,
        size,
        sides,
        rotation: rand(0, 360),
        colorStart: gradientPair[0],
        colorEnd: gradientPair[1],
        gradientAngle: rand(0, 360),
        glowColor: getComplementaryColor(baseColor),
        glowIntensity: scheme.glowIntensity,
        iconType: scheme.icon,
      });
    }
  }

  return tiles;
}

const MosaicGrid: React.FC<MosaicGridProps> = ({ scheme, animKey }) => {
  const tiles = useMemo(() => generateTiles(scheme), [scheme, animKey]);

  return (
    <div className="mosaic-grid-container" id="mosaic-canvas">
      <svg
        key={animKey}
        className={`mosaic-svg mosaic-transition-enter`}
        viewBox={`0 0 ${GRID_SIZE} ${GRID_SIZE}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {tiles.map((tile, i) => (
          <MosaicTile key={tile.id} tile={tile} gradientId={`grad-${animKey}-${i}`} />
        ))}
      </svg>
    </div>
  );
};

export default MosaicGrid;
