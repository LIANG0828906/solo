import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  InspirationTask,
  InspirationLogEntry,
  StarDust,
  StarDustColor,
  TenDayReport,
} from '@/types';

interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
}

interface DragPosition {
  x: number;
  y: number;
}

interface GameState {
  currentTask: InspirationTask | null;
  tasks: InspirationTask[];
  taskIndex: number;
  timeRemaining: number;
  totalPoints: number;
  completedConstellations: string[];
  inspirationLog: InspirationLogEntry[];
  placedStardust: StarDust[];
  isDragging: boolean;
  dragPosition: DragPosition;
  draggedStardust: StarDust | null;
  showReport: boolean;
  tenDayReport: TenDayReport | null;
  shakeScreen: boolean;
  successFlash: boolean;
  floatingText: FloatingText | null;

  setCurrentTask: (task: InspirationTask | null) => void;
  nextTask: () => void;
  updateTime: (time: number) => void;
  addPoints: (points: number) => void;
  addLogEntry: (entry: Omit<InspirationLogEntry, 'id' | 'timestamp'>) => void;
  placeStardust: (stardust: StarDust) => void;
  removeStardust: (id: string) => void;
  clearPlatform: () => void;
  setDragging: (
    isDragging: boolean,
    stardust: StarDust | null,
    position?: DragPosition
  ) => void;
  triggerSuccess: () => void;
  triggerFailure: () => void;
  openReport: (report: TenDayReport) => void;
  closeReport: () => void;
  setFloatingText: (text: FloatingText | null) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      currentTask: null,
      tasks: [],
      taskIndex: 0,
      timeRemaining: 0,
      totalPoints: 0,
      completedConstellations: [],
      inspirationLog: [],
      placedStardust: [],
      isDragging: false,
      dragPosition: { x: 0, y: 0 },
      draggedStardust: null,
      showReport: false,
      tenDayReport: null,
      shakeScreen: false,
      successFlash: false,
      floatingText: null,

      setCurrentTask: (task) => set({ currentTask: task }),

      nextTask: () => {
        const { tasks, taskIndex } = get();
        const nextIndex = taskIndex + 1;
        if (nextIndex < tasks.length) {
          set({
            taskIndex: nextIndex,
            currentTask: tasks[nextIndex],
            timeRemaining: tasks[nextIndex].timeLimit,
            placedStardust: [],
          });
        }
      },

      updateTime: (time) => set({ timeRemaining: time }),

      addPoints: (points) =>
        set((state) => ({ totalPoints: state.totalPoints + points })),

      addLogEntry: (entry) =>
        set((state) => ({
          inspirationLog: [
            ...state.inspirationLog,
            {
              ...entry,
              id: crypto.randomUUID(),
              timestamp: Date.now(),
            },
          ],
        })),

      placeStardust: (stardust) =>
        set((state) => ({
          placedStardust: [...state.placedStardust, stardust],
        })),

      removeStardust: (id) =>
        set((state) => ({
          placedStardust: state.placedStardust.filter((s) => s.id !== id),
        })),

      clearPlatform: () => set({ placedStardust: [] }),

      setDragging: (isDragging, stardust, position) =>
        set({
          isDragging,
          draggedStardust: stardust,
          dragPosition: position || { x: 0, y: 0 },
        }),

      triggerSuccess: () => {
        set({ successFlash: true });
        setTimeout(() => set({ successFlash: false }), 500);
      },

      triggerFailure: () => {
        set({ shakeScreen: true });
        setTimeout(() => set({ shakeScreen: false }), 300);
      },

      openReport: (report) => set({ showReport: true, tenDayReport: report }),

      closeReport: () => set({ showReport: false, tenDayReport: null }),

      setFloatingText: (text) => {
        set({ floatingText: text });
        if (text) {
          setTimeout(() => {
            if (get().floatingText?.id === text.id) {
              set({ floatingText: null });
            }
          }, 1500);
        }
      },
    }),
    {
      name: 'game-storage',
      partialize: (state) => ({
        totalPoints: state.totalPoints,
        completedConstellations: state.completedConstellations,
        inspirationLog: state.inspirationLog,
      }),
    }
  )
);
