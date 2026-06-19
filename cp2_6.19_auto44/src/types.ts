export interface SculptureParams {
  subdivision: number;
  twistIntensity: number;
  expansionRadius: number;
  verticalStretch: number;
  topContraction: number;
  rotationOffset: number;
  baseColor: string;
  metalness: number;
  roughness: number;
  emissiveColor: string;
  emissiveIntensity: number;
  colorMode: 'solid' | 'gradient';
  gradientStart: string;
  gradientEnd: string;
  ambientLightOn: boolean;
  pointLightOn: boolean;
}

export interface SliderConfig {
  key: keyof SculptureParams;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
  category: 'morphology' | 'material';
  displayFormat?: (value: number) => string;
}

export const DEFAULT_PARAMS: SculptureParams = {
  subdivision: 24,
  twistIntensity: 1.0,
  expansionRadius: 1.5,
  verticalStretch: 1.5,
  topContraction: 0.3,
  rotationOffset: 0,
  baseColor: '#6366f1',
  metalness: 0.3,
  roughness: 0.4,
  emissiveColor: '#000000',
  emissiveIntensity: 0,
  colorMode: 'solid',
  gradientStart: '#6366f1',
  gradientEnd: '#ec4899',
  ambientLightOn: true,
  pointLightOn: true,
};

export const SLIDER_CONFIGS: SliderConfig[] = [
  { key: 'subdivision', label: '细分程度', min: 8, max: 64, step: 1, default: 24, category: 'morphology' },
  { key: 'twistIntensity', label: '扭曲强度', min: 0, max: 3, step: 0.01, default: 1.0, category: 'morphology' },
  { key: 'expansionRadius', label: '扩张半径', min: 0.5, max: 3, step: 0.01, default: 1.5, category: 'morphology' },
  { key: 'verticalStretch', label: '垂直拉伸', min: 0.5, max: 3, step: 0.01, default: 1.5, category: 'morphology' },
  { key: 'topContraction', label: '顶部收缩', min: 0, max: 1, step: 0.01, default: 0.3, category: 'morphology' },
  { key: 'rotationOffset', label: '旋转偏移', min: 0, max: 360, step: 1, default: 0, category: 'morphology' },
  { key: 'metalness', label: '金属质感', min: 0, max: 1, step: 0.01, default: 0.3, category: 'material' },
  { key: 'roughness', label: '粗糙度', min: 0, max: 1, step: 0.01, default: 0.4, category: 'material' },
];

export interface Preset {
  id: string;
  name: string;
  icon: string;
  color: string;
  params: Partial<SculptureParams>;
}

export const PRESETS: Preset[] = [
  {
    id: 'spiral',
    name: '螺旋塔',
    icon: '🌀',
    color: '#00d4ff',
    params: {
      subdivision: 32,
      twistIntensity: 2.5,
      expansionRadius: 1.2,
      verticalStretch: 2.8,
      topContraction: 0.8,
      rotationOffset: 45,
      baseColor: '#06b6d4',
      metalness: 0.6,
      roughness: 0.2,
      emissiveColor: '#0891b2',
      emissiveIntensity: 0.3,
    },
  },
  {
    id: 'ripple',
    name: '波纹球',
    icon: '🔮',
    color: '#00d4ff',
    params: {
      subdivision: 48,
      twistIntensity: 0.5,
      expansionRadius: 2.0,
      verticalStretch: 1.0,
      topContraction: 0.1,
      rotationOffset: 0,
      baseColor: '#8b5cf6',
      metalness: 0.2,
      roughness: 0.6,
      emissiveColor: '#000000',
      emissiveIntensity: 0,
    },
  },
  {
    id: 'twist',
    name: '扭曲环',
    icon: '💫',
    color: '#00d4ff',
    params: {
      subdivision: 40,
      twistIntensity: 1.8,
      expansionRadius: 2.5,
      verticalStretch: 0.6,
      topContraction: 0.5,
      rotationOffset: 180,
      baseColor: '#ec4899',
      metalness: 0.8,
      roughness: 0.1,
      emissiveColor: '#000000',
      emissiveIntensity: 0,
    },
  },
  {
    id: 'nebula',
    name: '星云簇',
    icon: '✨',
    color: '#00d4ff',
    params: {
      subdivision: 56,
      twistIntensity: 0.8,
      expansionRadius: 1.8,
      verticalStretch: 1.8,
      topContraction: 0.2,
      rotationOffset: 90,
      baseColor: '#a855f7',
      metalness: 0.4,
      roughness: 0.5,
      emissiveColor: '#7c3aed',
      emissiveIntensity: 0.5,
    },
  },
];

export type AnimationType = 'none' | 'preset' | 'random' | 'explosion';

export interface AnimationState {
  type: AnimationType;
  progress: number;
  duration: number;
  startTime: number;
  startParams: SculptureParams;
  targetParams: SculptureParams;
  explosionScale: number;
}
