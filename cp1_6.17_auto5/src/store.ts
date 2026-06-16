import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Layer, FilterConfig, AppState, PLATFORM_CONFIGS, CanvasState } from './types';

const defaultFilterConfig: FilterConfig = {
  brightness: 0,
  contrast: 0,
  hue: 0,
  saturation: 0,
  preset: null,
};

const initialState: AppState = {
  layers: [],
  selectedLayerId: null,
  canvas: {
    width: PLATFORM_CONFIGS.taobao.width,
    height: PLATFORM_CONFIGS.taobao.height,
    platform: 'taobao',
  },
  isUploading: false,
  uploadProgress: 0,
  isDownloading: false,
};

interface StoreActions {
  addLayer: (layer: Omit<Layer, 'id' | 'zIndex'>) => void;
  removeLayer: (id: string) => void;
  duplicateLayer: (id: string) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  selectLayer: (id: string | null) => void;
  setCanvasSize: (platform: string) => void;
  setUploading: (uploading: boolean, progress?: number) => void;
  setDownloading: (downloading: boolean) => void;
  addTextLayer: () => void;
}

export const useStore = create<AppState & StoreActions>((set, get) => ({
  ...initialState,

  addLayer: (layerData) => {
    const { layers } = get();
    const newLayer: Layer = {
      ...layerData,
      id: uuidv4(),
      zIndex: layers.length,
    };
    set({ layers: [...layers, newLayer], selectedLayerId: newLayer.id });
  },

  removeLayer: (id) => {
    const { layers, selectedLayerId } = get();
    const newLayers = layers.filter((l) => l.id !== id);
    const newSelectedId = selectedLayerId === id ? null : selectedLayerId;
    set({
      layers: newLayers.map((l, idx) => ({ ...l, zIndex: idx })),
      selectedLayerId: newSelectedId,
    });
  },

  duplicateLayer: (id) => {
    const { layers } = get();
    const layer = layers.find((l) => l.id === id);
    if (layer) {
      const newLayer: Layer = {
        ...layer,
        id: uuidv4(),
        name: `${layer.name} 副本`,
        zIndex: layers.length,
        x: layer.x + 20,
        y: layer.y + 20,
      };
      set({ layers: [...layers, newLayer], selectedLayerId: newLayer.id });
    }
  },

  updateLayer: (id, updates) => {
    const { layers } = get();
    set({
      layers: layers.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    });
  },

  reorderLayers: (fromIndex, toIndex) => {
    const { layers } = get();
    const newLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);
    const [removed] = newLayers.splice(fromIndex, 1);
    newLayers.splice(toIndex, 0, removed);
    set({
      layers: newLayers.map((l, idx) => ({ ...l, zIndex: idx })),
    });
  },

  selectLayer: (id) => {
    set({ selectedLayerId: id });
  },

  setCanvasSize: (platform) => {
    const config = PLATFORM_CONFIGS[platform];
    if (!config) return;

    const { canvas, layers } = get();
    const scaleX = config.width / canvas.width;
    const scaleY = config.height / canvas.height;
    const scale = Math.min(scaleX, scaleY);

    const newCanvas: CanvasState = {
      width: config.width,
      height: config.height,
      platform: platform as 'taobao' | 'jd' | 'pdd',
    };

    const newLayers = layers.map((layer) => ({
      ...layer,
      x: layer.x * scaleX,
      y: layer.y * scaleY,
      width: layer.width * scale,
      height: layer.height * scale,
    }));

    set({ canvas: newCanvas, layers: newLayers });
  },

  setUploading: (uploading, progress = 0) => {
    set({ isUploading: uploading, uploadProgress: progress });
  },

  setDownloading: (downloading) => {
    set({ isDownloading: downloading });
  },

  addTextLayer: () => {
    const { canvas, layers } = get();
    const newLayer: Layer = {
      id: uuidv4(),
      type: 'text',
      name: `文字 ${layers.length + 1}`,
      x: canvas.width / 2,
      y: canvas.height / 2,
      width: 200,
      height: 50,
      scale: 1,
      rotation: 0,
      opacity: 1,
      visible: true,
      zIndex: layers.length,
      filterConfig: { ...defaultFilterConfig },
      textStyle: {
        content: '双击编辑文字',
        fontFamily: "'Noto Sans SC', sans-serif",
        fontSize: 32,
        fontWeight: 700,
        color: '#FF0000',
        align: 'center',
        rotation: 0,
      },
    };
    set({ layers: [...layers, newLayer], selectedLayerId: newLayer.id });
  },
}));

export const getFilterString = (filterConfig: FilterConfig): string => {
  const { brightness, contrast, hue, saturation } = filterConfig;
  const filters: string[] = [];
  
  if (brightness !== 0) {
    filters.push(`brightness(${100 + brightness}%)`);
  }
  if (contrast !== 0) {
    filters.push(`contrast(${100 + contrast}%)`);
  }
  if (hue !== 0) {
    filters.push(`hue-rotate(${hue}deg)`);
  }
  if (saturation !== 0) {
    filters.push(`saturate(${100 + saturation}%)`);
  }
  
  return filters.length > 0 ? filters.join(' ') : 'none';
};
