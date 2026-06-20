export enum DeviceType {
  MOBILE = 'mobile',
  TABLET = 'tablet',
  LAPTOP = 'laptop',
  DESKTOP_4K = 'desktop_4k'
}

export interface DeviceConfig {
  type: DeviceType;
  name: string;
  width: number;
  height: number;
}

export type CodePayload = {
  html: string;
  css: string;
  js: string;
};

export interface PreviewResult {
  deviceType: DeviceType;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  timestamp: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export const DEVICE_CONFIGS: DeviceConfig[] = [
  { type: DeviceType.MOBILE, name: '手机', width: 320, height: 568 },
  { type: DeviceType.TABLET, name: '平板', width: 768, height: 1024 },
  { type: DeviceType.LAPTOP, name: '笔记本', width: 1366, height: 768 },
  { type: DeviceType.DESKTOP_4K, name: '4K屏幕', width: 2560, height: 1440 }
];

export const THEME_COLORS = [
  '#3498DB',
  '#9B59B6',
  '#27AE60',
  '#E74C3C'
];
