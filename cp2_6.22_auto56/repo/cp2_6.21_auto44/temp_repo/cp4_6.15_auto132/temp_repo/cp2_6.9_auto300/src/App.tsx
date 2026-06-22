import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { saveAs } from 'file-saver';
import type { Book, Category, BorrowRecord } from './types';
import { api } from './api';
import BookCard from './components/BookCard';
import BorrowForm from './components/BorrowForm';

const avatarColors = ['#8d6e63', '#a1887f', '#6d4c41', '#4e342e'];

const getAvatarColor = (name: string): string => {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return avatarColors[hash % avatarColors.length];
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};

const isToday = (timestamp: number): boolean => {
  const today = new Date();
  const recordDate = new Date(timestamp);
  return (
    today.getFullYear() === recordDate.getFullYear() &&
    today.getMonth() === recordDate.getMonth() &&
    today.getDate() === recordDate.getDate()
  );
};

const Sidebar: React.FC<{ records: BorrowRecord[] }> = ({ records }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <aside className={`sidebar ${expanded ? 'expanded' : ''}`}>
      <div className="mobile-header">
        <h2 className="sidebar-title">借阅史录</h2>
        <button
          className="menu-btn"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? '✕' : '☰'}
        </button>
      </div>
      <h2 className="sidebar-title" style={{ display: expanded ? 'none' : 'block' }}>借阅史录</h2>
      <div className="timeline">
        {records.length === 0 ? (
          <div style={{ color: '#a1887f', fontSize: '14px', textAlign: 'center' }}>
            暂无借阅记录
          </div>
        ) : (
          records.map((record) => (
            <div key={record.id} className="timeline-item">
              <div
                className={`timeline-dot ${isToday(record.timestamp) ? 'today' : ''}`}
              />
              <div
                className="reader-avatar"
                style={{ background: getAvatarColor(record.readerName) }}
              >
                {record.readerName.charAt(0)}
              </div>
              <div className="timeline-book">{record.bookTitle}</div>
              <div className="timeline-date">{formatDate(record.borrowDate)}</div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
};

const SearchDropdown: React.FC<{
  results: Book[];
  onSelect: (bookId: string) => void;
}> = ({ results, onSelect }) => {
  if (results.length === 0) return null;

  return (
    <div className="search-dropdown">
      {results.slice(0, 10).map((book) => (
        <div
          key={book.id}
          className="search-dropdown-item"
          onClick={() => onSelect(book.id)}
        >
          <div
            className="search-thumb"
            style={{ background: book.coverGradient }}
          />
          <div className="search-item-info">
            <div className="search-item-title">{book.title}</div>
            <div className="search-item-author">{book.author}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

const HomePage: React.FC<{
  books: Book[];
  records: BorrowRecord[];
  onBorrow: (
    bookId: string,
    readerName: string,
    borrowDate: string,
    returnDate: string
  ) => void;
  onExport: () => void;
}> = ({ books, records, onBorrow, onExport }) => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const categories = api.getCategories();

  const filteredBooks = useMemo(() => {
    let result = books;
    if (selectedCategory !== 'all') {
      result = result.filter((b) => b.category === selectedCategory);
    }
    return result;
  }, [books, selectedCategory]);

  const handleSearch = useCallback(
    async (keyword: string) => {
      setSearchKeyword(keyword);
      if (keyword.trim().length > 0) {
        const results = await api.searchBooks(keyword);
        setSearchResults(results);
        setShowDropdown(true);
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    },
    []
  );

  const handleSelectBook = (bookId: string) => {
    setShowDropdown(false);
    setSearchKeyword('');
    navigate(`/book/${bookId}`);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!showDropdown) return;
    }, 100);
    return () => clearTimeout(timer);
  }, [showDropdown]);

  return (
    <>
      <Sidebar records={records} />
      <main className="main-content">
        <header className="header">
          <h1 className="header-title">古韵藏书楼</h1>
          <div className="search-bar">
            <input
              type="text"
              className="search-input"
              placeholder="搜索书名或作者..."
              value={searchKeyword}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchKeyword && setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            />
            {showDropdown && (
              <SearchDropdown
                results={searchResults}
                onSelect={handleSelectBook}
              />
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="category-tabs">
              <div
                className={`category-tab ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedCategory('all')}
              >
                全部
              </div>
              {categories.map((cat) => (
                <div
                  key={cat.key}
                  className={`category-tab ${selectedCategory === cat.key ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.key)}
                >
                  {cat.label}
                </div>
              ))}
            </div>
            <button className="export-btn" onClick={onExport}>
              导出书目
            </button>
          </div>
        </header>
        <div className="books-grid">
          {filteredBooks.map((book, index) => (
            <BookCard
              key={book.id}
              book={book}
              index={index}
              onClick={() => navigate(`/book/${book.id}`)}
            />
          ))}
        </div>
        {filteredBooks.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              color: '#6d4c41',
              fontSize: '20px',
              marginTop: '40px',
            }}
          >
            该类暂无藏书
          </div>
        )}
      </main>
    </>
  );
};

