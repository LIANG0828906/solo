export type TrackType = 'drum' | 'bass' | 'melody' | 'effect';

export type Difficulty = 'easy' | 'normal' | 'hard';

export type Rating = 'perfect' | 'good' | 'miss';

export type GamePhase = 'idle' | 'playing' | 'paused' | 'editing' | 'finished';

export type WaveformType = 'sine' | 'sawtooth' | 'square' | 'triangle';

export const TRACK_COLORS: Record<TrackType, string> = {
  drum: '#FF4757',
  bass: '#2ED573',
  melody: '#1E90FF',
  effect: '#FFA502',
};

export const TRACK_LABELS: Record<TrackType, string> = {
  drum: '鼓',
  bass: '贝斯',
  melody: '旋律',
  effect: '效果',
};

export const TRACK_WAVEFORMS: Record<TrackType, WaveformType> = {
  drum: 'square',
  bass: 'sawtooth',
  melody: 'sine',
  effect: 'triangle',
};

export const TRACK_FREQUENCIES: Record<TrackType, number> = {
  drum: 80,
  bass: 130,
  melody: 440,
  effect: 880,
};

export interface TrackConfig {
  type: TrackType;
  color: string;
  enabled: boolean;
  volume: number;
  waveform: WaveformType;
  frequency: number;
}

export interface BeatPoint {
  id: string;
  time: number;
  track: TrackType;
  sector: number;
}

export interface Pattern {
  name: string;
  bpm: number;
  duration: number;
  tracks: Record<TrackType, { enabled: boolean; volume: number }>;
  beats: BeatPoint[];
}

export interface ActiveWave {
  id: string;
  track: TrackType;
  color: string;
  startRadius: number;
  endRadius: number;
  startTime: number;
  duration: number;
  sector: number;
  hit: boolean;
  rated: boolean;
}

export interface RatingResult {
  rating: Rating;
  deviation: number;
  score: number;
  track: TrackType;
  sector: number;
  waveId: string;
}

export interface Ripple {
  id: string;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  startTime: number;
  duration: number;
  color: string;
}

export interface Highlight {
  sector: number;
  startTime: number;
  duration: number;
}

export interface GameState {
  phase: GamePhase;
  bpm: number;
  difficulty: Difficulty;
  pattern: Pattern | null;
  score: number;
  combo: number;
  maxCombo: number;
  perfectCount: number;
  goodCount: number;
  missCount: number;
  currentTime: number;
  selectedTrack: TrackType;
}
