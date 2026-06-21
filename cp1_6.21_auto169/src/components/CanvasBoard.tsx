
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useCardContext } from '../context/CardContext';
import CardItem from './CardItem';
import CardModal from './CardModal';
import type { Card } from '../types/card';
import { CARD_WIDTH, CARD_HEIGHT, CARD_GAP, CARDS_PER_ROW } from '../types/card';

const CanvasBoard: React.FC = () => {
  const {
    cards,
    timeLineMode,
    timeLineStamp,
    addCard,
    updateCardPosition,
    updateCardContent,
    deleteCard,
  } = useCardContext();

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggingCard, setDraggingCard] = useState<Card | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [createPosition, setCreatePosition] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const pendingPositionRef = useRef<{ x: number; y: number } | null>(null);

  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    return {
      x: (screenX - rect.left - offset.x) / scale,
      y: (screenY - rect.top - offset.y) / scale,
    };
  }, [offset, scale]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = -e.deltaY * 0.001;
    const newScale = Math.min(3, Math.max(0.5, scale * (1 + delta)));

    const scaleRatio = newScale / scale;
    const newOffsetX = mouseX - (mouseX - offset.x) * scaleRatio;
    const newOffsetY = mouseY - (mouseY - offset.y) * scaleRatio;

    setScale(newScale);
    setOffset({ x: newOffsetX, y: newOffsetY });
  }, [scale, offset]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    
    const target = e.target as HTMLElement;
    const cardElement = target.closest('.card-item');
    
    if (cardElement) return;

    setIsPanning(true);
    setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  }, [offset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => {
        setOffset({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
        rafRef.current = null;
      });
    }

    if (draggingCard) {
      const worldPos = screenToWorld(e.clientX, e.clientY);
      const newX = worldPos.x - dragOffset.x;
      const newY = worldPos.y - dragOffset.y;
      
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      pendingPositionRef.current = { x: newX, y: newY };
      rafRef.current = requestAnimationFrame(() => {
        if (pendingPositionRef.current) {
          updateCardPosition(draggingCard.id, pendingPositionRef.current.x, pendingPositionRef.current.y);
          pendingPositionRef.current = null;
        }
        rafRef.current = null;
      });
    }
  }, [isPanning, panStart, draggingCard, dragOffset, screenToWorld, updateCardPosition]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setDraggingCard(null);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (isPanning) return;
    
    const target = e.target as HTMLElement;
    const cardElement = target.closest('.card-item');
    if (cardElement) return;

    if (!timeLineMode) {
      const worldPos = screenToWorld(e.clientX, e.clientY);
      setCreatePosition(worldPos);
      setCreateModalOpen(true);
    }
  }, [isPanning, timeLineMode, screenToWorld]);

  const handleCardDragStart = useCallback((e: React.MouseEvent, card: Card) => {
    if (timeLineMode) return;
    e.stopPropagation();
    
    const worldPos = screenToWorld(e.clientX, e.clientY);
    setDragOffset({
      x: worldPos.x - card.x,
      y: worldPos.y - card.y,
    });
    setDraggingCard(card);
  }, [timeLineMode, screenToWorld]);

  const handleCardDoubleClick = useCallback((card: Card) => {
    if (timeLineMode) return;
    setEditingCard(card);
    setEditModalOpen(true);
  }, [timeLineMode]);

  const handleCardDelete = useCallback(async (card: Card) => {
    await deleteCard(card.id);
  }, [deleteCard]);

  const handlePositionSave = useCallback((id: string, x: number, y: number) => {
    if (timeLineMode) return;
    updateCardPosition(id, x, y);
  }, [timeLineMode, updateCardPosition]);

  const handleCreateConfirm = useCallback(async (data: { title: string; content: string; color: string }) => {
    await addCard({
      title: data.title,
      content: data.content,
      color: data.color,
      x: createPosition.x,
      y: createPosition.y,
    });
    setCreateModalOpen(false);
  }, [addCard, createPosition]);

  const handleEditConfirm = useCallback(async (data: { title: string; content: string; color: string }) => {
    if (!editingCard) return;
    await updateCardContent(editingCard.id, {
      title: data.title,
      content: data.content,
      color: data.color,
    });
    setEditModalOpen(false);
    setEditingCard(null);
  }, [editingCard, updateCardContent]);

  const getTimelinePosition = useCallback((card: Card, sortedCards: Card[]): { x: number; y: number } => {
    const index = sortedCards.findIndex(c => c.id === card.id);
    if (index === -1) return { x: card.x, y: card.y };
    
    const row = Math.floor(index / CARDS_PER_ROW);
    const col = index % CARDS_PER_ROW;
    
    const startX = 100;
    const startY = 100;
    
    return {
      x: startX + col * (CARD_WIDTH + CARD_GAP),
      y: startY + row * (CARD_HEIGHT + CARD_GAP),
    };
  }, []);

  const sortedCards = timeLineMode
    ? [...cards].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    : [];

  const getDisplayPosition = useCallback((card: Card): { x: number; y: number } => {
    if (timeLineMode) {
      return getTimelinePosition(card, sortedCards);
    }
    return { x: card.x, y: card.y };
  }, [timeLineMode, getTimelinePosition, sortedCards]);

  const isBeforeTimeLine = useCallback((card: Card): boolean => {
    if (!timeLineMode) return true;
    const cardTime = new Date(card.createdAt).getTime();
    return cardTime <= timeLineStamp;
  }, [timeLineMode, timeLineStamp]);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#0F172A',
          overflow: 'hidden',
          cursor: isPanning ? 'grabbing' : (timeLineMode ? 'default' : 'grab'),
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            willChange: 'transform',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundImage: `
                radial-gradient(circle, rgba(148, 163, 184, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: `${40 * scale}px ${40 * scale}px`,
              backgroundPosition: `${offset.x}px ${offset.y}px`,
              pointerEvents: 'none',
            }}
          />

          {cards.map((card) => {
            const displayPos = getDisplayPosition(card);
            const displayCard = { ...card, x: displayPos.x, y: displayPos.y };
            
            return (
              <CardItem
                key={card.id}
                card={displayCard}
                isDragging={draggingCard?.id === card.id}
                isTimeLineMode={timeLineMode}
                isBeforeTimeLine={isBeforeTimeLine(card)}
                scale={scale}
                onDragStart={handleCardDragStart}
                onDoubleClick={handleCardDoubleClick}
                onDelete={handleCardDelete}
                onPositionSave={handlePositionSave}
              />
            );
          })}
        </div>
      </div>

      <CardModal
        isOpen={createModalOpen}
        mode="create"
        onClose={() => setCreateModalOpen(false)}
        onConfirm={handleCreateConfirm}
      />

      <CardModal
        isOpen={editModalOpen}
        mode="edit"
        initialData={editingCard || undefined}
        onClose={() => {
          setEditModalOpen(false);
          setEditingCard(null);
        }}
        onConfirm={handleEditConfirm}
      />
    </>
  );
};

export default CanvasBoard;
