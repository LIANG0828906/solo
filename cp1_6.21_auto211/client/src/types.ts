export interface Player {
  id: string;
  nickname: string;
  avatarColor: string;
  isDrawing?: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  points: Point[];
  color: string;
  width: number;
  playerId: string;
}

export interface CanvasData {
  strokes: Stroke[];
}

export interface Room {
  id: string;
  name: string;
  players: Player[];
  maxPlayers: number;
  hasPassword: boolean;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  duration?: number;
}

export type Page = 'room-select' | 'drawing';
