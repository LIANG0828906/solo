
import React, { useState, useRef, useEffect } from 'react';
import type { Card } from '../types/card';
import { CARD_WIDTH, CARD_HEIGHT } from '../types/card';

interface CardItemProps {
  card: Card;
  isDragging: boolean;
  isTimeLineMode: boolean;
  isBeforeTimeLine: boolean;
  scale: number;
  onDragStart: (e: React.MouseEvent, card: Card) => void;
  onDoubleClick: (card: Card) => void;
  onDelete: (card: Card) => void;
  onPositionSave: (id: string, x: number, y: number) => void;
}

const CardItem: React.FC<CardItemProps> = ({
  card,
  isDragging,
  isTimeLineMode,
  isBeforeTimeLine,
  scale,
  onDragStart,
  onDoubleClick,
  onDelete,
  onPositionSave,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const prevPosRef = useRef({ x: card.x, y: card.y });

  useEffect(() => {
    const timer = setTimeout(() => setIsNew(false), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isDragging && (prevPosRef.current.x !== card.x || prevPosRef.current.y !== card.y)) {
      onPositionSave(card.id, card.x, card.y);
      prevPosRef.current = { x: card.x, y: card.y };
    }
  }, [isDragging, card.x, card.y, card.id, onPositionSave]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    setShowDeleteConfirm(false);
    setTimeout(() => {
      onDelete(card);
    }, 300);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isTimeLineMode && !isBeforeTimeLine) return;
    onDragStart(e, card);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTimeLineMode && !isBeforeTimeLine) return;
    onDoubleClick(card);
  };

  const opacity = isDeleting ? 0 : isNew ? 0 : (isTimeLineMode && !isBeforeTimeLine ? 0.3 : 1);
  const transform = isDeleting ? 'scale(0.5)' : isNew ? 'scale(0.8)' : (isDragging ? 'scale(1.02)' : 'scale(1)');
  const transition = isDeleting
    ? 'opacity 0.3s ease-out, transform 0.3s ease-out'
    : isNew
    ? 'opacity 0.3s ease-out, transform 0.3s ease-out'
    : isDragging
    ? 'none'
    : isTimeLineMode
    ? 'left 0.1s linear, top 0.1s linear'
    : 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';

  return (
    <div
      className="card-item"
      data-card-id={card.id}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      style={{
        position: 'absolute',
        left: card.x,
        top: card.y,
        width: CARD_WIDTH,
        minHeight: CARD_HEIGHT,
        backgroundColor: card.color,
        borderRadius: '16px',
        border: '2px solid #E2E8F0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        padding: '16px',
        cursor: isTimeLineMode && !isBeforeTimeLine ? 'not-allowed' : (isDragging ? 'grabbing' : 'grab'),
        opacity,
        transform,
        transition,
        boxSizing: 'border-box',
        userSelect: 'none',
        pointerEvents: isDeleting ? 'none' : 'auto',
        zIndex: isDragging ? 100 : 1,
        willChange: isTimeLineMode ? 'left, top' : 'auto',
      }}
    >
      <button
        onClick={handleDeleteClick}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: 'transparent',
          color: '#94A3B8',
          fontSize: '16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'color 0.2s, background-color 0.2s',
          padding: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#EF4444';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#94A3B8';
        }}
      >
        ×
      </button>

      {showDeleteConfirm && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: '30px',
            right: '8px',
            backgroundColor: '#1E293B',
            borderRadius: '8px',
            padding: '8px 12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: 10,
            whiteSpace: 'nowrap',
          }}
        >
          <p style={{
            color: '#F8FAFC',
            fontSize: '12px',
            margin: '0 0 8px 0',
            fontFamily: 'Inter, sans-serif',
          }}>
            确定删除此卡片？
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={handleCancelDelete}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                borderRadius: '4px',
                border: '1px solid #475569',
                backgroundColor: 'transparent',
                color: '#CBD5E1',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              取消
            </button>
            <button
              onClick={handleConfirmDelete}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              删除
            </button>
          </div>
        </div>
      )}

      <h3 style={{
        color: '#0F172A',
        fontSize: '16px',
        fontWeight: 600,
        margin: '0 24px 12px 0',
        fontFamily: 'Inter, sans-serif',
        wordBreak: 'break-word',
        lineHeight: 1.4,
      }}>
        {card.title}
      </h3>

      <p style={{
        color: '#475569',
        fontSize: '13px',
        margin: '0 0 12px 0',
        fontFamily: 'Inter, sans-serif',
        wordBreak: 'break-word',
        lineHeight: 1.5,
        maxHeight: '80px',
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 4,
        WebkitBoxOrient: 'vertical',
      }}>
        {card.content}
      </p>

      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '16px',
        right: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{
          color: '#94A3B8',
          fontSize: '11px',
          fontFamily: 'Inter, sans-serif',
        }}>
          创建 {formatDate(card.createdAt)}
        </span>
        {card.updatedAt !== card.createdAt && (
          <span style={{
            color: '#94A3B8',
            fontSize: '11px',
            fontFamily: 'Inter, sans-serif',
          }}>
            编辑 {formatDate(card.updatedAt)}
          </span>
        )}
      </div>
    </div>
  );
};

export default React.memo(CardItem);
