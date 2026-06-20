export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  content: string;
  characters: string[];
  shelfRow: number;
  shelfCol: number;
  isOpen: boolean;
  openProgress: number;
  color: { start: string; end: string };
  blinkPhase?: number;
  blinkStartTime?: number;
}

export interface Annotation {
  id: string;
  bookId: string;
  charIndex: number;
  content: string;
  createdAt: number;
}

export interface CharacterPosition {
  char: string;
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AppState {
  currentView: 'shelf' | 'reading';
  activeBookId: string | null;
  searchQuery: string;
  highlightedAnnotationId: string | null;
  hoveredBookId: string | null;
  hoveredAnnotationId: string | null;
  matchedBookIds: Set<string>;
  matchedAnnotationIds: Set<string>;
}

export interface SearchResult {
  bookIds: Set<string>;
  annotationIds: Set<string>;
}

export interface ShelfConfig {
  rows: number;
  cols: number;
  scrollWidth: number;
  scrollHeight: number;
  scrollGap: number;
  rowGap: number;
  shelfX: number;
  shelfY: number;
  shelfWidth: number;
  shelfHeight: number;
  scale: number;
}

export interface ReadingConfig {
  scrollX: number;
  scrollY: number;
  maxWidth: number;
  maxHeight: number;
  charSize: number;
  columnGap: number;
  rowGap: number;
  rightMargin: number;
  topMargin: number;
}

export interface Animation {
  type: 'open' | 'close' | 'blink';
  bookId: string;
  startTime: number;
  duration: number;
  onComplete?: () => void;
}

export const COLORS = {
  BACKGROUND: '#F5E6C8',
  WOOD_DARK: '#5C3A21',
  WOOD_LIGHT: '#6C4A31',
  SCROLL_START: '#C4A882',
  SCROLL_END: '#8B6914',
  ROPE_RED: '#C04000',
  TEXT: '#2F2F2F',
  PAPER: '#FFFACD',
  HIGHLIGHT: '#FFF8DC',
  ANNOTATION_MARK: '#C04000',
  SEARCH_MATCH: '#6495ED',
  SHADOW: 'rgba(0,0,0,0.2)',
} as const;
