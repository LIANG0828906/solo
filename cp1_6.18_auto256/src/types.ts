export type RoomType = 'start' | 'end' | 'normal' | 'treasure' | 'monster' | 'wall' | 'corridor';

export interface Room {
  x: number;
  y: number;
  type: RoomType;
  visited: boolean;
  hasMonster: boolean;
  monster?: Monster;
  hasTreasure: boolean;
  treasure?: Item;
}

export interface Monster {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  isHit: boolean;
}

export type ItemType = 'heal_potion' | 'energy_potion' | 'attack_boost';

export interface Item {
  id: string;
  type: ItemType;
  name: string;
  description: string;
  icon: string;
}

export interface Player {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  attack: number;
  attackBuffTurns: number;
  inventory: Item[];
  isDefending: boolean;
  isHit: boolean;
}

export interface BattleState {
  active: boolean;
  monster: Monster | null;
  playerTurn: boolean;
  log: string[];
}

export interface GameState {
  floor: number;
  map: Room[][];
  player: Player;
  battle: BattleState;
  isMoving: boolean;
  screenShake: boolean;
  damageVignette: boolean;
  pickingUpItem: Item | null;
  gameOver: boolean;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export type SkillType = 'attack' | 'defend' | 'special';

export const MAP_SIZE = 9;

export const ITEM_TEMPLATES: Record<ItemType, Omit<Item, 'id'>> = {
  heal_potion: {
    type: 'heal_potion',
    name: '回血药水',
    description: '恢复20点生命值',
    icon: '❤️',
  },
  energy_potion: {
    type: 'energy_potion',
    name: '能量药剂',
    description: '恢复30点能量',
    icon: '⚡',
  },
  attack_boost: {
    type: 'attack_boost',
    name: '攻击强化',
    description: '攻击力+5，持续3场战斗',
    icon: '⚔️',
  },
};

export const MONSTER_NAMES = ['史莱姆', '哥布林', '骷髅兵', '蝙蝠', '狼人'];
