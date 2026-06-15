export type CellType = 'wall' | 'floor' | 'corridor' | 'chest' | 'trap' | 'room_entrance';

export interface DungeonCell {
  type: CellType;
  roomId: number | null;
  revealed: boolean;
}

export interface DungeonRoom {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DungeonData {
  grid: DungeonCell[][];
  rooms: DungeonRoom[];
  seed: string;
  seedHash: string;
}

export interface MonsterTemplate {
  id: string;
  name: string;
  challengeRating: number;
  hp: number;
  ac: number;
  attackDice: string;
  icon: string;
  silhouette: string;
}

export interface PlacedMonster {
  id: string;
  templateId: string;
  name: string;
  challengeRating: number;
  hp: number;
  maxHp: number;
  ac: number;
  attackDice: string;
  icon: string;
  gridX: number;
  gridY: number;
}

export interface PlayerCharacter {
  id: string;
  name: string;
  class: string;
  hp: number;
  maxHp: number;
  ac: number;
  attackDice: string;
  initiative: number;
  gridX: number;
  gridY: number;
  color: string;
}

export interface CombatAction {
  round: number;
  actorId: string;
  actorName: string;
  actorType: 'player' | 'monster';
  targetId: string;
  targetName: string;
  hit: boolean;
  damage: number;
  targetRemainingHp: number;
  critical: boolean;
}

export interface CombatState {
  round: number;
  turnIndex: number;
  turnOrder: CombatParticipant[];
  isAutoRunning: boolean;
  isPaused: boolean;
  isFinished: boolean;
  logs: CombatAction[];
}

export interface CombatParticipant {
  id: string;
  name: string;
  type: 'player' | 'monster';
  hp: number;
  maxHp: number;
  ac: number;
  attackDice: string;
  initiative: number;
  gridX: number;
  gridY: number;
  icon: string;
  color: string;
}

export type AppMode = 'generate' | 'place' | 'battle';

export interface MonsterEdit {
  monsterId: string;
  hp: number;
  maxHp: number;
  ac: number;
  attackDice: string;
}

export const MONSTER_TEMPLATES: MonsterTemplate[] = [
  { id: 'rat', name: '巨鼠', challengeRating: 0, hp: 7, ac: 10, attackDice: '1d4', icon: '🐀', silhouette: '🦇' },
  { id: 'goblin', name: '哥布林', challengeRating: 0.25, hp: 7, ac: 15, attackDice: '1d6', icon: '👺', silhouette: '👹' },
  { id: 'skeleton', name: '骷髅兵', challengeRating: 0.25, hp: 13, ac: 13, attackDice: '1d6', icon: '💀', silhouette: '☠️' },
  { id: 'zombie', name: '僵尸', challengeRating: 0.25, hp: 22, ac: 8, attackDice: '1d6', icon: '🧟', silhouette: '👾' },
  { id: 'wolf', name: '灰狼', challengeRating: 0.5, hp: 11, ac: 13, attackDice: '2d4', icon: '🐺', silhouette: '🐕' },
  { id: 'bandit', name: '强盗', challengeRating: 0.5, hp: 11, ac: 12, attackDice: '1d6', icon: '🗡️', silhouette: '⚔️' },
  { id: 'orc', name: '兽人', challengeRating: 0.5, hp: 15, ac: 13, attackDice: '1d8', icon: '👹', silhouette: '🔨' },
  { id: 'bugbear', name: '熊地精', challengeRating: 1, hp: 27, ac: 15, attackDice: '2d8', icon: '🦍', silhouette: '🐻' },
  { id: 'spider_giant', name: '巨型蜘蛛', challengeRating: 1, hp: 26, ac: 14, attackDice: '1d8', icon: '🕷️', silhouette: '🕸️' },
  { id: 'ghoul', name: '食尸鬼', challengeRating: 1, hp: 22, ac: 12, attackDice: '2d6', icon: '👻', silhouette: '💀' },
  { id: 'ogre', name: '食人魔', challengeRating: 2, hp: 59, ac: 11, attackDice: '2d8+4', icon: '🗿', silhouette: '🪨' },
  { id: 'minotaur', name: '牛头人', challengeRating: 3, hp: 76, ac: 14, attackDice: '2d10+4', icon: '🐂', silhouette: '🪓' },
  { id: 'troll', name: '巨魔', challengeRating: 5, hp: 84, ac: 15, attackDice: '2d6+5', icon: '🧌', silhouette: '🏋️' },
  { id: 'dragon_wyrmling', name: '幼龙', challengeRating: 4, hp: 52, ac: 17, attackDice: '2d10', icon: '🐉', silhouette: '🔥' },
  { id: 'lich', name: '巫妖', challengeRating: 21, hp: 135, ac: 17, attackDice: '8d8', icon: '🧙', silhouette: '☠️' },
];

export const PLAYER_CLASSES = [
  '战士', '法师', '盗贼', '牧师', '游侠', '圣骑士', '术士', '吟游诗人'
];

export const PLAYER_COLORS = [
  '#4fc3f7', '#81c784', '#ffb74d', '#e57373', '#ba68c8', '#4dd0e1'
];
