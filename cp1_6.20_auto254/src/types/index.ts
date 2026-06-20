export type CoverTemplate = {
  id: string;
  name: string;
  backgroundColor: string;
  backgroundImage?: string;
  titleStyle: TextStyle;
  subtitleStyle?: TextStyle;
  showDate?: boolean;
};

export type PageBackground = {
  color: string;
  pattern?: 'none' | 'dots' | 'lines' | 'grid' | 'paper';
  opacity?: number;
  imageUrl?: string;
};

export type ModuleType =
  | 'text'
  | 'image'
  | 'sticker'
  | 'divider'
  | 'date'
  | 'weather'
  | 'mood'
  | 'checklist'
  | 'doodle';

export type StickerType =
  | 'washi-tape-1'
  | 'washi-tape-2'
  | 'paper-clip'
  | 'tag-1'
  | 'tag-2'
  | 'postmark'
  | 'polaroid'
  | 'masking-tape-1'
  | 'masking-tape-2'
  | 'sticky-note';

export type Position = {
  x: number;
  y: number;
};

export type Size = {
  width: number;
  height: number;
};

export type TextStyle = {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: number;
  letterSpacing?: number;
  italic?: boolean;
  underline?: boolean;
};

export type ImageData = {
  id: string;
  url: string;
  originalUrl?: string;
  alt?: string;
  caption?: string;
  filter?: 'none' | 'vintage' | 'warm' | 'cool' | 'mono' | 'sepia';
  rotation?: number;
  opacity?: number;
};

export type ModuleItemData = {
  id: string;
  type: ModuleType;
  position: Position;
  size: Size;
  rotation?: number;
  zIndex: number;
  content: string;
  textStyle?: TextStyle;
  image?: ImageData;
  stickerType?: StickerType;
  opacity?: number;
  locked?: boolean;
  checkedItems?: Array<{ text: string; checked: boolean }>;
};

export type JournalPage = {
  id: string;
  index: number;
  background: PageBackground;
  modules: ModuleItemData[];
};

export type Journal = {
  id: string;
  title: string;
  subtitle?: string;
  cover: CoverTemplate;
  createdAt: string;
  updatedAt: string;
  pages: JournalPage[];
};

export type HistoryState = {
  past: Journal[];
  present: Journal | null;
  future: Journal[];
};
