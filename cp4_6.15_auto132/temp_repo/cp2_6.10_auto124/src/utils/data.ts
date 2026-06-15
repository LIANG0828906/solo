import { Point } from '../store/useStore';

export interface AnimationConfig {
  type: 'cloud' | 'stone' | 'rhinoceros' | 'wave' | 'vine' | 'arrow' | 'sword';
  duration: number;
  startPosition: { x: number; y: number; z: number };
  endPosition: { x: number; y: number; z: number };
  colorStart: string;
  colorEnd: string;
}

export interface StrokeData {
  name: string;
  character: string;
  description: string;
  originalText: string;
  path: Point[];
  animationConfig: AnimationConfig;
  suggestions: {
    type: string;
    text: string;
  }[];
}

const generateHorizontalPath = (): Point[] => {
  const points: Point[] = [];
  const ts = Date.now();
  for (let i = 0; i <= 30; i++) {
    const t = i / 30;
    points.push({
      x: 0.15 + t * 0.7,
      y: 0.48 + Math.sin(t * Math.PI) * 0.02,
      timestamp: ts + i * 50,
    });
  }
  return points;
};

const generateDotPath = (): Point[] => {
  const points: Point[] = [];
  const ts = Date.now();
  for (let i = 0; i <= 15; i++) {
    const t = i / 15;
    points.push({
      x: 0.48 + t * 0.04,
      y: 0.4 + t * 0.15,
      pressure: 0.5 + t * 0.5,
      timestamp: ts + i * 40,
    });
  }
  return points;
};

const generateLeftFallingPath = (): Point[] => {
  const points: Point[] = [];
  const ts = Date.now();
  for (let i = 0; i <= 25; i++) {
    const t = i / 25;
    points.push({
      x: 0.6 - t * 0.4,
      y: 0.3 + t * 0.4,
      pressure: 0.8 - t * 0.4,
      timestamp: ts + i * 45,
    });
  }
  return points;
};

const generateRightFallingPath = (): Point[] => {
  const points: Point[] = [];
  const ts = Date.now();
  for (let i = 0; i <= 25; i++) {
    const t = i / 25;
    points.push({
      x: 0.4 + t * 0.35,
      y: 0.35 + t * 0.35 + Math.sin(t * Math.PI * 0.5) * 0.05,
      pressure: 0.6 + t * 0.3,
      timestamp: ts + i * 45,
    });
  }
  return points;
};

const generateVerticalPath = (): Point[] => {
  const points: Point[] = [];
  const ts = Date.now();
  for (let i = 0; i <= 30; i++) {
    const t = i / 30;
    points.push({
      x: 0.5 + Math.sin(t * Math.PI * 2) * 0.015,
      y: 0.2 + t * 0.6,
      pressure: 0.7 + Math.sin(t * Math.PI) * 0.2,
      timestamp: ts + i * 50,
    });
  }
  return points;
};

const generateBendPath = (): Point[] => {
  const points: Point[] = [];
  const ts = Date.now();
  for (let i = 0; i <= 35; i++) {
    const t = i / 35;
    if (t < 0.5) {
      points.push({
        x: 0.3 + t * 0.4,
        y: 0.35,
        pressure: 0.6 + t * 0.2,
        timestamp: ts + i * 40,
      });
    } else {
      const tt = (t - 0.5) / 0.5;
      points.push({
        x: 0.5,
        y: 0.35 + tt * 0.35,
        pressure: 0.8 - tt * 0.3,
        timestamp: ts + i * 40,
      });
    }
  }
  return points;
};

const generateHookPath = (): Point[] => {
  const points: Point[] = [];
  const ts = Date.now();
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    if (t < 0.7) {
      points.push({
        x: 0.5,
        y: 0.3 + t * 0.5,
        pressure: 0.7,
        timestamp: ts + i * 50,
      });
    } else {
      const tt = (t - 0.7) / 0.3;
      points.push({
        x: 0.5 - tt * 0.15,
        y: 0.65 + tt * 0.05,
        pressure: 0.7 - tt * 0.4,
        timestamp: ts + i * 50,
      });
    }
  }
  return points;
};

