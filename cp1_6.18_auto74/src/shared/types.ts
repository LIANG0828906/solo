export interface WindDataPoint {
  id: string;
  x: number;
  y: number;
  z: number;
  speed: number;
  direction: number;
  altitude: number;
}

export interface PressureLayer {
  id: string;
  altitude: number;
  pressure: number;
  points: { x: number; y: number; z: number }[];
}

export interface DatasetMeta {
  key: string;
  label: string;
  description: string;
  maxWindSpeed: number;
  altitudeRange: [number, number];
  pressureRange: [number, number];
}

export type VisualizationMode = 'vector' | 'heatmap' | 'pressure';

export interface DatasetResult {
  windPoints: WindDataPoint[];
  pressureLayers: PressureLayer[];
  meta: DatasetMeta;
}

export interface HoverInfo {
  speed: number;
  direction: number;
  pressure: number;
  altitude: number;
  screenX: number;
  screenY: number;
  visible: boolean;
}

export interface AppState {
  selectedDataset: string | null;
  visualizationMode: VisualizationMode;
  altitudeLevel: number;
  isLoading: boolean;
  hoverInfo: HoverInfo;
  datasetResult: DatasetResult | null;
  setSelectedDataset: (key: string | null) => void;
  setVisualizationMode: (mode: VisualizationMode) => void;
  setAltitudeLevel: (level: number) => void;
  setLoading: (loading: boolean) => void;
  setHoverInfo: (info: HoverInfo) => void;
  setDatasetResult: (result: DatasetResult | null) => void;
}
