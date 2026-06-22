import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { AppState, User, Escort, Mission, MapNode, CartSelection, BanditEvent, Position, ToastMessage } from '@/types';

export const useStore = create<AppState>((set) => ({
  user: null,
  escorts: [],
  missions: [],
  mapNodes: [],
  currentMission: null,
  selectedEscorts: [],
  selectedCarts: [],
  banditEvent: null,
  caravanPosition: { x: 0, y: 0 },
  currentRouteIndex: 0,
  toasts: [],
  isAnimating: false,

  setUser: (user: User | null) => set({ user }),
  
  setEscorts: (escorts: Escort[]) => set({ escorts }),
  
  setMissions: (missions: Mission[]) => set({ missions }),
  
  setMapNodes: (mapNodes: MapNode[]) => set({ mapNodes }),
  
  setCurrentMission: (currentMission: Mission | null) => set({ currentMission }),
  
  toggleEscortSelection: (escortId: string) => set((state) => {
    const isSelected = state.selectedEscorts.includes(escortId);
    if (isSelected) {
      return {
        selectedEscorts: state.selectedEscorts.filter(id => id !== escortId)
      };
    } else {
      if (state.selectedEscorts.length >= 5) {
        return state;
      }
      return {
        selectedEscorts: [...state.selectedEscorts, escortId]
      };
    }
  }),
  
  setSelectedCarts: (selectedCarts: CartSelection[]) => set({ selectedCarts }),
  
  setBanditEvent: (banditEvent: BanditEvent | null) => set({ banditEvent }),
  
  setCaravanPosition: (caravanPosition: Position) => set({ caravanPosition }),
  
  setCurrentRouteIndex: (currentRouteIndex: number) => set({ currentRouteIndex }),
  
  addToast: (message: string, type: 'success' | 'error' | 'info') => set((state) => {
    const id = uuidv4();
    const toast: ToastMessage = { id, message, type };
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) }));
    }, 2000);
    return { toasts: [...state.toasts, toast] };
  }),
  
  removeToast: (id: string) => set((state) => ({
    toasts: state.toasts.filter(t => t.id !== id)
  })),
  
  clearSelections: () => set({
    selectedEscorts: [],
    selectedCarts: [],
    banditEvent: null,
    currentRouteIndex: 0,
    isAnimating: false
  }),
  
  setIsAnimating: (isAnimating: boolean) => set({ isAnimating })
}));
