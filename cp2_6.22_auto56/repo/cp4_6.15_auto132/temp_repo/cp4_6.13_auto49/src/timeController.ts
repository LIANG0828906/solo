import { create } from 'zustand';

type TimelinePhase = 'idle' | 'sliding-out' | 'sliding-in';

interface TimeState {
  elapsedTime: number;
  isAnimating: boolean;
  timelinePhase: TimelinePhase;
  timerId: ReturnType<typeof setInterval> | null;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimeline: () => void;
  setAnimating: (state: boolean) => void;
}

export const useTimeStore = create<TimeState>((set, get) => ({
  elapsedTime: 0,
  isAnimating: false,
  timelinePhase: 'idle',
  timerId: null,

  startTimer: () => {
    const current = get();
    if (current.timerId) return;
    const id = setInterval(() => {
      set((state) => ({ elapsedTime: state.elapsedTime + 0.1 }));
    }, 100);
    set({ timerId: id });
  },

  stopTimer: () => {
    const { timerId } = get();
    if (timerId) {
      clearInterval(timerId);
      set({ timerId: null });
    }
  },

  resetTimeline: () => {
    get().stopTimer();
    set({ timelinePhase: 'sliding-out', elapsedTime: 0 });
    setTimeout(() => {
      set({ timelinePhase: 'sliding-in' });
      setTimeout(() => {
        set({ timelinePhase: 'idle' });
        get().startTimer();
      }, 400);
    }, 400);
  },

  setAnimating: (state: boolean) => {
    set({ isAnimating: state });
  }
}));
