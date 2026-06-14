export interface TextStyle {
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  strokeColor: string;
  strokeWidth: number;
  x: number;
  y: number;
}

export interface Sticker {
  id: string;
  type: 'emoji' | 'shape';
  content: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  zIndex: number;
}

export interface MemeTemplate {
  id: string;
  name: string;
  thumbnail: string;
  imageUrl: string;
}

export type PanelType = 'templates' | 'stickers' | 'text';

export interface AppState {
  image: string | null;
  topText: TextStyle;
  bottomText: TextStyle;
  stickers: Sticker[];
  selectedStickerId: string | null;
  selectedTextType: 'top' | 'bottom' | null;
  activePanel: PanelType | null;
  sidebarCollapsed: boolean;
  uploadProgress: number;
}

export const FONT_OPTIONS = [
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Impact', value: 'Impact, sans-serif' },
  { label: 'Comic Sans MS', value: '"Comic Sans MS", cursive' },
  { label: '黑体', value: '"Noto Sans SC", "SimHei", sans-serif' },
  { label: '宋体', value: '"SimSun", serif' },
];

export const EMOJI_STICKERS = ['😂', '😭', '😎', '🤔', '👍', '🔥', '💯', '🌈', '⭐', '💀'];

export const SHAPE_STICKERS = [
  '⬆️', '⬇️', '➡️', '⬅️',
  '💥', '💬', '💭', '❗',
  '❓', '🎯',
];

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};
