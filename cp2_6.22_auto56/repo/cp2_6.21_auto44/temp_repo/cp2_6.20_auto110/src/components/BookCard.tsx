import React from 'react';
import { Tag } from 'antd';
import type { Book, ReadingStatus } from '../types';

const statusConfig: Record<ReadingStatus, { label: string; color: string }> = {
  want: { label: '想读', color: '#faad14' },
  reading: { label: '在读', color: '#1890ff' },
  read: { label: '已读', color: '#52c41a' },
};

const BookCard: React.FC<{ book: Book }> = ({ book }) => {
  const progress =
    book.totalPages > 0
      ? Math.min(Math.round((book.currentPage / book.totalPages) * 100), 100)
      : 0;

  const handleClick = () => {
    window.location.hash = `#/book/${book.id}`;
  };

  const formattedDate = book.updatedAt
    ? new Date(book.updatedAt).toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
      })
    : '';

  return (
    <>
      <div
        className="book-card"
        onClick={handleClick}
        style={{
          background: '#fffdf8',
          borderRadius: 12,
          border: '1px solid rgba(106,153,78,0.12)',
          padding: 16,
          cursor: 'pointer',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          display: 'flex',
          gap: 14,
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            width: 120,
            minWidth: 120,
            height: 160,
            borderRadius: 6,
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #e8f5e1, #f0f7eb)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              style={{
                width: 120,
                height: 160,
                objectFit: 'cover',
                borderRadius: 6,
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.setAttribute(
                  'style',
                  'display:flex'
                );
              }}
            />
          ) : null}
          <span
            style={{
              display: book.coverUrl ? 'none' : 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              fontSize: 36,
              color: '#b5d99c',
            }}
          >
            📖
          </span>
        </div>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 600,
                color: '#2d4a1a',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '70%',
              }}
            >
              {book.title}
            </h3>
            <Tag
              color={statusConfig[book.status].color}
              style={{ margin: 0, borderRadius: 10, fontSize: 12 }}
            >
              {statusConfig[book.status].label}
            </Tag>
          </div>

          {book.author && (
            <div style={{ fontSize: 13, color: '#7a8a6e' }}>{book.author}</div>
          )}

          <div style={{ margin: '4px 0' }}>
            <div
              style={{
                height: 8,
                borderRadius: 4,
                background: '#e8f0e3',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '100%',
                  borderRadius: 4,
                  backgroundImage: 'linear-gradient(to right, #6a994e, #a7c957)',
                  transform: `scaleX(${progress / 100})`,
                  transformOrigin: 'left center',
                  transition: 'transform 0.3s ease',
                }}
              />
            </div>
            <div style={{ fontSize: 12, color: '#8a9a7e', marginTop: 2 }}>
              {progress}%
              {book.totalPages > 0 && (
                <span style={{ marginLeft: 6, color: '#aaa' }}>
                  {book.currentPage}/{book.totalPages}页
                </span>
              )}
            </div>
          </div>

          {book.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {book.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 11,
                    padding: '1px 8px',
                    borderRadius: 10,
                    background: 'rgba(106,153,78,0.1)',
                    color: '#6a994e',
                    border: '1px solid rgba(106,153,78,0.2)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {formattedDate && (
            <div style={{ fontSize: 11, color: '#bbb', marginTop: 'auto' }}>
              更新于 {formattedDate}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .book-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(106, 153, 78, 0.15);
        }
      `}</style>
    </>
  );
};

export default BookCard;
