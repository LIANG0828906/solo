import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBooks, subscribe } from '../../shared/dataStore';
import { addRipple } from '../../shared/utils';
import Navbar from '../../shared/Navbar';
import type { Book } from '../../shared/dataStore';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export default function BookListPage() {
  const [books, setBooks] = useState<Book[]>(getBooks);
  const [searchText, setSearchText] = useState('');
  const [category, setCategory] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);

  const debouncedSearch = useDebounce(searchText, 300);

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setBooks(getBooks());
    });
    return unsubscribe;
  }, []);

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesSearch =
        !debouncedSearch ||
        book.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        book.author.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesCategory = !category || book.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [books, debouncedSearch, category]);

  const getTagClass = (type: string) => {
    switch (type) {
      case '免费赠予': return 'tag-free';
      case '等价交换': return 'tag-equal';
      case '低价转让': return 'tag-low';
      default: return 'tag-equal';
    }
  };

  return (
    <>
      <Navbar />

      <div className="page-container">
        <div className="filter-header">
          <button
            className="filter-hamburger"
            onMouseDown={addRipple}
            onClick={() => setFilterOpen(!filterOpen)}
          >
            {filterOpen ? '✕ 筛选' : '☰ 筛选'}
          </button>
        </div>
        <div className={`filter-section ${filterOpen ? 'filter-open' : ''}`}>
          <input
            type="text"
            className="form-input"
            placeholder="搜索书名或作者..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">全部分类</option>
            <option value="小说">小说</option>
            <option value="科技">科技</option>
            <option value="教育">教育</option>
            <option value="生活">生活</option>
          </select>
        </div>

        {filteredBooks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📚</div>
            <div className="empty-state-text">没有找到匹配的书籍</div>
          </div>
        ) : (
          <div className="book-grid">
            {filteredBooks.map((book) => (
              <Link to={`/books/${book.id}`} key={book.id} style={{ textDecoration: 'none' }}>
                <div className="book-card">
                  <img className="book-card-cover" src={book.coverUrl} alt={book.title} />
                  <div className="book-card-body">
                    <div className="book-card-title">{book.title}</div>
                    <div className="book-card-author">{book.author}</div>
                    <div className="book-card-meta">
                      <span className="book-card-city">📍 {book.city}</span>
                      {book.status === '交换中' ? (
                        <span className="book-card-tag tag-exchanging">交换中</span>
                      ) : (
                        <span className={`book-card-tag ${getTagClass(book.exchangeType)}`}>
                          {book.exchangeType}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
