import { create } from 'zustand';

export interface OceanCurrent {
  id: string;
  name: string;
  nameEn: string;
  type: 'warm' | 'cold';
  baseSpeed: number;
  baseTemp: number;
  depth: number;
  seasonalSpeedVariation: number[];
  seasonalTempVariation: number[];
  controlPoints: [number, number, number][];
}

export interface Bookmark {
  id: string;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  time: number;
  depthMode: boolean;
  thumbnail: string;
}

export interface SelectedFlow {
  name: string;
  nameEn: string;
  speed: number;
  temperature: number;
  type: 'warm' | 'cold';
  depth: number;
}

interface AppState {
  currentTime: number;
  depthMode: boolean;
  bookmarks: Bookmark[];
  selectedFlow: SelectedFlow | null;
  infoPanelVisible: boolean;
  flowDetailVisible: boolean;
  depthStatsVisible: boolean;
  selectedDepthLayer: number | null;
  depthStats: { density: number; avgSpeed: number; dominantDirection: string } | null;

  setCurrentTime: (time: number) => void;
  toggleDepthMode: () => void;
  setDepthMode: (mode: boolean) => void;
  addBookmark: (bookmark: Bookmark) => void;
  removeBookmark: (id: string) => void;
  setSelectedFlow: (flow: SelectedFlow | null) => void;
  setInfoPanelVisible: (visible: boolean) => void;
  setFlowDetailVisible: (visible: boolean) => void;
  setDepthStatsVisible: (visible: boolean) => void;
  setSelectedDepthLayer: (layer: number | null) => void;
  setDepthStats: (stats: { density: number; avgSpeed: number; dominantDirection: string } | null) => void;
}

export const OCEAN_CURRENTS: OceanCurrent[] = [
  {
    id: 'gulf-stream',
    name: '湾流',
    nameEn: 'Gulf Stream',
    type: 'warm',
    baseSpeed: 1.8,
    baseTemp: 24,
    depth: 0,
    seasonalSpeedVariation: [1.6, 1.7, 1.8, 1.9, 2.0, 1.9, 1.8, 1.7, 1.6, 1.5, 1.5, 1.6],
    seasonalTempVariation: [22, 21, 22, 23, 25, 27, 28, 27, 26, 24, 23, 22],
    controlPoints: [
      [-80, 0, 25], [-75, 0, 28], [-70, 0, 32], [-65, 0, 35],
      [-60, 0, 38], [-55, 0, 40], [-50, 0, 42], [-45, 0, 44],
      [-40, 0, 46], [-35, 0, 48], [-30, 0, 50], [-25, 0, 52],
    ],
  },
  {
    id: 'kuroshio',
    name: '日本暖流',
    nameEn: 'Kuroshio Current',
    type: 'warm',
    baseSpeed: 1.5,
    baseTemp: 22,
    depth: 0,
    seasonalSpeedVariation: [1.3, 1.4, 1.5, 1.6, 1.7, 1.6, 1.5, 1.4, 1.3, 1.2, 1.2, 1.3],
    seasonalTempVariation: [20, 19, 20, 22, 24, 26, 27, 26, 25, 23, 21, 20],
    controlPoints: [
      [125, 0, 15], [130, 0, 18], [135, 0, 22], [140, 0, 28],
      [145, 0, 32], [150, 0, 35], [155, 0, 38], [160, 0, 40],
    ],
  },
  {
    id: 'antarctic-circumpolar',
    name: '南极环流',
    nameEn: 'Antarctic Circumpolar Current',
    type: 'cold',
    baseSpeed: 0.8,
    baseTemp: 2,
    depth: 0,
    seasonalSpeedVariation: [0.7, 0.7, 0.8, 0.9, 0.9, 0.8, 0.7, 0.7, 0.8, 0.9, 0.9, 0.8],
    seasonalTempVariation: [0, -1, -1, 0, 1, 2, 3, 2, 1, 0, -1, -1],
    controlPoints: [
      [-60, 0, -55], [-40, 0, -55], [-20, 0, -56], [0, 0, -56],
      [20, 0, -55], [40, 0, -55], [60, 0, -54], [80, 0, -54],
      [100, 0, -55], [120, 0, -56], [140, 0, -56], [160, 0, -55],
      [180, 0, -54], [-160, 0, -55], [-140, 0, -56], [-120, 0, -56],
      [-100, 0, -55], [-80, 0, -55],
    ],
  },
  {
    id: 'north-atlantic-drift',
    name: '北大西洋暖流',
    nameEn: 'North Atlantic Drift',
    type: 'warm',
    baseSpeed: 0.7,
    baseTemp: 14,
    depth: 200,
    seasonalSpeedVariation: [0.6, 0.6, 0.7, 0.8, 0.8, 0.7, 0.6, 0.6, 0.7, 0.8, 0.8, 0.7],
    seasonalTempVariation: [11, 10, 11, 13, 15, 17, 18, 17, 16, 14, 12, 11],
    controlPoints: [
      [-30, 0, 50], [-25, 0, 52], [-20, 0, 54], [-15, 0, 56],
      [-10, 0, 58], [-5, 0, 60], [0, 0, 62], [5, 0, 64],
    ],
  },
  {
    id: 'california-current',
    name: '加利福尼亚寒流',
    nameEn: 'California Current',
    type: 'cold',
    baseSpeed: 0.6,
    baseTemp: 10,
    depth: 0,
    seasonalSpeedVariation: [0.5, 0.5, 0.6, 0.7, 0.7, 0.6, 0.5, 0.5, 0.6, 0.7, 0.7, 0.6],
    seasonalTempVariation: [9, 8, 9, 10, 12, 13, 14, 13, 12, 11, 10, 9],
    controlPoints: [
      [-125, 0, 45], [-124, 0, 42], [-123, 0, 38], [-122, 0, 35],
      [-121, 0, 32], [-120, 0, 28], [-119, 0, 25], [-118, 0, 22],
    ],
  },
  {
    id: 'benguela-current',
    name: '本格拉寒流',
    nameEn: 'Benguela Current',
    type: 'cold',
    baseSpeed: 0.5,
    baseTemp: 8,
    depth: 0,
    seasonalSpeedVariation: [0.4, 0.4, 0.5, 0.6, 0.6, 0.5, 0.4, 0.4, 0.5, 0.6, 0.6, 0.5],
    seasonalTempVariation: [7, 6, 7, 8, 10, 11, 12, 11, 10, 9, 8, 7],
    controlPoints: [
      [12, 0, -30], [11, 0, -27], [10, 0, -23], [9, 0, -20],
      [8, 0, -17], [7, 0, -14], [6, 0, -10], [5, 0, -6],
    ],
  },
  {
    id: 'agulhas-current',
    name: '厄加勒斯暖流',
    nameEn: 'Agulhas Current',
    type: 'warm',
    baseSpeed: 1.2,
    baseTemp: 22,
    depth: 0,
    seasonalSpeedVariation: [1.1, 1.1, 1.2, 1.3, 1.3, 1.2, 1.1, 1.1, 1.2, 1.3, 1.3, 1.2],
    seasonalTempVariation: [21, 20, 21, 23, 25, 26, 27, 26, 25, 23, 22, 21],
    controlPoints: [
      [42, 0, -15], [40, 0, -20], [38, 0, -25], [35, 0, -30],
      [32, 0, -34], [28, 0, -36], [25, 0, -38], [22, 0, -37],
    ],
  },
  {
    id: 'deep-thermohaline',
    name: '深层热盐环流',
    nameEn: 'Deep Thermohaline Circulation',
    type: 'cold',
    baseSpeed: 0.3,
    baseTemp: 2,
    depth: 2000,
    seasonalSpeedVariation: [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3],
    seasonalTempVariation: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    controlPoints: [
      [-30, 0, 55], [-35, 0, 45], [-40, 0, 30], [-45, 0, 10],
      [-50, 0, -10], [-55, 0, -30], [-55, 0, -50], [-45, 0, -55],
      [-30, 0, -55], [-15, 0, -50], [0, 0, -40], [15, 0, -20],
    ],
  },
];

