import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import type { TimeBlock, ReviewData, DailyReport } from '@/types';
import { loadBlocks, saveBlocks, loadReviews, saveReviews, loadReport, saveReport } from '@/lib/db';
import { ENCOURAGEMENTS, TASK_TYPE_COLORS, clampMinutes } from '@/lib/constants';

interface PlanStore {
  currentDate: string;
  blocks: TimeBlock[];
  reviews: Record<string, ReviewData>;
  report: DailyReport | null;

  setCurrentDate: (date: string) => void;
  addBlock: (block: Omit<TimeBlock, 'id' | 'date'>) => void;
  updateBlock: (id: string, updates: Partial<TimeBlock>) => void;
  deleteBlock: (id: string) => void;
  moveBlock: (id: string, startTime: number, endTime: number) => void;
  setReview: (blockId: string, review: ReviewData) => void;
  generateReport: () => void;
  loadFromDB: (date: string) => Promise<void>;
}

export const usePlanStore = create<PlanStore>((set, get) => ({
  currentDate: format(new Date(), 'yyyy-MM-dd'),
  blocks: [],
  reviews: {},
  report: null,

  setCurrentDate: (date: string) => {
    set({ currentDate: date, blocks: [], reviews: {}, report: null });
    get().loadFromDB(date);
  },

  addBlock: (block) => {
    const { currentDate, blocks } = get();
    const newBlock: TimeBlock = { ...block, id: uuidv4(), date: currentDate };
    const updated = [...blocks, newBlock];
    set({ blocks: updated });
    saveBlocks(currentDate, updated);
  },

  updateBlock: (id, updates) => {
    const { currentDate, blocks } = get();
    const updated = blocks.map(b => b.id === id ? { ...b, ...updates } : b);
    set({ blocks: updated });
    saveBlocks(currentDate, updated);
  },

  deleteBlock: (id) => {
    const { currentDate, blocks, reviews } = get();
    const updatedBlocks = blocks.filter(b => b.id !== id);
    const updatedReviews = { ...reviews };
    delete updatedReviews[id];
    set({ blocks: updatedBlocks, reviews: updatedReviews });
    saveBlocks(currentDate, updatedBlocks);
    saveReviews(currentDate, updatedReviews);
  },

  moveBlock: (id, startTime, endTime) => {
    const s = clampMinutes(startTime);
    const e = clampMinutes(endTime);
    if (e <= s) return;
    const { currentDate, blocks } = get();
    const updated = blocks.map(b => b.id === id ? { ...b, startTime: s, endTime: e } : b);
    set({ blocks: updated });
    saveBlocks(currentDate, updated);
  },

  setReview: (blockId, review) => {
    const { currentDate, reviews } = get();
    const updated = { ...reviews, [blockId]: review };
    set({ reviews: updated });
    saveReviews(currentDate, updated);
    const { blocks, report } = get();
    const allReviewed = blocks.every(b => updated[b.id]);
    if (allReviewed && blocks.length > 0 && !report?.generated) {
      get().generateReport();
    }
  },

  generateReport: () => {
    const { currentDate, blocks, reviews } = get();
    if (blocks.length === 0) return;

    const completed = blocks.filter(b => reviews[b.id]?.completed).length;
    const completionRate = completed / blocks.length;

    let plannedTotal = 0;
    let actualTotal = 0;
    blocks.forEach(b => {
      plannedTotal += b.endTime - b.startTime;
      const r = reviews[b.id];
      if (r) {
        actualTotal += r.actualEnd - r.actualStart;
      }
    });
    const utilizationRate = plannedTotal > 0 ? Math.min(actualTotal / plannedTotal, 1) : 0;

    const typeDistribution: Record<string, number> = {};
    blocks.forEach(b => {
      const typeKey = b.type;
      typeDistribution[typeKey] = (typeDistribution[typeKey] || 0) + (b.endTime - b.startTime);
    });

    const encouragement = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];

    const report: DailyReport = {
      date: currentDate,
      completionRate,
      utilizationRate,
      typeDistribution,
      encouragement,
      generated: true,
    };

    set({ report });
    saveReport(currentDate, report);
  },

  loadFromDB: async (date: string) => {
    const [blocks, reviews, report] = await Promise.all([
      loadBlocks(date),
      loadReviews(date),
      loadReport(date),
    ]);
    set({ blocks, reviews, report });
  },
}));
