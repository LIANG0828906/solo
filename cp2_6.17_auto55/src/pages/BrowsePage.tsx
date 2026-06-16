import { useEffect, useMemo, useRef } from 'react';
import {
  useStore,
  computeFilteredBooks,
  computePaginatedBooks,
  computeTotalPages,
} from '../store';
import BookCard from '../components/BookCard';
import Pagination from '../components/Pagination';

const BrowsePage = () => {
  const {
    loadBooks,
    books,
    searchQuery,
    sortOrder,
    currentPage,
    pageSize,
    setSearchQuery,
    setSortOrder,
    setCurrentPage,
  } = useStore();

  const filteredBooks = useMemo(
    () => computeFilteredBooks(books, searchQuery, sortOrder),
    [books, searchQuery, sortOrder]
  );

  const paginatedBooks = useMemo(
    () => computePaginatedBooks(filteredBooks, currentPage, pageSize),
    [filteredBooks, currentPage, pageSize]
  );

  const totalPages = useMemo(
    () => computeTotalPages(filteredBooks, pageSize),
    [filteredBooks, pageSize]
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const handleSearchChange = (value: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 200);
  };

  return (
    <div className="page-container">
      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="搜索书名或作者..."
          defaultValue={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`sort-btn ${sortOrder === 'desc' ? 'sort-btn-active' : ''}`}
            onClick={() => setSortOrder('desc')}
          >
            评分从高到低
          </button>
          <button
            className={`sort-btn ${sortOrder === 'asc' ? 'sort-btn-active' : ''}`}
            onClick={() => setSortOrder('asc')}
          >
            评分从低到高
          </button>
        </div>
      </div>

      <div className="book-grid">
        {paginatedBooks.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>

      {paginatedBooks.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--color-text-gray)', padding: '40px 0' }}>
          没有找到相关书籍
        </p>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default BrowsePage;
