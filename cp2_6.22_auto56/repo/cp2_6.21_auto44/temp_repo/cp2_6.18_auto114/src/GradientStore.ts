import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type GradientType = 'linear' | 'radial' | 'conic';

export interface ColorStop {
  id: string;
  color: string;
  position: number;
}

export interface Preset {
  id: string;
  name: string;
  type: GradientType;
  angle: number;
  centerX: number;
  centerY: number;
  colorStops: Omit<ColorStop, 'id'>[];
}

interface GradientState {
  type: GradientType;
  angle: number;
  centerX: number;
  centerY: number;
  colorStops: ColorStop[];
  presets: Preset[];
  setType: (type: GradientType) => void;
  setAngle: (angle: number) => void;
  setCenter: (x: number, y: number) => void;
  addColorStop: (position?: number) => void;
  removeColorStop: (id: string) => void;
  updateColorStopColor: (id: string, color: string) => void;
  updateColorStopPosition: (id: string, position: number) => void;
  applyPreset: (presetId: string) => void;
}

const defaultPresets: Preset[] = [
  {
    id: 'sunset',
    name: '日落',
    type: 'linear',
    angle: 90,
    centerX: 50,
    centerY: 50,
    colorStops: [
      { color: '#FF6B6B', position: 0 },
      { color: '#FEC89A', position: 50 },
      { color: '#FF8EC7', position: 100 },
    ],
  },
  {
    id: 'ocean',
    name: '海洋',
    type: 'linear',
    angle: 180,
    centerX: 50,
    centerY: 50,
    colorStops: [
      { color: '#0077B6', position: 0 },
      { color: '#00B4D8', position: 50 },
      { color: '#90E0EF', position: 100 },
    ],
  },
  {
    id: 'aurora',
    name: '极光',
    type: 'radial',
    angle: 0,
    centerX: 50,
    centerY: 50,
    colorStops: [
      { color: '#06D6A0', position: 0 },
      { color: '#118AB2', position: 40 },
      { color: '#7B2CBF', position: 100 },
    ],
  },
  {
    id: 'neon',
    name: '霓虹',
    type: 'conic',
    angle: 0,
    centerX: 50,
    centerY: 50,
    colorStops: [
      { color: '#FF006E', position: 0 },
      { color: '#8338EC', position: 33 },
      { color: '#3A86FF', position: 66 },
      { color: '#FF006E', position: 100 },
    ],
  },
  {
    id: 'metal',
    name: '金属',
    type: 'linear',
    angle: 135,
    centerX: 50,
    centerY: 50,
    colorStops: [
      { color: '#E5E5E5', position: 0 },
      { color: '#737373', position: 30 },
      { color: '#A3A3A3', position: 50 },
      { color: '#525252', position: 70 },
      { color: '#D4D4D4', position: 100 },
    ],
  },
  {
    id: 'pastel',
    name: '柔和',
    type: 'linear',
    angle: 45,
    centerX: 50,
    centerY: 50,
    colorStops: [
      { color: '#FFD6E0', position: 0 },
      { color: '#C1BAF5', position: 50 },
      { color: '#B5EAD7', position: 100 },
    ],
  },
];

const createDefaultColorStops = (): ColorStop[] => [
  { id: uuidv4(), color: '#38BDF8', position: 0 },
  { id: uuidv4(), color: '#8B5CF6', position: 100 },
];

export const useGradientStore = create<GradientState>((set, get) => ({
  type: 'linear',
  angle: 90,
  centerX: 50,
  centerY: 50,
  colorStops: createDefaultColorStops(),
  presets: defaultPresets,

  setType: (type) => set({ type }),

  setAngle: (angle) => set({ angle }),

  setCenter: (x, y) => set({ centerX: x, centerY: y }),

  addColorStop: (position = 50) =>
    set((state) => ({
      colorStops: [
        ...state.colorStops,
        { id: uuidv4(), color: '#FFFFFF', position },
      ].sort((a, b) => a.position - b.position),
    })),

  removeColorStop: (id) =>
    set((state) => {
      if (state.colorStops.length <= 2) return state;
      return {
        colorStops: state.colorStops.filter((stop) => stop.id !== id),
      };
    }),

  updateColorStopColor: (id, color) =>
    set((state) => ({
      colorStops: state.colorStops.map((stop) =>
        stop.id === id ? { ...stop, color } : stop
      ),
    })),

  updateColorStopPosition: (id, position) =>
    set((state) => ({
      colorStops: state.colorStops
        .map((stop) =>
          stop.id === id ? { ...stop, position: Math.max(0, Math.min(100, position)) } : stop
        )
        .sort((a, b) => a.position - b.position),
    })),

  applyPreset: (presetId) => {
    const preset = get().presets.find((p) => p.id === presetId);
    if (!preset) return;
    set({
      type: preset.type,
      angle: preset.angle,
      centerX: preset.centerX,
      centerY: preset.centerY,
      colorStops: preset.colorStops.map((stop) => ({
        ...stop,
        id: uuidv4(),
      })),
    });
  },
}));
