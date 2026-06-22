import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StarRating } from './StarRating';
import type { BookMark } from '@/types';
import './BookCard.css';

interface BookCardProps {
  book: BookMark;
  index?: number;
  onDelete: (id: string) => void;
}

const tagColors = ['blue', 'green', 'pink', 'orange', 'purple'];

export const BookCard: React.FC<BookCardProps> = ({ book, index = 0, onDelete }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/bookmark/${book.id}`);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(book.id);
  };

  const truncateTitle = (title: string) => {
    return title.length > 20 ? title.slice(0, 20) + '...' : title;
  };

  const truncateExcerpt = (excerpt: string) => {
    const lines = excerpt.split('\n');
    const firstTwoLines = lines.slice(0, 2).join(' ');
    return firstTwoLines.length > 100 ? firstTwoLines.slice(0, 100) + '...' : firstTwoLines;
  };

  const getTagColor = (tagIndex: number) => tagColors[tagIndex % tagColors.length];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div
      className="book-card"
      onClick={handleClick}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <button
        className="book-card__delete-btn"
        onClick={handleDeleteClick}
        aria-label="删除书摘"
        title="删除"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>

      <div className="book-card__header">
        <h3 className="book-card__title" title={book.title}>
          {truncateTitle(book.title)}
        </h3>
        <p className="book-card__author">{book.author}</p>
      </div>

      <p className="book-card__excerpt" title={book.excerpt}>
        {truncateExcerpt(book.excerpt)}
      </p>

      <div className="book-card__tags">
        {book.tags.map((tag, tagIndex) => (
          <span key={tag} className={`tag tag--${getTagColor(tagIndex)}`}>
            {tag}
          </span>
        ))}
      </div>

      <div className="book-card__footer">
        <StarRating rating={book.rating} size="sm" readOnly />
        <span className="book-card__date">{formatDate(book.createdAt)}</span>
      </div>
    </div>
  );
};
