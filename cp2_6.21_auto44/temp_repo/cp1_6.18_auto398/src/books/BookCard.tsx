import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book } from '@/types';

interface BookCardProps {
  book: Book;
  index?: number;
  onClick?: (book: Book) => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, index = 0, onClick }) => {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const [errored, setErrored] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const fallbackCover = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop';

  useEffect(() => {
    if (!cardRef.current || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px', threshold: 0.05 }
    );
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const handleClick = () => {
    if (onClick) {
      onClick(book);
    } else {
      navigate(`/book/${book.id}`);
    }
  };

  const statusBadge = () => {
    if (!book.status) return null;
    const styles: Record<string, { bg: string; label: string }> = {
      reading: { bg: 'rgba(108, 99, 255, 0.9)', label: '在读' },
      finished: { bg: 'rgba(74, 222, 128, 0.9)', label: '已读' },
      wishlist: { bg: 'rgba(251, 191, 36, 0.9)', label: '想读' },
    };
    const cfg = styles[book.status];
    if (!cfg) return null;
    return (
      <span
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: cfg.bg,
          color: '#000',
          fontSize: 11,
          fontWeight: 600,
          padding: '3px 10px',
          borderRadius: 20,
          zIndex: 2,
          backdropFilter: 'blur(4px)',
        }}
      >
        {cfg.label}
      </span>
    );
  };

  const renderStars = () => {
    if (!book.rating) return null;
    const stars = '★'.repeat(book.rating) + '☆'.repeat(5 - book.rating);
    return (
      <div
        style={{
          position: 'absolute',
          top: 8,
          left: 8,
          color: '#FBBF24',
          fontSize: 14,
          letterSpacing: 1,
          zIndex: 2,
          textShadow: '0 1px 4px rgba(0,0,0,0.8)',
        }}
      >
        {stars}
      </div>
    );
  };

  return (
    <div
      ref={cardRef}
      onClick={handleClick}
      className="slide-up"
      style={{
        animationDelay: `${Math.min(index * 0.05, 0.5)}s`,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        perspective: '1000px',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 200,
          aspectRatio: '2/3',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: 'var(--shadow-book)',
          transition: 'all 0.3s ease',
          transform: 'translateZ(0)',
          background: '#FFFFFF10',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          el.style.transform = 'translateY(-8px) scale(1.02)';
          el.style.boxShadow = 'var(--shadow-book-hover)';
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.transform = 'translateY(0) scale(1)';
          el.style.boxShadow = 'var(--shadow-book)';
        }}
      >
        {renderStars()}
        {statusBadge()}

        {!loaded && !errored && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
              backgroundSize: '200% 100%',
              animation: 'skeletonShimmer 1.5s infinite',
            }}
          />
        )}

        {inView && !errored && (
          <img
            src={book.coverUrl || fallbackCover}
            alt={book.title}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: loaded ? 1 : 0,
              transition: 'opacity 0.5s ease',
            }}
          />
        )}

        {errored && (
          <img
            src={fallbackCover}
            alt={book.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.9,
            }}
          />
        )}

        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            background: 'linear-gradient(90deg, rgba(0,0,0,0.3), transparent)',
          }}
        />
      </div>

      <div style={{ width: '100%', maxWidth: 200, textAlign: 'left' }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text-primary)',
            lineHeight: 1.35,
            marginBottom: 4,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
          title={book.title}
        >
          {book.title}
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
          title={book.authors?.join(', ')}
        >
          {book.authors?.join(', ') || '未知作者'}
        </div>
        {(book.tags && book.tags.length > 0) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
            {book.tags.slice(0, 2).map((tag, i) => (
              <span
                key={i}
                style={{
                  fontSize: 10,
                  padding: '2px 8px',
                  background: 'var(--accent-light)',
                  color: '#B4AEFF',
                  borderRadius: 10,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookCard;
