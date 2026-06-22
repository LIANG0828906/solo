import { create } from 'zustand';

export type Time = { hour: number; minute: number };
export type TickStyle = 'dots' | 'lines' | 'roman' | 'arabic';

export const DIAL_COLORS = [
  { name: '白色', value: '#ffffff' },
  { name: '浅米色', value: '#f5f0e1' },
  { name: '淡蓝色', value: '#e8f4f8' },
  { name: '浅绿色', value: '#e8f5e9' },
  { name: '淡粉色', value: '#fce4ec' },
  { name: '浅灰色', value: '#e0e0e0' },
] as const;

interface ClockState {
  time: Time;
  dialColor: string;
  tickStyle: TickStyle;
  showNumbers: boolean;
  isScreenshotTriggered: boolean;
  setTime: (time: Time) => void;
  setDialColor: (color: string) => void;
  setTickStyle: (style: TickStyle) => void;
  toggleNumbers: () => void;
  triggerScreenshot: () => void;
  resetScreenshotTrigger: () => void;
}

export const useClockStore = create<ClockState>((set) => ({
  time: { hour: 10, minute: 10 },
  dialColor: DIAL_COLORS[0].value,
  tickStyle: 'arabic',
  showNumbers: true,
  isScreenshotTriggered: false,
  setTime: (time) =>
    set({
      time: {
        hour: Math.max(0, Math.min(23, time.hour)),
        minute: Math.max(0, Math.min(59, time.minute)),
      },
    }),
  setDialColor: (color) => set({ dialColor: color }),
  setTickStyle: (style) => set({ tickStyle: style }),
  toggleNumbers: () => set((state) => ({ showNumbers: !state.showNumbers })),
  triggerScreenshot: () => set({ isScreenshotTriggered: true }),
  resetScreenshotTrigger: () => set({ isScreenshotTriggered: false }),
}));
