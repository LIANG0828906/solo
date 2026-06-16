import { useState, useRef, useEffect, useCallback } from 'react';
import type { Card as CardType } from '../utils/types';
import { useStore } from '../store';
import './Card.css';

interface CardProps {
  card: CardType;
  scale: number;
}

export function Card({ card, scale }: CardProps) {
  const {
    moveCard,
    selectCard,
    selectedCardId,
    editingCardId,
    setEditingCard,
    updateCard,
    deleteCard,
    markCardAsNotNew,
  } = useStore();

  const [isDragging, setIsDragging] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, cardX: 0, cardY: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [editContent, setEditContent] = useState(card.content);
  const lastClickTimeRef = useRef(0);
  const moveThresholdRef = useRef(0);

  const isSelected = selectedCardId === card.id;
  const isEditing = editingCardId === card.id;
  const isNew = card.isNew;

  useEffect(() => {
    if (isNew) {
      const timer = setTimeout(() => {
        markCardAsNotNew(card.id);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isNew, card.id, markCardAsNotNew]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isEditing) return;
      e.stopPropagation();
      selectCard(card.id);

      const now = Date.now();
      const timeSinceLastClick = now - lastClickTimeRef.current;

      if (timeSinceLastClick < 300 && moveThresholdRef.current < 5) {
        setEditingCard(card.id);
        setEditContent(card.content);
        return;
      }

      lastClickTimeRef.current = now;
      moveThresholdRef.current = 0;

      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        cardX: card.x,
        cardY: card.y,
      };
    },
    [card.id, card.x, card.y, card.content, isEditing, selectCard, setEditingCard]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - dragStartRef.current.x) / scale;
      const dy = (e.clientY - dragStartRef.current.y) / scale;

      moveThresholdRef.current = Math.sqrt(dx * dx + dy * dy);

      const newX = dragStartRef.current.cardX + dx;
      const newY = dragStartRef.current.cardY + dy;

      moveCard(card.id, newX, newY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, card.id, scale, moveCard]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditContent(e.target.value);
  };

  const handleBlur = () => {
    if (editContent !== card.content) {
      updateCard(card.id, { content: editContent });
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 500);
    }
    setEditingCard(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditContent(card.content);
      setEditingCard(null);
    }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleBlur();
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteCard(card.id);
  };

  const renderContent = () => {
    if (isEditing && card.contentType === 'text') {
      return (
        <textarea
          ref={textareaRef}
          value={editContent}
          onChange={handleContentChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="card-edit-textarea"
          autoFocus
        />
      );
    }

    switch (card.contentType) {
      case 'text':
        return (
          <div className="card-text-content">
            {card.content || '空文本'}
          </div>
        );
      case 'image':
        return (
          <div className="card-image-content">
            <img src={card.content} alt="灵感图片" draggable={false} />
          </div>
        );
      case 'drawing':
        return (
          <div className="card-drawing-content">
            <img src={card.content} alt="手绘图" draggable={false} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={cardRef}
      className={`card ${isDragging ? 'card-dragging' : ''} ${
        isSelected ? 'card-selected' : ''
      } ${isEditing ? 'card-editing' : ''} ${isNew ? 'card-new' : ''} ${
        isPulsing ? 'card-pulse' : ''
      }`}
      style={{
        left: card.x,
        top: card.y,
        width: card.width,
        height: card.height,
        borderColor: card.color,
      }}
      onMouseDown={handleMouseDown}
    >
      {isNew && <div className="card-ripple" />}
      
      <div className="card-header" style={{ backgroundColor: card.color + '20' }}>
        <div className="card-type-dot" style={{ backgroundColor: card.color }} />
        <span className="card-type-label">
          {card.contentType === 'text' && '文字'}
          {card.contentType === 'image' && '图片'}
          {card.contentType === 'drawing' && '绘图'}
        </span>
        {isSelected && !isEditing && (
          <button className="card-delete-btn" onClick={handleDelete}>
            ×
          </button>
        )}
      </div>

      <div className="card-body">{renderContent()}</div>
    </div>
  );
}
