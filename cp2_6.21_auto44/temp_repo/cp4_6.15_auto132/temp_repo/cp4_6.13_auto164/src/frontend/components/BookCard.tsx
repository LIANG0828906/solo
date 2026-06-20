import React, { memo } from 'react';

export type BookStatus = 'want_to_read' | 'reading' | 'finished';

export interface Book {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  total_pages: number;
  current_page: number;
  status: BookStatus;
  created_at: string;
  updated_at: string;
}

interface BookCardProps {
  book: Book;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
  animationKey?: number;
}

const BookCard: React.FC<BookCardProps> = memo(({ book, onClick, onEdit, animationKey = 0 }) => {
  const [imgError, setImgError] = React.useState(false);
  const [fadeIn, setFadeIn] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setFadeIn(true), 20);
    return () => clearTimeout(t);
  }, [animationKey]);

  const progress = book.total_pages > 0
    ? Math.min(100, Math.round((book.current_page / book.total_pages) * 100))
    : 0;

  const coverStyle: React.CSSProperties = {
    width: 150,
    height: 220,
    margin: '20px auto 16px',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    background: '#f0f0f0',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  };

  const cardStyle: React.CSSProperties = {
    width: 280,
    height: 380,
    background: '#ffffff',
    borderRadius: 14,
    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
    padding: 4,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    opacity: fadeIn ? 1 : 0,
    transform: fadeIn ? 'translateY(0)' : 'translateY(10px)',
    transition: 'opacity 0.3s ease, transform 0.3s ease, box-shadow 0.2s ease',
    position: 'relative',
  };

  return (
    <div
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)'; }}
    >
      <div style={coverStyle}>
        {!imgError && book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            loading="lazy"
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            background: '#d5dbdb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#7f8c8d',
            fontSize: 13,
            fontWeight: 500,
            textAlign: 'center',
            padding: 10,
          }}>
            封面缺失
          </div>
        )}
      </div>

      <div style={{ padding: '0 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div
          title={book.title}
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#2c3e50',
            lineHeight: 1.3,
            marginBottom: 6,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {book.title}
        </div>
        <div
          title={book.author}
          style={{
            fontSize: 14,
            color: '#7f8c8d',
            marginBottom: 14,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {book.author}
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={{
            height: 8,
            width: '100%',
            background: '#ecf0f1',
            borderRadius: 4,
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #3498db, #2ecc71)',
              borderRadius: 4,
              transition: 'width 0.4s ease',
            }} />
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 6,
            marginBottom: 12,
          }}>
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#3498db',
            }}>
              {progress}%
            </span>
            <span style={{ fontSize: 12, color: '#95a5a6' }}>
              {book.current_page} / {book.total_pages}
            </span>
          </div>
        </div>

        <div style={{ marginTop: 'auto', marginBottom: 10 }}>
          <button
            onClick={onEdit}
            className="edit-btn"
            style={{
              width: '100%',
              padding: '9px 16px',
              borderRadius: 22,
              border: 'none',
              color: 'white',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
          >
            编辑
          </button>
        </div>
      </div>

      <style>{`
        .edit-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
        }
        .edit-btn:active {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
});

BookCard.displayName = 'BookCard';

export default BookCard;
