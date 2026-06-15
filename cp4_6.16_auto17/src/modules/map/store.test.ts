import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useMapStore } from './store';
import { TrailWithPoints, POI } from '@/shared/types';
import { getBounds } from '@/shared/utils';

const createMockTrail = (id: string, name: string, points: { lat: number; lng: number }[]): TrailWithPoints => {
  const now = new Date();
  return {
    id,
    name,
    createdAt: now,
    distance: points.length * 100,
    avgElevation: 100,
    isPublic: true,
    likes: 0,
    points: points.map((p, i) => ({
      id: `${id}-p${i}`,
      trailId: id,
      lat: p.lat,
      lng: p.lng,
      elevation: 100 + i * 10,
      timestamp: now,
    })),
  };
};

const mockTrail1 = createMockTrail('trail-1', '香山徒步', [
  { lat: 39.9000, lng: 116.4000 },
  { lat: 39.9020, lng: 116.4020 },
  { lat: 39.9040, lng: 116.4040 },
]);

const mockTrail2 = createMockTrail('trail-2', '八达岭长城', [
  { lat: 40.3500, lng: 116.0100 },
  { lat: 40.3530, lng: 116.0130 },
  { lat: 40.3560, lng: 116.0160 },
  { lat: 40.3590, lng: 116.0190 },
]);

const mockTrail3 = createMockTrail('trail-3', '慕田峪长城', [
  { lat: 40.4260, lng: 116.5560 },
  { lat: 40.4290, lng: 116.5590 },
  { lat: 40.4320, lng: 116.5620 },
]);

const mockPOI1: POI = {
  id: 'poi-1',
  trailId: 'trail-1',
  name: '测试点1',
  description: '描述1',
  lat: 39.9010,
  lng: 116.4010,
  createdAt: new Date(),
};

const mockPOI2: POI = {
  id: 'poi-2',
  trailId: 'trail-2',
  name: '测试点2',
  description: '描述2',
  lat: 40.3540,
  lng: 116.0140,
  createdAt: new Date(),
};

const mockPOI3: POI = {
  id: 'poi-3',
  trailId: 'trail-1',
  name: '测试点3',
  description: '描述3',
  lat: 39.9030,
  lng: 116.4030,
  createdAt: new Date(),
};

vi.mock('@/shared/db', () => ({
  getAllTrails: vi.fn(() => Promise.resolve([
    { id: mockTrail1.id, name: mockTrail1.name, createdAt: mockTrail1.createdAt, distance: mockTrail1.distance, avgElevation: mockTrail1.avgElevation, isPublic: mockTrail1.isPublic, likes: mockTrail1.likes },
    { id: mockTrail2.id, name: mockTrail2.name, createdAt: mockTrail2.createdAt, distance: mockTrail2.distance, avgElevation: mockTrail2.avgElevation, isPublic: mockTrail2.isPublic, likes: mockTrail2.likes },
    { id: mockTrail3.id, name: mockTrail3.name, createdAt: mockTrail3.createdAt, distance: mockTrail3.distance, avgElevation: mockTrail3.avgElevation, isPublic: mockTrail3.isPublic, likes: mockTrail3.likes },
  ])),
  getTrailWithPoints: vi.fn((id: string) => {
    if (id === mockTrail1.id) return Promise.resolve(mockTrail1);
    if (id === mockTrail2.id) return Promise.resolve(mockTrail2);
    if (id === mockTrail3.id) return Promise.resolve(mockTrail3);
    return Promise.resolve(null);
  }),
  getPOIsByTrail: vi.fn(() => Promise.resolve([])),
  savePOI: vi.fn((poi) => Promise.resolve({ ...poi, id: poi.id || 'new-poi-id', createdAt: poi.createdAt || new Date() })),
  deletePOI: vi.fn(() => Promise.resolve()),
  updatePOI: vi.fn((id, updates) => Promise.resolve({ id, ...updates })),
}));

