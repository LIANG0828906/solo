export interface LayoutScheme {
  id: string;
  name: string;
  layoutType: 'center' | 'left' | 'diagonal' | 'split' | 'minimal';
  textPosition: { x: number; y: number };
  textAlign: 'left' | 'center' | 'right';
  fontFamily: string;
  fontSize: number;
  textColor: string;
  backgroundColor: string;
  rotation: number;
  opacity: number;
  accentColor?: string;
  decorElements?: DecorElement[];
}

export interface ColorTheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  suggestedBg: string;
  suggestedText: string;
}

export interface TextStyle {
  content: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  position: { x: number; y: number };
  rotation: number;
  opacity: number;
  backgroundColor: string;
}

export interface DecorElement {
  type: 'line' | 'circle' | 'rect' | 'gradient';
  position: { x: number; y: number };
  size: { width: number; height: number };
  color: string;
  rotation?: number;
}

export interface EditorState {
  text: string;
  fontFamily: string;
  fontSize: number;
  textColor: string;
  backgroundColor: string;
  position: { x: number; y: number };
  rotation: number;
  opacity: number;
  accentColor: string;
  decorElements: DecorElement[];
}

export type EditorAction =
  | { type: 'SET_FROM_SCHEME'; payload: LayoutScheme & { content: string } }
  | { type: 'UPDATE_POSITION'; payload: { x: number; y: number } }
  | { type: 'UPDATE_FONT_FAMILY'; payload: string }
  | { type: 'UPDATE_FONT_SIZE'; payload: number }
  | { type: 'UPDATE_TEXT_COLOR'; payload: string }
  | { type: 'UPDATE_BACKGROUND_COLOR'; payload: string }
  | { type: 'UPDATE_ROTATION'; payload: number }
  | { type: 'UPDATE_OPACITY'; payload: number }
  | { type: 'APPLY_THEME'; payload: ColorTheme };

export const AVAILABLE_FONTS: { family: string; label: string; sample: string }[] = [
  { family: '"Noto Serif SC", serif', label: 'Noto Serif SC (衬线)', sample: '文A' },
  { family: '"ZCOOL QingKe HuangYou", cursive', label: 'ZCOOL QingKe HuangYou (手写)', sample: '文A' },
  { family: '"Ma Shan Zheng", cursive', label: 'Ma Shan Zheng (毛笔)', sample: '文A' },
  { family: '"Sixtyfour", sans-serif', label: 'SiKuai (圆润无衬线)', sample: '文A' },
];

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: 'sunrise',
    name: '晨曦暖阳',
    primary: '#FF8C42',
    secondary: '#F4D03F',
    accent: '#E67E22',
    suggestedBg: '#FFF8E7',
    suggestedText: '#E67E22',
  },
  {
    id: 'deep-sea',
    name: '深海幽蓝',
    primary: '#1A5276',
    secondary: '#2E86C1',
    accent: '#AED6F1',
    suggestedBg: '#D6EAF8',
    suggestedText: '#1A5276',
  },
  {
    id: 'aurora',
    name: '暗夜极光',
    primary: '#4A235A',
    secondary: '#8E44AD',
    accent: '#D2B4DE',
    suggestedBg: '#F5EEF8',
    suggestedText: '#4A235A',
  },
];
