import type { LevelConfig, Wall, Mechanism } from '../types/game';
import { v3 } from './helpers';

function createBoundaryWalls(mazeX: number, mazeZ: number, wallHeight: number = 2, wallThickness: number = 0.5): Wall[] {
  const halfX: number = mazeX / 2;
  const halfZ: number = mazeZ / 2;
  const walls: Wall[] = [
    {
      position: v3(0, wallHeight / 2, -halfZ - wallThickness / 2),
      size: v3(mazeX + wallThickness * 2, wallHeight, wallThickness),
    },
    {
      position: v3(0, wallHeight / 2, halfZ + wallThickness / 2),
      size: v3(mazeX + wallThickness * 2, wallHeight, wallThickness),
    },
    {
      position: v3(-halfX - wallThickness / 2, wallHeight / 2, 0),
      size: v3(wallThickness, wallHeight, mazeZ + wallThickness * 2),
    },
    {
      position: v3(halfX + wallThickness / 2, wallHeight / 2, 0),
      size: v3(wallThickness, wallHeight, mazeZ + wallThickness * 2),
    },
  ];
  return walls;
}

const level1: LevelConfig = {
  id: 'level-1',
  name: '第一关·初试光影',
  mazeSize: v3(10, 2, 10),
  walls: createBoundaryWalls(10, 10),
  mechanisms: [
    {
      id: 'm1-mirror-1',
      type: 'mirror',
      position: v3(2, 0.5, 0),
      rotation: 0,
      size: v3(0.05, 1, 2),
    },
  ],
  emitter: {
    position: v3(-4, 0.5, -3),
    direction: v3(1, 0, 0),
  },
  sensor: {
    position: v3(2, 0.25, 4),
    radius: 0.5,
  },
};

const level2: LevelConfig = {
  id: 'level-2',
  name: '第二关·双重折射',
  mazeSize: v3(12, 2, 12),
  walls: createBoundaryWalls(12, 12),
  mechanisms: [
    {
      id: 'm2-mirror-1',
      type: 'mirror',
      position: v3(0, 0.5, -3),
      rotation: 0,
      size: v3(0.05, 1, 2),
    },
    {
      id: 'm2-translucent-1',
      type: 'translucent',
      position: v3(0, 0.5, 1),
      rotation: 0,
      size: v3(0.3, 2, 1.5),
    },
    {
      id: 'm2-mirror-2',
      type: 'mirror',
      position: v3(0, 0.5, 4),
      rotation: 0,
      size: v3(0.05, 1, 2),
    },
  ],
  emitter: {
    position: v3(-5, 0.5, -3),
    direction: v3(1, 0, 0),
  },
  sensor: {
    position: v3(5, 0.25, 4),
    radius: 0.5,
  },
};

const level3: LevelConfig = {
  id: 'level-3',
  name: '第三关·棱镜分光',
  mazeSize: v3(14, 2, 14),
  walls: createBoundaryWalls(14, 14),
  mechanisms: [
    {
      id: 'm3-mirror-1',
      type: 'mirror',
      position: v3(-2, 0.5, -3),
      rotation: 0,
      size: v3(0.05, 1, 2),
    },
    {
      id: 'm3-prism-1',
      type: 'prism',
      position: v3(-2, 0.5, 2),
      rotation: 0,
      size: v3(1, 1, 1),
    },
    {
      id: 'm3-translucent-1',
      type: 'translucent',
      position: v3(3, 0.5, 5),
      rotation: 90,
      size: v3(0.3, 2, 1.5),
    },
  ],
  emitter: {
    position: v3(-6, 0.5, -3),
    direction: v3(1, 0, 0),
  },
  sensor: {
    position: v3(6, 0.25, 5),
    radius: 0.5,
  },
};

export const levels: LevelConfig[] = [level1, level2, level3];

export function getLevelById(id: string): LevelConfig | undefined {
  return levels.find((l: LevelConfig): boolean => l.id === id);
}

export function mechanismsToRecord(mechanisms: Mechanism[]): Record<string, Mechanism> {
  const record: Record<string, Mechanism> = {};
  mechanisms.forEach((m: Mechanism): void => {
    record[m.id] = m;
  });
  return record;
}

export { level1, level2, level3 };
