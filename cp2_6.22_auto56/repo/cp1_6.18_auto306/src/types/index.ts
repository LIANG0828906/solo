export interface Tile {
  x: number;
  y: number;
  type: 'wall' | 'floor' | 'corridor' | 'door';
}

export interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  id: number;
}

export interface DungeonMap {
  width: number;
  height: number;
  tiles: Tile[][];
  rooms: Room[];
  startRoom: Room;
  endRoom: Room;
}

export interface EchoShard {
  id: number;
  x: number;
  y: number;
  collected: boolean;
  flickerTimer: number;
  flickerSpeed: number;
  rotation: number;
}

export interface ShadowGuard {
  id: number;
  x: number;
  y: number;
  mode: 'patrol' | 'chase';
  patrolPath: { x: number; y: number }[];
  patrolIndex: number;
  speed: number;
  stunTimer: number;
  trail: { x: number; y: number; alpha: number }[];
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  life: number;
  maxLife: number;
  active: boolean;
}

export type GameStatus = 'menu' | 'playing' | 'paused' | 'gameover' | 'victory';

export type AreaName = '遗忘之厅' | '低语回廊' | '暗影深窟' | '回音之心';

export interface MemoryFragment {
  area: AreaName;
  text: string;
}

export const AREA_NAMES: AreaName[] = ['遗忘之厅', '低语回廊', '暗影深窟', '回音之心'];

export const MEMORY_FRAGMENTS: MemoryFragment[] = [
  { area: '遗忘之厅', text: '这里曾是辉煌的殿堂...如今只剩回声游荡...' },
  { area: '低语回廊', text: '我听见了...有人在呼唤我的名字...' },
  { area: '暗影深窟', text: '黑暗中藏着被遗忘的真相...' },
  { area: '回音之心', text: '所有的记忆终于汇聚...地牢苏醒了...' },
];

export const TILE_SIZE = 32;
export const PLAYER_SIZE = 12;
export const SHARD_WIDTH = 6;
export const SHARD_HEIGHT = 10;
export const GUARD_SIZE = 10;
