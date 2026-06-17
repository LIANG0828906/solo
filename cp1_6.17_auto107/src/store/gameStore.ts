import { create } from 'zustand';
import type { HSLColor, LabColor } from '@/modules/colorEngine/colorSpace';
import { hslToLab, cie76DeltaE } from '@/modules/colorEngine/colorSpace';
import { generateDailyPalette } from '@/modules/colorEngine/paletteGenerator';

export interface TargetBlock {
  id: number;
  color: HSLColor;
}

export interface MatchResult {
  blockId: number;
  targetColor: HSLColor;
  userColor: HSLColor;
  deltaE: number;
  feedback: 'perfect' | 'close' | 'tryAgain';
  timestamp: number;
}

export interface DayRecord {
  date: string;
  averageDeltaE: number;
  duration: number;
}

interface GameState {
  targetBlocks: TargetBlock[];
  matchResults: MatchResult[];
  history: DayRecord[];
  startTime: number;
  currentBlockIndex: number;
  submitMatch: (userColor: HSLColor) => void;
  reset: () => void;
}

function loadHistory(): DayRecord[] {
  try {
    const stored = localStorage.getItem('color-puzzle-history');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveHistory(history: DayRecord[]) {
  try {
    localStorage.setItem('color-puzzle-history', JSON.stringify(history));
  } catch {
    // ignore
  }
}

function getFeedback(deltaE: number): 'perfect' | 'close' | 'tryAgain' {
  if (deltaE < 10) return 'perfect';
  if (deltaE <= 20) return 'close';
  return 'tryAgain';
}

function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export const useGameStore = create<GameState>((set, get) => ({
  targetBlocks: generateDailyPalette().map((color, id) => ({ id, color })),
  matchResults: [],
  history: loadHistory(),
  startTime: Date.now(),
  currentBlockIndex: 0,

  submitMatch: (userColor: HSLColor) => {
    const state = get();
    if (state.currentBlockIndex >= state.targetBlocks.length) return;

    const target = state.targetBlocks[state.currentBlockIndex];
    const targetLab: LabColor = hslToLab(target.color.h, target.color.s, target.color.l);
    const userLab: LabColor = hslToLab(userColor.h, userColor.s, userColor.l);
    const deltaE = cie76DeltaE(targetLab, userLab);
    const feedback = getFeedback(deltaE);

    const result: MatchResult = {
      blockId: target.id,
      targetColor: target.color,
      userColor,
      deltaE,
      feedback,
      timestamp: Date.now(),
    };

    const newResults = [...state.matchResults, result];
    const newIndex = state.currentBlockIndex + 1;
    const isComplete = newIndex >= state.targetBlocks.length;

    let newHistory = state.history;
    if (isComplete) {
      const avgDeltaE = newResults.reduce((sum, r) => sum + r.deltaE, 0) / newResults.length;
      const duration = Math.round((Date.now() - state.startTime) / 1000);
      const todayRecord: DayRecord = {
        date: getTodayString(),
        averageDeltaE: avgDeltaE,
        duration,
      };
      const existingIdx = newHistory.findIndex(r => r.date === todayRecord.date);
      if (existingIdx >= 0) {
        newHistory = [...newHistory];
        newHistory[existingIdx] = todayRecord;
      } else {
        newHistory = [...newHistory, todayRecord];
      }
      saveHistory(newHistory);
    }

    set({
      matchResults: newResults,
      currentBlockIndex: newIndex,
      history: newHistory,
    });
  },

  reset: () => {
    set({
      targetBlocks: generateDailyPalette().map((color, id) => ({ id, color })),
      matchResults: [],
      startTime: Date.now(),
      currentBlockIndex: 0,
    });
  },
}));
