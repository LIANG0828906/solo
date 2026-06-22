export type ShipType = 'carrier' | 'battleship' | 'destroyer' | 'submarine';
export type EchoResult = 'HIT' | 'CLOSE' | 'WARM' | 'COLD';
export type GamePhase = 'menu' | 'waiting' | 'playing' | 'gameover';
export type Turn = 'player' | 'opponent';
export type Orientation = 'horizontal' | 'vertical';

export interface ShipCell {
  x: number;
  y: number;
}

export interface Ship {
  id: string;
  type: ShipType;
  name: string;
  length: number;
  cells: ShipCell[];
  hits: ShipCell[];
  sunk: boolean;
}

export interface SonarResult {
  x: number;
  y: number;
  result: EchoResult;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  sender: 'player' | 'opponent' | 'system';
  content: string;
  timestamp: number;
}

export interface SonarPulseAnimation {
  id: string;
  x: number;
  y: number;
  startTime: number;
  duration: number;
  isHit: boolean;
  particles: Particle[];
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  startTime: number;
  duration: number;
}

export interface ShipConfig {
  type: ShipType;
  name: string;
  length: number;
  count: number;
  colors: string[];
}

export interface GameState {
  roomCode: string | null;
  playerId: string | null;
  playerName: string;
  opponentName: string | null;
  opponentId: string | null;
  gamePhase: GamePhase;
  currentTurn: Turn;
  turnTimeRemaining: number;
  myShips: Ship[];
  opponentShips: Ship[];
  mySonarResults: SonarResult[];
  opponentSonarResults: SonarResult[];
  mySunkCount: number;
  opponentSunkCount: number;
  messages: ChatMessage[];
  opponentConnected: boolean;
  isReconnecting: boolean;
  winner: 'player' | 'opponent' | null;
  activePulse: SonarPulseAnimation | null;
  pendingTarget: ShipCell | null;
  showHitEffect: boolean;
  notification: string | null;
}

export const SHIP_CONFIGS: ShipConfig[] = [
  { type: 'carrier', name: '航母', length: 5, count: 1, colors: ['#991B1B', '#DC2626', '#F87171'] },
  { type: 'battleship', name: '战列舰', length: 4, count: 2, colors: ['#C2410C', '#EA580C', '#FB923C'] },
  { type: 'destroyer', name: '驱逐舰', length: 3, count: 3, colors: ['#A16207', '#CA8A04', '#FACC15'] },
  { type: 'submarine', name: '潜艇', length: 2, count: 4, colors: ['#4B5563', '#6B7280', '#9CA3AF'] },
];

export const GRID_SIZE = 10;
export const TURN_DURATION = 45;
export const SONAR_DELAY = 2500;
export const PULSE_DURATION = 1500;
