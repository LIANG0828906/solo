import { create } from 'zustand';
import { LampState, ScreenData } from '../types';
import { screensData } from '../data/screens';

export const useLampStore = create<LampState>((set) => ({
  screens: screensData,
  screenOrder: [0, 1, 2, 3, 4, 5],
  selectedIndex: 0,
  speed: 30,
  brightness: 50,
  currentRotation: 0,

  setSelectedIndex: (index: number) => set({ selectedIndex: index }),
  setSpeed: (speed: number) => set({ speed }),
  setBrightness: (brightness: number) => set({ brightness }),
  setScreenOrder: (order: number[]) => set({ screenOrder: order }),
  updateRotation: (delta: number) =>
    set((state) => ({ currentRotation: (state.currentRotation + delta) % 360 }))
}));

export const getOrderedScreens = (screens: ScreenData[], order: number[]): ScreenData[] => {
  return order.map((id) => screens.find((s) => s.id === id)!).filter(Boolean);
};
