export type FontFamily = 'kai' | 'xing' | 'li';

export type TemplateType =
  | 'classical-vertical'
  | 'modern-horizontal'
  | 'ink-blank'
  | 'fan-shaped'
  | 'scroll';

export interface PosterColors {
  background: string;
  text: string;
  accent: string;
}

export interface PosterConfig {
  text: string;
  fontFamily: FontFamily;
  strokeWidth: number;
  template: TemplateType;
  colors: PosterColors;
  sealText: string;
  signatureText: string;
  feibaiIntensity: number;
  inkSpread: number;
}

export interface GenerateResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export interface ShareResponse {
  success: boolean;
  shortUrl?: string;
  expiresAt?: number;
  error?: string;
}

export interface SharedPosterPayload {
  config: PosterConfig;
  imageData: string;
  createdAt: number;
  expiresAt: number;
}

export const FONT_OPTIONS: { value: FontFamily; label: string; cssFont: string }[] = [
  { value: 'kai', label: '楷体', cssFont: '"Noto Serif SC", "KaiTi", "STKaiti", serif' },
  { value: 'xing', label: '行书', cssFont: '"Ma Shan Zheng", "XingKai", "STXingkai", cursive' },
  { value: 'li', label: '隶书', cssFont: '"ZCOOL XiaoWei", "LiSu", "STLiti", serif' },
];

export const TEMPLATE_OPTIONS: { value: TemplateType; label: string; description: string }[] = [
  { value: 'classical-vertical', label: '古典竖排', description: '传统条幅，自上而下' },
  { value: 'modern-horizontal', label: '现代横排', description: '横向排版，极简雅致' },
  { value: 'ink-blank', label: '水墨留白', description: '大面积留白，意境悠远' },
  { value: 'fan-shaped', label: '扇形', description: '团扇章法，古韵盎然' },
  { value: 'scroll', label: '卷轴', description: '装裱卷轴，庄重大气' },
];

export const DEFAULT_CONFIG: PosterConfig = {
  text: '天道酬勤',
  fontFamily: 'kai',
  strokeWidth: 80,
  template: 'classical-vertical',
  colors: {
    background: '#F5E6C8',
    text: '#1A1A1A',
    accent: '#C23B22',
  },
  sealText: '墨韵',
  signatureText: '时在癸卯年春月',
  feibaiIntensity: 0.45,
  inkSpread: 0.3,
};

export const CANVAS_WIDTH = 1600;
export const CANVAS_HEIGHT = 1080;
export const EXPORT_DPI = 300;
export const SHARE_TTL_MS = 24 * 60 * 60 * 1000;
