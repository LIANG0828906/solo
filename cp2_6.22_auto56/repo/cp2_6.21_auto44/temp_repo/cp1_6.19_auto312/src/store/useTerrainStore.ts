import { create } from 'zustand';

export type DataSourceType = 'temperature' | 'humidity' | 'population';

export interface DataSourceInfo {
  key: DataSourceType;
  name: string;
  unit: string;
  min: number;
  max: number;
}

export const DATA_SOURCES: DataSourceInfo[] = [
  { key: 'temperature', name: '温度', unit: '°C', min: 15, max: 42 },
  { key: 'humidity', name: '湿度', unit: '%', min: 20, max: 95 },
  { key: 'population', name: '人口密度', unit: '人/km²', min: 10, max: 800 },
];

interface TerrainState {
  elevation: number;
  scale: number;
  heatmapOpacity: number;
  dataSourceIndex: number;
  showContour: boolean;
  autoRotate: boolean;

  setElevation: (v: number) => void;
  setScale: (v: number) => void;
  setHeatmapOpacity: (v: number) => void;
  setDataSourceIndex: (v: number) => void;
  setShowContour: (v: boolean) => void;
  setAutoRotate: (v: boolean) => void;
}

export const useTerrainStore = create<TerrainState>((set) => ({
  elevation: 1.5,
  scale: 1.0,
  heatmapOpacity: 0.6,
  dataSourceIndex: 0,
  showContour: false,
  autoRotate: false,

  setElevation: (v) => set({ elevation: v }),
  setScale: (v) => set({ scale: v }),
  setHeatmapOpacity: (v) => set({ heatmapOpacity: v }),
  setDataSourceIndex: (v) => set({ dataSourceIndex: v }),
  setShowContour: (v) => set({ showContour: v }),
  setAutoRotate: (v) => set({ autoRotate: v }),
}));
