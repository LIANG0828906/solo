import React from 'react';
import type { Book } from '../types';

interface BookCardProps {
  book: Book;
  onClick: () => void;
  index?: number;
}

export default function BookCard({ book, onClick, index = 0 }: BookCardProps) {
  const isAvailable = book.status === 'available' && book.availableCopies > 0;

  return (
    <div
      onClick={onClick}
      style={{
        width: '280px',
        backgroundColor: '#1E293B',
        borderRadius: '12px',
        padding: '16px',
        cursor: 'pointer',
        transition: 'transform 0.25s ease-out, box-shadow 0.25s ease-out',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        animation: `slideUp 0.4s ease-out ${index * 0.05}s both`,
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '#0F172A 0px 6px 12px';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div
        style={{
          width: '160px',
          height: '240px',
          alignSelf: 'center',
          backgroundColor: book.coverColor || '#334155',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            right: '10px',
            textAlign: 'center',
            fontSize: '10px',
            color: 'rgba(255, 255, 255, 0.5)',
            letterSpacing: '2px',
          }}
        >
          {book.category || 'BOOK'}
        </div>
        <svg
          width="56"
          height="56"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(255, 255, 255, 0.75)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '10px',
            right: '10px',
            textAlign: 'center',
            fontSize: '11px',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.85)',
            padding: '4px 8px',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {book.author}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#F8FAFC',
            lineHeight: 1.3,
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            minHeight: '46px',
          }}
        >
          {book.title}
        </h3>
        <p style={{ fontSize: '14px', color: '#94A3B8', margin: 0 }}>
          {book.author}
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 'auto',
          paddingTop: '4px',
        }}
      >
        <span
          style={{
            backgroundColor: isAvailable ? '#22C55E' : '#EF4444',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'white',
              display: 'inline-block',
            }}
          />
          {isAvailable ? '可借' : '已借出'}
        </span>
        <span
          style={{
            fontSize: '12px',
            color: '#64748B',
          }}
        >
          {book.availableCopies}/{book.totalCopies}本
        </span>
      </div>
    </div>
  );
}
