import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, BookOpen, History, ArrowLeftRight } from 'lucide-react';
import { apiService } from './apiService';
import type { Book, BorrowRecord } from './types';
import SearchBar from './components/SearchBar';
import BookCarousel from './components/BookCarousel';
import BookCard from './components/BookCard';
import HistoryModal from './components/HistoryModal';

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [historyModalBook, setHistoryModalBook] = useState<Book | null>(null);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiService.searchBooks('');
        setBooks(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载图书失败');
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  const handleBorrow = useCallback(async (bookId: string) => {
    const borrower = window.prompt('请输入借阅者姓名：', '社区读者');
    if (borrower === null) return;
    try {
      const updatedBook = await apiService.borrowBook(bookId, borrower);
      setBooks(prevBooks =>
        prevBooks.map(book => (book.id === bookId ? updatedBook : book))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : '借阅失败');
    }
  }, []);

  const handleReturn = useCallback(async (bookId: string) => {
    if (!window.confirm('确定要归还这本书吗？')) return;
    try {
      const updatedBook = await apiService.returnBook(bookId);
      setBooks(prevBooks =>
        prevBooks.map(book => (book.id === bookId ? updatedBook : book))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : '归还失败');
    }
  }, []);

  const handleViewHistory = useCallback((book: Book) => {
    setHistoryModalBook(book);
  }, []);

  const closeHistoryModal = useCallback(() => {
    setHistoryModalBook(null);
  }, []);

  const hotBooks = useMemo(() => {
    return [...books]
      .sort((a, b) => b.borrowCount - a.borrowCount)
      .slice(0, 5);
  }, [books]);

  const filteredBooks = useMemo(() => {
    if (!searchKeyword) return books;
    const keyword = searchKeyword.toLowerCase();
    return books.filter(
      book =>
        book.title.toLowerCase().includes(keyword) ||
        book.author.toLowerCase().includes(keyword)
    );
  }, [books, searchKeyword]);

  return (
    <div className="app-container">
      <SearchBar value={searchKeyword} onChange={setSearchKeyword} />

      <section className="carousel-section">
        <h2 className="carousel-title">热门推荐 · 借阅次数TOP5</h2>
        <BookCarousel
          books={hotBooks}
          onBorrow={handleBorrow}
          onReturn={handleReturn}
          onViewHistory={handleViewHistory}
        />
      </section>

      <section className="books-section">
        <h2 style={{ marginBottom: 20, fontSize: 22 }}>全部图书</h2>
        {loading ? (
          <div className="loading-text">加载中...</div>
        ) : error ? (
          <div className="error-text">{error}</div>
        ) : filteredBooks.length === 0 ? (
          <div className="no-results">没有找到匹配的图书</div>
        ) : (
          <div className="books-grid">
            {filteredBooks.map(book => (
              <BookCard
                key={book.id}
                book={book}
                onBorrow={handleBorrow}
                onReturn={handleReturn}
                onViewHistory={handleViewHistory}
              />
            ))}
          </div>
        )}
      </section>

      {historyModalBook && (
        <HistoryModal book={historyModalBook} onClose={closeHistoryModal} />
      )}
    </div>
  );
}
