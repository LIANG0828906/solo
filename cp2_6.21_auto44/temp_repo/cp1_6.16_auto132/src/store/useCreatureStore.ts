import { create } from 'zustand';
import type {
  Creature,
  CreatureStore,
  FusionSlotContent,
  FusionResult,
  GeneFragment,
} from '../types';
import { FetchService } from '../services/FetchService';
import { GeneratorService } from '../services/GeneratorService';

export const useCreatureStore = create<CreatureStore>((set, get) => ({
  creatures: [],
  loading: true,
  slotA: null,
  slotB: null,
  fusionResult: null,
  fusionProgress: 0,
  history: [],
  selectedCreature: null,
  selectedHistory: null,

  loadCreatures: async () => {
    set({ loading: true });
    const creatures = await FetchService.getCreatures();
    set({ creatures, loading: false });
  },

  setSlot: (slot: 'A' | 'B', content: FusionSlotContent) => {
    set({ [slot === 'A' ? 'slotA' : 'slotB']: content } as Partial<CreatureStore>);
    const state = get();
    const sa = slot === 'A' ? content : state.slotA;
    const sb = slot === 'B' ? content : state.slotB;
    if (sa && sb) {
      setTimeout(() => get().triggerFusion(), 300);
    }
  },

  triggerFusion: async () => {
    const state = get();
    if (!state.slotA || !state.slotB) return;
    set({ fusionProgress: 0, fusionResult: null });
    let progress = 0;
    const progressTimer = setInterval(() => {
      progress = Math.min(90, progress + Math.random() * 15);
      set({ fusionProgress: progress });
    }, 250);
    const result = await GeneratorService.generateFusion(
      state.slotA as GeneFragment,
      state.slotB as GeneFragment,
      state.creatures
    );
    clearInterval(progressTimer);
    set({ fusionProgress: 100 });
    setTimeout(() => {
      const nextHistory = [result, ...get().history].slice(0, 50);
      set({ fusionResult: result, history: nextHistory });
    }, 300);
  },

  deleteFromHistory: (id: string) => {
    set({ history: get().history.filter((r) => r.id !== id) });
  },

  clearHistory: () => {
    set({ history: [], fusionResult: null });
  },

  selectCreature: (c: Creature | null) => {
    set({ selectedCreature: c });
  },

  selectHistory: (r: FusionResult | null) => {
    set({ selectedHistory: r });
  },
}));
