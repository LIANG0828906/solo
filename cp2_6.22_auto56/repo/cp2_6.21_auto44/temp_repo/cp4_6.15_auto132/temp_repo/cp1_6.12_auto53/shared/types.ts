export type TileType = 'wall' | 'floor' | 'stairs_up' | 'stairs_down';

export type ItemType = 'key' | 'health_potion' | 'shield' | 'fireball' | 'cloak';

export interface Position {
  x: number;
  y: number;
}

export interface Tile {
  type: TileType;
  position: Position;
  item?: ItemType;
}

export interface Player {
  id: string;
  position: Position;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  inventory: ItemType[];
  floor: number;
}

export interface Monster {
  id: string;
  position: Position;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
}

export interface DungeonMap {
  width: number;
  height: number;
  tiles: Tile[][];
  monsters: Monster[];
  playerStart: Position;
}

export interface CombatRequest {
  playerId: string;
  monsterId: string;
  roomId: string;
  playerAttack: number;
  playerDefense: number;
  playerHp: number;
  monsterHp: number;
}

export interface CombatResult {
  playerDamage: number;
  monsterDamage: number;
  playerHp: number;
  monsterHp: number;
  monsterDefeated: boolean;
  log: string;
}

export interface RoomState {
  id: string;
  players: Map<string, Player>;
  currentMap: DungeonMap | null;
  currentFloor: number;
  combatLog: string[];
}

export const MAP_WIDTH = 15;
export const MAP_HEIGHT = 15;
export const ITEM_TYPES: ItemType[] = ['key', 'health_potion', 'shield', 'fireball', 'cloak'];

export const ITEM_NAMES: Record<ItemType, string> = {
  key: '钥匙',
  health_potion: '血瓶',
  shield: '盾牌',
  fireball: '火球',
  cloak: '隐身斗篷',
};

export const COLORS = {
  background: '#1a1a1a',
  wall: '#333333',
  floor: '#666666',
  player: '#00aaff',
  playerGlow: 'rgba(0, 170, 255, 0.3)',
  monster: '#ff3333',
  item: '#ffd700',
  hover: '#ffff99',
  stairsUp: '#8b4513',
  stairsDown: '#4a4a8a',
  text: '#ffffff',
  hpGreen: '#00ff00',
  hpYellow: '#ffff00',
  hpRed: '#ff0000',
} as const;
