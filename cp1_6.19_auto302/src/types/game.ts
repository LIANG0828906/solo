export type NoteType = 'tap' | 'hold' | 'slide';
export type JudgeGrade = 'perfect' | 'good' | 'miss' | null;
export type TrackIndex = 0 | 1 | 2;

export interface Note {
  id: number;
  type: NoteType;
  track: TrackIndex;
  spawnTime: number;
  hitTime: number;
  holdEndTime?: number;
  slideDirection?: 'up' | 'down';
  y: number;
  judged: boolean;
  judgeGrade?: JudgeGrade;
  holdProgress?: number;
  isHolding?: boolean;
}

export interface JudgeResult {
  noteId: number;
  grade: Exclude<JudgeGrade, null>;
  timestamp: number;
  track: TrackIndex;
}

export interface RippleEffect {
  id: number;
  x: number;
  y: number;
  startTime: number;
  grade: 'perfect' | 'good';
}

export interface MissEffect {
  id: number;
  x: number;
  y: number;
  startTime: number;
}

export interface ComboParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  startTime: number;
  color: string;
  size: number;
}

export interface GameState {
  score: number;
  combo: number;
  maxCombo: number;
  perfectCount: number;
  goodCount: number;
  missCount: number;
  notes: Note[];
  startTime: number;
  isPlaying: boolean;
  isEnded: boolean;
  currentTime: number;
  ripples: RippleEffect[];
  missEffects: MissEffect[];
  comboParticles: ComboParticle[];
  comboShake: number;
  missFlash: number;
}

export interface GameActions {
  startGame: () => void;
  endGame: () => void;
  resetGame: () => void;
  setCurrentTime: (t: number) => void;
  addNote: (note: Note) => void;
  removeNote: (id: number) => void;
  updateNote: (id: number, updates: Partial<Note>) => void;
  applyJudge: (result: JudgeResult) => void;
  addRipple: (r: RippleEffect) => void;
  addMissEffect: (m: MissEffect) => void;
  triggerComboMilestone: () => void;
  cleanupEffects: (now: number) => void;
}

export const TRACK_COLORS = ['#4A90D9', '#E74C3C', '#2ECC71'] as const;
export const PERFECT_WINDOW = 30;
export const GOOD_WINDOW = 80;
export const NOTE_FALL_DURATION = 2000;
export const JUDGE_LINE_Y_RATIO = 2 / 3;

export const KEY_MAP: Record<string, TrackIndex> = {
  KeyD: 0,
  KeyF: 1,
  KeyJ: 2,
  KeyK: 2,
};

export const SCORE_MAP = {
  perfect: 300,
  good: 150,
  miss: 0,
} as const;
