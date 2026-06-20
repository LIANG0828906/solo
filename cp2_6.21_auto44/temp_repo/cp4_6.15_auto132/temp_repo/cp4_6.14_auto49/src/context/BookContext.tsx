import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Book, Annotation } from '../types';

interface BookContextType {
  currentBook: Book | null;
  setCurrentBook: (book: Book | null) => void;
  currentChapter: number;
  setCurrentChapter: (chapter: number) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  annotations: Annotation[];
  addAnnotation: (annotation: Annotation) => void;
  deleteAnnotation: (id: string) => void;
  getAnnotationsByChapter: (chapterIndex: number) => Annotation[];
  blinkAnnotationId: string | null;
  setBlinkAnnotationId: (id: string | null) => void;
}

const BookContext = createContext<BookContextType | undefined>(undefined);

export const useBook = () => {
  const context = useContext(BookContext);
  if (!context) {
    throw new Error('useBook must be used within a BookProvider');
  }
  return context;
};

const ANNOTATIONS_STORAGE_PREFIX = 'book-annotations-';

export const BookProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentBook, setCurrentBookState] = useState<Book | null>(null);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [blinkAnnotationId, setBlinkAnnotationId] = useState<string | null>(null);

  useEffect(() => {
    if (currentBook) {
      const storageKey = ANNOTATIONS_STORAGE_PREFIX + currentBook.id;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          setAnnotations(JSON.parse(saved));
        } catch {
          setAnnotations([]);
        }
      } else {
        setAnnotations([]);
      }
    }
  }, [currentBook?.id]);

  useEffect(() => {
    if (currentBook) {
      const storageKey = ANNOTATIONS_STORAGE_PREFIX + currentBook.id;
      localStorage.setItem(storageKey, JSON.stringify(annotations));
    }
  }, [annotations, currentBook?.id]);

  const setCurrentBook = (book: Book | null) => {
    setCurrentBookState(book);
    setCurrentChapter(0);
    setCurrentPage(1);
  };

  const addAnnotation = (annotation: Annotation) => {
    setAnnotations((prev) => [...prev, annotation]);
  };

  const deleteAnnotation = (id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  };

  const getAnnotationsByChapter = (chapterIndex: number) => {
    return annotations.filter((a) => a.chapterIndex === chapterIndex);
  };

  return (
    <BookContext.Provider
      value={{
        currentBook,
        setCurrentBook,
        currentChapter,
        setCurrentChapter,
        currentPage,
        setCurrentPage,
        annotations,
        addAnnotation,
        deleteAnnotation,
        getAnnotationsByChapter,
        blinkAnnotationId,
        setBlinkAnnotationId,
      }}
    >
      {children}
    </BookContext.Provider>
  );
};
