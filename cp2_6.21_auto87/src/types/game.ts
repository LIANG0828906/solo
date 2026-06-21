export type PlayerSide = 'player' | 'opponent';

export type GamePhase = 'deploy' | 'playing' | 'ended';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export interface PlayerInfo {
  playerId: string;
  side: PlayerSide;
  connected: boolean;
}

export interface RoomState {
  roomId: string;
  players: PlayerInfo[];
  isFull: boolean;
  gameStarted: boolean;
  maxPlayers: number;
}

export type CardType = 'attack' | 'heal' | 'shield' | 'debuff' | 'utility';

export type TargetType = 'single' | 'all_friendly' | 'all_enemy' | 'random_enemy' | 'self' | 'none';

export type UnitType = 'hero' | 'minion';

export type EffectType = 'shield' | 'weakness' | 'attack_buff';

export type LogType = 'attack' | 'heal' | 'shield' | 'debuff' | 'system' | 'turn' | 'utility' | 'effect';

export type ActionType = 'play_card' | 'end_turn' | 'draw_card' | 'game_start' | 'game_end' | 'use_skill' | 'attack' | 'heal' | 'shield' | 'debuff' | 'deploy';

export interface Position {
  x: number;
  y: number;
}

export interface StatusEffect {
  id: string;
  type: EffectType;
  value: number;
  remainingTurns: number;
}

export interface CardEffect {
  damage?: number;
  heal?: number;
  shield?: number;
  attackModifier?: number;
  energyRestore?: number;
  ignoreShield?: boolean;
  duration?: number;
  targetCount?: number;
}

export interface Card {
  id: string;
  cardId: string;
  name: string;
  cost: number;
  type: CardType;
  description: string;
  targetType: TargetType;
  effect: CardEffect;
  icon: string;
}

export interface Unit {
  id: string;
  type: UnitType;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  baseAttack: number;
  shield: number;
  position: Position;
  owner: PlayerSide;
  effects: StatusEffect[];
}

export interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: LogType;
}

export interface ActionLog {
  id: string;
  timestamp: number;
  type: ActionType;
  playerId: PlayerSide;
  cardId?: string;
  targetId?: string;
  damage?: number;
  heal?: number;
  details: Record<string, unknown>;
}

export interface ReplayData {
  initialState: GameState;
  actions: ActionLog[];
  finalState: GameState;
  winner: PlayerSide | null;
}

export interface GameState {
  phase: GamePhase;
  currentTurn: PlayerSide;
  turnNumber: number;
  playerEnergy: number;
  opponentEnergy: number;
  maxEnergy: number;
  playerHand: Card[];
  opponentHand: Card[];
  playerDeck: Card[];
  opponentDeck: Card[];
  units: Unit[];
  selectedCard: Card | null;
  selectedTargetId: string | null;
  winner: PlayerSide | null;
  logs: LogEntry[];
  actionLogs: ActionLog[];
  playerSide: PlayerSide;
  roomId: string;
  stateVersion: number;
}
