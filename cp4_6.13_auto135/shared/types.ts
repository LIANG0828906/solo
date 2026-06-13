export interface Position {
  x: number;
  y: number;
}

export type BombType = 'basic' | 'delayed' | 'directional';

export interface Bomb {
  id: string;
  type: BombType;
  position: Position;
  playerId: string;
  placedAt: number;
  explodeAt?: number;
  direction?: number;
  isExploding: boolean;
  exploded?: boolean;
}

export interface Shockwave {
  id: string;
  position: Position;
  radius: number;
  maxRadius: number;
  startTime: number;
  duration: number;
  bombType: BombType;
  direction?: number;
  penetrated: number;
}

export interface Debris {
  id: string;
  position: Position;
  velocity: Position;
  size: number;
  color: string;
  createdAt: number;
  lifetime: number;
}

export interface Obstacle {
  id: string;
  position: Position;
  width: number;
  height: number;
  hitByExplosion: boolean;
}

export interface Player {
  id: string;
  nickname: string;
  score: number;
  isCurrentTurn: boolean;
}

export type GameState = 'waiting' | 'playing' | 'ended';

export interface Room {
  code: string;
  players: Player[];
  currentPlayerIndex: number;
  bombs: Bomb[];
  obstacles: Obstacle[];
  shockwaves: Shockwave[];
  debris: Debris[];
  gameState: GameState;
  roundStartTime: number;
  roundTimeLimit: number;
}

export interface LeaderboardEntry {
  nickname: string;
  score: number;
  date: string;
}

export type WSMessage =
  | { type: 'CREATE_ROOM'; nickname: string }
  | { type: 'JOIN_ROOM'; roomCode: string; nickname: string }
  | { type: 'PLACE_BOMB'; roomCode: string; playerId: string; bomb: Bomb }
  | { type: 'TRIGGER_EXPLOSION'; roomCode: string; bombId: string }
  | { type: 'GAME_STATE'; room: Room }
  | { type: 'ROOM_CREATED'; roomCode: string; playerId: string }
  | { type: 'PLAYER_JOINED'; player: Player }
  | { type: 'NEXT_TURN'; currentPlayerIndex: number }
  | { type: 'SCORE_UPDATE'; playerId: string; score: number; chainBombs: number; hitObstacles: number }
  | { type: 'LEAVE_ROOM'; roomCode: string; playerId: string }
  | { type: 'ERROR'; message: string };
