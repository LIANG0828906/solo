export enum TileType {
  WALL = 0,
  FLOOR = 1,
  CORRIDOR = 2,
}

export interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface DungeonMap {
  width: number;
  height: number;
  tiles: TileType[][];
  rooms: Room[];
  seed: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  damage: number;
  mpCost: number;
  cooldown: number;
  currentCooldown: number;
  icon: string;
}

export interface Player {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  skills: Skill[];
}

export interface Monster {
  id: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  attack: number;
  name: string;
}

export type LogEntryType = 'player' | 'enemy' | 'system';

export interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: LogEntryType;
}

export interface HistoryRecord {
  id: string;
  timestamp: Date;
  seed: number;
  mapWidth: number;
  mapHeight: number;
  roomCount: number;
  monsterCount: number;
}

export interface GeneratorParams {
  width: number;
  height: number;
  roomCount: number;
  monsterCount: number;
  seed?: number;
}

export interface Position {
  x: number;
  y: number;
}
