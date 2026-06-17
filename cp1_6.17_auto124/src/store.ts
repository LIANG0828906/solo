import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { SoundSample, SoundRoute, RoutePoint, SoundType } from './types';
import { fetchInitData } from './api';

interface SoundMapState {
  samples: SoundSample[];
  route: SoundRoute | null;
  isAddingMode: boolean;
  activeTourIndex: number;
  isTourPlaying: boolean;
  setAddingMode: (mode: boolean) => void;
  addSample: (lat: number, lng: number) => void;
  removeSample: (id: string) => void;
  generateRoute: () => void;
  startTour: () => void;
  stopTour: () => void;
  nextTourPoint: () => void;
  loadInitData: () => Promise<void>;
}

function euclideanDistance(a: SoundSample, b: SoundSample): number {
  const latDiff = a.lat - b.lat;
  const lngDiff = a.lng - b.lng;
  const volDiff = (a.volume - b.volume) / 100;
  const positionDist = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
  const soundDist = Math.abs(volDiff);
  return 0.6 * positionDist + 0.4 * soundDist;
}

function greedyTSP(samples: SoundSample[]): RoutePoint[] {
  if (samples.length === 0) return [];
  if (samples.length === 1) return [{ sampleId: samples[0].id, order: 0 }];

  const visited = new Set<string>();
  const order: RoutePoint[] = [];
  let current = samples[0];
  visited.add(current.id);
  order.push({ sampleId: current.id, order: 0 });

  while (visited.size < samples.length) {
    let nearest: SoundSample | null = null;
    let nearestDist = Infinity;
    for (const s of samples) {
      if (visited.has(s.id)) continue;
      const d = euclideanDistance(current, s);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = s;
      }
    }
    if (nearest) {
      visited.add(nearest.id);
      order.push({ sampleId: nearest.id, order: order.length });
      current = nearest;
    }
  }
  return order;
}

export const useSoundMapStore = create<SoundMapState>((set, get) => ({
  samples: [],
  route: null,
  isAddingMode: false,
  activeTourIndex: -1,
  isTourPlaying: false,

  setAddingMode: (mode) => set({ isAddingMode: mode }),

  addSample: (lat, lng) => {
    const soundTypes: SoundType[] = ['rain', 'traffic', 'bird', 'wind', 'voice'];
    const randomType = soundTypes[Math.floor(Math.random() * soundTypes.length)];
    const names = [
      '街角咖啡馆旁', '公园湖畔', '旧城区巷道', '河滨步道', '天桥下方',
      '社区花园', '地铁站出口', '校园草坪', '商业街中段', '住宅区小径',
    ];
    const descriptions: Record<SoundType, string[]> = {
      rain: ['细雨轻敲石板路', '暴雨冲刷屋檐', '雨滴落在荷叶上'],
      traffic: ['早晚高峰的车潮', '公交车靠站的声响', '远处高速公路的嗡鸣'],
      bird: ['清晨麻雀叽喳', '黄昏归巢的鸟群', '湖边水鸟的啼叫'],
      wind: ['穿堂风呼啸而过', '微风拂过竹林', '山顶的强风阵阵'],
      voice: ['集市叫卖声', '孩童嬉戏欢笑', '老人们闲聊絮语'],
    };

    const sample: SoundSample = {
      id: uuidv4(),
      lat,
      lng,
      name: names[Math.floor(Math.random() * names.length)],
      soundType: randomType,
      recordedAt: new Date().toISOString(),
      volume: 30 + Math.floor(Math.random() * 60),
      description: descriptions[randomType][Math.floor(Math.random() * descriptions[randomType].length)],
    };

    set((state) => ({
      samples: [sample, ...state.samples],
      route: null,
    }));
  },

  removeSample: (id) => set((state) => ({
    samples: state.samples.filter((s) => s.id !== id),
    route: state.route ? { ...state.route, points: state.route.points.filter((p) => p.sampleId !== id) } : null,
  })),

  generateRoute: () => {
    const { samples } = get();
    if (samples.length < 2) return;
    const points = greedyTSP(samples);
    let totalDistance = 0;
    for (let i = 1; i < points.length; i++) {
      const a = samples.find((s) => s.id === points[i - 1].sampleId)!;
      const b = samples.find((s) => s.id === points[i].sampleId)!;
      totalDistance += euclideanDistance(a, b);
    }
    set({
      route: {
        id: uuidv4(),
        points,
        totalDistance,
      },
      activeTourIndex: -1,
      isTourPlaying: false,
    });
  },

  startTour: () => {
    const { route } = get();
    if (!route || route.points.length === 0) return;
    set({ isTourPlaying: true, activeTourIndex: 0 });
  },

  stopTour: () => set({ isTourPlaying: false, activeTourIndex: -1 }),

  nextTourPoint: () => {
    const { route, activeTourIndex } = get();
    if (!route) return;
    const nextIndex = activeTourIndex + 1;
    if (nextIndex >= route.points.length) {
      set({ isTourPlaying: false, activeTourIndex: -1 });
    } else {
      set({ activeTourIndex: nextIndex });
    }
  },

  loadInitData: async () => {
    const data = await fetchInitData();
    if (data.samples && data.samples.length > 0) {
      set({ samples: data.samples });
    }
  },
}));
