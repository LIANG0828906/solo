export type PlayerColor = 'red' | 'blue' | 'yellow' | 'green';

export type Piece = {
  id: string;
  playerId: string;
  position: number;
  totalDistance: number;
  isFinished: boolean;
};

export type Player = {
  id: string;
  name: string;
  color: PlayerColor;
  pieces: Piece[];
  eventCards: EventCardType[];
  turnStartTime: number;
};

export type EventCardType = 'advance_clear' | 'back_collision' | 'teleport_teammate';

export type EventCard = {
  type: EventCardType;
  name: string;
  description: string;
};

export type Cell = {
  id: number;
  zone: PlayerColor | 'center';
  isStart: boolean;
  isEvent: boolean;
  specialMark?: 'arrow' | 'star';
  row: number;
  col: number;
};

export type CollisionResult = {
  collided: boolean;
  kickedPieceIds: string[];
  warning: string | null;
};

export type GameState = {
  players: Player[];
  cells: Cell[];
  currentPlayerIndex: number;
  diceValue: number | null;
  isRolling: boolean;
  activeEvent: EventCard | null;
  gamePhase: 'lobby' | 'playing' | 'finished';
  winner: Player | null;
  lastStateTimestamp: number;
  collidedPieces: string[];
  selectedPieceId: string | null;
  turnTimer: number;
  eventMessage: string | null;
};
