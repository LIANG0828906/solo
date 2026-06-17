export interface Pixel {
  id: string;
  x: number;
  y: number;
  color: string;
  timestamp: number;
  ownerId?: string;
}

export type CollabMessageType =
  | 'PIXEL_ADD'
  | 'PIXEL_UNDO'
  | 'SYNC_REQUEST'
  | 'SYNC_RESPONSE'
  | 'USER_JOIN'
  | 'USER_LEAVE'
  | 'HEARTBEAT';

export interface CollabMessage {
  type: CollabMessageType;
  senderId: string;
  pixel?: Pixel;
  pixelId?: string;
  pixels?: Pixel[];
  timestamp?: number;
}

export interface PixelBoardState {
  pixels: Pixel[];
  redoStack: Pixel[][];
  currentColor: string;
  presetColors: string[];
  onlineUsers: number;
  userId: string;
  isConnected: boolean;
  addPixel: (pixel: Pixel) => void;
  addRemotePixel: (pixel: Pixel) => void;
  undo: () => Pixel | null;
  setPixels: (pixels: Pixel[]) => void;
  setCurrentColor: (color: string) => void;
  setPresetColors: (colors: string[]) => void;
  setOnlineUsers: (count: number) => void;
  setConnected: (connected: boolean) => void;
  removePixelById: (id: string) => Pixel | null;
}

export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

export const GRID_SIZE = 32;
export const PIXEL_SIZE = 20;
export const CANVAS_SIZE = GRID_SIZE * PIXEL_SIZE;

export const DEFAULT_COLORS: string[] = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
  '#FF00FF', '#00FFFF', '#FF8000', '#8000FF', '#0080FF', '#00FF80',
  '#FF0080', '#808080', '#C0C0C0', '#800000', '#808000', '#008000',
  '#800080', '#008080', '#000080', '#FFA500', '#A52A2A', '#DEB887',
];
