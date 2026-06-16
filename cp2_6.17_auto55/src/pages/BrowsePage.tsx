import { useEffect, useRef } from 'react';
import { useStore } from '../store';
import BookCard from '../components/BookCard';
import Pagination from '../components/Pagination';

const BrowsePage = () => {
  const {
    loadBooks,
    paginatedBooks,
    searchQuery,
    sortOrder,
    currentPage,
    totalPages,
    setSearchQuery,
    setSortOrder,
    setCurrentPage,
  } = useStore();

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

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
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
        <button
          className="sort-btn"
          onClick={toggleSortOrder}
          style={{ background: '#3498DB', color: 'white', borderRadius: '6px' }}
        >
          {sortOrder === 'desc' ? '评分从高到低' : '评分从低到高'}
        </button>
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
