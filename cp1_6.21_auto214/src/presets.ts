export type AnimationProperty =
  | 'transform'
  | 'opacity'
  | 'filter'
  | 'clip-path'
  | 'border-radius'
  | 'background-color';

export interface AnimationStep {
  id: string;
  percentage: number;
  property: AnimationProperty;
  value: string;
}

export interface AnimationPreset {
  name: string;
  description: string;
  steps: AnimationStep[];
  duration: number;
}

export const ANIMATION_PROPERTIES: AnimationProperty[] = [
  'transform',
  'opacity',
  'filter',
  'clip-path',
  'border-radius',
  'background-color',
];

export const PROPERTY_DEFAULTS: Record<AnimationProperty, string> = {
  transform: 'rotate(360deg)',
  opacity: '0.5',
  filter: 'blur(8px)',
  'clip-path': 'circle(50%)',
  'border-radius': '50%',
  'background-color': '#EF4444',
};

const uid = () => crypto.randomUUID();

export const presets: AnimationPreset[] = [
  {
    name: '弹跳',
    description: '经典的弹性动画效果',
    duration: 2,
    steps: [
      { id: uid(), percentage: 0, property: 'transform', value: 'translateY(0) scale(1)' },
      { id: uid(), percentage: 30, property: 'transform', value: 'translateY(-80px) scale(1.05)' },
      { id: uid(), percentage: 50, property: 'transform', value: 'translateY(0) scale(0.95)' },
      { id: uid(), percentage: 70, property: 'transform', value: 'translateY(-40px) scale(1.02)' },
      { id: uid(), percentage: 100, property: 'transform', value: 'translateY(0) scale(1)' },
    ],
  },
  {
    name: '渐入',
    description: '透明度从无到有淡入',
    duration: 2,
    steps: [
      { id: uid(), percentage: 0, property: 'opacity', value: '0' },
      { id: uid(), percentage: 0, property: 'transform', value: 'scale(0.8) translateY(20px)' },
      { id: uid(), percentage: 100, property: 'opacity', value: '1' },
      { id: uid(), percentage: 100, property: 'transform', value: 'scale(1) translateY(0)' },
    ],
  },
  {
    name: '旋转+缩放',
    description: '同时旋转和放大缩小',
    duration: 2,
    steps: [
      { id: uid(), percentage: 0, property: 'transform', value: 'rotate(0deg) scale(1)' },
      { id: uid(), percentage: 50, property: 'transform', value: 'rotate(180deg) scale(1.3)' },
      { id: uid(), percentage: 100, property: 'transform', value: 'rotate(360deg) scale(1)' },
    ],
  },
  {
    name: '模糊+位移',
    description: '模糊与位移动画组合',
    duration: 2,
    steps: [
      { id: uid(), percentage: 0, property: 'filter', value: 'blur(0px)' },
      { id: uid(), percentage: 0, property: 'transform', value: 'translateX(0)' },
      { id: uid(), percentage: 50, property: 'filter', value: 'blur(10px)' },
      { id: uid(), percentage: 50, property: 'transform', value: 'translateX(60px)' },
      { id: uid(), percentage: 100, property: 'filter', value: 'blur(0px)' },
      { id: uid(), percentage: 100, property: 'transform', value: 'translateX(0)' },
    ],
  },
];
