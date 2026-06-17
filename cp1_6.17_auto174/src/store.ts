import { create } from 'zustand';
import type { Element, Creature, Environment, Recipe } from './types';

interface GameState {
  discoveredElements: Map<string, Element>;
  creatures: Creature[];
  environment: Environment;
  recipes: Recipe[];
  lastCombinedElement: Element | null;
  lastSpawnedCreature: Creature | null;
  combineFailed: boolean;
  showCodex: boolean;
  combineFlash: boolean;
  poolSlots: (Element | null)[];

  setDiscoveredElements: (elements: Map<string, Element>) => void;
  addDiscoveredElement: (element: Element) => void;
  setCreatures: (creatures: Creature[]) => void;
  setEnvironment: (env: Environment) => void;
  setRecipes: (recipes: Recipe[]) => void;
  setLastCombinedElement: (el: Element | null) => void;
  setLastSpawnedCreature: (c: Creature | null) => void;
  setCombineFailed: (v: boolean) => void;
  setShowCodex: (v: boolean) => void;
  setCombineFlash: (v: boolean) => void;
  setPoolSlots: (slots: (Element | null)[]) => void;
  setPoolSlot: (index: number, el: Element | null) => void;
  clearPool: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  discoveredElements: new Map(),
  creatures: [],
  environment: { temperature: 50, humidity: 50, food: 50, tick: 0 },
  recipes: [],
  lastCombinedElement: null,
  lastSpawnedCreature: null,
  combineFailed: false,
  showCodex: false,
  combineFlash: false,
  poolSlots: [null, null],

  setDiscoveredElements: (elements) => set({ discoveredElements: elements }),
  addDiscoveredElement: (element) =>
    set((state) => {
      const next = new Map(state.discoveredElements);
      next.set(element.id, element);
      return { discoveredElements: next };
    }),
  setCreatures: (creatures) => set({ creatures }),
  setEnvironment: (env) => set({ environment: env }),
  setRecipes: (recipes) => set({ recipes }),
  setLastCombinedElement: (el) => set({ lastCombinedElement: el }),
  setLastSpawnedCreature: (c) => set({ lastSpawnedCreature: c }),
  setCombineFailed: (v) => set({ combineFailed: v }),
  setShowCodex: (v) => set({ showCodex: v }),
  setCombineFlash: (v) => set({ combineFlash: v }),
  setPoolSlots: (slots) => set({ poolSlots: slots }),
  setPoolSlot: (index, el) =>
    set((state) => {
      const next = [...state.poolSlots];
      next[index] = el;
      return { poolSlots: next };
    }),
  clearPool: () => set({ poolSlots: [null, null] }),
}));
