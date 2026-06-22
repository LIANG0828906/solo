import { create } from 'zustand';
import type { PlantInstance, PlantState, GeneWeights } from '../core/types';
import { SLOT_POSITIONS, TAG_COLORS } from '../core/types';
import { createInitialPlantState } from '../core/plantGrowthEngine';
import { createDefaultGeneWeights } from '../core/geneWeights';

const MAX_PLANTS = 5;

export interface PlantStoreState {
  plants: Record<string, PlantInstance>;
  order: string[];
  globalTime: number;
  selectedId: string | null;
  addPlant: (options?: {
    geneWeights?: GeneWeights;
    tagRole?: 'parent' | 'mother' | 'filial';
    parentIds?: [string, string];
    initialGrowthTime?: number;
  }) => string | null;
  removePlant: (id: string) => void;
  updatePlantState: (id: string, state: PlantState, growthTime: number) => void;
  selectPlant: (id: string | null) => void;
  resetAll: () => void;
  setGlobalTime: (t: number) => void;
  findFreeSlot: () => number | null;
}

let idCounter = 1;
function newPlantId(): string {
  idCounter += 1;
  return `P${idCounter}`;
}

export const usePlantStore = create<PlantStoreState>((set, get) => ({
  plants: {},
  order: [],
  globalTime: 0,
  selectedId: null,

  findFreeSlot: () => {
    const taken = new Set(Object.values(get().plants).map((p) => p.slotIndex));
    for (let i = 0; i < MAX_PLANTS; i++) {
      if (!taken.has(i)) return i;
    }
    return null;
  },

  addPlant: (options) => {
    const state = get();
    if (Object.keys(state.plants).length >= MAX_PLANTS) return null;
    const slotIndex = state.findFreeSlot();
    if (slotIndex === null) return null;
    const id = newPlantId();
    const geneWeights = options?.geneWeights ?? createDefaultGeneWeights();
    const tagRole = options?.tagRole ?? 'filial';
    const tagColor =
      tagRole === 'parent'
        ? TAG_COLORS.parent
        : tagRole === 'mother'
        ? TAG_COLORS.mother
        : TAG_COLORS.filial;
    const tagLabel =
      tagRole === 'parent' ? 'P' : tagRole === 'mother' ? 'M' : 'F';
    const initialGrowthTime = options?.initialGrowthTime ?? 10;
    const plant: PlantInstance = {
      id,
      slotIndex,
      tagColor,
      tagLabel,
      parentIds: options?.parentIds ?? [],
      geneWeights,
      growthTime: initialGrowthTime,
      state: createInitialPlantState(),
    };
    set((s) => ({
      plants: { ...s.plants, [id]: plant },
      order: [...s.order, id],
      selectedId: s.selectedId ?? id,
    }));
    return id;
  },

  removePlant: (id) =>
    set((s) => {
      const { [id]: _removed, ...rest } = s.plants;
      return {
        plants: rest,
        order: s.order.filter((x) => x !== id),
        selectedId: s.selectedId === id ? s.order[0] ?? null : s.selectedId,
      };
    }),

  updatePlantState: (id, state, growthTime) =>
    set((s) => {
      const plant = s.plants[id];
      if (!plant) return {};
      return {
        plants: {
          ...s.plants,
          [id]: { ...plant, state, growthTime },
        },
      };
    }),

  selectPlant: (id) => set({ selectedId: id }),

  resetAll: () => {
    const state = get();
    const ids = state.order;
    const plants: Record<string, PlantInstance> = {};
    ids.forEach((id, i) => {
      const original = state.plants[id];
      plants[id] = {
        ...original,
        growthTime: 10,
        state: createInitialPlantState(),
        slotIndex: i,
      };
    });
    set({ plants, globalTime: 0, selectedId: ids[0] ?? null });
  },

  setGlobalTime: (t) => set({ globalTime: t }),
}));

export function slotPosition(slotIndex: number): [number, number, number] {
  return SLOT_POSITIONS[slotIndex] ?? [0, 0, 0];
}
