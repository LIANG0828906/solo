export interface DialogBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  originalText: string;
  translatedText: string;
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  strokeColor: string;
  strokeWidth: number;
  textX: number;
  textY: number;
}

export interface MangaPage {
  id: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  dialogBoxes: DialogBox[];
}

export type AppStep = 'detect' | 'edit' | 'export';

export const FONT_LIST = [
  { name: '思源黑体', family: '"Noto Sans SC", sans-serif' },
  { name: '思源宋体', family: '"Noto Serif SC", serif' },
  { name: '手写体', family: '"STKaiti", "KaiTi", cursive' },
  { name: '卡通体', family: '"Comic Sans MS", "YouYuan", cursive' },
  { name: '像素体', family: '"Press Start 2P", "Courier New", monospace' },
];

export const THEME = {
  bg: '#1a1a2e',
  card: '#16213e',
  text: '#e1e1e1',
  accent: '#0f3460',
  highlight: '#e94560',
  orange: '#ff8c42',
  blue: '#4a90d9',
  gold: '#ffd700',
  green: '#4caf50',
  radius: '8px',
} as const;
