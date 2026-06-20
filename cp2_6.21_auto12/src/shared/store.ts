import { create } from 'zustand';

export type ShapeType = 'moon' | 'cloud' | 'mountain' | 'tree' | 'bird' | 'star';
export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay';

export interface Layer {
  id: string;
  name: string;
  type: ShapeType;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  blendMode: BlendMode;
  colorIndex: number;
  customColor?: string;
}

export interface EditorState {
  layers: Layer[];
  palette: string[];
  activeColor: string;
  selectedLayerId: string | null;
  exportSvg: string | null;
  addLayer: (layer: Layer) => void;
  removeLayer: (id: string) => void;
  reorderLayer: (fromIndex: number, toIndex: number) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  selectLayer: (id: string | null) => void;
  setActiveColor: (color: string) => void;
  addSwatch: (color: string) => void;
  removeSwatch: (index: number) => void;
  updateSwatchColor: (index: number, color: string) => void;
  setExportSvg: (svg: string | null) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const initialPalette: string[] = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8B500', '#FF7F50', '#1ABC9C', '#E74C3C', '#3498DB', '#9B59B6',
  '#2ECC71', '#F39C12', '#E67E22', '#16A085'
];

const initialLayers: Layer[] = [
  { id: uid(), name: '图层1', type: 'mountain', x: 300, y: 280, scale: 180, rotation: 0, opacity: 100, blendMode: 'normal', colorIndex: 14 },
  { id: uid(), name: '图层2', type: 'tree', x: 180, y: 300, scale: 120, rotation: 0, opacity: 100, blendMode: 'normal', colorIndex: 16 },
  { id: uid(), name: '图层3', type: 'tree', x: 480, y: 310, scale: 100, rotation: 0, opacity: 100, blendMode: 'normal', colorIndex: 16 },
  { id: uid(), name: '图层4', type: 'moon', x: 520, y: 100, scale: 80, rotation: 0, opacity: 100, blendMode: 'normal', colorIndex: 4 },
  { id: uid(), name: '图层5', type: 'cloud', x: 150, y: 120, scale: 110, rotation: 0, opacity: 80, blendMode: 'screen', colorIndex: -1, customColor: '#ffffff' },
  { id: uid(), name: '图层6', type: 'bird', x: 350, y: 160, scale: 70, rotation: 0, opacity: 100, blendMode: 'normal', colorIndex: 0 },
  { id: uid(), name: '图层7', type: 'star', x: 250, y: 80, scale: 50, rotation: 0, opacity: 100, blendMode: 'normal', colorIndex: 11 }
];

export const useStore = create<EditorState>((set) => ({
  layers: initialLayers,
  palette: initialPalette,
  activeColor: initialPalette[0],
  selectedLayerId: null,
  exportSvg: null,
  addLayer: (layer) => set((s) => ({ layers: [...s.layers, layer] })),
  removeLayer: (id) => set((s) => ({ layers: s.layers.filter((l) => l.id !== id), selectedLayerId: s.selectedLayerId === id ? null : s.selectedLayerId })),
  reorderLayer: (fromIndex, toIndex) => set((s) => {
    const layers = [...s.layers];
    const [item] = layers.splice(fromIndex, 1);
    layers.splice(toIndex, 0, item);
    return { layers };
  }),
  updateLayer: (id, updates) => set((s) => ({ layers: s.layers.map((l) => l.id === id ? { ...l, ...updates } : l) })),
  selectLayer: (id) => set({ selectedLayerId: id }),
  setActiveColor: (color) => set({ activeColor: color }),
  addSwatch: (color) => set((s) => ({ palette: [...s.palette, color] })),
  removeSwatch: (index) => set((s) => {
    if (s.palette.length <= 8) return s;
    return { palette: s.palette.filter((_, i) => i !== index) };
  }),
  updateSwatchColor: (index, color) => set((s) => {
    const palette = [...s.palette];
    palette[index] = color;
    return { palette };
  }),
  setExportSvg: (svg) => set({ exportSvg: svg })
}));
