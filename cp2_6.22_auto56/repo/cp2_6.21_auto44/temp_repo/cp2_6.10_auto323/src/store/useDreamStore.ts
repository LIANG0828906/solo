import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DreamSymbol, DreamSlot, DreamResult, WeeklyReport } from '../types/dream';

interface DreamState {
  currentDate: string;
  dailySymbols: DreamSymbol[];
  dreamSlots: DreamSlot[];
  currentResult: DreamResult | null;
  dreamHistory: DreamResult[];
  remainingChances: number;
  litStars: string[];
  logs: string[];
  showWeeklyReport: boolean;
  weeklyReport: WeeklyReport | null;
}

interface DreamActions {
  setDailySymbols: (symbols: DreamSymbol[]) => void;
  updateSlot: (slotId: string, symbol: DreamSymbol | null) => void;
  clearSlot: (slotId: string) => void;
  setCurrentResult: (result: DreamResult | null) => void;
  addDreamHistory: (result: DreamResult) => void;
  decrementChances: () => void;
  litStar: (starId: string) => void;
  addLog: (message: string) => void;
  resetDaily: () => void;
  setShowWeeklyReport: (show: boolean) => void;
  setWeeklyReport: (report: WeeklyReport | null) => void;
}

const initializeSlots = (): DreamSlot[] => [
  { id: 'slot-1', position: 'north', symbol: null },
  { id: 'slot-2', position: 'south', symbol: null },
  { id: 'slot-3', position: 'east', symbol: null },
  { id: 'slot-4', position: 'west', symbol: null },
];

const getCurrentDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const useDreamStore = create<DreamState & DreamActions>()(
  persist(
    (set) => ({
      currentDate: getCurrentDateString(),
      dailySymbols: [],
      dreamSlots: initializeSlots(),
      currentResult: null,
      dreamHistory: [],
      remainingChances: 3,
      litStars: [],
      logs: [],
      showWeeklyReport: false,
      weeklyReport: null,

      setDailySymbols: (symbols) => set({ dailySymbols: symbols }),

      updateSlot: (slotId, symbol) =>
        set((state) => ({
          dreamSlots: state.dreamSlots.map((slot) =>
            slot.id === slotId ? { ...slot, symbol } : slot
          ),
        })),

      clearSlot: (slotId) =>
        set((state) => ({
          dreamSlots: state.dreamSlots.map((slot) =>
            slot.id === slotId ? { ...slot, symbol: null } : slot
          ),
        })),

      setCurrentResult: (result) => set({ currentResult: result }),

      addDreamHistory: (result) =>
        set((state) => ({
          dreamHistory: [...state.dreamHistory, result],
        })),

      decrementChances: () =>
        set((state) => ({
          remainingChances: Math.max(0, state.remainingChances - 1),
        })),

      litStar: (starId) =>
        set((state) => ({
          litStars: [...new Set([...state.litStars, starId])],
        })),

      addLog: (message) =>
        set((state) => ({
          logs: [...state.logs, `[${new Date().toLocaleTimeString()}] ${message}`],
        })),

      resetDaily: () =>
        set({
          dreamSlots: initializeSlots(),
          currentResult: null,
          remainingChances: 3,
          logs: [],
          currentDate: getCurrentDateString(),
        }),

      setShowWeeklyReport: (show) => set({ showWeeklyReport: show }),

      setWeeklyReport: (report) => set({ weeklyReport: report }),
    }),
    {
      name: 'dream-spirit-planet',
    }
  )
);
