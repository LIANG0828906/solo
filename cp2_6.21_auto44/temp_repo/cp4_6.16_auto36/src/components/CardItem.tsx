import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Card } from '../types';
import { CARD_COLORS } from '../types';
import { useBoardStore } from '../store/boardStore';
import ContextMenu from './ContextMenu';

interface CardItemProps {
  card: Card;
  scale: number;
  onConnectionStart: (cardId: string, e: React.MouseEvent) => void;
}

const CardItem: React.FC<CardItemProps> = ({ card, scale, onConnectionStart }) => {
  const updateCardPosition = useBoardStore((s) => s.updateCardPosition);
  const updateCard = useBoardStore((s) => s.updateCard);
  const deleteCard = useBoardStore((s) => s.deleteCard);
  const copyCard = useBoardStore((s) => s.copyCard);
  const bringCardToTop = useBoardStore((s) => s.bringCardToTop);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(card.title);
  const [isDragging, setIsDragging] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isAppearing, setIsAppearing] = useState(true);

  const dragStart = useRef<{ mouseX: number; mouseY: number; cardX: number; cardY: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsAppearing(false), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setEditTitle(card.title);
  }, [card.title]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isEditing) return;
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    bringCardToTop(card.id);
    const startX = e.clientX;
    const startY = e.clientY;
    dragStart.current = { mouseX: startX, mouseY: startY, cardX: card.x, cardY: card.y };
    setIsDragging(true);

    const handleMouseMove = (ev: MouseEvent) => {
      if (!dragStart.current) return;
      const dx = (ev.clientX - dragStart.current.mouseX) / scale;
      const dy = (ev.clientY - dragStart.current.mouseY) / scale;
      updateCardPosition(card.id, dragStart.current.cardX + dx, dragStart.current.cardY + dy);
    };

    const handleMouseUp = () => {
      dragStart.current = null;
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [card.id, card.x, card.y, scale, isEditing, updateCardPosition, bringCardToTop]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditTitle(card.title);
  }, [card.title]);

  const handleEditConfirm = useCallback(() => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed.length <= 30) {
      updateCard(card.id, { title: trimmed });
    }
    setIsEditing(false);
  }, [editTitle, card.id, updateCard]);

  const handleEditKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleEditConfirm();
    if (e.key === 'Escape') setIsEditing(false);
  }, [handleEditConfirm]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  const handleConnectionDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onConnectionStart(card.id, e);
  }, [card.id, onConnectionStart]);

  const colorHex = CARD_COLORS[card.color]?.hex || '#FB7185';

  return (
    <>
      <div
        ref={cardRef}
        className={`card-item ${isEditing ? 'editing' : ''} ${isDragging ? 'dragging' : ''} ${isAppearing ? 'appearing' : ''}`}
        style={{
          left: card.x,
          top: card.y,
          zIndex: card.zIndex,
          backgroundColor: colorHex,
        }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      >
        <div className="card-emoji">{card.emoji}</div>
        {isEditing ? (
          <input
            className="card-edit-input"
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value.slice(0, 30))}
            onBlur={handleEditConfirm}
            onKeyDown={handleEditKeyDown}
            autoFocus
            onClick={(e) => e.stopPropagation()}
            maxLength={30}
          />
        ) : (
          <div className="card-title">{card.title}</div>
        )}
        <div
          className="card-connection-handle"
          onMouseDown={handleConnectionDragStart}
          title="拖拽创建连线"
        >
          ↕
        </div>
      </div>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onCopy={() => copyCard(card.id)}
          onDelete={() => deleteCard(card.id)}
          onBringToTop={() => bringCardToTop(card.id)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
};

export default CardItem;
