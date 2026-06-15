import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useRecordStore } from './store';
import { calculateTotalDistance, calculateAvgElevation } from '@/shared/utils';

vi.mock('@/shared/db', () => ({
  saveTrail: vi.fn((trail) => Promise.resolve(trail)),
  saveTrackPointsBatch: vi.fn(() => Promise.resolve([])),
}));

describe('Record Store', () => {
  beforeEach(() => {
    useRecordStore.setState({
      isRecording: false,
      currentTrailId: null,
      currentTrailName: '',
      points: [],
      startTime: null,
      currentPosition: null,
      error: null,
    });
  });

  describe('startRecording', () => {
    it('应正确初始化录制状态', async () => {
      const store = useRecordStore.getState();
      await store.startRecording('测试轨迹');
      const state = useRecordStore.getState();

      expect(state.isRecording).toBe(true);
      expect(state.currentTrailId).toBeDefined();
      expect(state.currentTrailId).not.toBeNull();
      expect(state.currentTrailName).toBe('测试轨迹');
      expect(state.points).toEqual([]);
      expect(state.startTime).not.toBeNull();
      expect(state.startTime).toBeInstanceOf(Date);
      expect(state.error).toBeNull();
    });

    it('多次调用应覆盖之前的状态', async () => {
      const store = useRecordStore.getState();
      await store.startRecording('第一条轨迹');
      await store.startRecording('第二条轨迹');
      const state = useRecordStore.getState();

      expect(state.currentTrailName).toBe('第二条轨迹');
      expect(state.points).toEqual([]);
    });
  });

  describe('stopRecording', () => {
    it('没有轨迹ID或没有点时应返回null并重置状态', async () => {
      const store = useRecordStore.getState();
      const result = await store.stopRecording();

      expect(result).toBeNull();
      const state = useRecordStore.getState();
      expect(state.isRecording).toBe(false);
      expect(state.currentTrailId).toBeNull();
      expect(state.points).toEqual([]);
    });

    it('应正确计算距离和海拔并保存轨迹', async () => {
      const store = useRecordStore.getState();
      await store.startRecording('测试保存');

      const mockPoints = [
        {
          trailId: useRecordStore.getState().currentTrailId!,
          lat: 39.9042,
          lng: 116.4074,
          elevation: 50,
          timestamp: new Date(),
        },
        {
          trailId: useRecordStore.getState().currentTrailId!,
          lat: 39.9052,
          lng: 116.4084,
          elevation: 60,
          timestamp: new Date(),
        },
        {
          trailId: useRecordStore.getState().currentTrailId!,
          lat: 39.9062,
          lng: 116.4094,
          elevation: 70,
          timestamp: new Date(),
        },
      ];

      for (const p of mockPoints) {
        store.addPoint(p);
      }

      const expectedDistance = calculateTotalDistance(useRecordStore.getState().points);
      const expectedElevation = calculateAvgElevation(useRecordStore.getState().points);

      const result = await store.stopRecording();

      expect(result).not.toBeNull();
      expect(result?.name).toBe('测试保存');
      expect(result?.distance).toBeCloseTo(expectedDistance, 3);
      expect(result?.avgElevation).toBe(expectedElevation);
      expect(result?.isPublic).toBe(true);
      expect(result?.likes).toBe(0);

      const finalState = useRecordStore.getState();
      expect(finalState.isRecording).toBe(false);
      expect(finalState.currentTrailId).toBeNull();
      expect(finalState.points).toEqual([]);
    });
  });

  describe('addPoint', () => {
    it('应正确累加轨迹点', async () => {
      const store = useRecordStore.getState();
      await store.startRecording('加点测试');
      const trailId = useRecordStore.getState().currentTrailId!;

      const point1 = {
        trailId,
        lat: 39.9042,
        lng: 116.4074,
        elevation: 50,
        timestamp: new Date(),
      };
      const point2 = {
        trailId,
        lat: 39.9052,
        lng: 116.4084,
        elevation: 60,
        timestamp: new Date(),
      };

      store.addPoint(point1);
      expect(useRecordStore.getState().points).toHaveLength(1);

      store.addPoint(point2);
      const points = useRecordStore.getState().points;
      expect(points).toHaveLength(2);
      expect(points[0].id).toBeDefined();
      expect(points[0].lat).toBe(39.9042);
      expect(points[1].lng).toBe(116.4084);
    });

    it('每个点应生成唯一ID', async () => {
      const store = useRecordStore.getState();
      await store.startRecording('ID测试');
      const trailId = useRecordStore.getState().currentTrailId!;

      for (let i = 0; i < 5; i++) {
        store.addPoint({
          trailId,
          lat: 39.9 + i * 0.001,
          lng: 116.4 + i * 0.001,
          elevation: i * 10,
          timestamp: new Date(),
        });
      }

      const ids = useRecordStore.getState().points.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(5);
    });
  });

  describe('getCurrentDuration', () => {
    it('没有开始时间时应返回0', () => {
      const store = useRecordStore.getState();
      expect(store.getCurrentDuration()).toBe(0);
    });

    it('应正确计算经过的秒数', () => {
      useRecordStore.setState({
        startTime: new Date(Date.now() - 5000),
      });
      const duration = useRecordStore.getState().getCurrentDuration();
      expect(duration).toBeGreaterThanOrEqual(4.5);
      expect(duration).toBeLessThan(6);
    });

    it('应支持更大的时间跨度', () => {
      useRecordStore.setState({
        startTime: new Date(Date.now() - 2 * 60 * 1000 - 30 * 1000),
      });
      const duration = useRecordStore.getState().getCurrentDuration();
      expect(duration).toBeGreaterThanOrEqual(149.5);
      expect(duration).toBeLessThan(151);
    });
  });

  describe('getCurrentDistance', () => {
    it('空点数组应返回0', () => {
      const store = useRecordStore.getState();
      expect(store.getCurrentDistance()).toBe(0);
    });

    it('应调用calculateTotalDistance计算当前距离', async () => {
      const store = useRecordStore.getState();
      await store.startRecording('距离测试');
      const trailId = useRecordStore.getState().currentTrailId!;

      store.addPoint({
        trailId,
        lat: 39.9042,
        lng: 116.4074,
        elevation: 50,
        timestamp: new Date(),
      });
      store.addPoint({
        trailId,
        lat: 39.9052,
        lng: 116.4084,
        elevation: 60,
        timestamp: new Date(),
      });

      const distance = store.getCurrentDistance();
      const expected = calculateTotalDistance(useRecordStore.getState().points);
      expect(distance).toBeCloseTo(expected, 3);
      expect(distance).toBeGreaterThan(0);
    });

    it('单个点应返回0', async () => {
      const store = useRecordStore.getState();
      await store.startRecording('单点测试');
      const trailId = useRecordStore.getState().currentTrailId!;

      store.addPoint({
        trailId,
        lat: 39.9042,
        lng: 116.4074,
        elevation: 50,
        timestamp: new Date(),
      });

      expect(store.getCurrentDistance()).toBe(0);
    });
  });
});
