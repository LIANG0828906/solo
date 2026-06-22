import { create } from 'zustand';
import type {
  GameState,
  GameActions,
  Order,
  RestorationLog,
  TenDayReport,
  ToolType,
  PlacedTool,
} from '@/types';
import { INITIAL_TOOLS, EXPERIENCE_PER_LEVEL, MAX_LOGS } from '@/utils/constants';

const calculateLevel = (experience: number): number => {
  return Math.floor(experience / EXPERIENCE_PER_LEVEL) + 1;
};

const initialState: GameState = {
  currentOrder: null,
  timeRemaining: 0,
  experience: 0,
  level: 1,
  tools: INITIAL_TOOLS.map((tool) => ({ ...tool })),
  logs: [],
  dayCount: 1,
  isWarning: false,
  isShaking: false,
  showReport: false,
  currentReport: null,
  placedTools: [],
  isDragging: false,
};

export const useGameStore = create<GameState & GameActions>((set) => ({
  ...initialState,

  setCurrentOrder: (order: Order | null) =>
    set((state) => ({
      currentOrder: order,
      timeRemaining: order?.timeLimit ?? state.timeRemaining,
      placedTools: [],
    })),

  setTimeRemaining: (time: number) =>
    set({
      timeRemaining: time,
      isWarning: time <= 10 && time > 0,
    }),

  decrementTime: () =>
    set((state) => {
      const newTime = Math.max(0, state.timeRemaining - 1);
      return {
        timeRemaining: newTime,
        isWarning: newTime <= 10 && newTime > 0,
      };
    }),

  addExperience: (amount: number) =>
    set((state) => {
      const newExperience = Math.max(0, state.experience + amount);
      return {
        experience: newExperience,
        level: calculateLevel(newExperience),
      };
    }),

  updateToolQuantity: (type: ToolType, delta: number) =>
    set((state) => ({
      tools: state.tools.map((tool) =>
        tool.type === type
          ? { ...tool, quantity: Math.max(0, tool.quantity + delta) }
          : tool
      ),
    })),

  addLog: (log: RestorationLog) =>
    set((state) => {
      const newLogs = [log, ...state.logs].slice(0, MAX_LOGS);
      return { logs: newLogs };
    }),

  setIsWarning: (warning: boolean) => set({ isWarning: warning }),

  setIsShaking: (shaking: boolean) => set({ isShaking: shaking }),

  setShowReport: (show: boolean) => set({ showReport: show }),

  setCurrentReport: (report: TenDayReport | null) =>
    set({ currentReport: report }),

  incrementDay: () =>
    set((state) => ({
      dayCount: state.dayCount + 1,
    })),

  resetGame: () =>
    set({
      ...initialState,
      tools: INITIAL_TOOLS.map((tool) => ({ ...tool })),
    }),

  addPlacedTool: (tool: PlacedTool) =>
    set((state) => ({
      placedTools: [...state.placedTools, tool],
    })),

  removePlacedTool: (toolId: string) =>
    set((state) => ({
      placedTools: state.placedTools.filter((t) => t.id !== toolId),
    })),

  clearPlacedTools: () => set({ placedTools: [] }),

  setIsDragging: (dragging: boolean) => set({ isDragging: dragging }),
}));
