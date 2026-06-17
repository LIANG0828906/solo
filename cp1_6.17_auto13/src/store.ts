import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Layer, FilterConfig, TextConfig, CanvasDimensions, DEFAULT_FILTER, PLATFORM_SIZES } from './types';

interface AppState {
  layers: Layer[];
  selectedLayerId: string | null;
  canvas: CanvasDimensions;
  isDownloading: boolean;
  isUploading: boolean;
  uploadProgress: number;

  addImageLayer: (src: string, width: number, height: number, name?: string) => void;
  addTextLayer: () => void;
  removeLayer: (id: string) => void;
  duplicateLayer: (id: string) => void;
  selectLayer: (id: string | null) => void;
  moveLayer: (id: string, direction: 'up' | 'down') => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  updateLayerFilter: (id: string, filter: Partial<FilterConfig>) => void;
  updateLayerTextConfig: (id: string, config: Partial<TextConfig>) => void;
  applyFilterPreset: (id: string, preset: FilterConfig) => void;
  setCanvasDimensions: (platform: 'taobao' | 'jd' | 'pdd') => void;
  setDownloading: (val: boolean) => void;
  setUploading: (val: boolean) => void;
  setUploadProgress: (val: number) => void;
  getSelectedLayer: () => Layer | undefined;
}

const initialCanvas: CanvasDimensions = {
  width: 800,
  height: 800,
  platform: 'taobao',
};

export const useStore = create<AppState>((set, get) => ({
  layers: [],
  selectedLayerId: null,
  canvas: initialCanvas,
  isDownloading: false,
  isUploading: false,
  uploadProgress: 0,

  addImageLayer: (src, width, height, name) => {
    const { canvas } = get();
    const scale = Math.min(canvas.width * 0.6 / width, canvas.height * 0.6 / height, 1);
    const newWidth = width * scale;
    const newHeight = height * scale;

    const newLayer: Layer = {
      id: uuidv4(),
      type: 'image',
      x: (canvas.width - newWidth) / 2,
      y: (canvas.height - newHeight) / 2,
      width: newWidth,
      height: newHeight,
      rotation: 0,
      opacity: 1,
      filter: { ...DEFAULT_FILTER },
      src,
      name: name || `商品图 ${get().layers.filter(l => l.type === 'image').length + 1}`,
    };

    set(state => ({
      layers: [...state.layers, newLayer],
      selectedLayerId: newLayer.id,
    }));
  },

  addTextLayer: () => {
    const { canvas } = get();
    const newLayer: Layer = {
      id: uuidv4(),
      type: 'text',
      x: canvas.width / 2 - 100,
      y: canvas.height / 2 - 20,
      width: 200,
      height: 40,
      rotation: 0,
      opacity: 1,
      filter: { ...DEFAULT_FILTER },
      textConfig: {
        content: '双击编辑文字',
        fontFamily: '"Source Han Sans CN", "Noto Sans SC", sans-serif',
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1976D2',
        textAlign: 'center',
        opacity: 1,
      },
      name: `文字 ${get().layers.filter(l => l.type === 'text').length + 1}`,
    };

    set(state => ({
      layers: [...state.layers, newLayer],
      selectedLayerId: newLayer.id,
    }));
  },

  removeLayer: (id) => {
    set(state => ({
      layers: state.layers.filter(l => l.id !== id),
      selectedLayerId: state.selectedLayerId === id ? null : state.selectedLayerId,
    }));
  },

  duplicateLayer: (id) => {
    const { layers } = get();
    const index = layers.findIndex(l => l.id === id);
    if (index === -1) return;

    const source = layers[index];
    const newLayer: Layer = {
      ...source,
      id: uuidv4(),
      x: source.x + 20,
      y: source.y + 20,
      name: `${source.name} 副本`,
      filter: { ...source.filter },
      textConfig: source.textConfig ? { ...source.textConfig } : undefined,
    };

    const newLayers = [...layers];
    newLayers.splice(index + 1, 0, newLayer);

    set({
      layers: newLayers,
      selectedLayerId: newLayer.id,
    });
  },

  selectLayer: (id) => {
    set({ selectedLayerId: id });
  },

  moveLayer: (id, direction) => {
    set(state => {
      const index = state.layers.findIndex(l => l.id === id);
      if (index === -1) return state;

      const newLayers = [...state.layers];
      if (direction === 'up' && index < newLayers.length - 1) {
        [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
      } else if (direction === 'down' && index > 0) {
        [newLayers[index], newLayers[index - 1]] = [newLayers[index - 1], newLayers[index]];
      }

      return { layers: newLayers };
    });
  },

  reorderLayers: (fromIndex, toIndex) => {
    set(state => {
      const newLayers = [...state.layers];
      const [removed] = newLayers.splice(fromIndex, 1);
      newLayers.splice(toIndex, 0, removed);
      return { layers: newLayers };
    });
  },

  updateLayer: (id, updates) => {
    set(state => ({
      layers: state.layers.map(l =>
        l.id === id ? { ...l, ...updates } : l
      ),
    }));
  },

  updateLayerFilter: (id, filter) => {
    set(state => ({
      layers: state.layers.map(l =>
        l.id === id ? { ...l, filter: { ...l.filter, ...filter, preset: null } } : l
      ),
    }));
  },

  updateLayerTextConfig: (id, config) => {
    set(state => ({
      layers: state.layers.map(l =>
        l.id === id && l.textConfig
          ? { ...l, textConfig: { ...l.textConfig, ...config } }
          : l
      ),
    }));
  },

  applyFilterPreset: (id, preset) => {
    set(state => ({
      layers: state.layers.map(l =>
        l.id === id ? { ...l, filter: { ...preset } } : l
      ),
    }));
  },

  setCanvasDimensions: (platform) => {
    const size = PLATFORM_SIZES[platform];
    const { canvas, layers } = get();

    const scaleX = size.width / canvas.width;
    const scaleY = size.height / canvas.height;
    const scale = Math.min(scaleX, scaleY);

    const newLayers = layers.map(layer => {
      const newWidth = layer.width * scale;
      const newHeight = layer.height * scale;
      const newX = layer.x * scale + (size.width - canvas.width * scale) / 2;
      const newY = layer.y * scale + (size.height - canvas.height * scale) / 2;

      return {
        ...layer,
        width: newWidth,
        height: newHeight,
        x: newX,
        y: newY,
      };
    });

    set({
      canvas: { width: size.width, height: size.height, platform },
      layers: newLayers,
    });
  },

  setDownloading: (val) => set({ isDownloading: val }),
  setUploading: (val) => set({ isUploading: val }),
  setUploadProgress: (val) => set({ uploadProgress: val }),

  getSelectedLayer: () => {
    const { layers, selectedLayerId } = get();
    return layers.find(l => l.id === selectedLayerId);
  },
}));
