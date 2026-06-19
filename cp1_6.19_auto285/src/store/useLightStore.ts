import { create } from 'zustand';

export type LightType = 'point' | 'spot' | 'area';

export type EasingType = 'linear' | 'easeIn' | 'easeOut' | 'elastic' | 'bounce';

export type LightProperty = 'color' | 'intensity' | 'position' | 'rotation' | 'beamAngle';

export interface Keyframe {
  id: string;
  time: number;
  property: LightProperty;
  value: number[];
  easing: EasingType;
}

export interface LightSource {
  id: string;
  type: LightType;
  position: [number, number, number];
  rotation: [number, number, number];
  color: [number, number, number];
  intensity: number;
  beamAngle?: number;
  radius?: number;
  decay?: number;
  keyframes: Keyframe[];
}

export interface TimelineState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  selectedKeyframeId?: string;
}

interface LightStoreState {
  lights: LightSource[];
  selectedLightId?: string;
  timeline: TimelineState;
  showTestObjects: boolean;
}

interface LightStoreActions {
  addLight: (type: LightType) => void;
  updateLight: (id: string, updates: Partial<LightSource>) => void;
  removeLight: (id: string) => void;
  selectLight: (id?: string) => void;
  addKeyframe: (lightId: string, keyframe: Omit<Keyframe, 'id'>) => void;
  updateKeyframe: (lightId: string, keyframeId: string, updates: Partial<Keyframe>) => void;
  removeKeyframe: (lightId: string, keyframeId: string) => void;
  togglePlay: () => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  toggleTestObjects: () => void;
  loadScene: (data: { lights: LightSource[]; timeline: TimelineState; showTestObjects: boolean }) => void;
}

export type LightStore = LightStoreState & LightStoreActions;

const generateId = () => Math.random().toString(36).substring(2, 11);

const getDefaultLight = (type: LightType): Omit<LightSource, 'id'> => {
  const base = {
    color: [1, 1, 1] as [number, number, number],
    intensity: 1,
    keyframes: [],
  };

  switch (type) {
    case 'point':
      return {
        ...base,
        type,
        position: [2, 2, 2],
        rotation: [0, 0, 0],
      };
    case 'spot':
      return {
        ...base,
        type,
        position: [3, 3, 0],
        rotation: [-0.785, 0, 0],
        beamAngle: 30,
      };
    case 'area':
      return {
        ...base,
        type,
        position: [0, 3, 2],
        rotation: [0, 0, 0],
        radius: 1,
        decay: 2,
      };
  }
};

export const useLightStore = create<LightStore>((set) => ({
  lights: [],
  selectedLightId: undefined,
  timeline: {
    currentTime: 0,
    duration: 10,
    isPlaying: false,
    selectedKeyframeId: undefined,
  },
  showTestObjects: true,

  addLight: (type) =>
    set((state) => {
      if (state.lights.length >= 8) return state;
      const newLight: LightSource = {
        id: generateId(),
        ...getDefaultLight(type),
      };
      return {
        lights: [...state.lights, newLight],
        selectedLightId: newLight.id,
      };
    }),

  updateLight: (id, updates) =>
    set((state) => ({
      lights: state.lights.map((light) =>
        light.id === id ? { ...light, ...updates } : light
      ),
    })),

  removeLight: (id) =>
    set((state) => ({
      lights: state.lights.filter((light)