import React, { useState, useRef, useEffect } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import Card from './Card';
import { useBoard } from './App';
import type { Column as ColumnType } from './types';
import './Column.css';

interface ColumnProps {
  column: ColumnType;
  colIndex: number;
  onAddCard: () => void;
}

const Column: React.FC<ColumnProps> = ({ column, onAddCard }) => {
  const { cards, labels, updateColumnTitle, activeLabelId, searchQuery } = useBoard();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);
  const [isFlashing, setIsFlashing] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<number | null>(null);

  const isCardFiltered = (cardId: string) => {
    const card = cards[cardId];
    if (!card) return true;

    if (activeLabelId && !card.labels.includes(activeLabelId)) {
      return true;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !card.title.toLowerCase().includes(query) &&
        !card.description.toLowerCase().includes(query)
      ) {
        return true;
      }
    }

    return false;
  };

  const visibleCount = column.cardIds.filter(id => !isCardFiltered(id)).length;

  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditing]);

  const handleTitleSubmit = () => {
    if (editTitle.trim() && editTitle.trim() !== column.title) {
      updateColumnTitle(column.id, editTitle.trim());
      setIsFlashing(true);
      setTimeout(() => setIsFlashing(false), 500);
    } else {
      setEditTitle(column.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setEditTitle(column.title);
      setIsEditing(false);
    }
  };

  const handleMouseDown = () => {
    longPressTimer.current = window.setTimeout(() => {
      setIsEditing(true);
    }, 500);
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleMouseLeave = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchStart = () => {
    longPressTimer.current = window.setTimeout(() => {
      setIsEditing(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const getCardLabelColor = (labelId: string) => {
    const label = labels.find(l => l.id === labelId);
    return label?.color || '#6C63FF';
  };

  return (
    <div className={`column-wrapper ${isFlashing ? 'flashing' : ''}`}>
      <div className="column-header">
        <div
          className="column-title-wrapper"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {isEditing ? (
            <input
              ref={titleInputRef}
              type="text"
              className="column-title-input"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={handleKeyDown}
            />
          ) : (
            <h3 className="column-title">{column.title}</h3>
          )}
        </div>
        <div className="column-badge">{visibleCount}</div>
        <button
          className="add-card-btn"
          onClick={onAddCard}
          title="添加卡片"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`column-content ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
          >
            {column.cardIds.map((cardId, index) => {
              const card = cards[cardId];
              if (!card) return null;

              const filtered = isCardFiltered(cardId);

              return (
                <Card
                  key={cardId}
                  card={card}
                  index={index}
                  isFiltered={filtered}
                  labelColors={card.labels.map(getCardLabelColor)}
                />
              );
            })}
            {provided.placeholder}
            {visibleCount === 0 && (
              <div className="empty-column-hint">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 9h6M9 13h4M9 17h3" />
                </svg>
                <span>暂无卡片</span>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default Column;
