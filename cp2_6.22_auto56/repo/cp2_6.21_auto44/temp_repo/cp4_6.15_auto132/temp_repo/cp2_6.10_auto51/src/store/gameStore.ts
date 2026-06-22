import { create } from 'zustand';
import type { GameStore, TrayCell, Score } from '../types';
import { TRAY_SIZE as TRAY_SIZE_CONST } from '../types';
import { getCurrentLevel } from '../data/levels';

function createEmptyTray(): TrayCell[] {
  return Array(TRAY_SIZE_CONST).fill(null).map(() => ({
    char: null,
    isError: false,
    isCorrect: false,
    showStain: false
  }));
}

function calculateScore(errors: number, inkCoverage: number, maxErrors: number): Score {
  const errorPenalty = errors * 20;
  const inkScore = inkCoverage * 0.5;
  const baseScore = 100;
  let totalScore = Math.max(0, baseScore - errorPenalty + inkScore);
  totalScore = Math.min(100, totalScore);
  
  let grade: '甲' | '乙' | '丙' | '丁';
  if (errors <= 1 && inkCoverage >= 95) {
    grade = '甲';
  } else if (errors <= 2 && inkCoverage >= 85) {
    grade = '乙';
  } else if (errors <= 3 && inkCoverage >= 70) {
    grade = '丙';
  } else {
    grade = '丁';
  }
  
  return {
    errors,
    inkCoverage,
    totalScore: Math.round(totalScore),
    grade
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  currentLevel: 1,
  trayContent: createEmptyTray(),
  errorCount: 0,
  maxErrors: 3,
  inkCoverage: 0,
  isInking: false,
  isPrinting: false,
  gamePhase: 'menu',
  score: null,
  highlightIndex: 0,

  setLevel: (level: number) => set({ currentLevel: level }),

  placeCharacter: (index: number, char: string): boolean => {
    const state = get();
    if (state.gamePhase !== 'typesetting') return false;
    if (index < 0 || index >= TRAY_SIZE_CONST) return false;
    
    const cell = state.trayContent[index];
    if (cell.char !== null) return false;
    
    const level = state.currentLevel;
    const levelData = getCurrentLevel(level);
    const expectedChar = levelData.targetChars[index];
    
    const isCorrect = expectedChar === char;
    
    const newTray = [...state.trayContent];
    newTray[index] = {
      char,
      isError: !isCorrect,
      isCorrect: isCorrect,
      showStain: !isCorrect
    };
    
    let newErrorCount = state.errorCount;
    if (!isCorrect) {
      newErrorCount++;
    }
    
    const nextHighlight = isCorrect ? index + 1 : state.highlightIndex;
    
    if (newErrorCount >= state.maxErrors) {
      const score = calculateScore(newErrorCount, 0, state.maxErrors);
      set({
        trayContent: newTray,
        errorCount: newErrorCount,
        highlightIndex: nextHighlight,
        gamePhase: 'result',
        score
      });
      return isCorrect;
    }
    
    set({
      trayContent: newTray,
      errorCount: newErrorCount,
      highlightIndex: nextHighlight
    });
    
    if (!isCorrect) {
      setTimeout(() => {
        get().clearStain(index);
      }, 2000);
    }
    
    return isCorrect;
  },

  incrementError: (index: number) => {
    const state = get();
    const newTray = [...state.trayContent];
    if (newTray[index]) {
      newTray[index] = { ...newTray[index], showStain: true };
    }
    set({
      trayContent: newTray,
      errorCount: state.errorCount + 1
    });
  },

  setInkCoverage: (coverage: number) => set({ inkCoverage: coverage }),

  setIsInking: (inking: boolean) => set({ isInking: inking }),

  startPrinting: () => {
    const state = get();
    if (state.inkCoverage < 90) return;
    set({ isPrinting: true, gamePhase: 'printing' });
  },

  finishPrinting: (score: Score) => set({
    isPrinting: false,
    gamePhase: 'result',
    score
  }),

  resetTray: () => set({
    trayContent: createEmptyTray(),
    errorCount: 0,
    inkCoverage: 0,
    isInking: false,
    isPrinting: false,
    gamePhase: 'typesetting',
    score: null,
    highlightIndex: 0
  }),

  resetGame: () => set({
    trayContent: createEmptyTray(),
    errorCount: 0,
    inkCoverage: 0,
    isInking: false,
    isPrinting: false,
    gamePhase: 'typesetting',
    score: null,
    highlightIndex: 0
  }),

  clearStain: (index: number) => {
    const state = get();
    const newTray = [...state.trayContent];
    if (newTray[index]) {
      newTray[index] = { ...newTray[index], showStain: false, isError: false };
    }
    set({ trayContent: newTray });
  },

  goToMenu: () => set({
    gamePhase: 'menu',
    trayContent: createEmptyTray(),
    errorCount: 0,
    inkCoverage: 0,
    isInking: false,
    isPrinting: false,
    score: null,
    highlightIndex: 0
  }),

  startGame: () => set({
    gamePhase: 'typesetting',
    trayContent: createEmptyTray(),
    errorCount: 0,
    inkCoverage: 0,
    isInking: false,
    isPrinting: false,
    score: null,
    highlightIndex: 0
  })
}));

export { calculateScore };
