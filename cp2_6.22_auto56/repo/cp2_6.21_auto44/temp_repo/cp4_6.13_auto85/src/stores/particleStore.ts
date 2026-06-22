import { create } from 'zustand';

export type SensorReading = {
  id: string;
  x: number;
  y: number;
  z: number;
  pm25: number;
  co2: number;
  temperature: number;
  humidity: number;
};

export type SensorData = {
  timestamp: number;
  sensors: SensorReading[];
};

export type FrameData = {
  time: number;
  particles: Float32Array;
};

export type SelectionRange = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  zMin: number;
  zMax: number;
};

type ParameterKey = 'pm25' | 'co2' | 'temperature';
type ColorMapType = 'thermal' | 'rainbow' | 'blueWhiteRed';

const defaultColorRanges: Record<ParameterKey, { min: number; max: number }> = {
  pm25: { min: 5, max: 200 },
  co2: { min: 350, max: 800 },
  temperature: { min: 15, max: 30 },
};

type ParticleStoreState = {
  rawData: SensorData[];
  frames: FrameData[];
  currentFrameIndex: number;
  activeParameter: ParameterKey;
  colorMapType: ColorMapType;
  colorRange: { min: number; max: number };
  selection: SelectionRange | null;
  isLoading: boolean;
  loadingProgress: number;
};

type ParticleStoreActions = {
  setCurrentFrame: (index: number) => void;
  setActiveParameter: (param: ParameterKey) => void;
  setColorMapType: (type: ColorMapType) => void;
  setSelection: (range: SelectionRange | null) => void;
  setFrames: (frames: FrameData[]) => void;
  setLoading: (loading: boolean) => void;
  setLoadingProgress: (progress: number) => void;
};

export type ParticleStore = ParticleStoreState & ParticleStoreActions;

export const useParticleStore = create<ParticleStore>()((set) => ({
  rawData: [],
  frames: [],
  currentFrameIndex: 0,
  activeParameter: 'pm25',
  colorMapType: 'thermal',
  colorRange: { min: 5, max: 200 },
  selection: null,
  isLoading: false,
  loadingProgress: 0,

  setCurrentFrame: (index) => set({ currentFrameIndex: index }),

  setActiveParameter: (param) =>
    set({ activeParameter: param, colorRange: defaultColorRanges[param] }),

  setColorMapType: (type) => set({ colorMapType: type }),

  setSelection: (range) => set({ selection: range }),

  setFrames: (frames) => set({ frames }),

  setLoading: (loading) => set({ isLoading: loading }),

  setLoadingProgress: (progress) => set({ loadingProgress: progress }),
}));
