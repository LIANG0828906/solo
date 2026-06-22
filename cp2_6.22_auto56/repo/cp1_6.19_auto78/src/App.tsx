import { useState, useEffect, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import BookShelf from './components/BookShelf';
import ScrapPage from './components/ScrapPage';
import { generateBooks } from './data/mockData';
import type { Book, Annotation, Category } from './types';

const STORAGE_KEYS = {
  BOOKS: 'virtual_bookshelf_books',
  ANNOTATIONS: 'virtual_bookshelf_annotations',
  COMPLETED: 'virtual_bookshelf_completed',
};

const App = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [completedPuzzles, setCompletedPuzzles] = useState<Record<string, boolean>>({});
  const [currentCategory, setCurrentCategory] = useState<Category | '全部'>('全部');
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [isScrapPanelOpen, setIsScrapPanelOpen] = useState(false);

  useEffect(() => {
    try {
      const savedBooks = localStorage.getItem(STORAGE_KEYS.BOOKS);
      const savedAnnotations = localStorage.getItem(STORAGE_KEYS.ANNOTATIONS);
      const savedCompleted = localStorage.getItem(STORAGE_KEYS.COMPLETED);

      if (savedBooks) {
        setBooks(JSON.parse(savedBooks));
      } else {
        setBooks(generateBooks());
      }

      if (savedAnnotations) {
        setAnnotations(JSON.parse(savedAnnotations));
      }

      if (savedCompleted) {
        setCompletedPuzzles(JSON.parse(savedCompleted));
      }
    } catch {
      setBooks(generateBooks());
    }
  }, []);

  useEffect(() => {
    if (books.length > 0) {
      localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
    }
  }, [books]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ANNOTATIONS, JSON.stringify(annotations));
  }, [annotations]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COMPLETED, JSON.stringify(completedPuzzles));
  }, [completedPuzzles]);

  const handleBookClick = useCallback((bookId: string) => {
    setSelectedBookId(bookId);
    setIsScrapPanelOpen(true);
  }, []);

  const handleClosePanel = useCallback(() => {
    setIsScrapPanelOpen(false);
    setTimeout(() => setSelectedBookId(null), 300);
  }, []);

  const handleCategoryChange = useCallback((category: Category | '全部') => {
    setCurrentCategory(category);
  }, []);

  const handlePuzzleComplete = useCallback((bookId: string) => {
    setBooks((prev) =>
      prev.map((b) =>
        b.id === bookId
          ? {
              ...b,
              totalPuzzleAttempts: b.totalPuzzleAttempts + 1,
              puzzleCompletion: 100,
              popularity: b.popularity + 1,
            }
          : b
      )
    );
    setCompletedPuzzles((prev) => ({ ...prev, [bookId]: true }));
    toast.success('书评拼图完成！', { duration: 2000 });
  }, []);

  const handleAddAnnotation = useCallback(
    (bookId: string, sentenceIndex: number, content: string) => {
      const newAnnotation: Annotation = {
        id: `anno-${Date.now()}`,
        bookId,
        sentenceIndex,
        content,
        createdAt: Date.now(),
      };
      setAnnotations((prev) => [...prev, newAnnotation]);
      toast.success('批注已保存', { duration: 1500 });
    },
    []
  );

  const filteredBooks =
    currentCategory === '全部'
      ? books
      : books.filter((b) => b.category === currentCategory);

  const selectedBook = books.find((b) => b.id === selectedBookId) || null;
  const bookAnnotations = selectedBook
    ? annotations.filter((a) => a.bookId === selectedBook.id)
    : [];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FDF5E6' }}>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2000,
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '8px',
          },
        }}
      />
      <BookShelf
        books={filteredBooks}
        currentCategory={currentCategory}
        onCategoryChange={handleCategoryChange}
        onBookClick={handleBookClick}
        completedPuzzles={completedPuzzles}
      />
      <ScrapPage
        book={selectedBook}
        isOpen={isScrapPanelOpen}
        onClose={handleClosePanel}
        onPuzzleComplete={handlePuzzleComplete}
        annotations={bookAnnotations}
        onAddAnnotation={handleAddAnnotation}
        isCompleted={selectedBook ? completedPuzzles[selectedBook.id] : false}
      />
    </div>
  );
};

export default App;
