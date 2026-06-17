import { create } from 'zustand';
import type { GameState, GameStats, HitResult, GradeType, LevelData } from '../types';

interface GameStore {
  gameState: GameState;
  currentLevel: LevelData | null;
  score: number;
  combo: number;
  maxCombo: number;
  syncRate: number;
  perfectCount: number;
  goodCount: number;
  missCount: number;
  syncRateHistory: number[];
  currentBeatIndex: number;
  lastHitResult: HitResult;
  showGrade: boolean;
  currentGrade: GradeType | null;
  gameStats: GameStats | null;
  musicProgress: number;
  beatHighlight: boolean;
  playerActionResult: HitResult;
  setGameState: (state: GameState) => void;
  setCurrentLevel: (level: LevelData | null) => void;
  addScore: (points: number) => void;
  incrementCombo: () => void;
  resetCombo: () => void;
  setSyncRate: (rate: number) => void;
  recordHit: (result: HitResult) => void;
  setCurrentBeatIndex: (index: number) => void;
  setLastHitResult: (result: HitResult) => void;
  setShowGrade: (show: boolean, grade?: GradeType) => void;
  setGameStats: (stats: GameStats | null) => void;
  setMusicProgress: (progress: number) => void;
  setBeatHighlight: (highlight: boolean) => void;
  setPlayerActionResult: (result: HitResult) => void;
  resetGame: () => void;
  addSyncRateHistory: (rate: number) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: 'menu',
  currentLevel: null,
  score: 0,
  combo: 0,
  maxCombo: 0,
  syncRate: 100,
  perfectCount: 0,
  goodCount: 0,
  missCount: 0,
  syncRateHistory: [],
  currentBeatIndex: 0,
  lastHitResult: null,
  showGrade: false,
  currentGrade: null,
  gameStats: null,
  musicProgress: 0,
  beatHighlight: false,
  playerActionResult: null,
  setGameState: (state) => set({ gameState: state }),
  setCurrentLevel: (level) => set({ currentLevel: level }),
  addScore: (points) => set((state) => ({ score: state.score + points })),
  incrementCombo: () => set((state) => ({
    combo: state.combo + 1,
    maxCombo: Math.max(state.maxCombo, state.combo + 1)
  })),
  resetCombo: () => set({ combo: 0 }),
  setSyncRate: (rate) => set({ syncRate: Math.max(0, Math.min(100, rate)) }),
  recordHit: (result) => {
    if (result === 'perfect') {
      set((state) => ({ perfectCount: state.perfectCount + 1 }));
    } else if (result === 'good') {
      set((state) => ({ goodCount: state.goodCount + 1 }));
    } else if (result === 'miss') {
      set((state) => ({ missCount: state.missCount + 1 }));
    }
  },
  setCurrentBeatIndex: (index) => set({ currentBeatIndex: index }),
  setLastHitResult: (result) => set({ lastHitResult: result }),
  setShowGrade: (show, grade) => set({ showGrade: show, currentGrade: grade || null }),
  setGameStats: (stats) => set({ gameStats: stats }),
  setMusicProgress: (progress) => set({ musicProgress: progress }),
  setBeatHighlight: (highlight) => set({ beatHighlight: highlight }),
  setPlayerActionResult: (result) => set({ playerActionResult: result }),
  addSyncRateHistory: (rate) => set((state) => ({
    syncRateHistory: [...state.syncRateHistory, rate]
  })),
  resetGame: () => set({
    score: 0,
    combo: 0,
    maxCombo: 0,
    syncRate: 100,
    perfectCount: 0,
    goodCount: 0,
    missCount: 0,
    syncRateHistory: [],
    currentBeatIndex: 0,
    lastHitResult: null,
    showGrade: false,
    currentGrade: null,
    gameStats: null,
    musicProgress: 0,
    beatHighlight: false,
    playerActionResult: null
  })
}));
