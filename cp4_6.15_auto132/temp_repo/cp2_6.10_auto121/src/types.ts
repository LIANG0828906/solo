export type WindLevel = '微风' | '和风' | '大风';

export interface WindData {
  angle: number;
  level: WindLevel;
  speed: number;
}

export interface ScoreRecord {
  round: number;
  arrowIndex: number;
  score: number;
  type: '上射' | '参射' | '干射' | '脱靶';
}

export interface Archer {
  id: number;
  name: string;
  title: string;
  scores: ScoreRecord[];
  totalScore: number;
  upperShots: number;
  currentArrow: number;
  position: { x: number; y: number };
}

export interface Arrow {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
  trail: Array<{ x: number; y: number }>;
  targetIndex: number;
}

export interface Target {
  x: number;
  y: number;
  distance: number;
  type: '虎皮' | '熊皮' | '豹皮';
  bullseyeDiameter: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

export interface Announcement {
  id: number;
  text: string;
  timestamp: number;
}

export type GamePhase = 'waiting' | 'aiming' | 'charging' | 'shooting' | 'scoring' | 'roundEnd';

export interface GameState {
  archers: Archer[];
  currentArcherIndex: number;
  currentRound: number;
  arrowsPerRound: number;
  targets: Target[];
  currentTargetIndex: number;
  phase: GamePhase;
  chargeLevel: number;
  isCharging: boolean;
  announcements: Announcement[];
}

export type GameAction =
  | { type: 'START_CHARGE' }
  | { type: 'UPDATE_CHARGE'; payload: number }
  | { type: 'RELEASE_ARROW'; payload: { angle: number; wind: WindData } }
  | { type: 'ARROW_HIT'; payload: { score: number; type: ScoreRecord['type']; archerId: number } }
  | { type: 'ARROW_MISS'; payload: { archerId: number } }
  | { type: 'NEXT_ARCHER' }
  | { type: 'NEXT_ROUND' }
  | { type: 'ADD_ANNOUNCEMENT'; payload: string }
  | { type: 'REMOVE_ANNOUNCEMENT'; payload: number }
  | { type: 'SET_PHASE'; payload: GamePhase }
  | { type: 'RESET_GAME' };
