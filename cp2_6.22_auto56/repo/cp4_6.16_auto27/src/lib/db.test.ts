import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get, set, del } from 'idb-keyval';
import type { TimeBlock, ReviewData, DailyReport } from '@/types';

vi.mock('idb-keyval', () => ({
  get: vi.fn(),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
}));

import {
  loadBlocks,
  saveBlocks,
  loadReviews,
  saveReviews,
  loadReport,
  saveReport,
  deleteBlockData,
} from './db';

describe('db operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadBlocks', () => {
    it('returns empty array when no data', async () => {
      vi.mocked(get).mockResolvedValueOnce(undefined);

      const result = await loadBlocks('2024-01-15');

      expect(result).toEqual([]);
      expect(get).toHaveBeenCalledWith('blocks:2024-01-15');
    });

    it('returns stored blocks', async () => {
      const mockBlocks: TimeBlock[] = [
        {
          id: '1',
          date: '2024-01-15',
          title: 'Test',
          startTime: 60,
          endTime: 120,
          color: '#fff',
          type: 'work',
          note: '',
          lane: 0,
        },
      ];

      vi.mocked(get).mockResolvedValueOnce(mockBlocks);

      const result = await loadBlocks('2024-01-15');

      expect(result).toEqual(mockBlocks);
      expect(get).toHaveBeenCalledWith('blocks:2024-01-15');
    });
  });

  describe('saveBlocks', () => {
    it('stores data correctly', async () => {
      const blocks: TimeBlock[] = [
        {
          id: '1',
          date: '2024-01-15',
          title: 'Test',
          startTime: 60,
          endTime: 120,
          color: '#fff',
          type: 'work',
          note: '',
          lane: 0,
        },
      ];

      await saveBlocks('2024-01-15', blocks);

      expect(set).toHaveBeenCalledWith('blocks:2024-01-15', blocks);
    });
  });

  describe('loadReviews', () => {
    it('returns empty object when no data', async () => {
      vi.mocked(get).mockResolvedValueOnce(undefined);

      const result = await loadReviews('2024-01-15');

      expect(result).toEqual({});
      expect(get).toHaveBeenCalledWith('reviews:2024-01-15');
    });

    it('returns stored reviews', async () => {
      const mockReviews: Record<string, ReviewData> = {
        'block-1': {
          blockId: 'block-1',
          completed: true,
          actualStart: 60,
          actualEnd: 120,
          satisfaction: 5,
        },
      };

      vi.mocked(get).mockResolvedValueOnce(mockReviews);

      const result = await loadReviews('2024-01-15');

      expect(result).toEqual(mockReviews);
      expect(get).toHaveBeenCalledWith('reviews:2024-01-15');
    });
  });

  describe('saveReviews', () => {
    it('stores data correctly', async () => {
      const reviews: Record<string, ReviewData> = {
        'block-1': {
          blockId: 'block-1',
          completed: true,
          actualStart: 60,
          actualEnd: 120,
          satisfaction: 5,
        },
      };

      await saveReviews('2024-01-15', reviews);

      expect(set).toHaveBeenCalledWith('reviews:2024-01-15', reviews);
    });
  });

  describe('loadReport', () => {
    it('returns null when no data', async () => {
      vi.mocked(get).mockResolvedValueOnce(undefined);

      const result = await loadReport('2024-01-15');

      expect(result).toBeNull();
      expect(get).toHaveBeenCalledWith('report:2024-01-15');
    });

    it('returns stored report', async () => {
      const mockReport: DailyReport = {
        date: '2024-01-15',
        completionRate: 0.8,
        utilizationRate: 0.75,
        typeDistribution: { work: 120, study: 60 },
        encouragement: 'Good job!',
        generated: true,
      };

      vi.mocked(get).mockResolvedValueOnce(mockReport);

      const result = await loadReport('2024-01-15');

      expect(result).toEqual(mockReport);
      expect(get).toHaveBeenCalledWith('report:2024-01-15');
    });
  });

  describe('saveReport', () => {
    it('stores data correctly', async () => {
      const report: DailyReport = {
        date: '2024-01-15',
        completionRate: 0.8,
        utilizationRate: 0.75,
        typeDistribution: { work: 120, study: 60 },
        encouragement: 'Good job!',
        generated: true,
      };

      await saveReport('2024-01-15', report);

      expect(set).toHaveBeenCalledWith('report:2024-01-15', report);
    });
  });

  describe('deleteBlockData', () => {
    it('deletes block and saves updated list', async () => {
      const blocks: TimeBlock[] = [
        {
          id: '1',
          date: '2024-01-15',
          title: 'Task 1',
          startTime: 60,
          endTime: 120,
          color: '#fff',
          type: 'work',
          note: '',
          lane: 0,
        },
        {
          id: '2',
          date: '2024-01-15',
          title: 'Task 2',
          startTime: 120,
          endTime: 180,
          color: '#fff',
          type: 'study',
          note: '',
          lane: 0,
        },
      ];

      vi.mocked(get).mockResolvedValueOnce(blocks);

      await deleteBlockData('2024-01-15', '1');

      expect(set).toHaveBeenCalledWith('blocks:2024-01-15', [blocks[1]]);
      expect(del).not.toHaveBeenCalled();
    });
  });
});
