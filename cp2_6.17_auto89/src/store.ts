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

interface GeoFlowStore {
  rawData: RawDataPoint[];
  processedData: ProcessedDataPoint[];
  selectedPoint: ProcessedDataPoint | null;
  hoveredPoint: string | null;
  cameraView: CameraView;
  isLoading: boolean;
  loadingProgress: number;
  dataSourceName: string;
  isTransitioning: boolean;

  setRawData: (data: RawDataPoint[], sourceName: string) => void;
  setProcessedData: (data: ProcessedDataPoint[]) => void;
  setSelectedPoint: (point: ProcessedDataPoint | null) => void;
  setHoveredPoint: (id: string | null) => void;
  setCameraView: (view: CameraView) => void;
  setLoading: (loading: boolean) => void;
  setLoadingProgress: (progress: number) => void;
  setTransitioning: (transitioning: boolean) => void;
  resetData: () => void;
}

const initialCameraView: CameraView = {
  position: [0, 0, 600],
  target: [0, 0, 0]
};

export const useGeoFlowStore = create<GeoFlowStore>((set) => ({
  rawData: [],
  processedData: [],
  selectedPoint: null,
  hoveredPoint: null,
  cameraView: initialCameraView,
  isLoading: false,
  loadingProgress: 0,
  dataSourceName: '',
  isTransitioning: false,

  setRawData: (data, sourceName) => set({ rawData: data, dataSourceName: sourceName }),
  setProcessedData: (data) => set({ processedData: data }),
  setSelectedPoint: (point) => set({ selectedPoint: point }),
  setHoveredPoint: (id) => set({ hoveredPoint: id }),
  setCameraView: (view) => set({ cameraView: view }),
  setLoading: (loading) => set({ isLoading: loading }),
  setLoadingProgress: (progress) => set({ loadingProgress: progress }),
  setTransitioning: (transitioning) => set({ isTransitioning: transitioning }),
  resetData: () => set({
    rawData: [],
    processedData: [],
    selectedPoint: null,
    hoveredPoint: null
  })
}));
