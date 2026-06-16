export interface FilterConfig {
  brightness: number;
  contrast: number;
  hue: number;
  saturation: number;
  preset: string | null;
}

export interface TextStyle {
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  align: 'left' | 'center' | 'right';
  rotation: number;
}

export interface Layer {
  id: string;
  type: 'image' | 'text';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  zIndex: number;
  filterConfig: FilterConfig;
  imageSrc?: string;
  textStyle?: TextStyle;
}

export interface CanvasState {
  width: number;
  height: number;
  platform: 'taobao' | 'jd' | 'pdd';
}

export interface AppState {
  layers: Layer[];
  selectedLayerId: string | null;
  canvas: CanvasState;
  isUploading: boolean;
  uploadProgress: number;
  isDownloading: boolean;
  fps: number;
}

export interface PlatformConfig {
  name: string;
  width: number;
  height: number;
}

export type PresetFilter = {
  name: string;
  config: Partial<FilterConfig>;
  preview: string;
};

export const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  taobao: { name: '淘宝主图', width: 800, height: 800 },
  jd: { name: '京东主图', width: 750, height: 500 },
  pdd: { name: '拼多多主图', width: 750, height: 352 },
};

export const PRESET_FILTERS: PresetFilter[] = [
  {
    name: '美食暖黄',
    config: { brightness: 10, contrast: 15, hue: 0, saturation: 20, preset: 'warm' },
    preview: 'linear-gradient(135deg, #FFE4B5 0%, #FFDAB9 50%, #DEB887 100%)',
  },
  {
    name: '极简黑白',
    config: { brightness: 0, contrast: 20, hue: 0, saturation: -100, preset: 'bw' },
    preview: 'linear-gradient(135deg, #FFFFFF 0%, #808080 50%, #000000 100%)',
  },
  {
    name: '复古胶片',
    config: { brightness: -5, contrast: 10, hue: 10, saturation: -10, preset: 'vintage' },
    preview: 'linear-gradient(135deg, #F5DEB3 0%, #D2B48C 50%, #8B7355 100%)',
  },
  {
    name: '清新冷蓝',
    config: { brightness: 5, contrast: 0, hue: -15, saturation: 10, preset: 'cool' },
    preview: 'linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 50%, #80DEEA 100%)',
  },
  {
    name: '高饱和电商',
    config: { brightness: 15, contrast: 25, hue: 0, saturation: 40, preset: 'ecommerce' },
    preview: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 50%, #45B7D1 100%)',
  },
  {
    name: '柔光',
    config: { brightness: 20, contrast: -10, hue: 0, saturation: 10, preset: 'soft' },
    preview: 'linear-gradient(135deg, #FFF5EE 0%, #FFE4E1 50%, #FFDAB9 100%)',
  },
  {
    name: '锐化',
    config: { brightness: 0, contrast: 30, hue: 0, saturation: 15, preset: 'sharp' },
    preview: 'linear-gradient(135deg, #F0F8FF 0%, #E6E6FA 50%, #DDA0DD 100%)',
  },
  {
    name: '暗调',
    config: { brightness: -20, contrast: 15, hue: 0, saturation: -5, preset: 'dark' },
    preview: 'linear-gradient(135deg, #2C3E50 0%, #34495E 50%, #1A252F 100%)',
  },
];

export const FONT_OPTIONS = [
  { value: "'Noto Sans SC', sans-serif", label: '思源黑体' },
  { value: "'Noto Serif SC', serif", label: '思源宋体' },
  { value: "'Dancing Script', cursive", label: 'Dancing Script' },
  { value: "Arial, sans-serif", label: 'Arial' },
];

export const COLOR_PALETTE = [
  '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
  '#FF0000', '#FF6600', '#FFCC00', '#33CC00', '#00CCCC', '#0066FF',
  '#6600FF', '#CC00CC', '#FF0066', '#FF3300', '#FF9900', '#FFFF00',
  '#66FF00', '#00FFCC', '#0099FF', '#9900FF', '#FF00FF', '#FF3366',
  '#FF6666', '#FFB366', '#FFFF66', '#66FF66', '#66FFFF', '#66B2FF',
  '#B266FF', '#FF66FF', '#FF66B2', '#FF9999', '#FFCC99', '#FFFF99',
];
