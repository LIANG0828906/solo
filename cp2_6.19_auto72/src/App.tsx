import { useMemo, useRef, useState, useEffect } from 'react';
import { useBookStore } from './store';
import Sidebar from './components/Sidebar';
import BookCard from './components/BookCard';
import BookDetail from './components/BookDetail';
import AddBookModal from './components/AddBookModal';
import { BookOpen } from 'lucide-react';

const VIRTUAL_THRESHOLD = 20;
const CARD_HEIGHT_ESTIMATE = 290;

export default function App() {
  const selectedBookId = useBookStore((s) => s.selectedBookId);
  const books = useBookStore((s) => s.books);
  const animationKey = useBookStore((s) => s.animationKey);
  const getFilteredBooks = useBookStore((s) => s.getFilteredBooks);
  const getWeeklyStats = useBookStore((s) => s.getWeeklyStats);
  const [showAddModal, setShowAddModal] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const filteredBooks = getFilteredBooks();
  const selectedBook = useMemo(
    () => books.find((b) => b.id === selectedBookId) || null,
    [books, selectedBookId]
  );
  const weeklyStats = getWeeklyStats();
  const useVirtualScroll = filteredBooks.length > VIRTUAL_THRESHOLD;

  useEffect(() => {
    const updateHeight = () => {
      if (scrollContainerRef.current) {
        setViewportHeight(scrollContainerRef.current.clientHeight);
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [selectedBookId]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const getVisibleRange = () => {
    if (!useVirtualScroll) return null;
    const startIdx = Math.max(0, Math.floor(scrollTop / CARD_HEIGHT_ESTIMATE) - 2);
    const visibleCount = Math.ceil(viewportHeight / CARD_HEIGHT_ESTIMATE) + 4;
    const endIdx = Math.min(filteredBooks.length, startIdx + visibleCount);
    return { startIdx, endIdx };
  };

  const visibleRange = getVisibleRange();

  const renderBooks = () => {
    const listToRender = visibleRange
      ? filteredBooks.slice(visibleRange.startIdx, visibleRange.endIdx)
      : filteredBooks;

    return listToRender.map((book, idx) => {
      const actualIdx = visibleRange ? visibleRange.startIdx + idx : idx;
      const delay = Math.min(actualIdx * 50, 300);
      const style: React.CSSProperties = useVirtualScroll
        ? { position: 'absolute', top: actualIdx * CARD_HEIGHT_ESTIMATE, left: 0, right: 0, padding: '0 10px' }
        : { animationDelay: `${delay}ms` };

      return (
        <div key={`${book.id}-${animationKey}`} style={style}>
          <BookCard book={book} />
        </div>
      );
    });
  };

  return (
    <div className="app">
      <Sidebar onAddBook={() => setShowAddModal(true)} />

      <div
        className="main-content"
        ref={scrollContainerRef}
        onScroll={handleScroll}
      >
        {selectedBook ? (
          <BookDetail book={selectedBook} weeklyStats={weeklyStats} />
        ) : (
          <>
            <div className="content-header">
              <div>
                <h1 className="content-title">我的书架</h1>
                <p className="content-subtitle">
                  共 {filteredBooks.length} 本书 · 坚持阅读，记录思考
                </p>
              </div>
            </div>

            {filteredBooks.length === 0 ? (
              <div className="empty-state">
                <BookOpen size={48} />
                <p className="empty-state-text">还没有书籍</p>
                <p className="empty-state-hint">点击左侧「添加书籍」开始记录你的阅读之旅</p>
              </div>
            ) : useVirtualScroll ? (
              <div
                className="virtual-scroll-inner"
                style={{ height: filteredBooks.length * CARD_HEIGHT_ESTIMATE }}
              >
                {renderBooks()}
              </div>
            ) : (
              <div className="books-grid" key={animationKey}>
                {renderBooks()}
              </div>
            )}
          </>
        )}
      </div>

      {showAddModal && <AddBookModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
