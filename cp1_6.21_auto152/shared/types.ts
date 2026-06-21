export type CardType = 'attack' | 'defense' | 'skill';
export type EnemyType = 'goblin' | 'skeleton' | 'darkMage';
export type Phase = 'playerTurn' | 'enemyTurn' | 'victory' | 'defeat';

export interface Card {
  id: string;
  name: string;
  type: CardType;
  value: number;
  description: string;
}

export interface Enemy {
  id: string;
  name: string;
  type: EnemyType;
  hp: number;
  maxHP: number;
  shield: number;
  attack: number;
  specialTimer?: number;
}

export interface BattleStats {
  rounds: number;
  totalDamage: number;
  totalShield: number;
  cardsDrawn: number;
}

export interface BattleState {
  round: number;
  playerHP: number;
  playerMaxHP: number;
  playerShield: number;
  hand: Card[];
  deck: Card[];
  enemies: Enemy[];
  phase: Phase;
  stats: BattleStats;
}

export interface RoomState {
  roomId: string;
  players: string[];
  currentPlayerIndex: number;
  battleState: BattleState | null;
}

export interface BattleAction {
  type: 'playCard' | 'endTurn';
  cardIndex?: number;
  targetEnemyIndex?: number;
}

export interface BattleActionRequest {
  playerId: string;
  roomId?: string;
  action: BattleAction;
}

export interface BattleActionResponse {
  success: boolean;
  battleState: BattleState;
  damageDealt?: number;
  shieldGained?: number;
  cardsDrawn?: number;
}

export interface BattleResultResponse {
  victory: boolean;
  stats: BattleStats;
}

export interface CreateRoomRequest {
  playerName: string;
}

export interface CreateRoomResponse {
  roomId: string;
  players: string[];
}

export interface JoinRoomRequest {
  playerName: string;
}

export interface JoinRoomResponse {
  success: boolean;
  roomId: string;
  players: string[];
}

export interface RoomStatusResponse {
  roomId: string;
  players: string[];
  currentPlayerIndex: number;
  battleState: BattleState | null;
}
