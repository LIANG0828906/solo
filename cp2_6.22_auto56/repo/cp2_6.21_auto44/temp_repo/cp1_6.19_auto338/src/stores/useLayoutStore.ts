import { create } from 'zustand';
import { LayoutState } from '@/types';

interface LayoutActions {
  togglePanel: () => void;
  setScreenWidth: (width: number) => void;
}

const getInitialState = (): LayoutState => ({
  isPanelCollapsed: typeof window !== 'undefined' ? window.innerWidth < 1024 : false,
  screenWidth: typeof window !== 'undefined' ? window.innerWidth : 1200,
});

export const useLayoutStore = create<LayoutState & LayoutActions>((set) => ({
  ...getInitialState(),
  
  togglePanel: () => set((state) => ({
    isPanelCollapsed: !state.isPanelCollapsed,
  })),
  
  setScreenWidth: (width) => set({
    screenWidth: width,
    isPanelCollapsed: width < 1024,
  }),
}));
