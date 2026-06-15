export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface Position2D {
  x: number;
  y: number;
}

export type CharFont = 'songti' | 'kaiti' | 'lishu';

export type CharStatus = 'in-tray' | 'selected' | 'dragging' | 'in-plate' | 'inking' | 'printing';

export interface TypeChar {
  id: string;
  char: string;
  font: CharFont;
  trayRow: number;
  trayCol: number;
  trayPosition: Position3D;
  currentPosition: Position3D;
  targetPosition: Position3D;
  inkLevel: number;
  status: CharStatus;
  plateRow?: number;
  plateCol?: number;
  animationProgress?: number;
}

export interface TypePlate {
  rows: number;
  cols: number;
  isHorizontal: boolean;
  characters: TypeChar[];
}

export interface InkParams {
  inkLevel: number;
  inkQuality: 'light' | 'medium' | 'heavy';
  bleed: number;
}

export interface PrintResult {
  printId: string;
  content: string;
  inkQuality: 'light' | 'medium' | 'heavy';
  bleed: number;
  timestamp: number;
  imageData?: ImageData;
  dataUrl?: string;
}

export type AppMode = 'idle' | 'selecting' | 'dragging' | 'inking' | 'printing' | 'result';

export interface AppState {
  mode: AppMode;
  selectedCharId: string | null;
  draggingCharId: string | null;
  plate: TypePlate;
  trayChars: TypeChar[];
  inkParams: InkParams;
  isPrinting: boolean;
  scrollProgress: number;
  cropPosition: number;
  showingResult: boolean;
  inkingStartTime: number;
  pressStartTime: number;
}

export interface AnimationState {
  activeAnimations: Array<{
    charId: string;
    type: 'rise' | 'place' | 'return' | 'shrink';
    startTime: number;
    duration: number;
  }>;
  rippleTime: number;
  paperShakeTime: number;
  scrollRevealTime: number;
}

export const TRAY_ROWS = 12;
export const TRAY_COLS = 16;
export const PLATE_ROWS = 12;
export const PLATE_COLS = 10;
export const CHAR_SIZE = 0.5;
export const CHAR_GAP = 0.1;

export const COLORS = {
  PAPER_BG: '#EDE4D4',
  WOOD_DARK: '#6B4226',
  TRAY_CELL: '#D2B48C',
  BORDER_GRAY: '#AAAAAA',
  PAPER_XUAN: '#F5F0E1',
  CHAR_BLACK: '#1A1A1A',
  INK_BLACK: '#0A0A0A',
  INK_SATURATED: '#111111',
  GLOW_AMBER: '#FFBF00',
  GOLD_BORDER: '#D4AF37',
  BTN_BROWN: '#5C4033',
  BTN_INNER: '#E8C897',
  SCROLL_SILK: '#E8D5B7',
  CROP_LINE: '#B8860B',
  INK_LIGHT: '#888888',
  INK_MEDIUM: '#444444',
  INK_HEAVY: '#000000'
};
