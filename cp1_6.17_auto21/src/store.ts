import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type PlatformType = 'taobao' | 'jingdong' | 'pinduoduo';

export type FilterPresetType =
  | 'none'
  | 'warm-yellow'
  | 'black-white'
  | 'retro-film'
  | 'fresh-blue'
  | 'high-saturation'
  | 'soft-light'
  | 'sharpen'
  | 'dark-tone';

export interface Layer {
  id: string;
  type: 'image' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  imageUrl?: string;
  imageElement?: HTMLImageElement;
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
  brightness: number;
  contrast: number;
  hue: number;
  saturate: number;
  filterPreset: FilterPresetType;
  opacity: number;
  zIndex: number;
  name: string;
}

export interface PlatformConfig {
  label: string;
  width: number;
  height: number;
}

export const PLATFORM_CONFIGS: Record<PlatformType, PlatformConfig> = {
  taobao: { label: '淘宝主图', width: 800, height: 800 },
  jingdong: { label: '京东主图', width: 750, height: 500 },
  pinduoduo: { label: '拼多多主图', width: 750, height: 352 },
};

export const FILTER_PRESETS: { key: FilterPresetType; label: string; brightness: number; contrast: number; hue: number; saturate: number }[] = [
  { key: 'none', label: '原图', brightness: 100, contrast: 100, hue: 0, saturate: 100 },
  { key: 'warm-yellow', label: '美食暖黄', brightness: 108, contrast: 105, hue: 15, saturate: 120 },
  { key: 'black-white', label: '极简黑白', brightness: 100, contrast: 110, hue: 0, saturate: 0 },
  { key: 'retro-film', label: '复古胶片', brightness: 95, contrast: 90, hue: 25, saturate: 80 },
  { key: 'fresh-blue', label: '清新冷蓝', brightness: 105, contrast: 100, hue: 190, saturate: 90 },
  { key: 'high-saturation', label: '高饱和电商', brightness: 105, contrast: 115, hue: 0, saturate: 150 },
  { key: 'soft-light', label: '柔光', brightness: 112, contrast: 90, hue: 0, saturate: 95 },
  { key: 'sharpen', label: '锐化', brightness: 100, contrast: 130, hue: 0, saturate: 110 },
  { key: 'dark-tone', label: '暗调', brightness: 80, contrast: 120, hue: 0, saturate: 85 },
];

export const FONT_OPTIONS = [
  { label: '思源黑体', value: "'Noto Sans SC', sans-serif" },
  { label: '思源宋体', value: "'Noto Serif SC', serif" },
  { label: '站酷文艺体', value: "'ZCOOL XiaoWei', serif" },
  { label: 'Dancing Script', value: "'Dancing Script', cursive" },
];

export const COLOR_PALETTE = [
  '#000000','#333333','#555555','#777777','#999999','#BBBBBB','#DDDDDD','#FFFFFF',
  '#F44336','#E91E63','#9C27B0','#673AB7','#3F51B5','#2196F3','#03A9F4','#00BCD4',
  '#009688','#4CAF50','#8BC34A','#CDDC39','#FFEB3B','#FFC107','#FF9800','#FF5722',
  '#795548','#607D8B','#1976D2','#D32F2F','#388E3C','#F57C00','#512DA8','#00796B',
  '#C2185B','#AFB42B','#E64A19','#455A64',
];

interface CanvasStore {
  layers: Layer[];
  selectedLayerId: string | null;
  canvasWidth: number;
  canvasHeight: number;
  platform: PlatformType;
  uploading: boolean;
  uploadProgress: number;
  downloading: boolean;
  toastMessage: string | null;

  addLayer: (layer: Layer) => void;
  removeLayer: (id: string) => void;
  duplicateLayer: (id: string) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  setSelectedLayer: (id: string | null) => void;
  setCanvasSize: (platform: PlatformType) => void;
  setUploading: (uploading: boolean) => void;
  setUploadProgress: (progress: number) => void;
  setDownloading: (downloading: boolean) => void;
  showToast: (message: string) => void;
  hideToast: () => void;
}