export const STROKES_DATA: StrokeData[] = [
  {
    name: '横',
    character: '一',
    description: '千里阵云',
    originalText: '横如千里阵云，隐隐然其实有形。',
    path: generateHorizontalPath(),
    animationConfig: {
      type: 'cloud',
      duration: 3000,
      startPosition: { x: -2, y: 0.5, z: 0 },
      endPosition: { x: 2, y: 0.5, z: 0 },
      colorStart: '#b0a090',
      colorEnd: '#4a3b32',
    },
    suggestions: [
      { type: 'start_light', text: '横画起笔太轻，应如云层初现，渐行渐重。' },
      { type: 'end_heavy', text: '横画收笔过重，应如云尾渐收，余韵悠长。' },
      { type: 'uneven', text: '横画起伏不均，应如千里阵云，平缓中见气势。' },
      { type: 'too_fast', text: '行笔过快，应如云层舒展，从容不迫。' },
      { type: 'good', text: '横画如阵云千里，气势连贯，甚佳！' },
    ],
  },
  {
    name: '点',
    character: '丶',
    description: '高峰坠石',
    originalText: '点如高峰坠石，磕磕然实如崩也。',
    path: generateDotPath(),
    animationConfig: {
      type: 'stone',
      duration: 2000,
      startPosition: { x: 0.5, y: 3, z: 0 },
      endPosition: { x: 0.5, y: 0.1, z: 0 },
      colorStart: '#8b7355',
      colorEnd: '#4a3b32',
    },
    suggestions: [
      { type: 'not_compact', text: '点画不够紧凑，应如坠石落地，凝聚有力。' },
      { type: 'too_slow', text: '行笔过慢，应如坠石下坠，势不可挡。' },
      { type: 'too_light', text: '点画过轻，应如坠石之重，力透纸背。' },
      { type: 'position', text: '点画位置偏差，应如石落正中，沉稳有力。' },
      { type: 'good', text: '点如高峰坠石，力重千钧，妙哉！' },
    ],
  },
  {
    name: '撇',
    character: '丿',
    description: '陆断犀象',
    originalText: '撇如陆断犀象，角出而力有余。',
    path: generateLeftFallingPath(),
    animationConfig: {
      type: 'rhinoceros',
      duration: 2500,
      startPosition: { x: 1.5, y: 2, z: 0 },
      endPosition: { x: -1.5, y: -1, z: 0 },
      colorStart: '#8b6914',
      colorEnd: '#4a3b32',
    },
    suggestions: [
      { type: 'start_heavy', text: '撇画起笔过重，应如犀角初露，渐次展开。' },
      { type: 'end_too_thin', text: '撇画收笔过细，应如陆断犀象，力贯始终。' },
      { type: 'not_smooth', text: '撇画不够流畅，应如犀角划过，爽利果断。' },
      { type: 'too_short', text: '撇画过短，应如犀角之长，舒展有度。' },
      { type: 'good', text: '撇如陆断犀象，力贯毫端，甚妙！' },
    ],
  },
  {
    name: '捺',
    character: '㇏',
    description: '崩浪雷奔',
    originalText: '捺如崩浪雷奔，势不可挡。',
    path: generateRightFallingPath(),
    animationConfig: {
      type: 'wave',
      duration: 3000,
      startPosition: { x: -1, y: 2, z: 0 },
      endPosition: { x: 2, y: -1, z: 0 },
      colorStart: '#8baaa4',
      colorEnd: '#4a3b32',
    },
    suggestions: [
      { type: 'not_wavy', text: '捺画缺少波势，应如崩浪起伏，气势磅礴。' },
      { type: 'end_abrupt', text: '捺画收笔太急，应如浪涛拍岸，余响不绝。' },
      { type: 'too_straight', text: '捺画过直，应如波浪翻腾，曲折生姿。' },
      { type: 'pressure', text: '捺画力度不均，应如浪涌之力，由弱而强。' },
      { type: 'good', text: '捺如崩浪雷奔，气势如虹，妙极！' },
    ],
  },
  {
    name: '竖',
    character: '丨',
    description: '万岁枯藤',
    originalText: '竖如万岁枯藤，屈铁盘金。',
    path: generateVerticalPath(),
    animationConfig: {
      type: 'vine',
      duration: 3500,
      startPosition: { x: 0, y: -1.5, z: 0 },
      endPosition: { x: 0, y: 1.5, z: 0 },
      colorStart: '#5a8c5a',
      colorEnd: '#4a3b32',
    },
    suggestions: [
      { type: 'too_straight', text: '竖画过直，应如枯藤缠绕，屈中有伸。' },
      { type: 'not_strong', text: '竖画力度不够，应如屈铁盘金，刚劲有力。' },
      { type: 'wobbling', text: '竖画过于摇曳，应如枯藤挺立，稳中见动。' },
      { type: 'end_weak', text: '竖画收笔过弱，应如藤根深扎，力沉到底。' },
      { type: 'good', text: '竖如万岁枯藤，刚柔并济，绝佳！' },
    ],
  },
  {
    name: '折',
    character: '㇕',
    description: '劲弩筋节',
    originalText: '折如劲弩筋节，转角分明。',
    path: generateBendPath(),
    animationConfig: {
      type: 'arrow',
      duration: 2500,
      startPosition: { x: -1.5, y: 1, z: 0 },
      endPosition: { x: 0, y: -1, z: 0 },
      colorStart: '#8b4513',
      colorEnd: '#4a3b32',
    },
    suggestions: [
      { type: 'corner_rounded', text: '折角过圆，应如劲弩张弓，棱角分明。' },
      { type: 'corner_too_sharp', text: '折角过锐，应如筋节相连，转折自然。' },
      { type: 'speed_change', text: '转折处缺少停顿，应如弩机待发，蓄势而后发。' },
      { type: 'unbalanced', text: '两画比例失衡，应如弓弩之形，协调匀称。' },
      { type: 'good', text: '折如劲弩筋节，顿挫有力，妙哉！' },
    ],
  },
  {
    name: '钩',
    character: '㇃',
    description: '利剑斩犀',
    originalText: '钩如利剑斩犀，锋芒毕露。',
    path: generateHookPath(),
    animationConfig: {
      type: 'sword',
      duration: 2000,
      startPosition: { x: 0.5, y: 2, z: 0 },
      endPosition: { x: -0.5, y: 0.5, z: 0 },
      colorStart: '#c0c0c0',
      colorEnd: '#4a3b32',
    },
    suggestions: [
      { type: 'hook_not_sharp', text: '钩锋不够锐利，应如利剑出鞘，锋芒逼人。' },
      { type: 'hook_too_long', text: '钩画过长，应如剑刃之利，点到即止。' },
      { type: 'vertical_weak', text: '竖画无力，应如剑身挺立，然后出钩。' },
      { type: 'direction', text: '钩向偏差，应如利剑斩犀，准确有力。' },
      { type: 'good', text: '钩如利剑斩犀，锋芒毕露，甚佳！' },
    ],
  },
];

export const BRUSH_CONFIG = {
  jianhao: { width: 4, color: '#1a1a1a', name: '兼毫', description: '软硬适中' },
  langhao: { width: 3, color: '#0a0a0a', name: '狼毫', description: '刚劲有力' },
  yanghao: { width: 5, color: '#2a2a2a', name: '羊毫', description: '柔软丰腴' },
};

export const getStrokeData = (index: number): StrokeData => {
  return STROKES_DATA[Math.max(0, Math.min(index, STROKES_DATA.length - 1))];
};
