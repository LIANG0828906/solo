export type PlayerId = 'player1' | 'player2';
export type TerrainType = 'plain' | 'forest' | 'mountain' | 'river' | 'desert';
export type UnitType = 'infantry' | 'archer' | 'knight';
export type GamePhase = 'lobby' | 'playing' | 'ended';

export interface Position {
  x: number;
  y: number;
}

export interface TerrainCell {
  position: Position;
  terrain: TerrainType;
}

export interface Unit {
  id: string;
  type: UnitType;
  owner: PlayerId;
  position: Position;
  hp: number;
  maxHp: number;
  attack: number;
  movePoints: number;
  maxMovePoints: number;
  hasMoved: boolean;
  hasAttacked: boolean;
}

export interface ResourcePoint {
  id: string;
  position: Position;
  owner: PlayerId | null;
}

export interface Base {
  owner: PlayerId;
  position: Position;
  hp: number;
  maxHp: number;
}

export interface PlayerState {
  id: PlayerId;
  gold: number;
  socketId: string;
}

export interface LogEntry {
  timestamp: number;
  player: PlayerId;
  action: string;
  detail: string;
}

export interface GameState {
  roomId: string;
  map: TerrainCell[][];
  units: Unit[];
  resourcePoints: ResourcePoint[];
  bases: Base[];
  currentPlayer: PlayerId;
  turnNumber: number;
  players: PlayerState[];
  turnTimeLeft: number;
  gameLog: LogEntry[];
  phase: GamePhase;
}

export interface GameAction {
  type: 'move' | 'attack' | 'move_and_attack';
  unitId: string;
  targetPosition: Position;
}

export interface ActionResult {
  success: boolean;
  damage?: number;
  killed?: boolean;
  goldEarned?: number;
  message: string;
}

export interface DeployAction {
  unitType: UnitType;
  position: Position;
}

export interface TerrainEffect {
  moveCost: number;
  attackBonus: number;
  defenseBonus: number;
  dodgeBonus: number;
  flyingIgnore: boolean;
}

export interface UnitConfig {
  type: UnitType;
  name: string;
  cost: number;
  attack: number;
  hp: number;
  movePoints: number;
  special?: string;
  icon: string;
}

export interface ServerToClientEvents {
  'game:state': (state: GameState) => void;
  'game:start': (state: GameState) => void;
  'game:action_result': (result: ActionResult) => void;
  'game:turn_change': (data: { currentPlayer: PlayerId; timeLeft: number }) => void;
  'game:over': (data: { winner: PlayerId; reason: string }) => void;
  'room:created': (data: { roomId: string; playerId: PlayerId }) => void;
  'room:joined': (data: { roomId: string; playerId: PlayerId; players: string[] }) => void;
  'room:player_joined': (data: { playerId: PlayerId }) => void;
  'error': (message: string) => void;
}

export interface ClientToServerEvents {
  'room:create': () => void;
  'room:join': (data: { roomId: string }) => void;
  'game:action': (action: GameAction) => void;
  'game:end_turn': () => void;
  'game:deploy_unit': (data: DeployAction) => void;
}
