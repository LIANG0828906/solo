export interface IBeatData {
  time: number;
  intensity: number;
  type: 'spike' | 'bar' | 'wall';
}

export interface ISongConfig {
  id: string;
  title: string;
  artist: string;
  style: 'electronic' | 'rock' | 'hiphop';
  bpm: number;
  duration: number;
  color: string;
  audioUrl: string;
}

export interface IGameState {
  score: number;
  combo: number;
  maxCombo: number;
  hp: number;
  maxHp: number;
  isRunning: boolean;
  isGameOver: boolean;
  isComboFever: boolean;
  currentBeatIndex: number;
  difficulty: 'normal' | 'hard';
}

export type PlayerState = 'idle' | 'running' | 'jumping' | 'doubleJumping' | 'sliding' | 'dead';

export interface IObstacleInstance {
  id: number;
  type: 'spike' | 'bar' | 'wall';
  lane: number;
  beatTime: number;
  intensity: number;
  mesh: THREE.Group | null;
  active: boolean;
  passed: boolean;
}

export const SONGS: ISongConfig[] = [
  {
    id: 'electronic',
    title: 'NEON PULSE',
    artist: 'CyberWave',
    style: 'electronic',
    bpm: 128,
    duration: 60,
    color: '#bf40ff',
    audioUrl: '',
  },
  {
    id: 'rock',
    title: 'THUNDER ROAD',
    artist: 'Steel Voltage',
    style: 'rock',
    bpm: 140,
    duration: 60,
    color: '#40c4ff',
    audioUrl: '',
  },
  {
    id: 'hiphop',
    title: 'BLOCK BEATS',
    artist: 'MC Pixel',
    style: 'hiphop',
    bpm: 95,
    duration: 60,
    color: '#ff4081',
    audioUrl: '',
  },
];

export const LANE_POSITIONS = [-2.5, 0, 2.5];
export const SCROLL_SPEED = 12;
export const JUMP_FORCE = 12;
export const GRAVITY = 25;
export const SLIDE_DURATION = 0.6;
export const BEAT_LOOKAHEAD = 0.5;
export const COMBO_FEVER_THRESHOLD = 10;
export const MAX_PARTICLES = 300;
export const LANE_COUNT = 3;
