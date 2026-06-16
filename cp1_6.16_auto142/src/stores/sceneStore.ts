import { create } from 'zustand';

export type CameraPreset = 'global' | 'local';
export type TimeSpeed = 0.5 | 1 | 2 | 4;
export type RenderQuality = 'full' | 'half';

export interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
}

export interface CurrentData {
  id: string;
  name: string;
  particles: Particle[];
  colorStart: string;
  colorEnd: string;
  baseSpeed: number;
  description?: string;
}

export interface EcosystemData {
  planktonCount: number;
  fishCount: number;
}

export interface SceneState {
  oceanCurrentSpeed: number;
  planktonConcentration: number;
  fishActivity: number;
  cameraPreset: CameraPreset;
  earthRotationSpeed: number;
  earthAutoRotate: boolean;
  timeSpeed: TimeSpeed;
  simulationTime: number;
  renderQuality: RenderQuality;
  fps: number;
  currentDatas: CurrentData[];
  planktonCount: number;
  fishCount: number;
  hoveredCurrent: CurrentData | null;

  setOceanCurrentSpeed: (speed: number) => void;
  setPlanktonConcentration: (concentration: number) => void;
  setFishActivity: (activity: number) => void;
  setCameraPreset: (preset: CameraPreset) => void;
  setEarthRotationSpeed: (speed: number) => void;
  toggleEarthAutoRotate: () => void;
  setTimeSpeed: (speed: TimeSpeed) => void;
  setSimulationTime: (time: number) => void;
  setRenderQuality: (quality: RenderQuality) => void;
  setFps: (fps: number) => void;
  setCurrentDatas: (datas: CurrentData[]) => void;
  updatePlanktonCount: (count: number) => void;
  updateFishCount: (count: number) => void;
  setHoveredCurrent: (current: CurrentData | null) => void;
}

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

export const useSceneStore = create<SceneState>((set) => ({
  oceanCurrentSpeed: 1,
  planktonConcentration: 50,
  fishActivity: 70,
  cameraPreset: 'global',
  earthRotationSpeed: 0.5,
  earthAutoRotate: true,
  timeSpeed: 1,
  simulationTime: 0,
  renderQuality: 'full',
  fps: 60,
  currentDatas: [],
  planktonCount: 0,
  fishCount: 0,
  hoveredCurrent: null,

  setOceanCurrentSpeed: (speed) => set({ oceanCurrentSpeed: clamp(speed, 0.1, 3) }),
  setPlanktonConcentration: (concentration) => set({ planktonConcentration: clamp(concentration, 0, 100) }),
  setFishActivity: (activity) => set({ fishActivity: clamp(activity, 0, 100) }),
  setCameraPreset: (preset) => set({ cameraPreset: preset }),
  setEarthRotationSpeed: (speed) => set({ earthRotationSpeed: clamp(speed, 0, 2) }),
  toggleEarthAutoRotate: () => set((state) => ({ earthAutoRotate: !state.earthAutoRotate })),
  setTimeSpeed: (speed) => set({ timeSpeed: speed }),
  setSimulationTime: (time) => set({ simulationTime: time }),
  setRenderQuality: (quality) => set({ renderQuality: quality }),
  setFps: (fps) => set({ fps }),
  setCurrentDatas: (datas) => set({ currentDatas: datas }),
  updatePlanktonCount: (count) => set({ planktonCount: count }),
  updateFishCount: (count) => set({ fishCount: count }),
  setHoveredCurrent: (current) => set({ hoveredCurrent: current }),
}));
