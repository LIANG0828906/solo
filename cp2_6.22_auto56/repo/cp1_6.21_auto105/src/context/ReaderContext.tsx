import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Book, ReadingState, SaveStatus, Annotation, Bookmark, ReaderModule, ParserModule } from '@/types';

interface ReaderContextType {
  book: Book | null;
  readingState: ReadingState;
  readerModule: ReaderModule | null;
  parserModule: ParserModule | null;
  saveStatus: SaveStatus;
  uploadBook: (file: File) => Promise<void>;
  saveProgress: () => Promise<void>;
  addAnnotation: (annotation: Omit<Annotation, 'id' | 'createdAt'>) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
  addBookmark: (bookmark: Omit<Bookmark, 'id' | 'createdAt'>) => void;
  deleteBookmark: (id: string) => void;
  setCurrentChapter: (chapterId: string) => void;
  setScrollPercentage: (percentage: number) => void;
  jumpToAnnotation: (annotationId: string) => void;
}

const defaultReadingState: ReadingState = {
  currentChapterId: '',
  scrollPercentage: 0,
  annotations: [],
  bookmarks: [],
};

const ReaderContext = createContext<ReaderContextType | undefined>(undefined);

interface ReaderProviderProps {
  children: ReactNode;
  readerModule?: ReaderModule;
  parserModule?: ParserModule;
}

export function ReaderProvider({ 
  children, 
  readerModule = null, 
  parserModule = null 
}: ReaderProviderProps) {
  const [book, setBook] = useState<Book | null>(null);
  const [readingState, setReadingState] = useState<ReadingState>(defaultReadingState);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const uploadBook = useCallback(async (file: File) => {
    setSaveStatus('saving');
    try {
      if (!parserModule) {
        throw new Error('Parser module not available');
      }
      
      let parsedBook: Book;
      if (file.name.endsWith('.epub')) {
        parsedBook = await parserModule.parseEpub(file);
      } else if (file.name.endsWith('.txt')) {
        parsedBook = await parserModule.parseTxt(file);
      } else {
        throw new Error('Unsupported file format');
      }
      
      setBook(parsedBook);
      setReadingState({
        currentChapterId: parsedBook.chapters[0]?.id || '',
        scrollPercentage: 0,
        annotations: [],
        bookmarks: [],
      });
      setSaveStatus('saved');
    } catch (error) {
      setSaveStatus('error');
      throw error;
    }
  }, [parserModule]);

  const saveProgress = useCallback(async () => {
    setSaveStatus('saving');
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setSaveStatus('saved');
    } catch (error) {
      setSaveStatus('error');
    }
  }, []);

  const addAnnotation = useCallback((annotation: Omit<Annotation, 'id' | 'createdAt'>) => {
    setReadingState(prev => ({
      ...prev,
      annotations: [
        ...prev.annotations,
        {
          ...annotation,
          id: uuidv4(),
          createdAt: Date.now(),
        },
      ],
    }));
  }, []);

  const updateAnnotation = useCallback((id: string, updates: Partial<Annotation>) => {
    setReadingState(prev => ({
      ...prev,
      annotations: prev.annotations.map(a =>
        a.id === id ? { ...a, ...updates } : a
      ),
    }));
  }, []);

  const deleteAnnotation = useCallback((id: string) => {
    setReadingState(prev => ({
      ...prev,
      annotations: prev.annotations.filter(a => a.id !== id),
    }));
  }, []);

  const addBookmark = useCallback((bookmark: Omit<Bookmark, 'id' | 'createdAt'>) => {
    setReadingState(prev => ({
      ...prev,
      bookmarks: [
        ...prev.bookmarks,
        {
          ...bookmark,
          id: uuidv4(),
          createdAt: Date.now(),
        },
      ],
    }));
  }, []);

  const deleteBookmark = useCallback((id: string) => {
    setReadingState(prev => ({
      ...prev,
      bookmarks: prev.bookmarks.filter(b => b.id !== id),
    }));
  }, []);

  const setCurrentChapter = useCallback((chapterId: string) => {
    setReadingState(prev => ({
      ...prev,
      currentChapterId: chapterId,
    }));
  }, []);

  const setScrollPercentage = useCallback((percentage: number) => {
    setReadingState(prev => ({
      ...prev,
      scrollPercentage: Math.max(0, Math.min(100, percentage)),
    }));
  }, []);

  const jumpToAnnotation = useCallback((annotationId: string) => {
    setReadingState(prev => {
      const annotation = prev.annotations.find(a => a.id === annotationId);
      if (!annotation) return prev;
      return {
        ...prev,
        currentChapterId: annotation.chapterId,
      };
    });
  }, []);

  return (
    <ReaderContext.Provider
      value={{
        book,
        readingState,
        readerModule,
        parserModule,
        saveStatus,
        uploadBook,
        saveProgress,
        addAnnotation,
        updateAnnotation,
        deleteAnnotation,
        addBookmark,
        deleteBookmark,
        setCurrentChapter,
        setScrollPercentage,
        jumpToAnnotation,
      }}
    >
      {children}
    </ReaderContext.Provider>
  );
}

export function useReader() {
  const context = useContext(ReaderContext);
  if (context === undefined) {
    throw new Error('useReader must be used within a ReaderProvider');
  }
  return context;
}
