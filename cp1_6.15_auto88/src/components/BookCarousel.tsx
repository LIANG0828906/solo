import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Book } from '../types';

interface BookCarouselProps {
  books: Book[];
  onBorrow: (bookId: string) => void;
  onReturn: (bookId: string) => void;
  onViewHistory: (bookId: string) => void;
}

const VISIBLE_COUNT = 5;

export default function BookCarousel({ books, onBorrow, onReturn, onViewHistory }: BookCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const maxIndex = Math.max(books.length - VISIBLE_COUNT, 0);
  const showArrows = books.length > VISIBLE_COUNT;

  const prev = () => {
    setCurrentIndex((i) => (i <= 0 ? maxIndex : i - 1));
  };

  const next = () => {
    setCurrentIndex((i) => (i >= maxIndex ? 0 : i + 1));
  };

  const startAutoPlay = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = window.setInterval(() => {
      next();
    }, 4000);
  };

  useEffect(() => {
    if (showArrows) {
      startAutoPlay();
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [showArrows]);

  return (
    <div
      className="carousel-container"
      onMouseEnter={() => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }}
      onMouseLeave={() => {
        if (showArrows) {
          startAutoPlay();
        }
      }}
    >
      {showArrows && (
        <button className="carousel-arrow-btn carousel-arrow-left" onClick={prev}>
          <ChevronLeft size={20} />
        </button>
      )}
      <div
        className="carousel-track"
        style={{ transform: `translateX(-${currentIndex * (100 / VISIBLE_COUNT)}%)` }}
      >
        {books.map((book) => (
          <div className="carousel-slide" key={book.id}>
            <div className="carousel-card" onClick={() => onViewHistory(book.id)}>
              <img className="carousel-card-cover" src={book.cover} alt={book.title} />
              <h4 className="carousel-card-title">{book.title}</h4>
              <p className="carousel-card-author">{book.author}</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>
                借阅 {book.borrowCount} 次
              </p>
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                {book.status === 'available' ? (
                  <button
                    className="action-btn btn-borrow"
                    style={{ fontSize: 12, padding: '6px 10px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onBorrow(book.id);
                    }}
                  >
                    立即借阅
                  </button>
                ) : (
                  <button
                    className="action-btn btn-return"
                    style={{ fontSize: 12, padding: '6px 10px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onReturn(book.id);
                    }}
                  >
                    归还图书
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      {showArrows && (
        <button className="carousel-arrow-btn carousel-arrow-right" onClick={next}>
          <ChevronRight size={20} />
        </button>
      )}
    </div>
  );
}
