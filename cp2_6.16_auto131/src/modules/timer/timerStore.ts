import { create } from 'zustand';
import { useTaskStore } from '../task/taskStore';
import { useUserStore } from '../user/userStore';

interface TimerState {
  taskId: string | null;
  elapsedSeconds: number;
  isRunning: boolean;
  intervalId: number | null;
  lastToast: string | null;
  setTask: (taskId: string | null) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  submitTime: (hours?: number) => Promise<void>;
  manualAddHours: (hours: number) => Promise<void>;
  clearToast: () => void;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  taskId: null,
  elapsedSeconds: 0,
  isRunning: false,
  intervalId: null,
  lastToast: null,

  setTask: (taskId) => {
    const { isRunning, pause } = get();
    if (isRunning) {
      pause();
    }
    set({ taskId, elapsedSeconds: 0, isRunning: false });
  },

  start: () => {
    const { taskId, isRunning } = get();
    if (!taskId || isRunning) return;

    const intervalId = window.setInterval(() => {
      set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 }));
    }, 1000);

    set({ isRunning: true, intervalId });
  },

  pause: () => {
    const { intervalId } = get();
    if (intervalId) {
      clearInterval(intervalId);
    }
    set({ isRunning: false, intervalId: null });
  },

  reset: () => {
    const { pause } = get();
    pause();
    set({ elapsedSeconds: 0 });
  },

  submitTime: async (hours) => {
    const { taskId, elapsedSeconds, pause, reset } = get();
    if (!taskId) return;

    const currentUser = useUserStore.getState().currentUser;
    if (!currentUser) return;

    pause();

    const totalHours = hours !== undefined 
      ? hours 
      : Math.max(0.1, Math.round((elapsedSeconds / 3600) * 10) / 10);

    await useTaskStore.getState().addTimeEntry({
      taskId,
      userId: currentUser.id,
      userName: currentUser.name,
      duration: totalHours,
      timestamp: Date.now(),
    });

    reset();
    set({ lastToast: `已记录${totalHours.toFixed(1)}小时` });

    setTimeout(() => {
      set({ lastToast: null });
    }, 3000);
  },

  manualAddHours: async (hours) => {
    const { taskId } = get();
    if (!taskId) return;

    const currentUser = useUserStore.getState().currentUser;
    if (!currentUser) return;

    await useTaskStore.getState().addTimeEntry({
      taskId,
      userId: currentUser.id,
      userName: currentUser.name,
      duration: hours,
      timestamp: Date.now(),
    });

    set({ lastToast: `已记录${hours.toFixed(1)}小时` });

    setTimeout(() => {
      set({ lastToast: null });
    }, 3000);
  },

  clearToast: () => set({ lastToast: null }),
}));
