export enum TileType {
  EMPTY = 'empty',
  GRASS = 'grass',
  DIRT = 'dirt',
  STONE = 'stone'
}

export enum EntityType {
  COIN = 'coin',
  ENEMY = 'enemy',
  HEALTH = 'health'
}

export enum ToolType {
  SELECT = 'select',
  GRASS = 'grass',
  DIRT = 'dirt',
  STONE = 'stone',
  COIN = 'coin',
  ENEMY = 'enemy',
  HEALTH = 'health'
}

export interface Position {
  x: number;
  y: number;
}

export interface Tile {
  type: TileType;
  merged?: boolean;
}

export interface EnemyConfig {
  id: string;
  type: 'mushroom';
  path: Position[];
  gridX: number;
  gridY: number;
}

export interface CoinConfig {
  id: string;
  gridX: number;
  gridY: number;
  collected?: boolean;
}

export interface HealthConfig {
  id: string;
  gridX: number;
  gridY: number;
  collected?: boolean;
}

export interface LevelConfig {
  width: number;
  height: number;
  tileSize: number;
  tiles: TileType[][];
  enemies: EnemyConfig[];
  coins: CoinConfig[];
  healthPickups: HealthConfig[];
}

export type EditorUpdateHandler = () => void;
export type ToolChangeHandler = (tool: ToolType) => void;

export interface EditorStateSnapshot {
  tiles: TileType[][];
  enemies: EnemyConfig[];
  coins: CoinConfig[];
  healthPickups: HealthConfig[];
}