describe('Map Store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useMapStore.setState({
      selectedTrailIds: [],
      activeTrailId: null,
      trails: new Map(),
      pois: [],
      isAddingPOI: false,
      selectedPOI: null,
      compareMode: false,
      compareTrailIds: null,
      mapCenter: [39.9042, 116.4074],
      mapZoom: 12,
    });
  });

  describe('loadAllTrails', () => {
    it('应加载多条轨迹到trails Map中', async () => {
      const store = useMapStore.getState();
      await store.loadAllTrails();
      const state = useMapStore.getState();

      expect(state.trails.size).toBe(3);
      expect(state.trails.get('trail-1')?.name).toBe('香山徒步');
      expect(state.trails.get('trail-2')?.name).toBe('八达岭长城');
      expect(state.trails.get('trail-3')?.name).toBe('慕田峪长城');
      expect(state.trails.get('trail-1')?.points).toHaveLength(3);
      expect(state.trails.get('trail-2')?.points).toHaveLength(4);
    });
  });

  describe('selectTrail', () => {
    beforeEach(async () => {
      await useMapStore.getState().loadAllTrails();
    });

    it('应切换选中轨迹并清空多选', () => {
      const store = useMapStore.getState();
      store.toggleTrailSelection('trail-1');
      store.toggleTrailSelection('trail-2');
      expect(useMapStore.getState().selectedTrailIds).toHaveLength(2);

      store.selectTrail('trail-3');
      const state = useMapStore.getState();
      expect(state.selectedTrailIds).toEqual(['trail-3']);
      expect(state.activeTrailId).toBe('trail-3');
    });

    it('选中轨迹后应计算边界', () => {
      const store = useMapStore.getState();
      store.selectTrail('trail-1');
      const state = useMapStore.getState();

      const bounds = getBounds(mockTrail1.points);
      expect(bounds).not.toBeNull();
      if (bounds) {
        const centerLat = (bounds[0][0] + bounds[1][0]) / 2;
        const centerLng = (bounds[0][1] + bounds[1][1]) / 2;
        expect(state.mapCenter[0]).toBeCloseTo(centerLat, 5);
        expect(state.mapCenter[1]).toBeCloseTo(centerLng, 5);
      }
    });
  });

  describe('toggleTrailSelection', () => {
    beforeEach(async () => {
      await useMapStore.getState().loadAllTrails();
    });

    it('未选中时应添加到选中列表', () => {
      const store = useMapStore.getState();
      store.toggleTrailSelection('trail-1');
      expect(useMapStore.getState().selectedTrailIds).toContain('trail-1');
      expect(useMapStore.getState().activeTrailId).toBe('trail-1');
    });

    it('已选中时应从选中列表移除', () => {
      const store = useMapStore.getState();
      store.toggleTrailSelection('trail-1');
      store.toggleTrailSelection('trail-2');
      store.toggleTrailSelection('trail-1');
      const state = useMapStore.getState();
      expect(state.selectedTrailIds).not.toContain('trail-1');
      expect(state.selectedTrailIds).toContain('trail-2');
      expect(state.selectedTrailIds).toHaveLength(1);
    });

    it('多选时activeTrailId应为最后选中的', () => {
      const store = useMapStore.getState();
      store.toggleTrailSelection('trail-1');
      store.toggleTrailSelection('trail-2');
      store.toggleTrailSelection('trail-3');
      expect(useMapStore.getState().activeTrailId).toBe('trail-3');

      store.toggleTrailSelection('trail-3');
      expect(useMapStore.getState().activeTrailId).toBe('trail-2');
    });

    it('全部取消选中时activeTrailId应为null', () => {
      const store = useMapStore.getState();
      store.toggleTrailSelection('trail-1');
      store.toggleTrailSelection('trail-1');
      const state = useMapStore.getState();
      expect(state.selectedTrailIds).toEqual([]);
      expect(state.activeTrailId).toBeNull();
    });
  });

  describe('enableCompareMode', () => {
    beforeEach(async () => {
      await useMapStore.getState().loadAllTrails();
    });

    it('应启用对比模式并设置两条对比轨迹', () => {
      const store = useMapStore.getState();
      store.enableCompareMode('trail-1', 'trail-2');
      vi.advanceTimersByTime(200);
      const state = useMapStore.getState();

      expect(state.compareMode).toBe(true);
      expect(state.compareTrailIds).toEqual(['trail-1', 'trail-2']);
      expect(state.selectedTrailIds).toContain('trail-1');
      expect(state.selectedTrailIds).toContain('trail-2');
      expect(state.selectedTrailIds).toHaveLength(2);
    });

    it('应计算两条轨迹的合并边界', () => {
      const store = useMapStore.getState();
      store.enableCompareMode('trail-1', 'trail-2');
      vi.advanceTimersByTime(200);
      const state = useMapStore.getState();

      const allPoints = [...mockTrail1.points, ...mockTrail2.points];
      const bounds = getBounds(allPoints);
      expect(bounds).not.toBeNull();
      if (bounds) {
        const centerLat = (bounds[0][0] + bounds[1][0]) / 2;
        const centerLng = (bounds[0][1] + bounds[1][1]) / 2;
        expect(state.mapCenter[0]).toBeCloseTo(centerLat, 3);
        expect(state.mapCenter[1]).toBeCloseTo(centerLng, 3);
      }
    });
  });

  describe('setCompareTrails', () => {
    beforeEach(async () => {
      await useMapStore.getState().loadAllTrails();
      const store = useMapStore.getState();
      store.enableCompareMode('trail-1', 'trail-2');
      vi.advanceTimersByTime(200);
    });

    it('对比中切换轨迹正确更新', () => {
      const store = useMapStore.getState();
      store.setCompareTrails('trail-1', 'trail-3');
      vi.advanceTimersByTime(200);
      const state = useMapStore.getState();

      expect(state.compareTrailIds).toContain('trail-1');
      expect(state.compareTrailIds).toContain('trail-3');
      expect(state.compareTrailIds).not.toContain('trail-2');
    });

    it('切换后compareTrailIds顺序正确', () => {
      const store = useMapStore.getState();
      store.setCompareTrails('trail-3', 'trail-1');
      const state = useMapStore.getState();

      expect(state.compareTrailIds).toEqual(['trail-3', 'trail-1']);
    });

    it('切换后地图边界更新', () => {
      const store = useMapStore.getState();
      const beforeCenter = [...useMapStore.getState().mapCenter];

      store.setCompareTrails('trail-1', 'trail-3');
      vi.advanceTimersByTime(200);
      const state = useMapStore.getState();

      expect(state.mapCenter).not.toEqual(beforeCenter);

      const allPoints = [...mockTrail1.points, ...mockTrail3.points];
      const bounds = getBounds(allPoints);
      expect(bounds).not.toBeNull();
      if (bounds) {
        const centerLat = (bounds[0][0] + bounds[1][0]) / 2;
        const centerLng = (bounds[0][1] + bounds[1][1]) / 2;
        expect(state.mapCenter[0]).toBeCloseTo(centerLat, 3);
        expect(state.mapCenter[1]).toBeCloseTo(centerLng, 3);
      }
    });
  });

  describe('disableCompareMode', () => {
    beforeEach(async () => {
      await useMapStore.getState().loadAllTrails();
      const store = useMapStore.getState();
      store.enableCompareMode('trail-1', 'trail-2');
      vi.advanceTimersByTime(200);
    });

    it('退出后compareMode为false', () => {
      const store = useMapStore.getState();
      store.disableCompareMode();
      const state = useMapStore.getState();
      expect(state.compareMode).toBe(false);
    });

    it('退出后compareTrailIds为null', () => {
      const store = useMapStore.getState();
      store.disableCompareMode();
      const state = useMapStore.getState();
      expect(state.compareTrailIds).toBeNull();
    });
  });

  describe('setAddingPOI', () => {
    it('开启isAddingPOI状态正确', () => {
      const store = useMapStore.getState();
      store.setAddingPOI(true);
      expect(useMapStore.getState().isAddingPOI).toBe(true);
    });

    it('关闭isAddingPOI状态正确', () => {
      const store = useMapStore.getState();
      store.setAddingPOI(true);
      store.setAddingPOI(false);
      expect(useMapStore.getState().isAddingPOI).toBe(false);
    });
  });

  describe('fitTrailBounds', () => {
    beforeEach(async () => {
      await useMapStore.getState().loadAllTrails();
    });

    it('空轨迹不应修改地图中心', () => {
      const store = useMapStore.getState();
      const originalCenter = [...useMapStore.getState().mapCenter] as [number, number];
      store.fitTrailBounds('non-existent');
      const state = useMapStore.getState();
      expect(state.mapCenter).toEqual(originalCenter);
    });

    it('应正确计算trail-2的边界中心', () => {
      const store = useMapStore.getState();
      store.fitTrailBounds('trail-2');
      const state = useMapStore.getState();

      const bounds = getBounds(mockTrail2.points);
      expect(bounds).not.toBeNull();
      if (bounds) {
        const centerLat = (bounds[0][0] + bounds[1][0]) / 2;
        const centerLng = (bounds[0][1] + bounds[1][1]) / 2;
        expect(state.mapCenter[0]).toBeCloseTo(centerLat, 5);
        expect(state.mapCenter[1]).toBeCloseTo(centerLng, 5);
      }
    });

    it('单点轨迹中心应为该点坐标', async () => {
      const singlePointTrail = createMockTrail('single', '单点', [
        { lat: 35.0, lng: 120.0 },
      ]);
      const state = useMapStore.getState();
      state.trails.set('single', singlePointTrail);
      state.fitTrailBounds('single');
      expect(state.mapCenter).toEqual([35.0, 120.0]);
    });
  });

  describe('POI CRUD 原子性测试', () => {
    beforeEach(async () => {
      await useMapStore.getState().loadAllTrails();
      useMapStore.setState({ pois: [mockPOI1] });
    });

    it('同时调用addPOI和deletePOI的竞态条件模拟', async () => {
      const store = useMapStore.getState();
      const beforeCount = useMapStore.getState().pois.length;

      const newPOI = {
        trailId: 'trail-1',
        name: '新增POI',
        description: '新增描述',
        lat: 39.9050,
        lng: 116.4050,
      };

      const addPromise = store.addPOI(newPOI);
      const deletePromise = store.deletePOI('poi-1');

      await Promise.all([addPromise, deletePromise]);

      const state = useMapStore.getState();
      expect(state.pois.length).toBe(beforeCount);
      expect(state.pois.some(p => p.name === '新增POI')).toBe(true);
      expect(state.pois.some(p => p.id === 'poi-1')).toBe(false);
    });

    it('连续添加多个POI后总数正确', async () => {
      const store = useMapStore.getState();
      const initialCount = useMapStore.getState().pois.length;

      const poisToAdd = [
        { trailId: 'trail-1', name: 'POI-1', description: '', lat: 39.91, lng: 116.41 },
        { trailId: 'trail-1', name: 'POI-2', description: '', lat: 39.92, lng: 116.42 },
        { trailId: 'trail-2', name: 'POI-3', description: '', lat: 40.36, lng: 116.02 },
      ];

      for (const poi of poisToAdd) {
        await store.addPOI(poi);
      }

      const state = useMapStore.getState();
      expect(state.pois.length).toBe(initialCount + 3);
    });

    it('删除不存在的POI不影响状态', async () => {
      const store = useMapStore.getState();
      const beforeState = useMapStore.getState();
      const beforeCount = beforeState.pois.length;

      await store.deletePOI('non-existent-poi');

      const state = useMapStore.getState();
      expect(state.pois).toHaveLength(beforeCount);
      expect(state.pois.map(p => p.id)).toEqual(beforeState.pois.map(p => p.id));
    });

    it('updatePOIPosition后坐标正确更新', async () => {
      const store = useMapStore.getState();
      useMapStore.setState({ pois: [mockPOI1, mockPOI2] });

      const newLat = 39.9999;
      const newLng = 116.6666;
      await store.updatePOIPosition('poi-1', newLat, newLng);

      const state = useMapStore.getState();
      const updatedPOI = state.pois.find(p => p.id === 'poi-1');
      expect(updatedPOI).toBeDefined();
      expect(updatedPOI?.lat).toBe(newLat);
      expect(updatedPOI?.lng).toBe(newLng);

      const otherPOI = state.pois.find(p => p.id === 'poi-2');
      expect(otherPOI).toBeDefined();
      expect(otherPOI?.lat).toBe(mockPOI2.lat);
      expect(otherPOI?.lng).toBe(mockPOI2.lng);
    });
  });

  describe('addPOI 和 deletePOI', () => {
    beforeEach(async () => {
      await useMapStore.getState().loadAllTrails();
      useMapStore.setState({ pois: [mockPOI1] });
    });

    it('addPOI应添加POI并关闭添加模式', async () => {
      const store = useMapStore.getState();
      store.setAddingPOI(true);
      expect(useMapStore.getState().isAddingPOI).toBe(true);

      const newPOI = {
        trailId: 'trail-1',
        name: '新增POI',
        description: '新增描述',
        lat: 39.9050,
        lng: 116.4050,
      };
      await store.addPOI(newPOI);
      const state = useMapStore.getState();

      expect(state.pois.length).toBe(2);
      expect(state.pois.some(p => p.name === '新增POI')).toBe(true);
      expect(state.isAddingPOI).toBe(false);
    });

    it('deletePOI应删除指定POI', async () => {
      const store = useMapStore.getState();
      useMapStore.setState({ pois: [mockPOI1, mockPOI2] });
      expect(useMapStore.getState().pois).toHaveLength(2);

      await store.deletePOI('poi-1');
      const state = useMapStore.getState();
      expect(state.pois).toHaveLength(1);
      expect(state.pois[0].id).toBe('poi-2');
      expect(state.pois.some(p => p.id === 'poi-1')).toBe(false);
    });

    it('删除选中的POI应同时清空selectedPOI', async () => {
      const store = useMapStore.getState();
      useMapStore.setState({
        pois: [mockPOI1, mockPOI2],
        selectedPOI: mockPOI1,
      });
      expect(useMapStore.getState().selectedPOI?.id).toBe('poi-1');

      await store.deletePOI('poi-1');
      const state = useMapStore.getState();
      expect(state.selectedPOI).toBeNull();
    });

    it('删除非选中的POI不应影响selectedPOI', async () => {
      const store = useMapStore.getState();
      useMapStore.setState({
        pois: [mockPOI1, mockPOI2],
        selectedPOI: mockPOI2,
      });

      await store.deletePOI('poi-1');
      const state = useMapStore.getState();
      expect(state.selectedPOI?.id).toBe('poi-2');
    });

    it('删除不存在的POI不报错', async () => {
      const store = useMapStore.getState();
      useMapStore.setState({ pois: [mockPOI1] });
      const beforeCount = useMapStore.getState().pois.length;

      await store.deletePOI('non-existent-poi');
      const state = useMapStore.getState();
      expect(state.pois).toHaveLength(beforeCount);
    });
  });
});
