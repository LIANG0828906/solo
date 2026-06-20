import React, { useState } from 'react';

export type BookStatus = 'available' | 'borrowed' | 'drifting';

export interface Book {
  id: string;
  title: string;
  author: string;
  cover?: string;
  status: BookStatus;
  driftCount?: number;
  averageRating?: number;
}

interface BookCardProps {
  book: Book;
  onClick: (book: Book) => void;
}

const statusConfig: Record<BookStatus, { label: string; color: string; bg: string }> = {
  available: { label: '在架', color: '#FFFFFF', bg: '#22C55E' },
  borrowed: { label: '已借出', color: '#FFFFFF', bg: '#F97316' },
  drifting: { label: '漂流中', color: '#FFFFFF', bg: '#3B82F6' },
};

const PLACEHOLDER_COVER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjRDdDM0I3Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NSIgc2hhZG93LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPueZu+WcqOWcsOW3peWbvuWxgjwvdGV4dD48L3N2Zz4=';

const BookCard: React.FC<BookCardProps> = ({ book, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const config = statusConfig[book.status];

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: 200,
    backgroundColor: '#F5E6D3',
    border: '2px solid #5D4037',
    borderRadius: 8,
    cursor: 'pointer',
    overflow: 'hidden',
    transform: hovered ? 'translate(-3px, -6px)' : 'translate(0, 0)',
    boxShadow: hovered
      ? '0 12px 24px rgba(93, 64, 55, 0.35)'
      : '0 2px 6px rgba(93, 64, 55, 0.15)',
    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
  };

  const coverWrapStyle: React.CSSProperties = {
    width: '100%',
    aspectRatio: '4 / 3',
    overflow: 'hidden',
    backgroundColor: '#D7C3B7',
  };

  const coverStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  };

  const contentStyle: React.CSSProperties = {
    padding: 12,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 15,
    fontWeight: 600,
    color: '#3E2723',
    margin: 0,
    marginBottom: 6,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const authorStyle: React.CSSProperties = {
    fontSize: 13,
    color: '#6D4C41',
    margin: 0,
    marginBottom: 10,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const statusRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const tagStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 10,
    fontSize: 12,
    fontWeight: 500,
    color: config.color,
    backgroundColor: config.bg,
  };

  const hoverInfoStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: '10px 12px',
    backgroundColor: 'rgba(93, 64, 55, 0.92)',
    color: '#FFF8E1',
    fontSize: 12,
    transform: hovered ? 'translateY(0)' : 'translateY(100%)',
    transition: 'transform 0.25s ease',
    display: 'flex',
    justifyContent: 'space-between',
    gap: 8,
  };

  return (
    <div
      style={containerStyle}
      onClick={() => onClick(book)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={coverWrapStyle}>
        <img
          src={book.cover || PLACEHOLDER_COVER}
          alt={book.title}
          style={coverStyle}
        />
      </div>
      <div style={contentStyle}>
        <h3 style={titleStyle} title={book.title}>{book.title}</h3>
        <p style={authorStyle} title={book.author}>{book.author}</p>
        <div style={statusRowStyle}>
          <span style={tagStyle}>{config.label}</span>
        </div>
      </div>
      <div style={hoverInfoStyle}>
        <span>漂流次数: {book.driftCount ?? 0}</span>
        <span>平均评分: {(book.averageRating ?? 0).toFixed(1)} ★</span>
      </div>
    </div>
  );
};

export default BookCard;
