import React, { useState } from 'react';
import SearchBar from './components/SearchBar';
import BookDetail from './components/BookDetail';

interface Book {
  id: string;
  title: string;
  author: string;
  rating: number;
  ratingCount: number;
  coverColor: string;
}

const App: React.FC = () => {
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const handleSelectBook = (book: Book) => {
    setSelectedBook(book);
    setSelectedBookId(book.id);
  };

  const handleBack = () => {
    setSelectedBookId(null);
    setSelectedBook(null);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>书卷评论</h1>
      </header>
      <main style={styles.main}>
        <SearchBar onSelectBook={handleSelectBook} />
        {selectedBookId && selectedBook ? (
          <BookDetail
            bookId={selectedBookId}
            book={selectedBook}
            onBack={handleBack}
          />
        ) : (
          <div style={styles.placeholder}>
            <p style={styles.placeholderText}>搜索一本书籍开始探索</p>
          </div>
        )}
      </main>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#F5F0E8',
    color: '#3E2723',
    fontFamily: '"Noto Serif SC", "Georgia", serif',
  },
  header: {
    backgroundColor: '#3E2723',
    padding: '20px 0',
    textAlign: 'center' as const,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  title: {
    color: '#F5F0E8',
    fontSize: '32px',
    fontWeight: 700,
    margin: 0,
    letterSpacing: '4px',
  },
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px 16px',
  },
  placeholder: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
  },
  placeholderText: {
    fontSize: '20px',
    color: '#8B0000',
    opacity: 0.6,
  },
};

export default App;
