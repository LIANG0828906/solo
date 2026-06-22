import { create } from 'zustand';

export type ShapeType =
  | 'circle'
  | 'ellipse'
  | 'diamond'
  | 'hexagon'
  | 'triangle'
  | 'star'
  | 'petal'
  | 'ring'
  | 'stripe'
  | 'zigzag';

export type SymmetryMode = 'mirror' | 'rotational';
export type SymmetryCount = 4 | 6 | 8 | 12;

export interface Layer {
  id: string;
  shape: ShapeType;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  scale: number;
  radialDistance: number;
  rotation: number;
}

export interface CanvasConfig {
  symmetryMode: SymmetryMode;
  symmetryCount: SymmetryCount;
  angleOffset: number;
}

export const SHAPE_TYPES: ShapeType[] = [
  'circle',
  'ellipse',
  'diamond',
  'hexagon',
  'triangle',
  'star',
  'petal',
  'ring',
  'stripe',
  'zigzag'
];

const genId = (): string => Math.random().toString(36).slice(2, 10);

const defaultLayers: Layer[] = [
  {
    id: genId(),
    shape: 'ring',
    fillColor: '#fff3e0',
    strokeColor: '#d4884a',
    strokeWidth: 2,
    scale: 1.6,
    radialDistance: 0,
    rotation: 0
  },
  {
    id: genId(),
    shape: 'petal',
    fillColor: '#ffb088',
    strokeColor: '#c46a36',
    strokeWidth: 1.5,
    scale: 1.0,
    radialDistance: 90,
    rotation: 0
  },
  {
    id: genId(),
    shape: 'star',
    fillColor: '#ffd37a',
    strokeColor: '#a8621f',
    strokeWidth: 1,
    scale: 0.7,
    radialDistance: 50,
    rotation: 0
  }
];

interface EditorState {
  layers: Layer[];
  selectedLayerId: string | null;
  canvasConfig: CanvasConfig;
  toast: { message: string; visible: boolean } | null;
  addLayer: (shape: ShapeType) => void;
  updateLayer: (id: string, patch: Partial<Layer>) => void;
  removeLayer: (id: string) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  selectLayer: (id: string | null) => void;
  setCanvasConfig: (patch: Partial<CanvasConfig>) => void;
  showToast: (message: string) => void;
  hideToast: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  layers: defaultLayers,
  selectedLayerId: defaultLayers[1]?.id ?? null,
  canvasConfig: {
    symmetryMode: 'rotational',
    symmetryCount: 8,
    angleOffset: 0
  },
  toast: null,

  addLayer: (shape) => {
    const id = genId();
    const newLayer: Layer = {
      id,
      shape,
      fillColor: '#ffb088',
      strokeColor: '#8b4513',
      strokeWidth: 1.5,
      scale: 1,
      radialDistance: 80,
      rotation: 0
    };
    set({ layers: [...get().layers, newLayer], selectedLayerId: id });
    get().showToast('已添加新元素');
  },

  updateLayer: (id, patch) => {
    set({
      layers: get().layers.map((l) => (l.id === id ? { ...l, ...patch } : l))
    });
  },

  removeLayer: (id) => {
    const { layers, selectedLayerId } = get();
    const newLayers = layers.filter((l) => l.id !== id);
    const newSelected = selectedLayerId === id ? (newLayers[newLayers.length - 1]?.id ?? null) : selectedLayerId;
    set({ layers: newLayers, selectedLayerId: newSelected });
    get().showToast('已删除元素');
  },

  reorderLayers: (fromIndex, toIndex) => {
    const layers = Array.from(get().layers);
    const [removed] = layers.splice(fromIndex, 1);
    layers.splice(toIndex, 0, removed);
    set({ layers });
  },

  selectLayer: (id) => set({ selectedLayerId: id }),

  setCanvasConfig: (patch) => {
    set({ canvasConfig: { ...get().canvasConfig, ...patch } });
  },

  showToast: (message) => {
    set({ toast: { message, visible: true } });
    setTimeout(() => get().hideToast(), 3000);
  },

  hideToast: () => set({ toast: null })
}));
