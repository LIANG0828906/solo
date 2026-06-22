import { create } from 'zustand';

export type GamePhase = 'upload' | 'playing' | 'ended';
export type JudgmentType = 'perfect' | 'good' | 'miss';

type GameState = {
  phase: GamePhase;
  score: number;
  combo: number;
  maxCombo: number;
  perfectCount: number;
  goodCount: number;
  missCount: number;
  effectLevel: number;
  beatTimestamps: number[];
  lastJudgment: JudgmentType | null;
  lastJudgmentTime: number;
  audioFileName: string;
  duration: number;
  currentTime: number;
};

type GameActions = {
  startGame: (fileName: string, duration: number) => void;
  endGame: () => void;
  resetGame: () => void;
  recordBeat: (time: number) => void;
  judgeInput: (inputTime: number) => JudgmentType;
  setMiss: () => void;
  updateCurrentTime: (time: number) => void;
  getEffectLevel: (combo: number) => number;
};

export const useGameState = create<GameState & GameActions>((set, get) => ({
  phase: 'upload',
  score: 0,
  combo: 0,
  maxCombo: 0,
  perfectCount: 0,
  goodCount: 0,
  missCount: 0,
  effectLevel: 0,
  beatTimestamps: [],
  lastJudgment: null,
  lastJudgmentTime: 0,
  audioFileName: '',
  duration: 0,
  currentTime: 0,

  startGame: (fileName, duration) => set({
    phase: 'playing',
    score: 0,
    combo: 0,
    maxCombo: 0,
    perfectCount: 0,
    goodCount: 0,
    missCount: 0,
    effectLevel: 0,
    beatTimestamps: [],
    lastJudgment: null,
    lastJudgmentTime: 0,
    audioFileName: fileName,
    duration,
    currentTime: 0
  }),

  endGame: () => set({ phase: 'ended' }),

  resetGame: () => set({
    phase: 'upload',
    score: 0,
    combo: 0,
    maxCombo: 0,
    perfectCount: 0,
    goodCount: 0,
    missCount: 0,
    effectLevel: 0,
    beatTimestamps: [],
    lastJudgment: null,
    lastJudgmentTime: 0,
    audioFileName: '',
    duration: 0,
    currentTime: 0
  }),

  recordBeat: (time) => set(state => {
    const timestamps = [...state.beatTimestamps, time];
    if (timestamps.length > 200) timestamps.shift();
    return { beatTimestamps: timestamps };
  }),

  setMiss: () => set(state => ({
    missCount: state.missCount + 1,
    combo: 0,
    effectLevel: 0,
    lastJudgment: 'miss',
    lastJudgmentTime: performance.now()
  })),

  judgeInput: (inputTime) => {
    const state = get();
    const timestamps = state.beatTimestamps;
    if (timestamps.length === 0) {
      get().setMiss();
      return 'miss';
    }

    let minDiff = Infinity;
    for (const t of timestamps) {
      const diff = Math.abs(inputTime - t);
      if (diff < minDiff) minDiff = diff;
    }

    const diffSec = minDiff * 1000;

    if (diffSec <= 50) {
      const newCombo = state.combo + 1;
      const level = get().getEffectLevel(newCombo);
      set({
        score: state.score + 100,
        combo: newCombo,
        maxCombo: Math.max(state.maxCombo, newCombo),
        perfectCount: state.perfectCount + 1,
        effectLevel: level,
        lastJudgment: 'perfect',
        lastJudgmentTime: performance.now()
      });
      return 'perfect';
    } else if (diffSec <= 150) {
      const newCombo = state.combo + 1;
      const level = get().getEffectLevel(newCombo);
      set({
        score: state.score + 50,
        combo: newCombo,
        maxCombo: Math.max(state.maxCombo, newCombo),
        goodCount: state.goodCount + 1,
        effectLevel: level,
        lastJudgment: 'good',
        lastJudgmentTime: performance.now()
      });
      return 'good';
    } else {
      get().setMiss();
      return 'miss';
    }
  },

  updateCurrentTime: (time) => set({ currentTime: time }),

  getEffectLevel: (combo) => {
    if (combo >= 100) return 4;
    if (combo >= 50) return 3;
    if (combo >= 25) return 2;
    if (combo >= 10) return 1;
    return 0;
  }
}));
