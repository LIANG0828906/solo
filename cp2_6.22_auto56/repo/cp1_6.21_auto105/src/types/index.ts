export interface Book {
  id: string;
  title: string;
  author?: string;
  cover?: string;
  filePath: string;
  fileType: 'epub' | 'txt';
  totalChapters: number;
  chapters: Chapter[];
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  index: number;
}

export interface Annotation {
  id: string;
  chapterId: string;
  startOffset: number;
  endOffset: number;
  text: string;
  note?: string;
  color: string;
  createdAt: number;
}

export interface Bookmark {
  id: string;
  chapterId: string;
  offset: number;
  text: string;
  createdAt: number;
}

export interface ReadingState {
  currentChapterId: string;
  scrollPercentage: number;
  annotations: Annotation[];
  bookmarks: Bookmark[];
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface ReaderModule {
  parseBook: (file: File) => Promise<Book>;
  getChapterContent: (book: Book, chapterId: string) => string;
}

export interface ParserModule {
  parseEpub: (file: File) => Promise<Book>;
  parseTxt: (file: File) => Promise<Book>;
}
