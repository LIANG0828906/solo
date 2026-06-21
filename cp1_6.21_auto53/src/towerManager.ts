import { v4 as uuidv4 } from 'uuid';
import type {
  Tower,
  TowerType,
  Point,
  TowerConfig,
  CoverageArea,
  CoverageStats,
} from './types';

export const TOWER_CONFIGS: Record<TowerType, TowerConfig> = {
  arrow: {
    type: 'arrow',
    name: '箭塔',
    color: '#6B8E23',
    range: 2.5,
  },
  cannon: {
    type: 'cannon',
    name: '炮塔',
    color: '#555555',
    range: 2.5,
  },
  magic: {
    type: 'magic',
    name: '魔法塔',
    color: '#9370DB',
    range: 2.5,
  },
};

const TOWER_RADIUS = 2.5;

export function addTower(
  type: TowerType,
  position: Point,
  existingTowers: Tower[]
): Tower | null {
  const isOccupied = existingTowers.some(
    (t) => t.position.x === position.x && t.position.y === position.y
  );

  if (isOccupied) {
    return null;
  }

  return {
    id: uuidv4(),
    type,
    position: { ...position },
  };
}

export function removeTower(towerId: string, existingTowers: Tower[]): Tower[] {
  return existingTowers.filter((t) => t.id !== towerId);
}

export function getTowerAtPosition(
  position: Point,
  towers: Tower[]
): Tower | undefined {
  return towers.find(
    (t) => t.position.x === position.x && t.position.y === position.y
  );
}

function isPointInCircle(
  point: Point,
  center: Point,
  radius: number,
  cellSize: number = 1
): boolean {
  const dx = (point.x + 0.5) * cellSize - (center.x + 0.5) * cellSize;
  const dy = (point.y + 0.5) * cellSize - (center.y + 0.5) * cellSize;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance <= radius * cellSize;
}

export function getCoverage(
  towers: Tower[],
  path: Point[]
): {
  areas: CoverageArea[];
  stats: CoverageStats;
} {
  const areas: CoverageArea[] = towers.map((tower) => ({
    towerId: tower.id,
    center: tower.position,
    radius: TOWER_RADIUS,
    color: TOWER_CONFIGS[tower.type].color,
  }));

  const totalPathLength = Math.max(0, path.length - 1);
  const coveredPoints: Point[] = [];

  for (const pathPoint of path) {
    let isCovered = false;
    for (const tower of towers) {
      if (isPointInCircle(pathPoint, tower.position, TOWER_RADIUS)) {
        isCovered = true;
        break;
      }
    }
    if (isCovered) {
      coveredPoints.push(pathPoint);
    }
  }

  const coveredSegments = coveredPoints.length > 0 ? coveredPoints.length - 1 : 0;
  const coveragePercent =
    totalPathLength > 0
      ? Math.round((coveredSegments / totalPathLength) * 100)
      : 0;

  const stats: CoverageStats = {
    totalPathLength,
    coveredPathLength: coveredSegments,
    coveragePercent,
    coveredPoints,
  };

  return { areas, stats };
}

export function getBlockedCells(towers: Tower[]): Point[] {
  return towers.map((t) => t.position);
}
