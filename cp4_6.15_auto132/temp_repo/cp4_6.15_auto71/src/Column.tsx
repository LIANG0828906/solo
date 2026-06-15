import React, { useState, useRef, useEffect } from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
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
  const [showLongPressHint, setShowLongPressHint] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

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

  const visibleCardIds = column.cardIds.filter(id => !isCardFiltered(id));
  const filteredCardIds = column.cardIds.filter(id => isCardFiltered(id));
  const visibleCount = visibleCardIds.length;

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
      e.preventDefault();
      handleTitleSubmit();
    } else if (e.key === 'Escape') {
      setEditTitle(column.title);
      setIsEditing(false);
    }
  };

  const clearLongPressTimer = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const startLongPress = (e: React.MouseEvent | React.TouchEvent) => {
    if (isEditing) return;
    longPressTriggered.current = false;
    setShowLongPressHint(true);
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setShowLongPressHint(false);
      setIsEditing(true);
    }, 600);
  };

  const cancelLongPress = () => {
    clearLongPressTimer();
    if (showLongPressHint) {
      setShowLongPressHint(false);
    }
  };

  const handleTitleClick = (e: React.MouseEvent) => {
    if (longPressTriggered.current) {
      e.preventDefault();
      e.stopPropagation();
      longPressTriggered.current = false;
    }
  };

  const handleTitleDoubleClick = () => {
    if (!isEditing) {
      setIsEditing(true);
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
          className={`column-title-wrapper ${showLongPressHint ? 'long-press-active' : ''}`}
          onMouseDown={startLongPress}
          onMouseUp={cancelLongPress}
          onMouseLeave={cancelLongPress}
          onTouchStart={startLongPress}
          onTouchEnd={cancelLongPress}
          onTouchCancel={cancelLongPress}
          onClick={handleTitleClick}
          onDoubleClick={handleTitleDoubleClick}
          title="长按或双击编辑列名"
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
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <React.Fragment>
              <h3 className="column-title">{column.title}</h3>
              <span className="column-edit-hint">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z" />
                </svg>
              </span>
            </React.Fragment>
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
            {visibleCardIds.map((cardId, index) => {
              const card = cards[cardId];
              if (!card) return null;

              return (
                <Draggable
                  key={cardId}
                  draggableId={cardId}
                  index={index}
                >
                  {(dragProvided, dragSnapshot) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      {...dragProvided.dragHandleProps}
                      style={{
                        ...dragProvided.draggableProps.style,
                      }}
                    >
                      <Card
                        card={card}
                        index={index}
                        isFiltered={false}
                        isDragging={dragSnapshot.isDragging}
                        labelColors={card.labels.map(getCardLabelColor)}
                      />
                    </div>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
            {filteredCardIds.map((cardId, index) => {
              const card = cards[cardId];
              if (!card) return null;
              return (
                <Card
                  key={cardId}
                  card={card}
                  index={visibleCardIds.length + index}
                  isFiltered={true}
                  isDragging={false}
                  labelColors={card.labels.map(getCardLabelColor)}
                />
              );
            })}
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
