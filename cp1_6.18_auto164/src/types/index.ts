export type ScentType = 'floral' | 'woody' | 'citrus' | 'ocean';

export type MoodType = 'calm' | 'excited' | 'melancholy' | 'elegant';

export interface ScentCard {
  id: string;
  type: ScentType;
  name: string;
  description: string;
  emoji: string;
  color: string;
  liquidColor: string;
}

export interface FormulaItem {
  id: string;
  scentId: string;
  type: ScentType;
  name: string;
  color: string;
  liquidColor: string;
  ratio: number;
}

export interface Perfume {
  id: string;
  name: string;
  mood: MoodType;
  formula: FormulaItem[];
  gradientColors: string[];
  dominantColor: string;
  createdAt: number;
}

export interface MixResult {
  formula: FormulaItem[];
  totalRatio: number;
  gradient: string;
  dominantColor: string;
}

export interface MoodOption {
  value: MoodType;
  label: string;
  color: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  { value: 'calm', label: '宁静', color: '#A8D8A8' },
  { value: 'excited', label: '兴奋', color: '#FFB3B3' },
  { value: 'melancholy', label: '忧郁', color: '#A0C4E8' },
  { value: 'elegant', label: '优雅', color: '#D4A8D4' },
];

export const SCENT_LIBRARY: ScentCard[] = [
  {
    id: 'scent-floral',
    type: 'floral',
    name: '花香',
    description: '玫瑰与茉莉的浪漫气息，温柔而柔美，唤起春日花园的芬芳记忆。',
    emoji: '🌸',
    color: '#F4A7A7',
    liquidColor: '#F4A7A7',
  },
  {
    id: 'scent-woody',
    type: 'woody',
    name: '木质',
    description: '雪松与檀香的深邃暖意，沉稳有力，带来森林深处的静谧与力量。',
    emoji: '🌲',
    color: '#A0B2A0',
    liquidColor: '#8FA88F',
  },
  {
    id: 'scent-citrus',
    type: 'citrus',
    name: '柑橘',
    description: '柠檬与佛手柑的清新活力，明亮活泼，如同午后阳光下的果林。',
    emoji: '🍊',
    color: '#F7D794',
    liquidColor: '#FFC870',
  },
  {
    id: 'scent-ocean',
    type: 'ocean',
    name: '海洋',
    description: '海风与盐雾的清冽广阔，自由纯净，仿佛站在悬崖边眺望深蓝海岸。',
    emoji: '🌊',
    color: '#8EC8E8',
    liquidColor: '#7AB8DC',
  },
];

export function getMoodOption(mood: MoodType): MoodOption {
  return MOOD_OPTIONS.find(m => m.value === mood) ?? MOOD_OPTIONS[0];
}
