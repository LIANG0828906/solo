export interface EmojiItem {
  id: string;
  emoji: string;
  x: number;
  y: number;
  size: number;
  color: string;
  zIndex: number;
}

export interface Viewport {
  offsetX: number;
  offsetY: number;
  scale: number;
}

export type FilterType = 'none' | 'gaussianBlur' | 'sepia' | 'neon';

export interface EmojiCategory {
  name: string;
  icon: string;
  emojis: string[];
}

export interface RingMenuItem {
  id: string;
  label: string;
  icon: string;
  angle: number;
}

export interface DragState {
  isDragging: boolean;
  emojiId: string | null;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  scaleAnimation: number;
}

export interface LongPressState {
  isActive: boolean;
  emojiId: string | null;
  x: number;
  y: number;
  timer: number | null;
}
