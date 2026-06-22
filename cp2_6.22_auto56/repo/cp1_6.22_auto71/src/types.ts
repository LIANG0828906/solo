export type TagColor =
  | 'dustyBlue'
  | 'dustyPink'
  | 'matchaGreen'
  | 'warmOrange'
  | 'dustyPurple'
  | 'dustyGray'
  | 'beanRed'
  | 'creamYellow';

export type SortOrder = 'newest' | 'oldest';

export interface InspirationCard {
  id: string;
  title: string;
  content: string;
  color: TagColor;
  emoji?: string;
  createdAt: number;
  updatedAt: number;
  isFavorite: boolean;
  column: number;
  order: number;
}

export interface FilterState {
  searchQuery: string;
  sortOrder: SortOrder;
  selectedColors: TagColor[];
  onlyFavorites: boolean;
}

export interface DragState {
  isDragging: boolean;
  draggedCardId: string | null;
  sourceColumn: number | null;
  targetColumn: number | null;
  targetIndex: number | null;
}

export interface TagColorOption {
  value: TagColor;
  label: string;
  hex: string;
}

export const TAG_COLORS: TagColorOption[] = [
  { value: 'dustyBlue', label: '雾霾蓝', hex: '#7B8FA1' },
  { value: 'dustyPink', label: '灰粉', hex: '#D4A5A5' },
  { value: 'matchaGreen', label: '抹茶绿', hex: '#9CB380' },
  { value: 'warmOrange', label: '暖橙', hex: '#D4A373' },
  { value: 'dustyPurple', label: '灰紫', hex: '#9B8AA3' },
  { value: 'dustyGray', label: '雾霾灰', hex: '#8D99AE' },
  { value: 'beanRed', label: '豆沙红', hex: '#B5838D' },
  { value: 'creamYellow', label: '米黄', hex: '#E9C46A' },
];

export const EMOJI_OPTIONS = [
  '💡', '✨', '🎨', '📝', '🚀', '🌟', '🔥', '💭',
  '🎯', '🌈', '📌', '💎', '🎵', '📚', '🌙', '☀️',
  '🍀', '🌸', '🎪', '🔮', '🎭', '🖼️', '🎬', '📸'
];
