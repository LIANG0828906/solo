export interface ColorTheme {
  name: string;
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
}

export interface ColorVariants {
  light20: string;
  light40: string;
  light60: string;
  dark20: string;
  dark40: string;
  complementary: string;
}

export interface SavedTheme extends ColorTheme {
  id: string;
  createdAt: number;
}

export const PRESET_COLORS: string[] = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#84CC16',
  '#F97316',
  '#6366F1',
  '#14B8A6',
  '#E11D48',
];

export const PRESET_THEMES: ColorTheme[] = [
  {
    name: '深蓝灰',
    primary: '#3B82F6',
    secondary: '#1E40AF',
    background: '#0F172A',
    text: '#E2E8F0',
    accent: '#60A5FA',
  },
  {
    name: '森林绿',
    primary: '#10B981',
    secondary: '#047857',
    background: '#0F172A',
    text: '#ECFDF5',
    accent: '#34D399',
  },
  {
    name: '日落橙',
    primary: '#F59E0B',
    secondary: '#B45309',
    background: '#1C1917',
    text: '#FEF3C7',
    accent: '#FBBF24',
  },
  {
    name: '星空紫',
    primary: '#8B5CF6',
    secondary: '#5B21B6',
    background: '#0F172A',
    text: '#EDE9FE',
    accent: '#A78BFA',
  },
  {
    name: '樱花粉',
    primary: '#EC4899',
    secondary: '#BE185D',
    background: '#1F1F29',
    text: '#FCE7F3',
    accent: '#F472B6',
  },
];

export const THEME_VARIABLE_KEYS: (keyof Omit<ColorTheme, 'name'>)[] = [
  'primary',
  'secondary',
  'background',
  'text',
  'accent',
];

export const THEME_VARIABLE_LABELS: Record<keyof Omit<ColorTheme, 'name'>, string> = {
  primary: '主色',
  secondary: '辅色',
  background: '背景色',
  text: '文字色',
  accent: '强调色',
};
