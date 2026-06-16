export interface GridCoord {
  x: number;
  y: number;
}

export interface PixelCoord {
  x: number;
  y: number;
}

export type ElementType = 'mirror' | 'prism' | 'blocker';

export type MirrorOrientation = 'nw-se' | 'ne-sw';

export interface OpticalElement {
  id: string;
  type: ElementType;
  position: GridCoord;
  orientation?: MirrorOrientation;
  movable: boolean;
  owner: 'playerA' | 'playerB' | 'neutral';
}

export interface LaserSegment {
  start: PixelCoord;
  end: PixelCoord;
  intensity: number;
}

export interface ParticleEffect {
  id: string;
  position: PixelCoord;
  color: string;
  createdAt: number;
  duration: number;
}

export interface LaserResult {
  segments: LaserSegment[];
  hitBase: 'playerA' | 'playerB' | null;
  hitPosition: PixelCoord | null;
  particles: ParticleEffect[];
}

export interface PlayerState {
  id: string;
  name: 'playerA' | 'playerB';
  lives: number;
  score: number;
  connected: boolean;
}

export type GamePhase = 'matching' | 'playing' | 'ended';
export type TurnPhase = 'adjust' | 'fire' | 'resolve';

export interface GameState {
  phase: GamePhase;
  currentTurn: 'playerA' | 'playerB';
  turnPhase: TurnPhase;
  round: number;
  timeRemaining: number;
  players: Record<'playerA' | 'playerB', PlayerState>;
  elements: OpticalElement[];
  laserResult: LaserResult | null;
  isFiring: boolean;
  winner: 'playerA' | 'playerB' | 'draw' | null;
  roomCode: string | null;
  localPlayer: 'playerA' | 'playerB' | null;
}

export interface ServerToClientEvents {
  'room:joined': (data: { roomCode: string; player: 'playerA' | 'playerB' }) => void;
  'room:full': () => void;
  'game:start': (state: GameState) => void;
  'game:state': (state: Partial<GameState>) => void;
  'game:turn': (data: { turn: 'playerA' | 'playerB'; phase: TurnPhase; time: number }) => void;
  'element:moved': (data: { elementId: string; position: GridCoord }) => void;
  'laser:fired': (result: LaserResult) => void;
  'game:end': (data: { winner: 'playerA' | 'playerB' | 'draw' }) => void;
  'error': (message: string) => void;
}

export interface ClientToServerEvents {
  'room:create': () => void;
  'room:join': (roomCode: string) => void;
  'element:move': (data: { elementId: string; position: GridCoord }) => void;
  'laser:fire': () => void;
  'game:restart': () => void;
}

export const GRID_SIZE = 8;
export const CELL_SIZE = 80;
export const BOARD_SIZE = GRID_SIZE * CELL_SIZE;
export const SNAP_THRESHOLD = 40;
export const TURN_DURATION = 15;
export const MAX_ROUNDS = 5;
export const INITIAL_LIVES = 3;

export const COLORS = {
  background: {
    start: '#1A1A2E',
    end: '#16213E'
  },
  board: '#2C2C2C',
  gridLine: '#4A4A4A',
  playerA: '#FF4444',
  playerB: '#4444FF',
  mirror: '#FFD700',
  prism: '#C0C0C0',
  blocker: '#00BFFF',
  laser: '#FF2222',
  particle: '#87CEEB',
  glowA: '#FF444440',
  glowB: '#4444FF40',
  gold: '#FFD700'
};
