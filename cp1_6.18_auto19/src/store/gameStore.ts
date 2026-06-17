import { create } from 'zustand';

interface GameState {
  currentZoneIndex: number;
  unlockedZones: string[];
  answeredExhibits: Record<string, boolean>;
  setCurrentZone: (index: number) => void;
  unlockZone: (zoneId: string) => void;
  markExhibitAnswered: (exhibitId: string, correct: boolean) => void;
  isExhibitAnswered: (exhibitId: string) => boolean;
  isZoneUnlocked: (zoneId: string) => boolean;
  resetProgress: () => void;
}

const initialState = {
  currentZoneIndex: 0,
  unlockedZones: ['zone-1'],
  answeredExhibits: {},
};

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState,

  setCurrentZone: (index) => set({ currentZoneIndex: index }),

  unlockZone: (zoneId) =>
    set((state) => ({
      unlockedZones: state.unlockedZones.includes(zoneId)
        ? state.unlockedZones
        : [...state.unlockedZones, zoneId],
    })),

  markExhibitAnswered: (exhibitId, correct) =>
    set((state) => ({
      answeredExhibits: { ...state.answeredExhibits, [exhibitId]: correct },
    })),

  isExhibitAnswered: (exhibitId) => exhibitId in get().answeredExhibits,

  isZoneUnlocked: (zoneId) => get().unlockedZones.includes(zoneId),

  resetProgress: () => set(initialState),
}));
