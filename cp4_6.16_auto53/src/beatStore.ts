import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  RHYTHM_PATTERN,
  NOTE_COLORS,
  SCORE_VALUES,
  INITIAL_LIVES,
  type Note,
  type Particle,
  type JudgeResult,
  type Direction,
} from './types';

interface BeatState {
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  startTime: number;
  currentTime: number;
  score: number;
  combo: number;
  maxCombo: number;
  lives: number;
  notes: Note[];
  particles: Particle[];
  rhythmPattern: typeof RHYTHM_PATTERN;
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  resetGame: () => void;
  addNote: (direction: Direction, targetTime: number) => void;
  hitNote: (noteId: string, result: JudgeResult) => void;
  missNote: (noteId: string) => void;
  updateNotePosition: (noteId: string, y: number) => void;
  addParticle: (x: number, y: number, color: string) => void;
  removeParticle: (particleId: string) => void;
  decrementLife: () => void;
  setCurrentTime: (time: number) => void;
}

const getInitialState = () => ({
  isPlaying: false,
  isPaused: false,
  isGameOver: false,
  startTime: 0,
  currentTime: 0,
  score: 0,
  combo: 0,
  maxCombo: 0,
  lives: INITIAL_LIVES,
  notes: [] as Note[],
  particles: [] as Particle[],
  rhythmPattern: RHYTHM_PATTERN,
});

export const useBeatStore = create<BeatState>((set, get) => ({
  ...getInitialState(),

  startGame: () => {
    const now = performance.now();
    set({
      ...getInitialState(),
      isPlaying: true,
      startTime: now,
      currentTime: now,
    });
  },

  pauseGame: () => {
    set({ isPaused: true });
  },

  resumeGame: () => {
    set({ isPaused: false });
  },

  resetGame: () => {
    set(getInitialState());
  },

  addNote: (direction: Direction, targetTime: number) => {
    const newNote: Note = {
      id: uuidv4(),
      direction,
      targetTime,
      y: -50,
      state: 'active',
      color: NOTE_COLORS[direction],
    };
    set((state) => ({
      notes: [...state.notes, newNote],
    }));
  },

  hitNote: (noteId: string, result: JudgeResult) => {
    const { combo, maxCombo } = get();
    const scoreValue = SCORE_VALUES[result];
    const newCombo = result !== 'miss' ? combo + 1 : 0;
    const newMaxCombo = Math.max(maxCombo, newCombo);

    set((state) => ({
      score: state.score + scoreValue,
      combo: newCombo,
      maxCombo: newMaxCombo,
      notes: state.notes.map((note) =>
        note.id === noteId ? { ...note, state: 'hit' } : note
      ),
    }));
  },

  missNote: (noteId: string) => {
    set((state) => ({
      combo: 0,
      notes: state.notes.map((note) =>
        note.id === noteId ? { ...note, state: 'missed' } : note
      ),
    }));
    get().decrementLife();
  },

  updateNotePosition: (noteId: string, y: number) => {
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === noteId ? { ...note, y } : note
      ),
    }));
  },

  addParticle: (x: number, y: number, color: string) => {
    const particleCount = 8;
    const newParticles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 2 + Math.random() * 3;
      newParticles.push({
        id: uuidv4(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 1,
      });
    }

    set((state) => ({
      particles: [...state.particles, ...newParticles],
    }));
  },

  removeParticle: (particleId: string) => {
    set((state) => ({
      particles: state.particles.filter((p) => p.id !== particleId),
    }));
  },

  decrementLife: () => {
    set((state) => {
      const newLives = state.lives - 1;
      return {
        lives: newLives,
        isGameOver: newLives <= 0,
        isPlaying: newLives <= 0 ? false : state.isPlaying,
      };
    });
  },

  setCurrentTime: (time: number) => {
    set({ currentTime: time });
  },
}));
