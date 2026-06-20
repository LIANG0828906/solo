export type PlayerColor = 'red' | 'blue' | 'yellow' | 'green';

export interface Piece {
  id: string;
  position: number;
  distanceTraveled: number;
  isHome: boolean;
}

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  pieces: Piece[];
  eventCards: EventCardType[];
  isCurrentTurn: boolean;
}

export type EventCardType = 'advance2_clear' | 'retreat3_collision' | 'teleport_ally';

export interface BoardCell {
  index: number;
  zone: 'red' | 'blue' | 'yellow' | 'green' | 'center';
  row: number;
  col: number;
  isStart: boolean;
  startForColor?: PlayerColor;
  isEvent: boolean;
  isShortcut: boolean;
  shortcutTarget?: number;
}

export type GamePhase = 'waiting' | 'rolling' | 'moving' | 'event' | 'finished';

export interface GameEvent {
  type: 'collision' | 'event_card' | 'shortcut' | 'turn_timeout';
  description: string;
  affectedPieceIds: string[];
  timestamp: number;
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  diceValue: number | null;
  isRolling: boolean;
  phase: GamePhase;
  eventQueue: GameEvent[];
  winner: string | null;
  timestamp: number;
  turnTimer: number;
  selectedPieceId: string | null;
}
