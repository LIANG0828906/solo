import { create } from 'zustand';

export interface RawDataPoint {
  longitude: number;
  latitude: number;
  intensity: number;
}

export interface ProcessedDataPoint extends RawDataPoint {
  id: string;
  position: [number, number, number];
  height: number;
  color: string;
}

export interface CameraView {
  position: [number, number, number];
  target: [number, number, number];
}

export interface DataStatistics {
  count: number;
  maxIntensity: number;
  minIntensity: number;
  avgIntensity: number;
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  drawCalls: number;
  isLODActive: boolean;
}

interface GeoFlowStore {
  rawData: RawDataPoint[];
  processedData: ProcessedDataPoint[];
  selectedPoint: ProcessedDataPoint | null;
  hoveredPoint: string | null;
  cameraView: CameraView;
  cameraDistance: number;
  isLoading: boolean;
  loadingProgress: number;
  dataSourceName: string;
  isTransitioning: boolean;
  statistics: DataStatistics;
  performance: PerformanceMetrics;

  setRawData: (data: RawDataPoint[], sourceName: string) => void;
  setProcessedData: (data: ProcessedDataPoint[]) => void;
  setSelectedPoint: (point: ProcessedDataPoint | null) => void;
  setHoveredPoint: (id: string | null) => void;
  setCameraView: (view: CameraView) => void;
  setCameraDistance: (distance: number) => void;
  setLoading: (loading: boolean) => void;
  setLoadingProgress: (progress: number) => void;
  setTransitioning: (transitioning: boolean) => void;
  setPerformance: (metrics: Partial<PerformanceMetrics>) => void;
  calculateStatistics: () => void;
  resetData: () => void;
}

const initialCameraView: CameraView = {
  position: [0, 0, 600],
  target: [0, 0, 0]
};

const initialStatistics: DataStatistics = {
  count: 0,
  maxIntensity: 0,
  minIntensity: 0,
  avgIntensity: 0
};

const initialPerformance: PerformanceMetrics = {
  fps: 60,
  frameTime: 16.67,
  drawCalls: 0,
  isLODActive: false
};

function computeStatistics(data: RawDataPoint[]): DataStatistics {
  if (data.length === 0) {
    return { ...initialStatistics };
  }

  const intensities = data.map(d => d.intensity);
  const validIntensities = intensities.filter(i => !isNaN(i) && isFinite(i));

  if (validIntensities.length === 0) {
    return { ...initialStatistics, count: data.length };
  }

  const max = Math.max(...validIntensities);
  const min = Math.min(...validIntensities);
  const sum = validIntensities.reduce((a, b) => a + b, 0);
  const avg = sum / validIntensities.length;

  return {
    count: data.length,
    maxIntensity: isFinite(max) ? max : 0,
    minIntensity: isFinite(min) ? min : 0,
    avgIntensity: isFinite(avg) ? avg : 0
  };
}

export const useGeoFlowStore = create<GeoFlowStore>((set, get) => ({
  rawData: [],
  processedData: [],
  selectedPoint: null,
  hoveredPoint: null,
  cameraView: initialCameraView,
  cameraDistance: 600,
  isLoading: false,
  loadingProgress: 0,
  dataSourceName: '',
  isTransitioning: false,
  statistics: { ...initialStatistics },
  performance: { ...initialPerformance },

  setRawData: (data, sourceName) => {
    const stats = computeStatistics(data);
    set({ rawData: data, dataSourceName: sourceName, statistics: stats });
  },
  setProcessedData: (data) => set({ processedData: data }),
  setSelectedPoint: (point) => set({ selectedPoint: point }),
  setHoveredPoint: (id) => set({ hoveredPoint: id }),
  setCameraView: (view) => set({ cameraView: view }),
  setCameraDistance: (distance) => set({ cameraDistance: distance }),
  setLoading: (loading) => set({ isLoading: loading }),
  setLoadingProgress: (progress) => set({ loadingProgress: progress }),
  setTransitioning: (transitioning) => set({ isTransitioning: transitioning }),
  setPerformance: (metrics) => set((state) => ({
    performance: { ...state.performance, ...metrics }
  })),
  calculateStatistics: () => {
    const { rawData } = get();
    const stats = computeStatistics(rawData);
    set({ statistics: stats });
  },
  resetData: () => set({
    rawData: [],
    processedData: [],
    selectedPoint: null,
    hoveredPoint: null,
    statistics: { ...initialStatistics }
  })
}));
