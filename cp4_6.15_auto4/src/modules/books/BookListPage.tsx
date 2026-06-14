import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getBooks, subscribe } from '../../shared/dataStore';
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState<Book[]>(getBooks);
  const [searchText, setSearchText] = useState('');
  const [category, setCategory] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const debouncedSearch = useDebounce(searchText, 300);

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setBooks(getBooks());
    });
    return unsubscribe;
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

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
      <nav className="navbar">
        <div className="navbar-brand">
          <Link to="/">二手书交换</Link>
        </div>
        <div className="navbar-links">
          <Link to="/" className="active">书籍列表</Link>
          <Link to="/exchange-history">
            交换记录
          </Link>
          <div className="nav-user">
            <span className="nav-user-nickname">{user?.nickname}</span>
            <button className="btn-logout" onClick={handleLogout}>登出</button>
          </div>
        </div>
        <button className="nav-hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? '✕' : '☰'}
        </button>
      </nav>

      <div className={`nav-mobile-menu ${menuOpen ? 'open' : ''}`}>
        <Link to="/" onClick={() => setMenuOpen(false)}>书籍列表</Link>
        <Link to="/exchange-history" onClick={() => setMenuOpen(false)}>交换记录</Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
          <span style={{ color: 'var(--color-mint)' }}>{user?.nickname}</span>
          <button className="btn-logout" onClick={handleLogout}>登出</button>
        </div>
      </div>

      <div className="page-container">
        <div className="filter-section">
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
