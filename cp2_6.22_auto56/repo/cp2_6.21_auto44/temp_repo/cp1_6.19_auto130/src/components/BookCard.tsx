import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Book, statusColors } from '../data/books';

interface BookCardProps {
  book: Book;
  onClick: (book: Book) => void;
}

const BookCard: React.FC<BookCardProps> = memo(({ book, onClick }) => {
  return (
    <motion.div
      layout
      whileHover={{ y: -6, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onClick(book)}
      style={{
        width: 140,
        height: 200,
        borderRadius: 12,
        backgroundColor: statusColors[book.status],
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'background-color 0.3s ease'
      }}
    >
      <div
        style={{
          height: 130,
          width: '100%',
          background: `linear-gradient(135deg, ${book.coverColor}, ${book.coverColor2})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        <span
          style={{
            fontSize: 36,
            fontWeight: 'bold',
            color: 'rgba(255,255,255,0.95)',
            textShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}
        >
          {book.title.charAt(0)}
        </span>
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor:
              book.status === 'read'
                ? '#4CAF50'
                : book.status === 'reading'
                ? '#2196F3'
                : '#9E9E9E',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
          }}
        />
      </div>
      <div
        style={{
          flex: 1,
          padding: '10px 10px 12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#333',
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}
        >
          {book.title}
        </div>
        <div
          style={{
            fontSize: 11,
            color: '#666',
            marginTop: 4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {book.author}
        </div>
      </div>
    </motion.div>
  );
});

BookCard.displayName = 'BookCard';

export default BookCard;
