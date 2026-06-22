import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import BookShelf from './components/BookShelf';
import BookEditor from './components/BookEditor';
import SocialFeed from './components/SocialFeed';
import { getBooks, Book } from './services/api';

function StatsPanel({ books }: { books: Book[] }) {
  const currentYear = new Date().getFullYear();

  const readThisYear = books.filter((book) => {
    if (!book.endDate) return false;
    const endYear = new Date(book.endDate).getFullYear();
    return endYear === currentYear;
  }).length;

  const totalPages = books.length * 300;

  const calculateStreak = (): number => {
    const endDates = books
      .filter((b) => b.endDate)
      .map((b) => new Date(b.endDate).toISOString().split('T')[0])
      .sort((a, b) => b.localeCompare(a));

    if (endDates.length === 0) return 0;

    const today = new Date().toISOString().split('T')[0];
    let streak = 0;
    let currentDate = today;

    for (let i = 0; i < 365; i++) {
      if (endDates.includes(currentDate)) {
        streak++;
      } else if (streak > 0) {
        break;
      }
      const prevDate = new Date(currentDate);
      prevDate.setDate(prevDate.getDate() - 1);
      currentDate = prevDate.toISOString().split('T')[0];
    }

    return streak;
  };

  const [displayCount, setDisplayCount] = useState(readThisYear);
  const [displayPages, setDisplayPages] = useState(totalPages);
  const [displayStreak, setDisplayStreak] = useState(calculateStreak());

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayCount(readThisYear);
      setDisplayPages(totalPages);
      setDisplayStreak(calculateStreak());
    }, 100);
    return () => clearTimeout(timer);
  }, [readThisYear, totalPages, books]);

  return (
    <div className="stats-panel">
      <div className="stat-item">
        <svg className="stat-icon" viewBox="0 0 32 32" fill="none">
          <path d="M6 4h18a2 2 0 012 2v20l-8-4-8 4V6a2 2 0 012-2z" stroke="#F97316" strokeWidth="2" fill="none"/>
          <path d="M6 6v18l8-4 8 4V6" stroke="#F97316" strokeWidth="2" fill="none"/>
        </svg>
        <div className="stat-content">
          <span className="stat-value" key={displayCount}>{displayCount}</span>
          <span className="stat-label">已读</span>
        </div>
      </div>

      <div className="stat-item">
        <svg className="stat-icon" viewBox="0 0 32 32" fill="none">
          <rect x="4" y="6" width="24" height="20" rx="2" stroke="#F97316" strokeWidth="2" fill="none"/>
          <path d="M8 12h16M8 16h16M8 20h10" stroke="#F97316" strokeWidth="2"/>
        </svg>
        <div className="stat-content">
          <span className="stat-value" key={displayPages}>{displayPages}</span>
          <span className="stat-label">累计阅读页数</span>
        </div>
      </div>

      <div className="stat-item">
        <svg className="stat-icon" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="12" stroke="#F97316" strokeWidth="2" fill="none"/>
          <path d="M16 8v8l5 3" stroke="#F97316" strokeWidth="2" strokeLinecap="round" fill="none"/>
        </svg>
        <div className="stat-content">
          <span className="stat-value" key={displayStreak}>{displayStreak}</span>
          <span className="stat-label">连续阅读天数</span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const data = await getBooks();
      setBooks(data);
      setFilteredBooks(data);
    } catch (error) {
      console.error('获取书籍列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query) {
      setFilteredBooks(books);
      return;
    }
    try {
      const data = await getBooks(query);
      setFilteredBooks(data);
    } catch (error) {
      console.error('搜索失败:', error);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleAddClick = () => {
    navigate('/add');
  };

  return (
    <div className="app-container">
      <StatsPanel books={books} />

      <button className="add-book-btn" onClick={handleAddClick} title="添加新书">
        +
      </button>

      <Routes>
        <Route
          path="/"
          element={
            <>
              {loading ? (
                <div style={{ color: '#94A3B8', textAlign: 'center', padding: '40px' }}>
                  书架加载中...
                </div>
              ) : (
                <BookShelf books={filteredBooks} onSearch={handleSearch} />
              )}
              <SocialFeed />
            </>
          }
        />
        <Route path="/add" element={<BookEditor onBookAdded={fetchBooks} />} />
        <Route
          path="/:userId"
          element={
            <>
              <div style={{ color: '#94A3B8', textAlign: 'center', padding: '40px' }}>
                好友书架功能开发中...
              </div>
              <SocialFeed />
            </>
          }
        />
      </Routes>
    </div>
  );
}