export const DEPTH_LAYERS = [
  { name: '表层', nameEn: 'Surface', min: 0, max: 200 },
  { name: '中层', nameEn: 'Mesopelagic', min: 200, max: 1000 },
  { name: '深层', nameEn: 'Deep', min: 1000, max: 4000 },
];

export const MONTHS = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

export const useStore = create<AppState>((set) => ({
  currentTime: 1,
  depthMode: false,
  bookmarks: [],
  selectedFlow: null,
  infoPanelVisible: true,
  flowDetailVisible: false,
  depthStatsVisible: false,
  selectedDepthLayer: null,
  depthStats: null,

  setCurrentTime: (time) => set({ currentTime: time }),
  toggleDepthMode: () => set((state) => ({ depthMode: !state.depthMode })),
  setDepthMode: (mode) => set({ depthMode: mode }),
  addBookmark: (bookmark) => set((state) => {
    if (state.bookmarks.length >= 5) return state;
    return { bookmarks: [...state.bookmarks, bookmark] };
  }),
  removeBookmark: (id) => set((state) => ({
    bookmarks: state.bookmarks.filter((b) => b.id !== id),
  })),
  setSelectedFlow: (flow) => set({ selectedFlow: flow, flowDetailVisible: flow !== null }),
  setInfoPanelVisible: (visible) => set({ infoPanelVisible: visible }),
  setFlowDetailVisible: (visible) => set({ flowDetailVisible: visible }),
  setDepthStatsVisible: (visible) => set({ depthStatsVisible: visible }),
  setSelectedDepthLayer: (layer) => set({ selectedDepthLayer: layer }),
  setDepthStats: (stats) => set({ depthStats: stats }),
}));
