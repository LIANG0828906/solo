import React, { memo } from 'react'
import { Book, getCoverColor, getStatusLabel } from '../stores/bookStore'

interface BookCardProps {
  book: Book
  onClick: () => void
  isBlinking?: boolean
  style?: React.CSSProperties
}

const BookCard: React.FC<BookCardProps> = memo(({ book, onClick, isBlinking, style }) => {
  const coverColor = getCoverColor(book.publishYear)
  const firstChar = book.title.charAt(0)
  const statusLabel = getStatusLabel(book.status)

  const statusColor = {
    available: '#4CAF50',
    borrowed: '#FF9800',
    exchanged: '#9E9E9E'
  }[book.status]

  return (
    <div
      onClick={onClick}
      style={{
        ...style,
        width: 260,
        background: '#FFFEF5',
        borderRadius: 8,
        padding: '16px 12px',
        cursor: 'pointer',
        position: 'relative',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out',
        borderLeft: '1px solid #D4C9A3',
        borderRight: '1px solid #D4C9A3',
        animation: isBlinking ? 'blinkCard 0.5s ease-in-out' : undefined,
        transformOrigin: 'center center'
      }}
      className="book-card"
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)'
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.125)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)'
      }}
    >
      <div
        style={{
          width: '100%',
          height: 180,
          borderRadius: 4,
          background: `linear-gradient(135deg, ${coverColor} 0%, ${coverColor}dd 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 8,
            bottom: 0,
            width: 2,
            background: 'rgba(0,0,0,0.15)'
          }}
        />
        <span
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: '#FFFEF5',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            fontFamily: "'Noto Serif SC', serif"
          }}
        >
          {firstChar}
        </span>
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            padding: '2px 8px',
            borderRadius: 10,
            fontSize: 11,
            color: '#fff',
            background: statusColor,
            fontWeight: 600
          }}
        >
          {statusLabel}
        </div>
      </div>

      <div style={{ padding: '0 4px' }}>
        <h3
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#3E2723',
            marginBottom: 4,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {book.title}
        </h3>
        <p
          style={{
            fontSize: 13,
            color: '#5D4037',
            marginBottom: 4,
            opacity: 0.8
          }}
        >
          {book.author} · {book.publishYear}
        </p>
        <p
          style={{
            fontSize: 12,
            color: '#5D4037',
            lineHeight: 1.5,
            opacity: 0.7,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {book.review}
        </p>
        {book.messages.length > 0 && (
          <div
            style={{
              marginTop: 8,
              fontSize: 11,
              color: '#8B4513',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <span>💬</span>
            <span>{book.messages.length} 条留言</span>
          </div>
        )}
      </div>
    </div>
  )
})

BookCard.displayName = 'BookCard'

export default BookCard
