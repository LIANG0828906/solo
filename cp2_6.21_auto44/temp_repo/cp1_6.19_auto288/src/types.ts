export type TileType = 'wall' | 'corridor' | 'room';

export type DecorationType = 'torch' | 'chest' | 'rubble' | 'bones' | null;

export interface Tile {
  type: TileType;
  decoration: DecorationType;
  x: number;
  y: number;
  visible: boolean;
  explored: boolean;
}

export interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface Position {
  x: number;
  y: number;
}

export type MonsterType = 'slime' | 'goblin' | 'skeleton' | 'orc' | 'boss';

export interface Monster {
  id: string;
  type: MonsterType;
  name: string;
  position: Position;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  expReward: number;
  isBoss: boolean;
}

export type SkillId = 'fireball' | 'frost_nova' | 'heal_wave' | 'poison_blade';

export interface Skill {
  id: SkillId;
  name: string;
  description: string;
  damage: number;
  manaCost: number;
  cooldown: number;
  currentCooldown: number;
  type: 'damage' | 'aoe' | 'heal' | 'dot';
  color: string;
  icon: string;
}

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type ItemType = 'weapon' | 'armor' | 'potion';

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  attack?: number;
  defense?: number;
  hpRestore?: number;
  manaRestore?: number;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  critRate: number;
  dodgeRate: number;
  level: number;
  exp: number;
  expToNext: number;
  gold: number;
}

export interface Player {
  position: Position;
  stats: PlayerStats;
  skills: Skill[];
  inventory: Item[];
  equippedWeapon: Item | null;
  equippedArmor: Item | null;
  buffs: Buff[];
}

export interface Buff {
  id: string;
  name: string;
  type: 'poison' | 'frost' | 'attack_up' | 'defense_up';
  duration: number;
  value: number;
}

export interface CombatLogEntry {
  id: string;
  message: string;
  type: 'player_attack' | 'monster_attack' | 'skill' | 'loot' | 'system' | 'level_up';
  timestamp: number;
}

export interface CombatState {
  isInCombat: boolean;
  currentMonster: Monster | null;
  combatLogs: CombatLogEntry[];
  playerTurn: boolean;
}

export interface MapData {
  width: number;
  height: number;
  tiles: Tile[][];
  rooms: Room[];
  monsters: Monster[];
  seed: number;
  floor: number;
  bossPosition: Position;
  items: MapItem[];
}

export interface MapItem {
  id: string;
  position: Position;
  item: Item;
}

export type GamePhase = 'title' | 'exploring' | 'combat' | 'victory' | 'defeat' | 'shop';

export interface GameState {
  phase: GamePhase;
  player: Player;
  mapData: MapData | null;
  combat: CombatState;
  currentFloor: number;
  messages: string[];
}
