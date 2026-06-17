import { create } from 'zustand';
import { GameState, Beat } from '../types';

interface GameStore {
  gameState: GameState;
  score: number;
  combo: number;
  maxCombo: number;
  playerHealth: number;
  enemyHealth: number;
  bpm: number;
  beats: Beat[];
  audioFile: File | null;
  audioBuffer: AudioBuffer | null;
  setGameState: (state: GameState) => void;
  setScore: (score: number) => void;
  addScore: (points: number) => void;
  incrementCombo: () => void;
  resetCombo: () => void;
  setPlayerHealth: (health: number) => void;
  setEnemyHealth: (health: number) => void;
  setBpm: (bpm: number) => void;
  setBeats: (beats: Beat[]) => void;
  setAudioFile: (file: File | null) => void;
  setAudioBuffer: (buffer: AudioBuffer | null) => void;
  resetGame: () => void;
}

const initialState = {
  gameState: 'idle' as GameState,
  score: 0,
  combo: 0,
  maxCombo: 0,
  playerHealth: 100,
  enemyHealth: 100,
  bpm: 0,
  beats: [],
  audioFile: null,
  audioBuffer: null,
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,
  setGameState: (state) => set({ gameState: state }),
  setScore: (score) => set({ score }),
  addScore: (points) => set((state) => ({ score: state.score + points })),
  incrementCombo: () =>
    set((state) => {
      const newCombo = state.combo + 1;
      return {
        combo: newCombo,
        maxCombo: Math.max(state.maxCombo, newCombo),
      };
    }),
  resetCombo: () => set({ combo: 0 }),
  setPlayerHealth: (health) => set({ playerHealth: health }),
  setEnemyHealth: (health) => set({ enemyHealth: health }),
  setBpm: (bpm) => set({ bpm }),
  setBeats: (beats) => set({ beats }),
  setAudioFile: (file) => set({ audioFile: file }),
  setAudioBuffer: (buffer) => set({ audioBuffer: buffer }),
  resetGame: () => set(initialState),
}));
