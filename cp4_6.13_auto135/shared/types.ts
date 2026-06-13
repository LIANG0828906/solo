export type Position = {
  x: number;
  y: number;
};

export type BombType = 'basic' | 'delayed' | 'directional';

export type BombDirection = 'up' | 'down' | 'left' | 'right';

export type Bomb = {
  id: string;
  type: BombType;
  position: Position;
  playerId: string;
  placedAt: number;
  explodeAt?: number;
  direction?: BombDirection;
  isExploding: boolean;
};

export type Shockwave = {
  id: string;
  position: Position;
  radius: number;
  maxRadius: number;
  startTime: number;
  duration: number;
  bombType: BombType;
  direction?: BombDirection;
  penetrated: boolean;
};

export type Debris = {
  id: string;
  position: Position;
  velocity: Position;
  size: number;
  color: string;
  createdAt: number;
  lifetime: number;
};

export type Obstacle = {
  id: string;
  position: Position;
  width: number;
  height: number;
  hitByExplosion: boolean;
};

export type Player = {
  id: string;
  nickname: string;
  score: number;
  isCurrentTurn: boolean;
};

export type GameState = 'waiting' | 'playing' | 'ended';

export type Room = {
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
};

export type WSMessageType =
  | 'CREATE_ROOM'
  | 'JOIN_ROOM'
  | 'PLACE_BOMB'
  | 'TRIGGER_EXPLOSION'
  | 'GAME_STATE'
  | 'ROOM_CREATED'
  | 'PLAYER_JOINED'
  | 'NEXT_TURN'
  | 'SCORE_UPDATE'
  | 'ERROR';

export type CreateRoomMessage = {
  type: 'CREATE_ROOM';
  payload: {
    nickname: string;
  };
};

export type JoinRoomMessage = {
  type: 'JOIN_ROOM';
  payload: {
    roomCode: string;
    nickname: string;
  };
};

export type PlaceBombMessage = {
  type: 'PLACE_BOMB';
  payload: {
    roomCode: string;
    playerId: string;
    bombType: BombType;
    position: Position;
    direction?: BombDirection;
  };
};

export type TriggerExplosionMessage = {
  type: 'TRIGGER_EXPLOSION';
  payload: {
    roomCode: string;
    bombId: string;
  };
};

export type GameStateMessage = {
  type: 'GAME_STATE';
  payload: {
    room: Room;
  };
};

export type RoomCreatedMessage = {
  type: 'ROOM_CREATED';
  payload: {
    roomCode: string;
    playerId: string;
  };
};

export type PlayerJoinedMessage = {
  type: 'PLAYER_JOINED';
  payload: {
    player: Player;
  };
};

export type NextTurnMessage = {
  type: 'NEXT_TURN';
  payload: {
    currentPlayerIndex: number;
    currentPlayerId: string;
  };
};

export type ScoreUpdateMessage = {
  type: 'SCORE_UPDATE';
  payload: {
    playerId: string;
    score: number;
  };
};

export type ErrorMessage = {
  type: 'ERROR';
  payload: {
    message: string;
    code?: string;
  };
};

export type WSMessage =
  | CreateRoomMessage
  | JoinRoomMessage
  | PlaceBombMessage
  | TriggerExplosionMessage
  | GameStateMessage
  | RoomCreatedMessage
  | PlayerJoinedMessage
  | NextTurnMessage
  | ScoreUpdateMessage
  | ErrorMessage;

export type WSClientMessage =
  | CreateRoomMessage
  | JoinRoomMessage
  | PlaceBombMessage
  | TriggerExplosionMessage;

export type WSServerMessage =
  | GameStateMessage
  | RoomCreatedMessage
  | PlayerJoinedMessage
  | NextTurnMessage
  | ScoreUpdateMessage
  | ErrorMessage;
