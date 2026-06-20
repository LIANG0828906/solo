import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { FormulaItem, Perfume, ScentCard, MoodType } from '../types';
import { SCENT_LIBRARY } from '../types';
import {
  buildFormulaItem,
  recalcRatios,
  getGradientColors,
  getDominantColor,
} from '../engine/mixEngine';

interface PerfumeState {
  scentLibrary: ScentCard[];
  currentFormula: FormulaItem[];
  perfumeLibrary: Perfume[];
  addedInstanceId: string | null;
  removedInstanceId: string | null;

  addScentToFormula: (scent: ScentCard) => void;
  removeFromFormula: (formulaItemId: string) => void;
  resetFormula: () => void;
  clearAddedInstanceId: () => void;
  clearRemovedInstanceId: () => void;

  addPerfume: (data: { name: string; mood: MoodType }) => boolean;
  removePerfume: (perfumeId: string) => void;
  updatePerfume: (perfumeId: string, patch: Partial<Perfume>) => void;
  getPerfumeList: () => Perfume[];
  loadPerfumeToFormula: (perfumeId: string) => void;
}

export const usePerfumeStore = create<PerfumeState>((set, get) => ({
  scentLibrary: SCENT_LIBRARY,
  currentFormula: [],
  perfumeLibrary: [],
  addedInstanceId: null,
  removedInstanceId: null,

  addScentToFormula: (scent) => {
    const instanceId = uuidv4();
    const newItem = buildFormulaItem(scent, instanceId);
    const updated = [...get().currentFormula, newItem];
    set({
      currentFormula: recalcRatios(updated),
      addedInstanceId: instanceId,
    });
  },

  removeFromFormula: (formulaItemId) => {
    const filtered = get().currentFormula.filter(f => f.id !== formulaItemId);
    set({
      currentFormula: recalcRatios(filtered),
      removedInstanceId: formulaItemId,
    });
  },

  resetFormula: () => set({ currentFormula: [] }),
  clearAddedInstanceId: () => set({ addedInstanceId: null }),
  clearRemovedInstanceId: () => set({ removedInstanceId: null }),

  addPerfume: ({ name, mood }) => {
    const formula = get().currentFormula;
    if (formula.length === 0 || !name.trim()) return false;
    const perfume: Perfume = {
      id: uuidv4(),
      name: name.trim(),
      mood,
      formula: [...formula],
      gradientColors: getGradientColors(formula),
      dominantColor: getDominantColor(formula),
      createdAt: Date.now(),
    };
    set(state => ({
      perfumeLibrary: [perfume, ...state.perfumeLibrary],
    }));
    return true;
  },

  removePerfume: (perfumeId) => {
    set(state => ({
      perfumeLibrary: state.perfumeLibrary.filter(p => p.id !== perfumeId),
    }));
  },

  updatePerfume: (perfumeId, patch) => {
    set(state => ({
      perfumeLibrary: state.perfumeLibrary.map(p =>
        p.id === perfumeId ? { ...p, ...patch } : p
      ),
    }));
  },

  getPerfumeList: () => get().perfumeLibrary,

  loadPerfumeToFormula: (perfumeId) => {
    const target = get().perfumeLibrary.find(p => p.id === perfumeId);
    if (!target) return;
    const cloned: FormulaItem[] = target.formula.map(f => ({
      ...f, id: uuidv4() }));
    set({ currentFormula: recalcRatios(cloned) });
  },
}));
