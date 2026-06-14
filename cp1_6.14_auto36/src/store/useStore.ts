import { create } from "zustand";

export interface Creature {
  id: string;
  name: string;
  scientificName: string;
  habitat: string;
  depthRange: string;
  conservationStatus: string;
  description: string;
  color: string;
  size?: number;
  speed?: number;
}

export interface Coral {
  id: string;
  name: string;
  scientificName: string;
  habitat: string;
  depthRange: string;
  conservationStatus: string;
  description: string;
  color: string;
  size?: number;
  speed?: number;
}

interface StoreState {
  chamberPosition: [number, number, number];
  chamberVelocity: [number, number, number];
  chamberRotation: [number, number];
  depth: number;
  selectedCreatureId: string | null;
  creatures: Creature[];
  corals: Coral[];
  loading: boolean;
}

interface StoreActions {
  setChamberPosition: (pos: [number, number, number]) => void;
  setChamberVelocity: (vel: [number, number, number]) => void;
  setChamberRotation: (rot: [number, number]) => void;
  setDepth: (depth: number) => void;
  setSelectedCreatureId: (id: string | null) => void;
  setCreatures: (creatures: Creature[]) => void;
  setCorals: (corals: Coral[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useStore = create<StoreState & { actions: StoreActions }>()((set) => ({
  chamberPosition: [0, -20, 0],
  chamberVelocity: [0, 0, 0],
  chamberRotation: [0, 0],
  depth: 20,
  selectedCreatureId: null,
  creatures: [],
  corals: [],
  loading: true,
  actions: {
    setChamberPosition: (chamberPosition) => set({ chamberPosition }),
    setChamberVelocity: (chamberVelocity) => set({ chamberVelocity }),
    setChamberRotation: (chamberRotation) => set({ chamberRotation }),
    setDepth: (depth) => set({ depth }),
    setSelectedCreatureId: (selectedCreatureId) => set({ selectedCreatureId }),
    setCreatures: (creatures) => set({ creatures }),
    setCorals: (corals) => set({ corals }),
    setLoading: (loading) => set({ loading }),
  },
}));
