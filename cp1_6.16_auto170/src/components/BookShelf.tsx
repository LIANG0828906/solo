import React, { useCallback, useMemo } from 'react';
import { useStore } from '../stores/store';
import BookCard from '../components/BookCard';

const categoryOptions = [
  { value: 'all', label: '全部' },
  { value: 'fiction', label: '虚构' },
  { value: 'non-fiction', label: '非虚构' },
] as const;

const genreOptions = [
  { value: 'all', label: '全部' },
  { value: 'literature', label: '文学' },
  { value: 'social', label: '社科' },
  { value: 'art', label: '艺术' },
  { value: 'history', label: '历史' },
  { value: 'science', label: '科学' },
  { value: 'philosophy', label: '哲学' },
] as const;

const BookShelf: React.FC = () => {
  const filterCategory = useStore((state) => state.filterCategory);
  const filterGenre = useStore((state) => state.filterGenre);
  const setFilterCategory = useStore((state) => state.setFilterCategory);
  const setFilterGenre = useStore((state) => state.setFilterGenre);
  const getFilteredBooks = useStore((state) => state.getFilteredBooks);

  const filteredBooks = useMemo(() => getFilteredBooks(), [getFilteredBooks]);

  const handleCategoryClick = useCallback(
    (category: 'all' | 'fiction' | 'non-fiction') => {
      setFilterCategory(category);
    },
    [setFilterCategory]
  );

  const handleGenreClick = useCallback(
    (genre: string) => {
      setFilterGenre(genre);
    },
    [setFilterGenre]
  );

  return (
    <div className="bookshelf-container" style={styles.bookshelfContainer}>
      <div className="bookshelf-header" style={styles.bookshelfHeader}>
        <h2 style={styles.headerTitle}>📚 书库</h2>
      </div>

      <div className="filter-section" style={styles.filterSection}>
        <div className="filter-category-buttons" style={styles.filterCategoryButtons}>
          {categoryOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleCategoryClick(option.value)}
              style={{
                ...styles.categoryButton,
                ...(filterCategory === option.value
                  ? styles.categoryButtonActive
                  : {}),
              }}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="filter-genre-tags" style={styles.filterGenreTags}>
          {genreOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleGenreClick(option.value)}
              style={{
                ...styles.genreTag,
                ...(filterGenre === option.value ? styles.genreTagActive : {}),
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="books-list-container" style={styles.booksListContainer}>
        {filteredBooks.length > 0 ? (
          <div style={styles.bookGrid}>
            {filteredBooks.map((book) => (
              <BookCard key={book.id} book={book} source="shelf" />
            ))}
          </div>
        ) : (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>📖</span>
            <p style={styles.emptyText}>暂无符合条件的图书</p>
          </div>
        )}
      </div>

      <style>{`
        .books-list-container::-webkit-scrollbar {
          width: 6px;
        }
        .books-list-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .books-list-container::-webkit-scrollbar-thumb {
          background: #D4C4A8;
          border-radius: 3px;
        }
        .books-list-container::-webkit-scrollbar-thumb:hover {
          background: #B8A88A;
        }
      `}</style>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  bookshelfContainer: {
    width: '320px',
    height: '100%',
    backgroundColor: '#F8F4E8',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  bookshelfHeader: {
    padding: '20px 16px',
    borderBottom: '1px solid #E8E0D0',
    flexShrink: 0,
  },
  headerTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 600,
    color: '#2C2C2C',
  },
  filterSection: {
    padding: '16px',
    borderBottom: '1px solid #E8E0D0',
    flexShrink: 0,
  },
  filterCategoryButtons: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  },
  categoryButton: {
    flex: 1,
    padding: '8px 12px',
    fontSize: '14px',
    borderRadius: '6px',
    backgroundColor: '#FFFFFF',
    color: '#6B6B6B',
    border: '1px solid #E8E0D0',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  categoryButtonActive: {
    backgroundColor: '#36A2A2',
    color: '#FFFFFF',
    borderColor: '#36A2A2',
  },
  filterGenreTags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  genreTag: {
    padding: '4px 10px',
    fontSize: '12px',
    borderRadius: '12px',
    backgroundColor: '#FFFFFF',
    color: '#6B6B6B',
    border: '1px solid #E8E0D0',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  genreTagActive: {
    backgroundColor: '#9B72AA',
    color: '#FFFFFF',
    borderColor: '#9B72AA',
  },
  booksListContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
  },
  bookGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 16px',
    color: '#9B9B9B',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '12px',
    opacity: 0.5,
  },
  emptyText: {
    fontSize: '14px',
    color: '#6B6B6B',
    margin: 0,
  },
};

export default BookShelf;
