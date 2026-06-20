export interface IBook {
  id: string;
  title: string;
  author: string;
  price: number;
  cover: string;
  category: 'fiction' | 'non-fiction';
  genre: 'literature' | 'social' | 'art' | 'history' | 'science' | 'philosophy';
  description: string;
}

export interface ITheme {
  id: string;
  name: string;
  color: string;
  bookIds: string[];
}

export interface IExhibition {
  id: string;
  title: string;
  themes: ITheme[];
  uncategorizedBooks: string[];
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'published';
}

export interface IBookShelfState {
  books: IBook[];
  filterCategory: 'all' | 'fiction' | 'non-fiction';
  filterGenre: string;
}

export interface IExhibitionState {
  currentExhibition: IExhibition | null;
  exhibitions: IExhibition[];
  isPreviewOpen: boolean;
  isFullscreen: boolean;
}

export type ThemeColor = 
  | '#D85A5A' | '#36A2A2' | '#9B72AA' | '#D4A843'
  | '#B5795B' | '#F0E5D8' | '#6C8EB2' | '#C9A9C6';

export const THEME_COLORS: ThemeColor[] = [
  '#D85A5A', '#36A2A2', '#9B72AA', '#D4A843',
  '#B5795B', '#F0E5D8', '#6C8EB2', '#C9A9C6'
];

export const ItemTypes = {
  BOOK: 'book',
  THEME: 'theme',
};

export interface BookDragItem {
  type: typeof ItemTypes.BOOK;
  bookId: string;
  source: 'shelf' | 'exhibition' | 'theme';
  themeId?: string;
}

export interface ThemeDragItem {
  type: typeof ItemTypes.THEME;
  themeId: string;
  index: number;
}
