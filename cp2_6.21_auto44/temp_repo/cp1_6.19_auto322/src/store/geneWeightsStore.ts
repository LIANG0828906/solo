import { create } from 'zustand';
import type { GeneWeights, PlantInstance } from '../core/types';
import { createDefaultGeneWeights, hybridize, mutate } from '../core/geneWeights';
import { TAG_COLORS } from '../core/types';

export interface GeneStoreState {
  plants: Record<string, GeneWeights>;
  selectedPlantId: string | null;
  breedingParentId: string | null;
  setSelectedPlant: (id: string | null) => void;
  setBreedingParent: (id: string | null) => void;
  setPlantGene: (plantId: string, key: keyof GeneWeights, value: number) => void;
  mutatePlant: (plantId: string) => void;
}

function clamp(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export const useGeneWeightsStore = create<GeneStoreState>((set, get) => ({
  plants: {},
  selectedPlantId: null,
  breedingParentId: null,
  setSelectedPlant: (id) => set({ selectedPlantId: id }),
  setBreedingParent: (id) => set({ breedingParentId: id }),
  setPlantGene: (plantId, key, value) =>
    set((state) => ({
      plants: {
        ...state.plants,
        [plantId]: {
          ...(state.plants[plantId] ?? createDefaultGeneWeights()),
          [key]: clamp(value),
        },
      },
    })),
  mutatePlant: (plantId) =>
    set((state) => {
      const current = state.plants[plantId] ?? createDefaultGeneWeights();
      return {
        plants: { ...state.plants, [plantId]: mutate(current, 0.2) },
      };
    }),
}));

export function registerPlantGenes(
  plantId: string,
  weights: GeneWeights = createDefaultGeneWeights()
): void {
  useGeneWeightsStore.setState((s) => ({
    plants: { ...s.plants, [plantId]: weights },
  }));
}

export function createChildFromBreeding(
  parentIdA: string,
  parentIdB: string
): GeneWeights {
  const state = useGeneWeightsStore.getState();
  const a = state.plants[parentIdA] ?? createDefaultGeneWeights();
  const b = state.plants[parentIdB] ?? createDefaultGeneWeights();
  return hybridize(a, b, 0.05, 0.2);
}

export type TagRole = 'parent' | 'mother' | 'filial';

export function tagColorFor(role: TagRole): string {
  return TAG_COLORS[role];
}
