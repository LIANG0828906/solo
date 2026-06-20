export type CellType = 'wall' | 'room' | 'corridor';

export interface Room {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  explored: boolean;
  eventTriggered: boolean;
}

export interface Corridor {
  id: string;
  cells: { x: number; y: number }[];
}

export interface DungeonMap {
  grid: CellType[][];
  rooms: Room[];
  corridors: Corridor[];
  width: number;
  height: number;
}

export interface Player {
  x: number;
  y: number;
  renderX: number;
  renderY: number;
  health: number;
  maxHealth: number;
  isMoving: boolean;
}

export type EventType = 'beneficial' | 'harmful' | 'neutral';

export interface EventCard {
  id: string;
  type: EventType;
  name: string;
  description: string;
}

export type GameStatus = 'playing' | 'won' | 'lost';

export interface GameState {
  map: DungeonMap | null;
  player: Player;
  currentEvent: EventCard | null;
  showEventModal: boolean;
  gameStatus: GameStatus;
  exploredRooms: number;
  totalRooms: number;
  startTime: number;
  elapsedTime: number;
  hintText: string;
}

export interface GameRecord {
  id: string;
  result: 'won' | 'lost';
  time: number;
  roomsExplored: number;
  remainingHealth: number;
  timestamp: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';
