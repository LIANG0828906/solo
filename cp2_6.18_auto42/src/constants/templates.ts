export interface CardColors {
  background: string;
  title: string;
  body: string;
  accent: string;
}

export interface CardData {
  id: string;
  title: string;
  body: string;
  emoji: string;
  template: TemplateName;
  colors: CardColors;
  isFavorite: boolean;
  createTime: number;
}

export type TemplateName = 'simple' | 'vintage' | 'tech';

export interface TemplateConfig {
  name: TemplateName;
  label: string;
  defaultColors: CardColors;
  fontFamily: string;
}

export const TEMPLATES: TemplateConfig[] = [
  {
    name: 'simple',
    label: '简约白',
    defaultColors: {
      background: '#F8F9FA',
      title: '#212529',
      body: '#495057',
      accent: '#DEE2E6',
    },
    fontFamily: '"Helvetica Neue", Helvetica, Arial, "PingFang SC", "Microsoft YaHei", sans-serif',
  },
  {
    name: 'vintage',
    label: '复古纸',
    defaultColors: {
      background: '#F5E6C8',
      title: '#5C3A21',
      body: '#7A5C3A',
      accent: '#C4A27A',
    },
    fontFamily: '"Georgia", "Times New Roman", "KaiTi", "STKaiti", serif',
  },
  {
    name: 'tech',
    label: '科技蓝',
    defaultColors: {
      background: '#E6F2FF',
      title: '#003366',
      body: '#004080',
      accent: '#99C2FF',
    },
    fontFamily: '"SF Mono", "Consolas", "Courier New", "Microsoft YaHei", monospace',
  },
];

export const EMOJI_LIST: string[] = [
  '📚', '💡', '🎯', '🚀', '⭐', '🔥',
  '✨', '🌈', '🧠', '🎨', '📝', '⚡',
  '🌟', '🎪', '🏆', '🌱', '🔬', '🎭',
  '📖', '💎', '🎵', '🗺️', '🎁', '🌍',
];

export const TITLE_MAX_LENGTH = 30;
export const BODY_MAX_LENGTH = 200;
export const HISTORY_MAX_COUNT = 20;
export const FAVORITES_MAX_COUNT = 50;

export const CARD_WIDTH = 400;
export const CARD_HEIGHT = 300;

export function getTemplateByName(name: TemplateName): TemplateConfig {
  return TEMPLATES.find((t) => t.name === name) || TEMPLATES[0];
}
