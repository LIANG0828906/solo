import { create } from 'zustand';
import {
  TOTAL_CELLS,
  generatePattern,
  MIN_TARGETS,
  MAX_TARGETS,
} from '../utils/patternGenerator';

export type GamePhase = 'idle' | 'playing' | 'ended';

export interface CellState {
  isActive: boolean;
  isMatched: boolean;
  isWrong: boolean;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  originX: number;
  originY: number;
  color: string;
  createdAt: number;
  angle: number;
}

export interface ScorePopup {
  id: number;
  x: number;
  y: number;
  value: number;
  createdAt: number;
}

const TOTAL_TIME = 30;
const MAX_LIVES = 5;
const CELL_COLOR_DEFAULT = '#333333';
const CELL_COLOR_ACTIVE = '#00E5FF';
const MAX_PARTICLES = 200;
const PARTICLES_PER_BURST = 8;

let particleIdCounter = 0;
let popupIdCounter = 0;

function createEmptyGrid(): CellState[] {
  return Array.from({ length: TOTAL_CELLS }, () => ({
    isActive: false,
    isMatched: false,
    isWrong: false,
  }));
}

interface GameState {
  phase: GamePhase;
  endReason: 'timeout' | 'lives' | null;
  timeLeft: number;
  totalTime: number;
  score: number;
  lives: number;
  maxLives: number;
  grid: CellState[];
  targetPattern: number[];
  correctCount: number;
  totalClicks: number;
  particles: Particle[];
  scorePopups: ScorePopup[];
  shakeTrigger: number;
  flashTrigger: number;
  startGame: () => void;
  endGame: (reason: 'timeout' | 'lives') => void;
  resetGame: () => void;
  handleCellClick: (index: number, cellX: number, cellY: number) => void;
  tick: () => void;
  spawnParticles: (x: number, y: number, color: string) => void;
  spawnScorePopup: (x: number, y: number, value: number) => void;
  clearExpiredEffects: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'idle',
  endReason: null,
  timeLeft: TOTAL_TIME,
  totalTime: TOTAL_TIME,
  score: 0,
  lives: MAX_LIVES,
  maxLives: MAX_LIVES,
  grid: createEmptyGrid(),
  targetPattern: [],
  correctCount: 0,
  totalClicks: 0,
  particles: [],
  scorePopups: [],
  shakeTrigger: 0,
  flashTrigger: 0,

  startGame: () => {
    const pattern = generatePattern();
    set({
      phase: 'playing',
      endReason: null,
      timeLeft: TOTAL_TIME,
      totalTime: TOTAL_TIME,
      score: 0,
      lives: MAX_LIVES,
      maxLives: MAX_LIVES,
      grid: createEmptyGrid(),
      targetPattern: pattern,
      correctCount: 0,
      totalClicks: 0,
      particles: [],
      scorePopups: [],
      shakeTrigger: 0,
      flashTrigger: 0,
    });
  },

  endGame: (reason: 'timeout' | 'lives') => {
    set({ phase: 'ended', endReason: reason });
  },

  resetGame: () => {
    get().startGame();
  },

  handleCellClick: (index: number, cellX: number, cellY: number) => {
    const state = get();
    if (state.phase !== 'playing') return;

    const cell = state.grid[index];
    if (cell.isMatched) return;

    const isTarget = state.targetPattern.includes(index);
    const newGrid = state.grid.map((c, i) => {
      if (i !== index) return c;
      return {
        ...c,
        isActive: !c.isActive,
        isWrong: false,
      };
    });

    const newClicks = state.totalClicks + 1;

    if (isTarget && !cell.isActive) {
      newGrid[index] = { ...newGrid[index], isMatched: true };

      const stillNeeded = state.targetPattern.filter(
        (ti) => ti !== index && !newGrid[ti].isMatched
      );
      const allMatched = stillNeeded.length === 0;

      let newPattern = state.targetPattern;
      if (allMatched) {
        newPattern = generatePattern();
        for (let i = 0; i < TOTAL_CELLS; i++) {
          if (newGrid[i].isMatched) {
            newGrid[i] = { isActive: false, isMatched: false, isWrong: false };
          }
        }
      }

      set({
        grid: newGrid,
        targetPattern: newPattern,
        score: state.score + 100,
        correctCount: state.correctCount + 1,
        totalClicks: newClicks,
      });

      get().spawnParticles(cellX, cellY, CELL_COLOR_ACTIVE);
      get().spawnScorePopup(cellX, cellY, 100);
    } else {
      newGrid[index] = { ...newGrid[index], isWrong: true };
      const newLives = state.lives - 1;

      set({
        grid: newGrid,
        lives: newLives,
        totalClicks: newClicks,
        shakeTrigger: state.shakeTrigger + 1,
        flashTrigger: state.flashTrigger + 1,
      });

      setTimeout(() => {
        const cur = get();
        const reset = cur.grid.map((c, i) => {
          if (i === index) return { ...c, isWrong: false };
          return c;
        });
        set({ grid: reset });
      }, 300);

      if (newLives <= 0) {
        get().endGame('lives');
      }
    }
  },

  tick: () => {
    const state = get();
    if (state.phase !== 'playing') return;
    const next = Math.max(0, state.timeLeft - 1);
    set({ timeLeft: next });
    if (next <= 0) {
      get().endGame('timeout');
    }
  },

  spawnParticles: (x: number, y: number, color: string) => {
    const state = get();
    const now = performance.now();
    const newParticles: Particle[] = [];
    for (let i = 0; i < PARTICLES_PER_BURST; i++) {
      const angle = (i / PARTICLES_PER_BURST) * Math.PI * 2;
      particleIdCounter += 1;
      newParticles.push({
        id: particleIdCounter,
        x,
        y,
        originX: x,
        originY: y,
        color,
        createdAt: now,
        angle,
      });
    }
    let combined = [...state.particles, ...newParticles];
    if (combined.length > MAX_PARTICLES) {
      combined = combined.slice(combined.length - MAX_PARTICLES);
    }
    set({ particles: combined });
  },

  spawnScorePopup: (x: number, y: number, value: number) => {
    const state = get();
    popupIdCounter += 1;
    const popup: ScorePopup = {
      id: popupIdCounter,
      x,
      y,
      value,
      createdAt: performance.now(),
    };
    set({ scorePopups: [...state.scorePopups, popup] });
  },

  clearExpiredEffects: () => {
    const state = get();
    const now = performance.now();
    const PARTICLE_LIFETIME = 600;
    const POPUP_LIFETIME = 1000;
    const filteredParticles = state.particles.filter(
      (p) => now - p.createdAt < PARTICLE_LIFETIME
    );
    const filteredPopups = state.scorePopups.filter(
      (p) => now - p.createdAt < POPUP_LIFETIME
    );
    if (
      filteredParticles.length !== state.particles.length ||
      filteredPopups.length !== state.scorePopups.length
    ) {
      set({ particles: filteredParticles, scorePopups: filteredPopups });
    }
  },
}));

export {
  CELL_COLOR_DEFAULT,
  CELL_COLOR_ACTIVE,
  TOTAL_TIME,
  MAX_LIVES,
  PARTICLES_PER_BURST,
  MIN_TARGETS,
  MAX_TARGETS,
};
