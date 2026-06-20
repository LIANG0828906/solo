export enum Rarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

export enum SkillType {
  ACTIVE_SUMMON = 'active_summon',
  ACTIVE_ATTACK = 'active_attack',
  PASSIVE_GLOBAL = 'passive_global',
  PASSIVE_BUFF = 'passive_buff',
}

export enum SkillEffect {
  DAMAGE_ALL_ENEMIES = 'damage_all_enemies',
  DAMAGE_FRONT_ENEMY = 'damage_front_enemy',
  HEAL_ALL_ALLIES = 'heal_all_allies',
  BUFF_ATTACK_ALLIES = 'buff_attack_allies',
  BUFF_DEFENSE_ALLIES = 'buff_defense_allies',
  DRAW_CARD = 'draw_card',
  TAUNT = 'taunt',
  CHARGE = 'charge',
  SHIELD = 'shield',
  PIERCE = 'pierce',
  LIFESTEAL = 'lifesteal',
  BURN = 'burn',
  FREEZE = 'freeze',
}

export interface Card {
  id: string;
  name: string;
  cost: number;
  attack: number;
  defense: number;
  description: string;
  rarity: Rarity;
  skillType: SkillType;
  skillEffect: SkillEffect | null;
  skillValue: number;
  skillDescription: string;
}

export interface BoardCard extends Card {
  instanceId: string;
  currentAttack: number;
  currentDefense: number;
  maxDefense: number;
  canAttack: boolean;
  hasAttacked: boolean;
  position: Position;
  owner: 'player' | 'ai';
  isFrozen: boolean;
  isShielded: boolean;
  hasCharge: boolean;
  hasTaunt: boolean;
  hasPierce: boolean;
  hasLifesteal: boolean;
  burnDamage: number;
}

export interface Position {
  row: number;
  col: number;
}

export interface PlayerState {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  hand: Card[];
  deck: Card[];
  board: BoardCard[];
  graveyard: Card[];
}

export enum GamePhase {
  PREPARING = 'preparing',
  PLAYING = 'playing',
  ENDED = 'ended',
}

export enum TurnPlayer {
  PLAYER = 'player',
  AI = 'ai',
}

export enum LogType {
  PLAYER = 'player',
  AI = 'ai',
  SYSTEM = 'system',
}

export interface BattleLogEntry {
  id: string;
  timestamp: number;
  type: LogType;
  message: string;
}

export interface GameState {
  phase: GamePhase;
  turn: TurnPlayer;
  turnNumber: number;
  player: PlayerState;
  ai: PlayerState;
  logs: BattleLogEntry[];
  winner: TurnPlayer | null;
  selectedCardIndex: number | null;
  selectedBoardCardId: string | null;
  isDragging: boolean;
  dragCard: Card | null;
  skillEffectPlaying: string | null;
}
