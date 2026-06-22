import { create } from 'zustand';
import { GameState, GameStatus } from './types';

interface GameStore {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  audioFileName: string | null;
  setAudioFileName: (name: string | null) => void;
  bpm: number | null;
  setBPM: (bpm: number | null) => void;
  setStatus: (status: GameStatus) => void;
}

const createInitialState = (): GameState => ({
  status: 'idle',
  score: 0,
  combo: 0,
  maxCombo: 0,
  beatPointsCollected: 0,
  obstacles: [],
  beatPoints: [],
  particles: [],
  glowEffects: [],
  player: {
    lane: 1,
    targetLane: 1,
    x: 200,
    y: 450,
    baseY: 450,
    isJumping: false,
    jumpTime: 0,
    jumpDuration: 600,
    jumpHeight: 150,
    isSliding: false,
    slideTime: 0,
    slideDuration: 500,
    laneTransitionTime: 300,
    laneTransitionDuration: 300,
    radius: 12,
    opacity: 1,
    scale: 1,
  },
  currentTime: 0,
  speedMultiplier: 1.0,
  lastBeatIndex: -1,
  comboEffect: 0,
  gameTime: 0,
});

export const useGameStore = create<GameStore>((set) => ({
  gameState: createInitialState(),
  setGameState: (state) => set({ gameState: state }),
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  error: null,
  setError: (error) => set({ error }),
  audioFileName: null,
  setAudioFileName: (name) => set({ audioFileName: name }),
  bpm: null,
  setBPM: (bpm) => set({ bpm }),
  setStatus: (status) =>
    set((state) => ({
      gameState: { ...state.gameState, status },
    })),
}));
