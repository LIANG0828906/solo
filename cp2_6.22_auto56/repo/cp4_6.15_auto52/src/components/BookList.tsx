import React, { useState, useMemo } from 'react';
import { useLibrary } from '@/context/LibraryContext';
import BookCard from './BookCard';
import BookForm from './BookForm';
import BatchImport from './BatchImport';

type FilterType = 'all' | 'want-to-read' | 'reading' | 'finished';

export default function BookList() {
  const { books, selectBook, searchBooks } = useLibrary();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBatchImport, setShowBatchImport] = useState(false);

  const filteredBooks = useMemo(() => {
    let result = searchQuery.trim() ? searchBooks(searchQuery) : books;
    if (filter !== 'all') {
      result = result.filter((b) => b.status === filter);
    }
    return result;
  }, [books, searchQuery, filter, searchBooks]);

  const wantToReadCount = books.filter((b) => b.status === 'want-to-read').length;

  return (
    <div className="book-list-page">
      <div className="book-list-toolbar">
        <div className="toolbar-left">
          <div className="filter-tabs">
            {([
              ['all', '全部'],
              ['want-to-read', '想读'],
              ['reading', '在读'],
              ['finished', '读完'],
            ] as [FilterType, string][]).map(([key, label]) => (
              <button
                key={key}
                className={`filter-tab ${filter === key ? 'active' : ''}`}
                onClick={() => setFilter(key)}
              >
                {label}
                <span className="tab-count">
                  {key === 'all'
                    ? books.length
                    : books.filter((b) => b.status === key).length}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-secondary" onClick={() => setShowBatchImport(true)}>
            批量导入
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
            + 添加藏书
          </button>
        </div>
      </div>
      {filteredBooks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <p>{searchQuery ? '没有找到匹配的书籍' : '书架空空如也，快去添加藏书吧'}</p>
        </div>
      ) : (
        <div className="book-grid">
          {filteredBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onClick={() => selectBook(book.id)}
              totalWantToRead={wantToReadCount}
            />
          ))}
        </div>
      )}
      {showAddForm && <BookForm onClose={() => setShowAddForm(false)} />}
      {showBatchImport && <BatchImport onClose={() => setShowBatchImport(false)} />}
    </div>
  );
}
