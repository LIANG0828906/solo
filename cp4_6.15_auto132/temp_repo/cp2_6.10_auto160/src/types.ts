export interface BookPage {
  pageNum: number;
  originalText: string;
  translation: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  dynasty: string;
  category: 'jing' | 'shi' | 'zi' | 'ji';
  coverColor: string;
  pages: BookPage[];
}

export interface Annotation {
  id: string;
  bookId: string;
  pageNum: number;
  startOffset: number;
  endOffset: number;
  text: string;
  note: string;
  createdAt: number;
}

export type CategoryKey = 'jing' | 'shi' | 'zi' | 'ji';

export const CATEGORY_NAMES: Record<CategoryKey, string> = {
  jing: '经部',
  shi: '史部',
  zi: '子部',
  ji: '集部'
};
