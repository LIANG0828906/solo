import { create } from 'zustand';
import { Landmark, PlayerState, TargetId, Vector3 } from '../types';

interface NavState {
  player: PlayerState;
  landmarks: Landmark[];
  targetId: TargetId;
  showLockPrompt: boolean;
  showArrivalEffect: boolean;

  setPlayerPosition: (position: Vector3) => void;
  setPlayerFacing: (facing: number) => void;
  setLandmarks: (landmarks: Landmark[]) => void;
  setTargetLandmark: (id: TargetId) => void;
  setShowLockPrompt: (show: boolean) => void;
  setShowArrivalEffect: (show: boolean) => void;
}

export const useNavStore = create<NavState>((set) => ({
  player: {
    position: { x: 0, y: 0, z: 0 },
    facing: 0,
  },
  landmarks: [],
  targetId: null,
  showLockPrompt: false,
  showArrivalEffect: false,

  setPlayerPosition: (position) =>
    set((state) => ({
      player: { ...state.player, position },
    })),

  setPlayerFacing: (facing) =>
    set((state) => ({
      player: { ...state.player, facing },
    })),

  setLandmarks: (landmarks) => set({ landmarks }),

  setTargetLandmark: (id) => set({ targetId: id }),

  setShowLockPrompt: (show) => set({ showLockPrompt: show }),

  setShowArrivalEffect: (show) => set({ showArrivalEffect: show }),
}));
