export interface ColorStop {
  id: string;
  color: string;
  position: number;
  opacity: number;
}

export type GradientDirection =
  | 'to right'
  | 'to left'
  | 'to bottom'
  | 'to top'
  | 'to bottom right'
  | 'to bottom left'
  | 'to top right'
  | 'to top left';

export interface GradientConfig {
  colorStops: ColorStop[];
  direction: GradientDirection;
}

export interface Preset {
  id: string;
  name: string;
  config: GradientConfig;
  createdAt: number;
}

export interface GradientState {
  config: GradientConfig;
  presets: Preset[];
  selectedColorStopId: string | null;
  isExporting: boolean;
  setDirection: (direction: GradientDirection) => void;
  addColorStop: () => void;
  removeColorStop: (id: string) => void;
  updateColorStop: (id: string, updates: Partial<ColorStop>) => void;
  selectColorStop: (id: string | null) => void;
  savePreset: (name: string) => void;
  loadPreset: (id: string) => void;
  deletePreset: (id: string) => void;
  setExporting: (exporting: boolean) => void;
}

export const PRESET_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
  '#2C3E50',
];

export const DIRECTIONS: { value: GradientDirection; label: string; angle: number }[] = [
  { value: 'to right', label: '从左到右', angle: 90 },
  { value: 'to left', label: '从右到左', angle: 270 },
  { value: 'to bottom', label: '从上到下', angle: 180 },
  { value: 'to top', label: '从下到上', angle: 0 },
  { value: 'to bottom right', label: '左上到右下', angle: 135 },
  { value: 'to bottom left', label: '右上到左下', angle: 225 },
  { value: 'to top right', label: '左下到右上', angle: 45 },
  { value: 'to top left', label: '右下到左上', angle: 315 },
];

export const MAX_COLOR_STOPS = 5;
export const MIN_COLOR_STOPS = 2;
