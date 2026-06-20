export enum TileType {
  GRASS = 'grass',
  DIRT = 'dirt',
  ROCK = 'rock',
}

export type ResourceType = 'wood' | 'stone' | 'food';

export interface Tile {
  type: TileType;
  resourceAmount: number;
  resourceType?: ResourceType;
  occupiedByBuilding: boolean;
}

export interface ResourceNode {
  id: string;
  x: number;
  y: number;
  type: ResourceType;
  amount: number;
  maxAmount: number;
}

export type BuildingType = 'woodWall' | 'stoneWall' | 'tower' | 'warehouse';

export interface BuildingBlueprint {
  type: BuildingType;
  name: string;
  woodCost: number;
  stoneCost: number;
  foodCost: number;
  maxHealth: number;
  height: number;
  color: string;
  description: string;
}

export const TILE_SIZE = 16;
export const MAP_WIDTH = 64;
export const MAP_HEIGHT = 64;

export const BUILDING_BLUEPRINTS: Record<BuildingType, BuildingBlueprint> = {
  woodWall: {
    type: 'woodWall',
    name: '木墙',
    woodCost: 10,
    stoneCost: 0,
    foodCost: 0,
    maxHealth: 100,
    height: 14,
    color: '#8B5A2B',
    description: '基础防御建筑',
  },
  stoneWall: {
    type: 'stoneWall',
    name: '石墙',
    woodCost: 5,
    stoneCost: 5,
    foodCost: 0,
    maxHealth: 200,
    height: 14,
    color: '#808080',
    description: '高耐久防御建筑',
  },
  tower: {
    type: 'tower',
    name: '防御塔',
    woodCost: 15,
    stoneCost: 10,
    foodCost: 0,
    maxHealth: 150,
    height: 28,
    color: '#696969',
    description: '自动攻击范围内怪物',
  },
  warehouse: {
    type: 'warehouse',
    name: '仓库',
    woodCost: 20,
    stoneCost: 15,
    foodCost: 0,
    maxHealth: 180,
    height: 20,
    color: '#A0522D',
    description: '存储资源',
  },
};

function randomRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function generateMap(): Tile[][] {
  const map: Tile[][] = [];

  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      let type = TileType.GRASS;
      const rand = Math.random();

      if (rand < 0.08) {
        type = TileType.ROCK;
      } else if (rand < 0.23) {
        type = TileType.DIRT;
      }

      row.push({
        type,
        resourceAmount: 0,
        occupiedByBuilding: false,
      });
    }
    map.push(row);
  }

  for (let i = 0; i < 5; i++) {
    const cx = randomRange(10, MAP_WIDTH - 10);
    const cy = randomRange(10, MAP_HEIGHT - 10);
    const radius = randomRange(2, 5);
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (
          nx >= 0 && nx < MAP_WIDTH &&
          ny >= 0 && ny < MAP_HEIGHT &&
          dx * dx + dy * dy <= radius * radius
        ) {
          if (Math.random() < 0.6) {
            map[ny][nx].type = TileType.DIRT;
          }
        }
      }
    }
  }

  for (let i = 0; i < 3; i++) {
    const cx = randomRange(5, MAP_WIDTH - 5);
    const cy = randomRange(5, MAP_HEIGHT - 5);
    const radius = randomRange(1, 3);
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (
          nx >= 0 && nx < MAP_WIDTH &&
          ny >= 0 && ny < MAP_HEIGHT &&
          dx * dx + dy * dy <= radius * radius
        ) {
          map[ny][nx].type = TileType.ROCK;
        }
      }
    }
  }

  return map;
}

export function generateResourceNodes(map: Tile[][]): ResourceNode[] {
  const nodes: ResourceNode[] = [];

  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      const tile = map[y][x];

      if (tile.type === TileType.ROCK && Math.random() < 0.5) {
        const amount = randomRange(3, 10);
        tile.resourceAmount = amount;
        tile.resourceType = 'stone';
        nodes.push({
          id: generateId(),
          x: x * TILE_SIZE + TILE_SIZE / 2,
          y: y * TILE_SIZE + TILE_SIZE / 2,
          type: 'stone',
          amount,
          maxAmount: amount,
        });
      } else if (tile.type === TileType.GRASS && Math.random() < 0.06) {
        const amount = randomRange(5, 15);
        tile.resourceAmount = amount;
        tile.resourceType = 'wood';
        nodes.push({
          id: generateId(),
          x: x * TILE_SIZE + TILE_SIZE / 2,
          y: y * TILE_SIZE + TILE_SIZE / 2,
          type: 'wood',
          amount,
          maxAmount: amount,
        });
      } else if (tile.type === TileType.GRASS && Math.random() < 0.04) {
        const amount = randomRange(10, 20);
        tile.resourceAmount = amount;
        tile.resourceType = 'food';
        nodes.push({
          id: generateId(),
          x: x * TILE_SIZE + TILE_SIZE / 2,
          y: y * TILE_SIZE + TILE_SIZE / 2,
          type: 'food',
          amount,
          maxAmount: amount,
        });
      }
    }
  }

  return nodes;
}

export function findSafeSpawnPosition(map: Tile[][]): { x: number; y: number } {
  const centerX = Math.floor(MAP_WIDTH / 2);
  const centerY = Math.floor(MAP_HEIGHT / 2);

  for (let radius = 0; radius < 20; radius++) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = centerX + dx;
        const ny = centerY + dy;
        if (
          nx >= 1 && nx < MAP_WIDTH - 1 &&
          ny >= 1 && ny < MAP_HEIGHT - 1
        ) {
          const tile = map[ny][nx];
          if (
            (tile.type === TileType.GRASS || tile.type === TileType.DIRT) &&
            !tile.occupiedByBuilding &&
            tile.resourceAmount === 0
          ) {
            return {
              x: nx * TILE_SIZE + TILE_SIZE / 2,
              y: ny * TILE_SIZE + TILE_SIZE / 2,
            };
          }
        }
      }
    }
  }

  return {
    x: centerX * TILE_SIZE + TILE_SIZE / 2,
    y: centerY * TILE_SIZE + TILE_SIZE / 2,
  };
}

export function isTileBuildable(
  map: Tile[][],
  tileX: number,
  tileY: number,
  resourceNodes: ResourceNode[]
): boolean {
  if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) {
    return false;
  }
  const tile = map[tileY][tileX];
  if (tile.type === TileType.ROCK || tile.occupiedByBuilding) {
    return false;
  }
  const centerX = tileX * TILE_SIZE + TILE_SIZE / 2;
  const centerY = tileY * TILE_SIZE + TILE_SIZE / 2;
  for (const node of resourceNodes) {
    const dx = node.x - centerX;
    const dy = node.y - centerY;
    if (dx * dx + dy * dy < TILE_SIZE * TILE_SIZE) {
      return false;
    }
  }
  return true;
}
