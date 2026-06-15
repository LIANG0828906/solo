import { describe, it, expect, vi, beforeEach } from 'vitest';
import { create } from 'zustand';
import { act } from 'react-dom/test-utils';
import type { TimeBlock, ReviewData, DailyReport } from '@/types';
import { ENCOURAGEMENTS } from '@/lib/constants';

vi.mock('@/lib/db', () => ({
  loadBlocks: vi.fn().mockResolvedValue([]),
  saveBlocks: vi.fn().mockResolvedValue(undefined),
  loadReviews: vi.fn().mockResolvedValue({}),
  saveReviews: vi.fn().mockResolvedValue(undefined),
  loadReport: vi.fn().mockResolvedValue(null),
  saveReport: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('uuid', () => ({
  v4: vi.fn().mockReturnValue('test-uuid'),
}));

vi.mock('date-fns', () => ({
  format: vi.fn().mockReturnValue('2024-01-15'),
}));

import { loadBlocks, saveBlocks, loadReviews, saveReviews, loadReport, saveReport } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

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

const createTestStore = () => {
  return create<PlanStore>((set, get) => ({
    currentDate: '2024-01-15',
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
      const clamp = (v: number) => Math.max(0, Math.min(1440, v));
      const s = clamp(startTime);
      const e = clamp(endTime);
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
};

describe('usePlanStore', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    store = createTestStore();
  });

  describe('initial state', () => {
    it('has correct initial state', () => {
      const state = store.getState();
      expect(state.currentDate).toBe('2024-01-15');
      expect(state.blocks).toEqual([]);
      expect(state.reviews).toEqual({});
      expect(state.report).toBeNull();
    });
  });

  describe('setCurrentDate', () => {
    it('changes date and clears blocks/reviews/report', () => {
      act(() => {
        store.getState().addBlock({
          title: 'Test',
          startTime: 60,
          endTime: 120,
          color: '#fff',
          type: 'work',
          note: '',
          lane: 0,
        });
        store.getState().setReview('test-uuid', {
          blockId: 'test-uuid',
          completed: true,
          actualStart: 60,
          actualEnd: 120,
          satisfaction: 5,
        });
        store.getState().generateReport();
      });

      expect(store.getState().blocks.length).toBe(1);
      expect(Object.keys(store.getState().reviews).length).toBe(1);
      expect(store.getState().report).not.toBeNull();

      act(() => {
        store.getState().setCurrentDate('2024-01-16');
      });

      expect(store.getState().currentDate).toBe('2024-01-16');
      expect(store.getState().blocks).toEqual([]);
      expect(store.getState().reviews).toEqual({});
      expect(store.getState().report).toBeNull();
      expect(loadBlocks).toHaveBeenCalledWith('2024-01-16');
    });
  });

  describe('addBlock', () => {
    it('adds a new block with generated id and currentDate', () => {
      const blockData = {
        title: 'Morning Work',
        startTime: 60,
        endTime: 120,
        color: '#e94560',
        type: 'work' as const,
        note: 'Important task',
        lane: 0,
      };

      act(() => {
        store.getState().addBlock(blockData);
      });

      const blocks = store.getState().blocks;
      expect(blocks.length).toBe(1);
      expect(blocks[0]).toEqual({
        ...blockData,
        id: 'test-uuid',
        date: '2024-01-15',
      });
      expect(saveBlocks).toHaveBeenCalledWith('2024-01-15', blocks);
    });
  });

  describe('updateBlock', () => {
    it('updates only specified fields', () => {
      act(() => {
        store.getState().addBlock({
          title: 'Original',
          startTime: 60,
          endTime: 120,
          color: '#fff',
          type: 'work',
          note: '',
          lane: 0,
        });
      });

      act(() => {
        store.getState().updateBlock('test-uuid', {
          title: 'Updated',
          startTime: 90,
        });
      });

      const blocks = store.getState().blocks;
      expect(blocks[0].title).toBe('Updated');
      expect(blocks[0].startTime).toBe(90);
      expect(blocks[0].endTime).toBe(120);
      expect(blocks[0].color).toBe('#fff');
      expect(saveBlocks).toHaveBeenCalledTimes(2);
    });
  });

  describe('deleteBlock', () => {
    it('removes block and associated review', () => {
      act(() => {
        store.getState().addBlock({
          title: 'Test',
          startTime: 60,
          endTime: 120,
          color: '#fff',
          type: 'work',
          note: '',
          lane: 0,
        });
        store.getState().setReview('test-uuid', {
          blockId: 'test-uuid',
          completed: true,
          actualStart: 60,
          actualEnd: 120,
          satisfaction: 5,
        });
      });

      expect(store.getState().blocks.length).toBe(1);
      expect(store.getState().reviews['test-uuid']).not.toBeUndefined();

      act(() => {
        store.getState().deleteBlock('test-uuid');
      });

      expect(store.getState().blocks).toEqual([]);
      expect(store.getState().reviews['test-uuid']).toBeUndefined();
      expect(saveBlocks).toHaveBeenCalledWith('2024-01-15', []);
      expect(saveReviews).toHaveBeenCalledWith('2024-01-15', {});
    });
  });

  describe('moveBlock', () => {
    it('updates startTime and endTime with clamping', () => {
      act(() => {
        store.getState().addBlock({
          title: 'Test',
          startTime: 60,
          endTime: 120,
          color: '#fff',
          type: 'work',
          note: '',
          lane: 0,
        });
      });

      act(() => {
        store.getState().moveBlock('test-uuid', 100, 200);
      });

      const blocks = store.getState().blocks;
      expect(blocks[0].startTime).toBe(100);
      expect(blocks[0].endTime).toBe(200);
      expect(saveBlocks).toHaveBeenCalledTimes(2);
    });

    it('clamps values to 0-1440 range', () => {
      act(() => {
        store.getState().addBlock({
          title: 'Test',
          startTime: 60,
          endTime: 120,
          color: '#fff',
          type: 'work',
          note: '',
          lane: 0,
        });
      });

      act(() => {
        store.getState().moveBlock('test-uuid', -50, 1500);
      });

      const blocks = store.getState().blocks;
      expect(blocks[0].startTime).toBe(0);
      expect(blocks[0].endTime).toBe(1440);
    });

    it('does not update if endTime <= startTime', () => {
      act(() => {
        store.getState().addBlock({
          title: 'Test',
          startTime: 60,
          endTime: 120,
          color: '#fff',
          type: 'work',
          note: '',
          lane: 0,
        });
      });

      const saveCallCount = vi.mocked(saveBlocks).mock.calls.length;

      act(() => {
        store.getState().moveBlock('test-uuid', 200, 100);
      });

      expect(vi.mocked(saveBlocks).mock.calls.length).toBe(saveCallCount);
      const blocks = store.getState().blocks;
      expect(blocks[0].startTime).toBe(60);
      expect(blocks[0].endTime).toBe(120);
    });
  });

  describe('setReview', () => {
    it('adds a new review', () => {
      act(() => {
        store.getState().addBlock({
          title: 'Test',
          startTime: 60,
          endTime: 120,
          color: '#fff',
          type: 'work',
          note: '',
          lane: 0,
        });
      });

      const review: ReviewData = {
        blockId: 'test-uuid',
        completed: true,
        actualStart: 65,
        actualEnd: 115,
        satisfaction: 4,
      };

      act(() => {
        store.getState().setReview('test-uuid', review);
      });

      expect(store.getState().reviews['test-uuid']).toEqual(review);
      expect(saveReviews).toHaveBeenCalledWith('2024-01-15', { 'test-uuid': review });
    });

    it('updates existing review', () => {
      act(() => {
        store.getState().addBlock({
          title: 'Test',
          startTime: 60,
          endTime: 120,
          color: '#fff',
          type: 'work',
          note: '',
          lane: 0,
        });
      });

      const review1: ReviewData = {
        blockId: 'test-uuid',
        completed: true,
        actualStart: 60,
        actualEnd: 120,
        satisfaction: 5,
      };

      const review2: ReviewData = {
        blockId: 'test-uuid',
        completed: false,
        actualStart: 0,
        actualEnd: 0,
        satisfaction: 3,
      };

      act(() => {
        store.getState().setReview('test-uuid', review1);
      });

      act(() => {
        store.getState().setReview('test-uuid', review2);
      });

      expect(store.getState().reviews['test-uuid']).toEqual(review2);
    });
  });

  describe('generateReport', () => {
    it('calculates correct completionRate when all blocks completed', () => {
      vi.mocked(uuidv4).mockReturnValueOnce('uuid-1').mockReturnValueOnce('uuid-2');

      act(() => {
        store.getState().addBlock({
          title: 'Task 1',
          startTime: 60,
          endTime: 120,
          color: '#fff',
          type: 'work',
          note: '',
          lane: 0,
        });
        store.getState().addBlock({
          title: 'Task 2',
          startTime: 120,
          endTime: 180,
          color: '#fff',
          type: 'study',
          note: '',
          lane: 0,
        });

        store.getState().setReview('uuid-1', {
          blockId: 'uuid-1',
          completed: true,
          actualStart: 60,
          actualEnd: 120,
          satisfaction: 5,
        });
        store.getState().setReview('uuid-2', {
          blockId: 'uuid-2',
          completed: true,
          actualStart: 120,
          actualEnd: 180,
          satisfaction: 4,
        });
      });

      act(() => {
        store.getState().generateReport();
      });

      const report = store.getState().report;
      expect(report).not.toBeNull();
      expect(report?.completionRate).toBe(1);
      expect(report?.generated).toBe(true);
      expect(saveReport).toHaveBeenCalled();
    });

    it('calculates correct completionRate when some blocks completed', () => {
      vi.mocked(uuidv4).mockReturnValueOnce('uuid-1').mockReturnValueOnce('uuid-2');

      act(() => {
        store.getState().addBlock({
          title: 'Task 1',
          startTime: 60,
          endTime: 120,
          color: '#fff',
          type: 'work',
          note: '',
          lane: 0,
        });
        store.getState().addBlock({
          title: 'Task 2',
          startTime: 120,
          endTime: 180,
          color: '#fff',
          type: 'study',
          note: '',
          lane: 0,
        });

        store.getState().setReview('uuid-1', {
          blockId: 'uuid-1',
          completed: true,
          actualStart: 60,
          actualEnd: 120,
          satisfaction: 5,
        });
        store.getState().setReview('uuid-2', {
          blockId: 'uuid-2',
          completed: false,
          actualStart: 0,
          actualEnd: 0,
          satisfaction: 3,
        });
      });

      act(() => {
        store.getState().generateReport();
      });

      const report = store.getState().report;
      expect(report?.completionRate).toBe(0.5);
    });

    it('calculates correct utilizationRate', () => {
      act(() => {
        store.getState().addBlock({
          title: 'Task',
          startTime: 60,
          endTime: 120,
          color: '#fff',
          type: 'work',
          note: '',
          lane: 0,
        });

        store.getState().setReview('test-uuid', {
          blockId: 'test-uuid',
          completed: true,
          actualStart: 70,
          actualEnd: 110,
          satisfaction: 4,
        });
      });

      act(() => {
        store.getState().generateReport();
      });

      const report = store.getState().report;
      expect(report?.utilizationRate).toBe(40 / 60);
    });

    it('caps utilizationRate at 1', () => {
      act(() => {
        store.getState().addBlock({
          title: 'Task',
          startTime: 60,
          endTime: 120,
          color: '#fff',
          type: 'work',
          note: '',
          lane: 0,
        });

        store.getState().setReview('test-uuid', {
          blockId: 'test-uuid',
          completed: true,
          actualStart: 30,
          actualEnd: 150,
          satisfaction: 4,
        });
      });

      act(() => {
        store.getState().generateReport();
      });

      const report = store.getState().report;
      expect(report?.utilizationRate).toBe(1);
    });

    it('calculates correct typeDistribution', () => {
      vi.mocked(uuidv4).mockReturnValueOnce('uuid-1').mockReturnValueOnce('uuid-2').mockReturnValueOnce('uuid-3');

      act(() => {
        store.getState().addBlock({
          title: 'Work Task',
          startTime: 60,
          endTime: 120,
          color: '#fff',
          type: 'work',
          note: '',
          lane: 0,
        });
        store.getState().addBlock({
          title: 'Study Task',
          startTime: 120,
          endTime: 210,
          color: '#fff',
          type: 'study',
          note: '',
          lane: 0,
        });
        store.getState().addBlock({
          title: 'Work Task 2',
          startTime: 210,
          endTime: 270,
          color: '#fff',
          type: 'work',
          note: '',
          lane: 0,
        });

        store.getState().setReview('uuid-1', {
          blockId: 'uuid-1',
          completed: true,
          actualStart: 60,
          actualEnd: 120,
          satisfaction: 4,
        });
        store.getState().setReview('uuid-2', {
          blockId: 'uuid-2',
          completed: true,
          actualStart: 120,
          actualEnd: 210,
          satisfaction: 4,
        });
        store.getState().setReview('uuid-3', {
          blockId: 'uuid-3',
          completed: true,
          actualStart: 210,
          actualEnd: 270,
          satisfaction: 4,
        });
      });

      act(() => {
        store.getState().generateReport();
      });

      const report = store.getState().report;
      expect(report?.typeDistribution['work']).toBe(120);
      expect(report?.typeDistribution['study']).toBe(90);
    });

    it('selects random encouragement from ENCOURAGEMENTS array', () => {
      act(() => {
        store.getState().addBlock({
          title: 'Task',
          startTime: 60,
          endTime: 120,
          color: '#fff',
          type: 'work',
          note: '',
          lane: 0,
        });
        store.getState().setReview('test-uuid', {
          blockId: 'test-uuid',
          completed: true,
          actualStart: 60,
          actualEnd: 120,
          satisfaction: 4,
        });
      });

      act(() => {
        store.getState().generateReport();
      });

      const report = store.getState().report;
      expect(ENCOURAGEMENTS).toContain(report?.encouragement);
    });

    it('does not generate report when there are no blocks', () => {
      act(() => {
        store.getState().generateReport();
      });

      expect(store.getState().report).toBeNull();
      expect(saveReport).not.toHaveBeenCalled();
    });
  });

  describe('auto-report trigger', () => {
    it('generates report automatically when last block review is saved', () => {
      vi.mocked(uuidv4).mockReturnValueOnce('uuid-1').mockReturnValueOnce('uuid-2');

      act(() => {
        store.getState().addBlock({
          title: 'Task 1',
          startTime: 60,
          endTime: 120,
          color: '#fff',
          type: 'work',
          note: '',
          lane: 0,
        });
        store.getState().addBlock({
          title: 'Task 2',
          startTime: 120,
          endTime: 180,
          color: '#fff',
          type: 'study',
          note: '',
          lane: 0,
        });
      });

      const reportSpy = vi.spyOn(store.getState(), 'generateReport');

      act(() => {
        store.getState().setReview('uuid-1', {
          blockId: 'uuid-1',
          completed: true,
          actualStart: 60,
          actualEnd: 120,
          satisfaction: 4,
        });
      });

      expect(store.getState().report).toBeNull();
      expect(reportSpy).not.toHaveBeenCalled();

      act(() => {
        store.getState().setReview('uuid-2', {
          blockId: 'uuid-2',
          completed: true,
          actualStart: 120,
          actualEnd: 180,
          satisfaction: 4,
        });
      });

      expect(reportSpy).toHaveBeenCalled();
      expect(store.getState().report).not.toBeNull();
    });

    it('does not generate report if already generated', () => {
      vi.mocked(uuidv4).mockReturnValueOnce('uuid-1');

      const reportSpy = vi.spyOn(store.getState(), 'generateReport');

      act(() => {
        store.getState().addBlock({
          title: 'Task',
          startTime: 60,
          endTime: 120,
          color: '#fff',
          type: 'work',
          note: '',
          lane: 0,
        });

        store.getState().setReview('uuid-1', {
          blockId: 'uuid-1',
          completed: true,
          actualStart: 60,
          actualEnd: 120,
          satisfaction: 4,
        });
      });

      expect(reportSpy).toHaveBeenCalledTimes(1);
      expect(store.getState().report?.generated).toBe(true);

      act(() => {
        store.getState().setReview('uuid-1', {
          blockId: 'uuid-1',
          completed: true,
          actualStart: 65,
          actualEnd: 115,
          satisfaction: 5,
        });
      });

      expect(reportSpy).toHaveBeenCalledTimes(1);
    });
  });
});
