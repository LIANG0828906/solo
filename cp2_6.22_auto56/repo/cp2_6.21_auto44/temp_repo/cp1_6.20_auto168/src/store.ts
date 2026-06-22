import { create } from 'zustand';
import type { AnchorPoint, Layer, GradientType, BlendMode, CanvasState } from './types';

let layerCounter = 0;
let anchorCounter = 0;

function genLayerId() {
  return `layer-${++layerCounter}-${Date.now()}`;
}

function genAnchorId() {
  return `anchor-${++anchorCounter}-${Date.now()}`;
}

function createDefaultLayer(): Layer {
  const id = genLayerId();
  return {
    id,
    name: `图层 ${layerCounter}`,
    visible: true,
    gradientType: 'linear',
    anchors: [
      { id: genAnchorId(), x: 0, y: 50, color: '#e94560', type: 'start' },
      { id: genAnchorId(), x: 100, y: 50, color: '#0f3460', type: 'end' },
    ],
    blendMode: 'normal',
    order: 0,
  };
}

interface AppStore {
  layers: Layer[];
  activeLayerId: string;
  canvasState: CanvasState;
  panelCollapsed: boolean;
  prevGradientType: GradientType | null;
  gradientTransitioning: boolean;

  addLayer: () => void;
  removeLayer: (id: string) => void;
  updateLayer: (id: string, partial: Partial<Layer>) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  setActiveLayer: (id: string) => void;

  addAnchor: (layerId: string, x: number, y: number) => void;
  updateAnchor: (layerId: string, anchorId: string, partial: Partial<AnchorPoint>) => void;
  removeAnchor: (layerId: string, anchorId: string) => void;

  setGradientType: (layerId: string, type: GradientType) => void;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  togglePanel: () => void;
}

const initialLayer = createDefaultLayer();

export const useAppStore = create<AppStore>((set, get) => ({
  layers: [initialLayer],
  activeLayerId: initialLayer.id,
  canvasState: { zoom: 100, panX: 0, panY: 0 },
  panelCollapsed: false,
  prevGradientType: null,
  gradientTransitioning: false,

  addLayer: () => {
    const newLayer = createDefaultLayer();
    set((s) => ({
      layers: [...s.layers, { ...newLayer, order: s.layers.length }],
      activeLayerId: newLayer.id,
    }));
  },

  removeLayer: (id) => {
    set((s) => {
      const remaining = s.layers.filter((l) => l.id !== id);
      if (remaining.length === 0) return s;
      return {
        layers: remaining.map((l, i) => ({ ...l, order: i })),
        activeLayerId: s.activeLayerId === id ? remaining[0].id : s.activeLayerId,
      };
    });
  },

  updateLayer: (id, partial) => {
    set((s) => ({
      layers: s.layers.map((l) => (l.id === id ? { ...l, ...partial } : l)),
    }));
  },

  reorderLayers: (fromIndex, toIndex) => {
    set((s) => {
      const sorted = [...s.layers].sort((a, b) => a.order - b.order);
      const [moved] = sorted.splice(fromIndex, 1);
      sorted.splice(toIndex, 0, moved);
      return {
        layers: sorted.map((l, i) => ({ ...l, order: i })),
      };
    });
  },

  setActiveLayer: (id) => set({ activeLayerId: id }),

  addAnchor: (layerId, x, y) => {
    const id = genAnchorId();
    set((s) => ({
      layers: s.layers.map((l) =>
        l.id === layerId
          ? { ...l, anchors: [...l.anchors, { id, x, y, color: '#ffffff', type: 'end' as const }] }
          : l
      ),
    }));
  },

  updateAnchor: (layerId, anchorId, partial) => {
    set((s) => ({
      layers: s.layers.map((l) =>
        l.id === layerId
          ? {
              ...l,
              anchors: l.anchors.map((a) => (a.id === anchorId ? { ...a, ...partial } : a)),
            }
          : l
      ),
    }));
  },

  removeAnchor: (layerId, anchorId) => {
    set((s) => ({
      layers: s.layers.map((l) =>
        l.id === layerId
          ? { ...l, anchors: l.anchors.filter((a) => a.id !== anchorId) }
          : l
      ),
    }));
  },

  setGradientType: (layerId, type) => {
    const state = get();
    const layer = state.layers.find((l) => l.id === layerId);
    if (!layer || layer.gradientType === type) return;
    set({ prevGradientType: layer.gradientType, gradientTransitioning: true });
    set((s) => ({
      layers: s.layers.map((l) => (l.id === layerId ? { ...l, gradientType: type } : l)),
    }));
    setTimeout(() => {
      set({ gradientTransitioning: false, prevGradientType: null });
    }, 300);
  },

  setZoom: (zoom) => set((s) => ({ canvasState: { ...s.canvasState, zoom: Math.max(50, Math.min(200, zoom)) } })),

  setPan: (x, y) => set((s) => ({ canvasState: { ...s.canvasState, panX: x, panY: y } })),

  togglePanel: () => set((s) => ({ panelCollapsed: !s.panelCollapsed })),
}));

export { genAnchorId };
