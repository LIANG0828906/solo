export type TrackIndex = 0 | 1 | 2 | 3;

export type NoteType = 'tap' | 'hold' | 'swipe';

export type Judgment = 'perfect' | 'good' | 'miss';

export type NoteTypeLabel = '普通单点' | '长按Hold' | '滑动Swipe';

export interface Note {
  id: string;
  time: number;
  track: TrackIndex;
  type: NoteType;
  duration?: number;
}

export type TimeSignature = '4/4' | '3/4' | '6/8';

export interface Beatmap {
  version: string;
  title: string;
  bpm: number;
  timeSignature: TimeSignature;
  offset: number;
  notes: Note[];
  audioFileName?: string;
}

export type GameMode = 'editor' | 'playing' | 'practice';

export type PlaybackSpeed = 0.5 | 0.75 | 1.0 | 1.5;

export interface HitEvent {
  noteId: string;
  track: TrackIndex;
  time: number;
  judgment: Judgment;
  deviation: number;
}

export interface RippleEffect {
  id: string;
  track: TrackIndex;
  judgment: Judgment;
  startTime: number;
}

export interface ComboBurstEffect {
  id: string;
  combo: number;
  startTime: number;
  level: 10 | 30 | 50 | 100;
}

export interface MissIndicator {
  track: TrackIndex;
  noteId: string;
  time: number;
}

export interface GameStateData {
  mode: GameMode;
  isPlaying: boolean;
  currentTime: number;
  score: number;
  combo: number;
  maxCombo: number;
  perfectCount: number;
  goodCount: number;
  missCount: number;
  playbackSpeed: PlaybackSpeed;
  loopEnabled: boolean;
  loopStart: number;
  loopEnd: number;
  activeNotes: Note[];
  hitNotes: Map<string, Judgment>;
  holdProgress: Map<string, number>;
  lastHitEvent: HitEvent | null;
  rippleEffects: RippleEffect[];
  comboBurstEffects: ComboBurstEffect[];
  missIndicator: MissIndicator | null;
  isPausedForMiss: boolean;
  screenFlash: { level: 10 | 30 | 50 | 100; startTime: number } | null;
}

export interface GameEngineCallbacks {
  onStateUpdate: (state: Partial<GameStateData>) => void;
  onHit: (event: HitEvent) => void;
  onComboMilestone: (combo: number) => void;
}

export const TRACK_KEYS: Record<TrackIndex, { primary: string; secondary: string; label: string }> = {
  0: { primary: 'ArrowLeft', secondary: 'a', label: 'A / ←' },
  1: { primary: 'ArrowDown', secondary: 's', label: 'S / ↓' },
  2: { primary: 'ArrowUp', secondary: 'd', label: 'D / ↑' },
  3: { primary: 'ArrowRight', secondary: 'f', label: 'F / →' },
};

export const TRACK_COLORS: Record<TrackIndex, string> = {
  0: '#3b82f6',
  1: '#10b981',
  2: '#f59e0b',
  3: '#ef4444',
};

export const NOTE_TYPE_LABELS: Record<NoteType, NoteTypeLabel> = {
  tap: '普通单点',
  hold: '长按Hold',
  swipe: '滑动Swipe',
};

export const JUDGMENT_WINDOWS = {
  perfect: 20,
  good: 50,
  miss: 150,
} as const;

export const SCORE_VALUES = {
  perfect: 300,
  good: 100,
  miss: 0,
} as const;
