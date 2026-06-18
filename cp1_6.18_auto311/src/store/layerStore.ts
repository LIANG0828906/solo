import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Layer, LayerTransform, ShapeType } from '../types';
import { MAX_LAYERS, MAX_HISTORY, CANVAS_WIDTH, CANVAS_HEIGHT } from '../types';
import { exportSVG, downloadSVG } from '../canvas/CanvasRenderer';

interface HistoryState {
  layers: Layer[];
  selectedLayerId: string | null;
}

interface LayerState extends HistoryState {
  currentTool: ShapeType;
  currentColor: string;
  history: HistoryState[];
  historyIndex: number;
  addLayer: (layer: Omit<Layer, 'id'>, saveHist?: boolean) => void;
  updateLayer: (id: string, updates: Partial<Layer>, saveHist?: boolean) => void;
  deleteLayer: (id: string) => void;
  selectLayer: (id: string | null) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  setTool: (tool: ShapeType) => void;
  setColor: (color: string) => void;
  updateLayerTransform: (id: string, transform: Partial<LayerTransform>) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  saveToHistory: () => void;
  exportToSVG: () => void;
}

const cloneLayers = (layers: Layer[]): Layer[] => {
  return layers.map(l => ({
    ...l,
    transform: { ...l.transform }
  }));
};

const createInitialState = (): HistoryState => ({
  layers: [],
  selectedLayerId: null
});

export const useLayerStore = create<LayerState>((set, get) => {
  const initialState = createInitialState();
  
  return {
    ...initialState,
    currentTool: 'rect',
    currentColor: '#FF5722',
    history: [initialState],
    historyIndex: 0,

    saveToHistory: () => {
      const { layers, selectedLayerId, history, historyIndex } = get();
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push({
        layers: cloneLayers(layers),
        selectedLayerId
      });
      if (newHistory.length > MAX_HISTORY + 1) {
        newHistory.shift();
      }
      set({
        history: newHistory,
        historyIndex: newHistory.length - 1
      });
    },

    addLayer: (layer, saveHist = true) => {
      const { layers } = get();
      if (layers.length >= MAX_LAYERS) return;
      
      const newLayer: Layer = {
        ...layer,
        id: uuidv4()
      };
      
      set((state) => ({
        layers: [...state.layers, newLayer],
        selectedLayerId: newLayer.id
      }));
      
      if (saveHist) {
        get().saveToHistory();
      }
    },

    updateLayer: (id, updates, saveHist = false) => {
      set((state) => ({
        layers: state.layers.map(l =>
          l.id === id ? { ...l, ...updates } : l
        )
      }));
      if (saveHist) {
        get().saveToHistory();
      }
    },

    updateLayerTransform: (id, transform) => {
      set((state) => ({
        layers: state.layers.map(l =>
          l.id === id
            ? { ...l, transform: { ...l.transform, ...transform } }
            : l
        )
      }));
    },

    deleteLayer: (id) => {
      const layer = get().layers.find(l => l.id === id);
      if (!layer) return;

      set((state) => ({
        layers: state.layers.map(l =>
          l.id === id ? { ...l, isDeleting: true } : l
        )
      }));

      setTimeout(() => {
        set((state) => {
          const newLayers = state.layers.filter(l => l.id !== id);
          const newSelectedId = state.selectedLayerId === id
            ? newLayers.length > 0
              ? newLayers[newLayers.length - 1].id
              : null
            : state.selectedLayerId;
          
          return {
            layers: newLayers,
            selectedLayerId: newSelectedId
          };
        });
        get().saveToHistory();
      }, 200);
    },

    selectLayer: (id) => {
      set({ selectedLayerId: id });
    },

    reorderLayers: (fromIndex, toIndex) => {
      set((state) => {
        const newLayers = [...state.layers];
        const [removed] = newLayers.splice(fromIndex, 1);
        newLayers.splice(toIndex, 0, removed);
        return { layers: newLayers };
      });
      get().saveToHistory();
    },

    setTool: (tool) => {
      set({ currentTool: tool });
    },

    setColor: (color) => {
      set({ currentColor: color });
    },

    undo: () => {
      const { historyIndex, history } = get();
      if (historyIndex <= 0) return;
      
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      set({
        layers: cloneLayers(state.layers),
        selectedLayerId: state.selectedLayerId,
        historyIndex: newIndex
      });
    },

    redo: () => {
      const { historyIndex, history } = get();
      if (historyIndex >= history.length - 1) return;
      
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      set({
        layers: cloneLayers(state.layers),
        selectedLayerId: state.selectedLayerId,
        historyIndex: newIndex
      });
    },

    canUndo: () => get().historyIndex > 0,
    canRedo: () => get().historyIndex < get().history.length - 1,

    exportToSVG: () => {
      const { layers } = get();
      const svg = exportSVG(layers, CANVAS_WIDTH, CANVAS_HEIGHT);
      downloadSVG(svg, `vector-canvas-${Date.now()}.svg`);
    }
  };
});
