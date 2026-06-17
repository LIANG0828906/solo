import { create } from 'zustand';
import { Microbe, StatsPoint, MicrobeType } from '../types';

interface EcosystemState {
  microbes: Microbe[];
  stats: StatsPoint[];
  counts: Record<MicrobeType, number>;
  setMicrobes: (microbes: Microbe[]) => void;
  addMicrobe: (microbe: Microbe) => void;
  removeMicrobe: (id: string) => void;
  updateMicrobe: (id: string, updates: Partial<Microbe>) => void;
  addStatsPoint: (point: StatsPoint) => void;
  resetStats: () => void;
  updateCounts: () => void;
}

const initialCounts: Record<MicrobeType, number> = {
  [MicrobeType.COCCUS]: 0,
  [MicrobeType.BACILLUS]: 0,
  [MicrobeType.SPIRILLUM]: 0,
};

export const useEcosystemStore = create<EcosystemState>((set, get) => ({
  microbes: [],
  stats: [],
  counts: { ...initialCounts },

  setMicrobes: (microbes: Microbe[]) => {
    const counts = { ...initialCounts };
    microbes.forEach((m) => {
      counts[m.type]++;
    });
    set({ microbes, counts });
  },

  addMicrobe: (microbe: Microbe) => {
    const { microbes, counts } = get();
    const newCounts = { ...counts, [microbe.type]: counts[microbe.type] + 1 };
    set({ microbes: [...microbes, microbe], counts: newCounts });
  },

  removeMicrobe: (id: string) => {
    const { microbes, counts } = get();
    const m = microbes.find((x) => x.id === id);
    if (!m) return;
    const newCounts = { ...counts, [m.type]: Math.max(0, counts[m.type] - 1) };
    set({
      microbes: microbes.filter((x) => x.id !== id),
      counts: newCounts,
    });
  },

  updateMicrobe: (id: string, updates: Partial<Microbe>) => {
    const { microbes } = get();
    set({
      microbes: microbes.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    });
  },

  addStatsPoint: (point: StatsPoint) => {
    const { stats } = get();
    const cutoff = point.time - 30;
    const filtered = stats.filter((s) => s.time >= cutoff);
    set({ stats: [...filtered, point] });
  },

  resetStats: () => set({ stats: [], counts: { ...initialCounts } }),

  updateCounts: () => {
    const { microbes } = get();
    const counts = { ...initialCounts };
    microbes.forEach((m) => {
      counts[m.type]++;
    });
    set({ counts });
  },
}));
