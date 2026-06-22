export interface BezierPreset {
  id: string;
  name: string;
  cp1: [number, number];
  cp2: [number, number];
}

export interface KeyframeData {
  id: string;
  time: number;
  opacity: number;
  translateX: number;
  translateY: number;
  scale: number;
  rotate: number;
}

export interface PresetConfig {
  id: string;
  name: string;
  bezier: BezierPreset;
  keyframes: KeyframeData[];
  isCustom?: boolean;
}

export const builtInPresets: PresetConfig[] = [
  {
    id: 'bounce',
    name: '弹跳',
    bezier: { id: 'bounce', name: '弹跳', cp1: [0.34, 1.56], cp2: [0.64, 1.0] },
    keyframes: [
      { id: 'k1', time: 0, opacity: 1, translateX: 0, translateY: 0, scale: 1, rotate: 0 },
      { id: 'k2', time: 0.5, opacity: 1, translateX: 0, translateY: -80, scale: 1.1, rotate: 0 },
      { id: 'k3', time: 1, opacity: 1, translateX: 0, translateY: 0, scale: 1, rotate: 0 },
    ],
  },
  {
    id: 'fadein',
    name: '淡入',
    bezier: { id: 'fadein', name: '淡入', cp1: [0.25, 0.1], cp2: [0.25, 1.0] },
    keyframes: [
      { id: 'k1', time: 0, opacity: 0, translateX: 0, translateY: 20, scale: 0.9, rotate: 0 },
      { id: 'k2', time: 1, opacity: 1, translateX: 0, translateY: 0, scale: 1, rotate: 0 },
    ],
  },
  {
    id: 'elastic',
    name: '弹性',
    bezier: { id: 'elastic', name: '弹性', cp1: [0.68, -0.55], cp2: [0.27, 1.55] },
    keyframes: [
      { id: 'k1', time: 0, opacity: 1, translateX: 0, translateY: 0, scale: 0, rotate: 0 },
      { id: 'k2', time: 0.6, opacity: 1, translateX: 0, translateY: 0, scale: 1.15, rotate: 5 },
      { id: 'k3', time: 0.8, opacity: 1, translateX: 0, translateY: 0, scale: 0.95, rotate: -3 },
      { id: 'k4', time: 1, opacity: 1, translateX: 0, translateY: 0, scale: 1, rotate: 0 },
    ],
  },
  {
    id: 'blink',
    name: '闪烁',
    bezier: { id: 'blink', name: '闪烁', cp1: [0.5, 0.0], cp2: [0.5, 1.0] },
    keyframes: [
      { id: 'k1', time: 0, opacity: 1, translateX: 0, translateY: 0, scale: 1, rotate: 0 },
      { id: 'k2', time: 0.25, opacity: 0.2, translateX: 0, translateY: 0, scale: 0.95, rotate: 0 },
      { id: 'k3', time: 0.5, opacity: 1, translateX: 0, translateY: 0, scale: 1, rotate: 0 },
      { id: 'k4', time: 0.75, opacity: 0.2, translateX: 0, translateY: 0, scale: 0.95, rotate: 0 },
      { id: 'k5', time: 1, opacity: 1, translateX: 0, translateY: 0, scale: 1, rotate: 0 },
    ],
  },
  {
    id: 'rotate',
    name: '旋转',
    bezier: { id: 'rotate', name: '旋转', cp1: [0.45, 0.05], cp2: [0.55, 0.95] },
    keyframes: [
      { id: 'k1', time: 0, opacity: 1, translateX: 0, translateY: 0, scale: 1, rotate: 0 },
      { id: 'k2', time: 0.5, opacity: 0.8, translateX: 30, translateY: -10, scale: 1.1, rotate: 180 },
      { id: 'k3', time: 1, opacity: 1, translateX: 0, translateY: 0, scale: 1, rotate: 360 },
    ],
  },
];

export function loadCustomPresets(): PresetConfig[] {
  try {
    const raw = localStorage.getItem('bezier_custom_presets');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCustomPresets(presets: PresetConfig[]): void {
  localStorage.setItem('bezier_custom_presets', JSON.stringify(presets));
}