const useStore = create<CanvasStore>((set, get) => ({
  layers: [],
  selectedLayerId: null,
  canvasWidth: 800,
  canvasHeight: 800,
  platform: 'taobao',
  uploading: false,
  uploadProgress: 0,
  downloading: false,
  toastMessage: null,

  addLayer: (layer) =>
    set((state) => ({
      layers: [...state.layers, { ...layer, zIndex: state.layers.length }],
      selectedLayerId: layer.id,
    })),

  removeLayer: (id) =>
    set((state) => {
      const filtered = state.layers.filter((l) => l.id !== id);
      const reindexed = filtered.map((l, i) => ({ ...l, zIndex: i }));
      return {
        layers: reindexed,
        selectedLayerId: state.selectedLayerId === id ? null : state.selectedLayerId,
      };
    }),

  duplicateLayer: (id) => {
    const state = get();
    const layer = state.layers.find((l) => l.id === id);
    if (!layer) return;
    const newLayer: Layer = {
      ...layer,
      id: uuidv4(),
      x: layer.x + 20,
      y: layer.y + 20,
      zIndex: state.layers.length,
      name: `${layer.name} 副本`,
    };
    set({ layers: [...state.layers, newLayer], selectedLayerId: newLayer.id });
  },

  updateLayer: (id, updates) =>
    set((state) => ({
      layers: state.layers.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    })),

  reorderLayers: (fromIndex, toIndex) =>
    set((state) => {
      const newLayers = [...state.layers];
      const [moved] = newLayers.splice(fromIndex, 1);
      newLayers.splice(toIndex, 0, moved);
      const reindexed = newLayers.map((l, i) => ({ ...l, zIndex: i }));
      return { layers: reindexed };
    }),

  setSelectedLayer: (id) => set({ selectedLayerId: id }),

  setCanvasSize: (platform) => {
    const config = PLATFORM_CONFIGS[platform];
    const oldWidth = get().canvasWidth;
    const oldHeight = get().canvasHeight;
    const scaleX = config.width / oldWidth;
    const scaleY = config.height / oldHeight;
    const scale = Math.min(scaleX, scaleY);
    set((state) => ({
      platform,
      canvasWidth: config.width,
      canvasHeight: config.height,
      layers: state.layers.map((l) => ({
        ...l,
        x: l.x * scale + (config.width - oldWidth * scale) / 2,
        y: l.y * scale + (config.height - oldHeight * scale) / 2,
        width: l.width * scale,
        height: l.height * scale,
      })),
    }));
  },

  setUploading: (uploading) => set({ uploading }),
  setUploadProgress: (progress) => set({ uploadProgress: progress }),
  setDownloading: (downloading) => set({ downloading }),
  showToast: (message) => set({ toastMessage: message }),
  hideToast: () => set({ toastMessage: null }),
}));

export function createImageLayer(
  img: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number
): Layer {
  const maxW = canvasWidth * 0.7;
  const maxH = canvasHeight * 0.7;
  const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  return {
    id: uuidv4(),
    type: 'image',
    x: (canvasWidth - w) / 2,
    y: (canvasHeight - h) / 2,
    width: w,
    height: h,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    imageUrl: img.src,
    imageElement: img,
    brightness: 100,
    contrast: 100,
    hue: 0,
    saturate: 100,
    filterPreset: 'none',
    opacity: 1,
    zIndex: 0,
    name: '商品图',
  };
}

export function createTextLayer(canvasWidth: number, canvasHeight: number): Layer {
  return {
    id: uuidv4(),
    type: 'text',
    x: canvasWidth / 2 - 100,
    y: canvasHeight / 2 - 20,
    width: 200,
    height: 40,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    text: '请输入文案',
    fontFamily: "'Noto Sans SC', sans-serif",
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    brightness: 100,
    contrast: 100,
    hue: 0,
    saturate: 100,
    filterPreset: 'none',
    opacity: 1,
    zIndex: 0,
    name: '文字图层',
  };
}

export default useStore;
