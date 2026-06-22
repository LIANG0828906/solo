import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFire, FaPuzzlePiece } from 'react-icons/fa';
import type { Book, Category } from '../types';
import { CATEGORY_COLORS } from '../types';

interface BookShelfProps {
  books: Book[];
  currentCategory: Category | '全部';
  onCategoryChange: (category: Category | '全部') => void;
  onBookClick: (bookId: string) => void;
  completedPuzzles: Record<string, boolean>;
}

const categories: (Category | '全部')[] = ['全部', '文学', '科学', '历史', '艺术', '哲学'];

const CATEGORY_BG_COLORS: Record<Category | '全部', string> = {
  全部: '#B8860B',
  文学: CATEGORY_COLORS['文学'],
  科学: CATEGORY_COLORS['科学'],
  历史: CATEGORY_COLORS['历史'],
  艺术: CATEGORY_COLORS['艺术'],
  哲学: CATEGORY_COLORS['哲学'],
};

const BookShelf = ({
  books,
  currentCategory,
  onCategoryChange,
  onBookClick,
  completedPuzzles,
}: BookShelfProps) => {
  const [visibleCount, setVisibleCount] = useState(15);
  const shelfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(15);
  }, [currentCategory]);

  useEffect(() => {
    const handleScroll = () => {
      if (!shelfRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = shelfRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        setVisibleCount((prev) => Math.min(prev + 5, books.length));
      }
    };

    const el = shelfRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (el) {
        el.removeEventListener('scroll', handleScroll);
      }
    };
  }, [books.length]);

  const visibleBooks = books.slice(0, visibleCount);

  const getCompletionColor = (completion: number) => {
    if (completion >= 100) return '#32CD32';
    if (completion >= 50) return '#9ACD32';
    return '#A9A9A9';
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#FDF5E6',
        padding: '24px 32px',
      }}
    >
      <header
        style={{
          textAlign: 'center',
          marginBottom: '32px',
        }}
      >
        <h1
          style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#333333',
            marginBottom: '8px',
            letterSpacing: '2px',
          }}
        >
          探案书架
        </h1>
        <p style={{ color: '#666', fontSize: '14px' }}>
          浏览图书，拼读书评碎片，留下你的阅读痕迹
        </p>
      </header>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '32px',
          flexWrap: 'wrap',
        }}
      >
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            style={{
              padding: '8px 20px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: currentCategory === cat ? '700' : '500',
              backgroundColor:
                currentCategory === cat ? CATEGORY_BG_COLORS[cat] : 'transparent',
              color: currentCategory === cat ? '#fff' : '#333',
              border:
                currentCategory === cat ? 'none' : `2px solid ${CATEGORY_BG_COLORS[cat]}`,
              transition: 'all 0.3s ease',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div
        ref={shelfRef}
        style={{
          maxHeight: 'calc(100vh - 240px)',
          overflowY: 'auto',
          padding: '0 16px',
        }}
      >
        <div
          style={{
            background:
              'repeating-linear-gradient(180deg, transparent 0px, transparent 240px, #DEB887 240px, #DEB887 248px)',
            paddingBottom: '20px',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCategory}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '24px 32px',
                padding: '20px 0',
              }}
            >
              {visibleBooks.map((book, index) => (
                <motion.div
                  key={book.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: (index % 5) * 0.05 }}
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    onClick={() => onBookClick(book.id)}
                    style={{
                      position: 'relative',
                      width: '140px',
                      height: '200px',
                      borderRadius: '4px',
                      border: `2px solid #D4AF37`,
                      backgroundColor: book.coverColor,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '16px 12px',
                      boxShadow: '2px 4px 8px rgba(0,0,0,0.1)',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '4px 8px 20px rgba(0,0,0,0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '2px 4px 8px rgba(0,0,0,0.1)';
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color: '#fff',
                          fontSize: '16px',
                          fontWeight: '700',
                          marginBottom: '8px',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                          lineHeight: '1.3',
                        }}
                      >
                        {book.title}
                      </div>
                      <div
                        style={{
                          color: 'rgba(255,255,255,0.85)',
                          fontSize: '12px',
                        }}
                      >
                        {book.author}
                      </div>
                    </div>

                    <div
                      style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        alignItems: 'flex-end',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          color: '#fff',
                        }}
                      >
                        <FaFire
                          style={{
                            background:
                              'linear-gradient(135deg, #FF4500, #FF8C00)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontSize: '12px',
                          }}
                        />
                        <span>{book.popularity}</span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          color: '#fff',
                        }}
                      >
                        <FaPuzzlePiece
                          style={{
                            color: getCompletionColor(book.puzzleCompletion),
                            fontSize: '12px',
                          }}
                        />
                        <span>{book.puzzleCompletion}%</span>
                      </div>
                    </div>

                    {completedPuzzles[book.id] && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: '#32CD32',
                          color: '#fff',
                          fontSize: '10px',
                          fontWeight: '600',
                        }}
                      >
                        已完成
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default BookShelf;
