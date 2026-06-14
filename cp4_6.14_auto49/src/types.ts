export type AnnotationType = 'highlight' | 'underline' | 'note';

export interface Annotation {
  id: string;
  bookId: string;
  chapterIndex: number;
  startOffset: number;
  endOffset: number;
  text: string;
  type: AnnotationType;
  note?: string;
  createdAt: number;
}

export interface Chapter {
  title: string;
  content: string;
  pageStart: number;
  pageEnd: number;
}

export interface Book {
  id: string;
  title: string;
  type: 'txt' | 'epub';
  chapters: Chapter[];
  totalPages: number;
}

export interface SelectionInfo {
  text: string;
  startOffset: number;
  endOffset: number;
  rect: DOMRect | null;
}