const BookDetailPage: React.FC<{
  books: Book[];
  records: BorrowRecord[];
  onBorrow: (
    bookId: string,
    readerName: string,
    borrowDate: string,
    returnDate: string
  ) => void;
}> = ({ books, records, onBorrow }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const book = books.find((b) => b.id === id);

  if (!book) {
    return (
      <div className="app">
        <Sidebar records={records} />
        <main className="main-content">
          <div className="detail-page">
            <button className="back-btn" onClick={() => navigate('/')}>
              ← 返回藏书楼
            </button>
            <div style={{ textAlign: 'center', marginTop: '40px', fontSize: '24px' }}>
              该书不存在或已被移出藏书楼
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <Sidebar records={records} />
      <main className="main-content">
        <div className="detail-page">
          <button className="back-btn" onClick={() => navigate('/')}>
            ← 返回藏书楼
          </button>
          <div className="book-detail-header">
            <div
              className="book-detail-cover"
              style={{ background: book.coverGradient }}
            >
              <div
                style={{
                  writingMode: 'vertical-rl',
                  fontSize: '32px',
                  color: '#d4a373',
                  letterSpacing: '10px',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                }}
              >
                {book.title}
              </div>
            </div>
            <div className="book-detail-info">
              <h2 className="book-detail-title">{book.title}</h2>
              <p className="book-detail-author">{book.author} 著</p>
              <p className="book-detail-meta">
                <strong>分类：</strong>
                {book.category}部
              </p>
              <p className="book-detail-meta">
                <strong>版本：</strong>
                {book.edition}
              </p>
              <p className="book-detail-meta">
                <strong>册数：</strong>
                {book.volumeCount}册
              </p>
              <p className="book-detail-meta">
                <strong>状态：</strong>
                <span style={{ color: book.isBorrowed ? '#c62828' : '#2e7d32' }}>
                  {book.isBorrowed ? '已借出' : '在架可阅'}
                </span>
              </p>
            </div>
          </div>
          <div className="book-detail-description">
            <p style={{ marginBottom: '15px' }}>{book.description}</p>
            <p style={{ fontStyle: 'italic', color: '#6d4c41' }}>
              「{book.colophon}」
            </p>
          </div>
          <BorrowForm
            bookId={book.id}
            bookTitle={book.title}
            isBorrowed={book.isBorrowed}
            onSubmit={(readerName, borrowDate, returnDate) =>
              onBorrow(book.id, readerName, borrowDate, returnDate)
            }
          />
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initData = async () => {
      const [booksData, recordsData] = await Promise.all([
        api.getBooks(),
        api.getBorrowRecords(10),
      ]);
      setBooks(booksData);
      setRecords(recordsData);
      setLoading(false);
    };
    initData();
  }, []);

  const handleBorrow = useCallback(
    async (bookId: string, readerName: string, borrowDate: string, returnDate: string) => {
      const record = await api.borrowBook(bookId, readerName, borrowDate, returnDate);
      if (record) {
        const updatedBooks = await api.getBooks();
        const updatedRecords = await api.getBorrowRecords(10);
        setBooks(updatedBooks);
        setRecords(updatedRecords);
      }
    },
    []
  );

  const handleExport = useCallback(async () => {
    const csvContent = await api.exportBookList();
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `古韵藏书楼书目_${new Date().toLocaleDateString('zh-CN')}.csv`);
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '24px',
          color: '#5d4037',
        }}
      >
        藏书楼开启中...
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="app">
            <HomePage
              books={books}
              records={records}
              onBorrow={handleBorrow}
              onExport={handleExport}
            />
          </div>
        }
      />
      <Route
        path="/book/:id"
        element={
          <BookDetailPage books={books} records={records} onBorrow={handleBorrow} />
        }
      />
    </Routes>
  );
};

export default App;
