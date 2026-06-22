import { create } from 'zustand';
import { saveTimerState, loadTimerState, clearTimerState } from '@/utils/storage';
import type { TimerState } from '../../shared/types';

interface TimerStore extends TimerState {
  displayTime: number;
  timerInterval: number | null;
  setIsRunning: (isRunning: boolean) => void;
  setCurrentTask: (task: string) => void;
  setClientId: (clientId: string | null) => void;
  setStartTime: (startTime: string | null) => void;
  setAccumulatedTime: (time: number) => void;
  startTimer: (taskName: string, clientId?: string | null, startTime?: string) => void;
  stopTimer: () => void;
  tick: () => void;
  initFromStorage: () => void;
  reset: () => void;
}

export const useTimerStore = create<TimerStore>((set, get) => ({
  isRunning: false,
  currentTask: '',
  clientId: null,
  startTime: null,
  accumulatedTime: 0,
  displayTime: 0,
  timerInterval: null,

  setIsRunning: (isRunning) => set({ isRunning }),
  setCurrentTask: (currentTask) => set({ currentTask }),
  setClientId: (clientId) => set({ clientId }),
  setStartTime: (startTime) => set({ startTime }),
  setAccumulatedTime: (accumulatedTime) => set({ accumulatedTime, displayTime: accumulatedTime }),

  startTimer: (taskName, clientId = null, startTime) => {
    const start = startTime || new Date().toISOString();
    set({
      isRunning: true,
      currentTask: taskName,
      clientId,
      startTime: start,
      accumulatedTime: 0,
      displayTime: 0,
    });

    saveTimerState({
      isRunning: true,
      currentTask: taskName,
      clientId,
      startTime: start,
      accumulatedTime: 0,
      lastUpdated: Date.now(),
    });
  },

  stopTimer: () => {
    const { accumulatedTime } = get();
    set({
      isRunning: false,
      displayTime: accumulatedTime,
    });
    clearTimerState();
  },

  tick: () => {
    const { isRunning, startTime, accumulatedTime } = get();
    if (!isRunning || !startTime) return;

    const now = Date.now();
    const start = new Date(startTime).getTime();
    const currentDuration = Math.floor((now - start) / 1000);
    const total = accumulatedTime + currentDuration;

    set({ displayTime: total });
  },

  initFromStorage: () => {
    const saved = loadTimerState();
    if (saved && saved.isRunning && saved.startTime) {
      const now = Date.now();
      const start = new Date(saved.startTime).getTime();
      const elapsed = Math.floor((now - start) / 1000);
      const total = saved.accumulatedTime + elapsed;

      set({
        isRunning: true,
        currentTask: saved.currentTask,
        clientId: saved.clientId,
        startTime: saved.startTime,
        accumulatedTime: saved.accumulatedTime,
        displayTime: total,
      });
      return true;
    }
    return false;
  },

  reset: () => {
    set({
      isRunning: false,
      currentTask: '',
      clientId: null,
      startTime: null,
      accumulatedTime: 0,
      displayTime: 0,
    });
    clearTimerState();
  },
}));
