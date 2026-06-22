import React from 'react';
import type { Book } from '../types';

interface BookCardProps {
  book: Book;
  onClick?: () => void;
  matchRate?: number;
}

const BookCard: React.FC<BookCardProps> = ({ book, onClick, matchRate }) => {
  return (
    <div
      onClick={onClick}
      style={styles.card}
      className="book-card"
    >
      {book.cover && (
        <img src={book.cover} alt={book.title} style={styles.cover} />
      )}
      <div style={styles.content}>
        <h4 style={styles.title}>{book.title}</h4>
        <p style={styles.author}>{book.author}</p>
        {book.description && (
          <p style={styles.description}>{book.description}</p>
        )}
        {matchRate !== undefined && (
          <div style={styles.matchContainer}>
            <div style={styles.matchBar}>
              <div
                style={{
                  ...styles.matchFill,
                  width: `${matchRate}%`,
                }}
              />
            </div>
            <span style={styles.matchText}>匹配度 {matchRate}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  card: {
    display: 'flex',
    backgroundColor: '#fff9ed',
    borderRadius: '8px',
    padding: '12px',
    gap: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    border: '1px solid #e8dcc4',
    alignItems: 'center',
  } as React.CSSProperties,
  cover: {
    width: '60px',
    height: '85px',
    objectFit: 'cover' as const,
    borderRadius: '4px',
    flexShrink: 0,
    boxShadow: '2px 2px 6px rgba(0,0,0,0.1)',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    margin: '0 0 4px 0',
    fontSize: '15px',
    fontWeight: 600,
    color: '#3b2e1f',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  author: {
    margin: '0 0 4px 0',
    fontSize: '13px',
    color: '#8b5e3c',
  },
  description: {
    margin: '0',
    fontSize: '12px',
    color: '#6b5a42',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
    lineHeight: 1.5,
  },
  matchContainer: {
    marginTop: '8px',
  },
  matchBar: {
    height: '6px',
    backgroundColor: '#e8dcc4',
    borderRadius: '3px',
    overflow: 'hidden',
    marginBottom: '4px',
  },
  matchFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #d4a574, #8b5e3c)',
    borderRadius: '3px',
    transition: 'width 0.5s ease',
  },
  matchText: {
    fontSize: '11px',
    color: '#8b5e3c',
    fontWeight: 500,
  },
};

export default BookCard;
