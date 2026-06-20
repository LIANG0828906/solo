import type { UIConfig, NoiseType, SliderConfig, NoiseButtonConfig } from '@/types';

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

const sliders: SliderConfig[] = [
  {
    key: 'density',
    label: '建筑密度',
    min: 0.2,
    max: 1.0,
    step: 0.05,
    default: 0.5,
    unit: '%',
    format: (v) => `${Math.round(v * 100)}%`,
  },
  {
    key: 'heightScale',
    label: '高度幅度',
    min: 0.5,
    max: 2.0,
    step: 0.1,
    default: 1.0,
    unit: 'x',
    format: (v) => `${v.toFixed(1)}x`,
  },
  {
    key: 'colorContrast',
    label: '颜色对比度',
    min: 0.5,
    max: 2.0,
    step: 0.1,
    default: 1.0,
    unit: 'x',
    format: (v) => `${v.toFixed(1)}x`,
  },
];

const noiseButtons: NoiseButtonConfig[] = [
  {
    key: 'white',
    label: '白噪音',
    description: '均匀随机高度分布',
  },
  {
    key: 'pink',
    label: '粉红噪音',
    description: '高低建筑集群分布',
  },
  {
    key: 'brown',
    label: '布朗噪音',
    description: '平滑山丘状起伏',
  },
];

export const NOISE_LABEL_MAP: Record<NoiseType, string> = {
  white: '白噪音模式',
  pink: '粉红噪音模式',
  brown: '布朗噪音模式',
};

export const uiConfig: UIConfig = {
  panelWidth: {
    desktop: 280,
    mobile: 220,
  },
  breakpoint: 1024,
  sliders,
  noiseButtons,
  colorPalette: {
    background: '#1A1A2E',
    panelBg: 'rgba(255, 255, 255, 0.06)',
    accent: '#81ECEC',
    selected: '#FF6B6B',
    highlight: '#FFD93D',
    textPrimary: '#FFFFFF',
    textSecondary: '#A0A0A0',
    sliderTrack: '#2D3436',
    buttonBg: '#16213E',
    buttonHover: '#1A1A40',
    buttonActive: '#0F3460',
    buildingColors: ['#2D3436', '#636E72', '#B2BEC3', '#DFE6E9'],
  },
  animation: {
    transitionDuration: 1500,
    easeOutCubic,
  },
  camera: {
    initialPosition: [0, 30, 40],
    rotateSpeed: 0.004,
    minDistance: 15,
    maxDistance: 80,
    panSpeed: 0.3,
  },
};

export const defaultCityConfig = {
  gridSize: 50,
  density: 0.5,
  heightScale: 1.0,
  colorContrast: 1.0,
  noiseType: 'white' as NoiseType,
};

export const BUILDING_CONSTRAINTS = {
  minSize: 0.3,
  maxSize: 1.5,
  minHeight: 0.5,
  maxHeight: 12,
  spacing: 0.2,
  maxBuildings: 2500,
  maxDensityBuildings: 2000,
  glowIntensity: 0.2,
  hoverEdgeWidth: 0.03,
  selectedLift: 0.5,
};
