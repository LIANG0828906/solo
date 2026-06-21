import { create } from 'zustand';
import type { Room, ToastEvent, UnitType, AnimationState } from '../types';

interface GameState {
  roomId: string | null;
  playerId: string | null;
  playerName: string;
  room: Room | null;
  toasts: ToastEvent[];
  selectedUnits: UnitType[];
  animationState: AnimationState;
  isAnimating: boolean;
  setRoomId: (id: string | null) => void;
  setPlayerId: (id: string | null) => void;
  setPlayerName: (name: string) => void;
  setRoom: (room: Room | null) => void;
  addToast: (toast: Omit<ToastEvent, 'id' | 'timestamp'>) => void;
  removeToast: (id: string) => void;
  setSelectedUnits: (units: UnitType[]) => void;
  setAnimationState: (state: Partial<AnimationState>) => void;
  setIsAnimating: (animating: boolean) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  roomId: null,
  playerId: null,
  playerName: '',
  room: null,
  toasts: [],
  selectedUnits: [],
  animationState: {
    type: 'idle',
    sourceUnitId: null,
    targetUnitId: null,
    timestamp: 0,
  },
  isAnimating: false,
  setRoomId: (id) => set({ roomId: id }),
  setPlayerId: (id) => set({ playerId: id }),
  setPlayerName: (name) => set({ playerName: name }),
  setRoom: (room) => set({ room }),
  addToast: (toast) => {
    const newToast: ToastEvent = {
      ...toast,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };
    set((state) => ({ toasts: [...state.toasts, newToast] }));
    setTimeout(() => {
      get().removeToast(newToast.id);
    }, 2500);
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
  setSelectedUnits: (units) => set({ selectedUnits: units }),
  setAnimationState: (state) =>
    set((prev) => ({
      animationState: { ...prev.animationState, ...state },
    })),
  setIsAnimating: (animating) => set({ isAnimating: animating }),
  reset: () =>
    set({
      roomId: null,
      playerId: null,
      playerName: '',
      room: null,
      toasts: [],
      selectedUnits: [],
      animationState: {
        type: 'idle',
        sourceUnitId: null,
        targetUnitId: null,
        timestamp: 0,
      },
      isAnimating: false,
    }),
}));
