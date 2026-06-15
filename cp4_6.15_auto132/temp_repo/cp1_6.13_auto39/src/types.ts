export type FilterType =
  | 'pixelate'
  | 'posterize'
  | 'watercolor'
  | 'grain'
  | 'glitch'
  | 'vignette'
  | 'chromatic'
  | 'scanline';

export interface FilterConfig {
  id: FilterType;
  name: string;
  description: string;
  icon: string;
  intensity: number;
  enabled: boolean;
  min: number;
  max: number;
  step: number;
  unit: string;
}

export interface TimeRange {
  start: number;
  end: number;
}

export interface ExportProgress {
  stage: 'preparing' | 'capturing' | 'encoding' | 'done';
  percent: number;
}

export const DEFAULT_FILTERS: FilterConfig[] = [
  {
    id: 'pixelate',
    name: '像素化',
    description: '将画面分解为块状像素',
    icon: '▦',
    intensity: 8,
    enabled: false,
    min: 2,
    max: 20,
    step: 1,
    unit: 'px'
  },
  {
    id: 'posterize',
    name: '色阶分离',
    description: '减少颜色层级，形成剪影风格',
    icon: '◐',
    intensity: 4,
    enabled: false,
    min: 2,
    max: 8,
    step: 1,
    unit: '级'
  },
  {
    id: 'watercolor',
    name: '水彩晕染',
    description: '柔和边缘，模拟水彩笔触',
    icon: '❊',
    intensity: 50,
    enabled: false,
    min: 0,
    max: 100,
    step: 5,
    unit: '%'
  },
  {
    id: 'grain',
    name: '电影颗粒',
    description: '添加复古胶片颗粒感',
    icon: '✺',
    intensity: 40,
    enabled: false,
    min: 0,
    max: 100,
    step: 5,
    unit: '%'
  },
  {
    id: 'glitch',
    name: '故障失真',
    description: 'RGB通道错位，赛博朋克风',
    icon: '⚡',
    intensity: 30,
    enabled: false,
    min: 0,
    max: 100,
    step: 5,
    unit: '%'
  },
  {
    id: 'vignette',
    name: '暗角光晕',
    description: '边缘压暗，聚焦中心',
    icon: '◉',
    intensity: 60,
    enabled: false,
    min: 0,
    max: 100,
    step: 5,
    unit: '%'
  },
  {
    id: 'chromatic',
    name: '色调映射',
    description: '分离色调，青橙电影感',
    icon: '◈',
    intensity: 70,
    enabled: false,
    min: 0,
    max: 100,
    step: 5,
    unit: '%'
  },
  {
    id: 'scanline',
    name: '扫描线',
    description: 'CRT显示器扫描线效果',
    icon: '≡',
    intensity: 50,
    enabled: false,
    min: 0,
    max: 100,
    step: 5,
    unit: '%'
  }
];
