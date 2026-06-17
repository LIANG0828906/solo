import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import type { Card as CardType } from '../types/card';
import { PRESET_COLORS, CARD_WIDTH } from '../types/card';
import { useDragAdoption } from '../engine/canvasEngine';
import { useCardStore } from '../data/cardStore';
import './Card.css';

interface CardProps {
  card: CardType;
  scale: number;
  otherCards: CardType[];
}

export const Card: React.FC<CardProps> = memo(function Card({
  card,
  scale,
  otherCards,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [editTitle, setEditTitle] = useState(card.title);
  const [editBody, setEditBody] = useState(card.body);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const updateCard = useCardStore((state) => state.updateCard);
  const setEditingCard = useCardStore((state) => state.setEditingCard);
  const editingCardId = useCardStore((state) => state.editingCardId);
  const updateCardPosition = useCardStore((state) => state.updateCardPosition);

  const { isDragging, currentPos, handleMouseDown } = useDragAdoption({
    cardId: card.id,
    initialX: card.x,
    initialY: card.y,
    scale,
    onPositionChange: (x, y) => {
      updateCardPosition(card.id, x, y);
    },
    otherCards,
    enableSnap: true,
  });

  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setEditingCard(card.id);
    setEditTitle(card.title);
    setEditBody(card.body);
  }, [card.id, card.title, card.body, setEditingCard]);

  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (editingCardId !== card.id && isEditing) {
      saveEdits();
    }
  }, [editingCardId, card.id, isEditing]);

  const saveEdits = useCallback(() => {
    if (editTitle.trim() || editBody.trim()) {
      updateCard(card.id, {
        title: editTitle.trim(),
        body: editBody.trim(),
      });
    }
    setIsEditing(false);
    setShowColorPicker(false);
  }, [card.id, editTitle, editBody, updateCard]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditTitle(e.target.value);
  };

  const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditBody(e.target.value);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      bodyTextareaRef.current?.focus();
    }
    if (e.key === 'Escape') {
      setEditTitle(card.title);
      setEditBody(card.body);
      setIsEditing(false);
    }
  };

  const handleBodyKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditTitle(card.title);
      setEditBody(card.body);
      setIsEditing(false);
    }
    if (e.key === 'Enter' && e.ctrlKey) {
      saveEdits();
    }
  };

  const handleColorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowColorPicker(!showColorPicker);
  };

  const handleColorSelect = (color: string) => {
    updateCard(card.id, { color });
    setShowColorPicker(false);
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (
      colorPickerRef.current &&
      !colorPickerRef.current.contains(e.target as Node)
    ) {
      setShowColorPicker(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleBlur = () => {
    setTimeout(() => {
      if (!document.activeElement?.closest('.card-edit-container')) {
        saveEdits();
      }
    }, 100);
  };

  const borderColor = card.color + '40';

  return (
    <div
      className={`card-wrapper ${isDragging ? 'dragging' : ''}`}
      style={{
        transform: `translate(${currentPos.x}px, ${currentPos.y}px)`,
        width: CARD_WIDTH,
        transition: isDragging ? 'none' : 'transform 0.1s ease',
        willChange: isDragging ? 'transform' : 'auto',
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      <div
        className="card-container"
        style={{
          borderColor,
        }}
      >
        <button
          className="card-color-tag"
          style={{ backgroundColor: card.color }}
          onClick={handleColorClick}
          aria-label="选择颜色标签"
        />

        {showColorPicker && (
          <div className="color-picker" ref={colorPickerRef}>
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                className={`color-option ${card.color === color ? 'active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => handleColorSelect(color)}
                aria-label={`选择颜色 ${color}`}
              />
            ))}
          </div>
        )}

        <div className="card-content card-edit-container">
          {isEditing ? (
            <>
              <input
                ref={titleInputRef}
                className="card-title-input"
                value={editTitle}
                onChange={handleTitleChange}
                onKeyDown={handleTitleKeyDown}
                onBlur={handleBlur}
                placeholder="输入标题..."
                maxLength={100}
              />
              <textarea
                ref={bodyTextareaRef}
                className="card-body-input"
                value={editBody}
                onChange={handleBodyChange}
                onKeyDown={handleBodyKeyDown}
                onBlur={handleBlur}
                placeholder="记录你的灵感..."
                maxLength={500}
              />
            </>
          ) : (
            <>
              <h3 className="card-title">{card.title || '无标题'}</h3>
              <p className="card-body">{card.body || '双击编辑...'}</p>
            </>
          )}
        </div>

        {card.keywords.length > 0 && (
          <div className="card-keywords">
            {card.keywords.slice(0, 3).map((keyword, idx) => (
              <span key={idx} className="keyword-tag">
                {keyword}
              </span>
            ))}
            {card.keywords.length > 3 && (
              <span className="keyword-tag">+{card.keywords.length - 3}</span>
            )}
          </div>
        )}

        <button
          className="card-color-picker-btn"
          style={{ backgroundColor: card.color }}
          onClick={handleColorClick}
          aria-label="更改卡片颜色"
        />
      </div>
    </div>
  );
});
