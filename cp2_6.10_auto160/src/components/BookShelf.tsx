import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookStore } from '../store/useBookStore';
import { CATEGORY_NAMES, CategoryKey, Book } from '../types';

const CATEGORIES: CategoryKey[] = ['jing', 'shi', 'zi', 'ji'];
const BOOK_HEIGHT = 120;
const BOOK_GAP = 16;
const VISIBLE_BOOKS = 20;
const PADDING_TOP = 80;
const PADDING_BOTTOM = 40;

export default function BookShelf() {
  const { books, activeCategory, setActiveCategory, selectBook } = useBookStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [hoveredBookId, setHoveredBookId] = useState<string | null>(null);
  const velocityRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastScrollTimeRef = useRef(0);
  const lastScrollTopRef = useRef(0);

  const filteredBooks = useMemo(() => {
    return books.filter(book => book.category === activeCategory);
  }, [books, activeCategory]);

  const totalHeight = PADDING_TOP + filteredBooks.length * (BOOK_HEIGHT + BOOK_GAP) + PADDING_BOTTOM;

  const visibleStartIndex = Math.max(0, Math.floor((scrollTop - PADDING_TOP) / (BOOK_HEIGHT + BOOK_GAP)) - 2);
  const visibleEndIndex = Math.min(
    filteredBooks.length,
    visibleStartIndex + VISIBLE_BOOKS + 4
  );

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!scrollContainerRef.current) return;
    
    e.preventDefault();
    const delta = e.deltaY * 1.5;
    const container = scrollContainerRef.current;
    const maxScroll = container.scrollHeight - container.clientHeight;
    
    const newScrollTop = Math.max(0, Math.min(maxScroll, scrollTop + delta));
    setScrollTop(newScrollTop);
    
    const now = Date.now();
    const timeDelta = now - lastScrollTimeRef.current;
    if (timeDelta > 0) {
      velocityRef.current = delta / timeDelta;
    }
    lastScrollTimeRef.current = now;
    lastScrollTopRef.current = newScrollTop;
  }, [scrollTop]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTop = scrollTop;
  }, [scrollTop]);

  useEffect(() => {
    const handleWheelEnd = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      const container = scrollContainerRef.current;
      if (!container) return;

      const animate = () => {
        velocityRef.current *= 0.95;
        
        if (Math.abs(velocityRef.current) < 0.01) {
          velocityRef.current = 0;
          return;
        }

        const maxScroll = container.scrollHeight - container.clientHeight;
        const newScrollTop = Math.max(0, Math.min(maxScroll, scrollTop + velocityRef.current * 16));
        
        setScrollTop(newScrollTop);
        lastScrollTopRef.current = newScrollTop;
        
        animationFrameRef.current = requestAnimationFrame(animate);
      };

      if (Math.abs(velocityRef.current) > 0.1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    const timeoutId = setTimeout(handleWheelEnd, 100);
    return () => clearTimeout(timeoutId);
  }, [scrollTop]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleBookClick = (book: Book) => {
    selectBook(book.id);
  };

  const visibleBooks = filteredBooks.slice(visibleStartIndex, visibleEndIndex);

  return (
    <div 
      className="bookshelf-container"
      style={{
        width: '100%',
        height: '100%',
        background: `linear-gradient(180deg, 
          var(--color-wood-dark) 0%, 
          var(--color-wood) 3%, 
          var(--color-wood-light) 5%,
          var(--color-wood) 8%,
          var(--color-wood-dark) 10%,
          var(--color-wood) 15%,
          var(--color-wood) 100%)`,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{
        padding: '16px 20px',
        background: 'linear-gradient(180deg, var(--color-wood-dark) 0%, var(--color-wood) 100%)',
        borderBottom: '2px solid var(--color-wood-dark)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{
          fontFamily: 'var(--font-title)',
          fontSize: '24px',
          color: 'var(--color-paper)',
          textAlign: 'center',
          letterSpacing: '4px',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
          marginBottom: '12px'
        }}>
          金陵书坊
        </h1>
        <div style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'center'
        }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="ink-button"
              style={{
                padding: '6px 16px',
                fontSize: '13px',
                background: activeCategory === cat ? 'var(--color-ink)' : 'var(--color-paper)',
                color: activeCategory === cat ? 'var(--color-paper)' : 'var(--color-ink)',
                borderColor: activeCategory === cat ? 'var(--color-paper)' : 'var(--color-ink)'
              }}
            >
              {CATEGORY_NAMES[cat]}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        onWheel={handleWheel}
        style={{
          flex: 1,
          overflowY: 'hidden',
          position: 'relative'
        }}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          {visibleBooks.map((book, idx) => {
            const actualIndex = visibleStartIndex + idx;
            const top = PADDING_TOP + actualIndex * (BOOK_HEIGHT + BOOK_GAP);
            
            return (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, delay: idx * 0.02 }}
                style={{
                  position: 'absolute',
                  top,
                  left: 0,
                  right: 0,
                  height: BOOK_HEIGHT,
                  padding: '0 20px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <ShelfLine top={top - 8} />
                
                <motion.div
                  className="book-spine"
                  onClick={() => handleBookClick(book)}
                  onMouseEnter={() => setHoveredBookId(book.id)}
                  onMouseLeave={() => setHoveredBookId(null)}
                  whileHover={{ 
                    scale: 1.08, 
                    x: 10,
                    transition: { type: 'spring', stiffness: 400, damping: 15 }
                  }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    height: '100%',
                    width: '60px',
                    background: `linear-gradient(90deg, 
                      ${book.coverColor} 0%, 
                      ${adjustColor(book.coverColor, 20)} 15%, 
                      ${book.coverColor} 45%,
                      ${adjustColor(book.coverColor, -15)} 85%,
                      ${adjustColor(book.coverColor, -25)} 100%)`,
                    borderRadius: '3px 8px 8px 3px',
                    boxShadow: hoveredBookId === book.id 
                      ? '4px 4px 20px rgba(0,0,0,0.5), inset 0 0 10px rgba(255,255,255,0.1)'
                      : '2px 2px 8px rgba(0,0,0,0.4), inset 0 0 5px rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <div style={{
                    writingMode: 'vertical-rl',
                    textOrientation: 'upright',
                    fontFamily: 'var(--font-title)',
                    fontSize: '14px',
                    color: 'var(--color-paper)',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    letterSpacing: '2px',
                    fontWeight: 600,
                    padding: '8px 0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxHeight: '90px'
                  }}>
                    {book.title}
                  </div>
                  
                  <div style={{
                    position: 'absolute',
                    right: '4px',
                    top: '8px',
                    bottom: '8px',
                    width: '2px',
                    background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.3), transparent)'
                  }} />
                </motion.div>

                <AnimatePresence>
                  {hoveredBookId === book.id && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        marginLeft: '16px',
                        padding: '12px 16px',
                        background: 'var(--color-paper-light)',
                        border: 'var(--border-ink)',
                        borderRadius: '4px',
                        boxShadow: 'var(--shadow-book)',
                        minWidth: '180px',
                        zIndex: 10
                      }}
                    >
                      <h3 style={{
                        fontFamily: 'var(--font-title)',
                        fontSize: '16px',
                        color: 'var(--color-ink)',
                        marginBottom: '6px',
                        borderBottom: '1px solid var(--color-ink-light)',
                        paddingBottom: '4px'
                      }}>
                        {book.title}
                      </h3>
                      <p style={{
                        fontSize: '13px',
                        color: 'var(--color-ink-light)',
                        marginBottom: '4px'
                      }}>
                        {book.dynasty} · {book.author}
                      </p>
                      <p style={{
                        fontSize: '12px',
                        color: 'var(--color-vermilion)'
                      }}>
                        共 {book.pages.length} 页
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
          
          <ShelfLine top={PADDING_TOP - 8} />
          <ShelfLine top={totalHeight - PADDING_BOTTOM + BOOK_HEIGHT} />
        </div>
      </div>

      <div style={{
        padding: '12px',
        background: 'var(--color-wood-dark)',
        borderTop: '2px solid #2c1810',
        textAlign: 'center'
      }}>
        <p style={{
          color: 'var(--color-paper-dark)',
          fontSize: '12px',
          fontFamily: 'var(--font-title)',
          letterSpacing: '2px'
        }}>
          共 {filteredBooks.length} 部藏书
        </p>
      </div>
    </div>
  );
}

function ShelfLine({ top }: { top: number }) {
  return (
    <div style={{
      position: 'absolute',
      top,
      left: 0,
      right: 0,
      height: '10px',
      background: `linear-gradient(180deg, 
        var(--color-wood-dark) 0%, 
        var(--color-wood-light) 30%, 
        var(--color-wood) 60%,
        var(--color-wood-dark) 100%)`,
      boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
    }} />
  );
}

function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
  const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
  const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
  return `rgb(${r}, ${g}, ${b})`;
}
