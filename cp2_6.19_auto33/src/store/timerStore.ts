import { create } from 'zustand';

interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  completedPomodoros: number;
  activeTaskId: string | null;
  setActiveTaskId: (taskId: string | null) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;
  complete: () => void;
}

const DEFAULT_TIME = 25 * 60;

export const useTimerStore = create<TimerState>((set, get) => ({
  timeLeft: DEFAULT_TIME,
  isRunning: false,
  completedPomodoros: 0,
  activeTaskId: null,

  setActiveTaskId: (taskId) => set({ activeTaskId: taskId }),

  start: () => set({ isRunning: true }),

  pause: () => set({ isRunning: false }),

  reset: () => set({ timeLeft: DEFAULT_TIME, isRunning: false }),

  tick: () => {
    const { timeLeft, isRunning } = get();
    if (isRunning && timeLeft > 0) {
      set({ timeLeft: timeLeft - 1 });
    }
    if (isRunning && timeLeft <= 1) {
      get().complete();
    }
  },

  complete: () => {
    const { activeTaskId } = get();
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);

    set((state) => ({
      timeLeft: DEFAULT_TIME,
      isRunning: false,
      completedPomodoros: state.completedPomodoros + 1,
    }));

    if (activeTaskId) {
      const { useBoardStore } = require('./boardStore');
      useBoardStore.getState().incrementCompletedPomodoros(activeTaskId);
    }
  },
}));
