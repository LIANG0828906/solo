export interface FilterConfig {
  brightness: number;
  contrast: number;
  hueRotate: number;
  saturate: number;
  blur: number;
  sepia: number;
  grayscale: number;
  preset: string | null;
}

export interface TextConfig {
  content: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  textAlign: 'left' | 'center' | 'right';
  opacity: number;
}

export interface Layer {
  id: string;
  type: 'image' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  filter: FilterConfig;
  textConfig?: TextConfig;
  src?: string;
  name: string;
}

export interface CanvasDimensions {
  width: number;
  height: number;
  platform: 'taobao' | 'jd' | 'pdd';
}

export const PLATFORM_SIZES: Record<string, { width: number; height: number; label: string }> = {
  taobao: { width: 800, height: 800, label: '淘宝主图 (800×800)' },
  jd: { width: 750, height: 500, label: '京东主图 (750×500)' },
  pdd: { width: 750, height: 352, label: '拼多多主图 (750×352)' },
};

export const FILTER_PRESETS: Record<string, FilterConfig> = {
  '美食暖黄': { brightness: 110, contrast: 105, hueRotate: 15, saturate: 120, blur: 0, sepia: 10, grayscale: 0, preset: '美食暖黄' },
  '极简黑白': { brightness: 100, contrast: 110, hueRotate: 0, saturate: 0, blur: 0, sepia: 0, grayscale: 100, preset: '极简黑白' },
  '复古胶片': { brightness: 95, contrast: 90, hueRotate: -10, saturate: 85, blur: 0.5, sepia: 20, grayscale: 0, preset: '复古胶片' },
  '清新冷蓝': { brightness: 105, contrast: 100, hueRotate: 200, saturate: 90, blur: 0, sepia: 0, grayscale: 0, preset: '清新冷蓝' },
  '高饱和电商': { brightness: 105, contrast: 115, hueRotate: 0, saturate: 140, blur: 0, sepia: 0, grayscale: 0, preset: '高饱和电商' },
  '柔光': { brightness: 108, contrast: 85, hueRotate: 0, saturate: 95, blur: 1.5, sepia: 5, grayscale: 0, preset: '柔光' },
  '锐化': { brightness: 100, contrast: 120, hueRotate: 0, saturate: 105, blur: 0, sepia: 0, grayscale: 0, preset: '锐化' },
  '暗调': { brightness: 75, contrast: 110, hueRotate: 0, saturate: 85, blur: 0, sepia: 5, grayscale: 0, preset: '暗调' },
};

export const DEFAULT_FILTER: FilterConfig = {
  brightness: 100,
  contrast: 100,
  hueRotate: 0,
  saturate: 100,
  blur: 0,
  sepia: 0,
  grayscale: 0,
  preset: null,
};

export const FONT_OPTIONS = [
  { value: '"Source Han Sans CN", "Noto Sans SC", sans-serif', label: '思源黑体' },
  { value: '"Source Han Serif CN", "Noto Serif SC", serif', label: '思源宋体' },
  { value: '"ZCOOL KuaiLe", cursive', label: '站酷文艺体' },
  { value: '"Dancing Script", cursive', label: 'Dancing Script' },
];
