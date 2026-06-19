import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Plus, Download, Menu, X } from 'lucide-react';
import type { Card } from '@/types';
import useBoardStore from '@/store/boardStore';
import { CardItem } from './CardItem';
import { TagSidebar } from './TagSidebar';
import { StickyNote } from './StickyNote';
import { TrashZone } from './TrashZone';
import { CardDetailModal } from './CardDetailModal';
import { useDragDrop } from '@/hooks/useDragDrop';

interface BoardViewProps {
  onOpenCapture: () => void;
  onOpenExport: () => void;
}

export function BoardView({ onOpenCapture, onOpenExport }: BoardViewProps) {
  const {
    cards,
    tags,
    notes,
    selectedTagId,
    selectedCardIds,
    isLoading,
    reorderCards,
    deleteCard,
    toggleCardSelection,
    clearSelection,
    addNote,
  } = useBoardStore();

  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [filterAnimationKey, setFilterAnimationKey] = useState(0);
  const boardRef = useRef<HTMLDivElement>(null);

  const filteredCards = useMemo(() => {
    let result = [...cards].sort((a, b) => a.order - b.order);
    
    if (selectedTagId) {
      const selectedTag = tags.find(t => t.id === selectedTagId);
      if (selectedTag) {
        result = result.filter(card => card.tags.includes(selectedTag.name));
      }
    }
    
    return result;
  }, [cards, tags, selectedTagId]);

  useEffect(() => {
    setFilterAnimationKey(prev => prev + 1);
  }, [selectedTagId]);

  const {
    dragState,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
  } = useDragDrop(filteredCards, reorderCards);

  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);

  const handleCardDragStart = (e: React.DragEvent, cardId: string) => {
    setDraggingCardId(cardId);
    handleDragStart(e, cardId);
  };

  const handleCardDragEnd = () => {
    setDraggingCardId(null);
    handleDragEnd();
  };

  const handleTrashDrop = useCallback(() => {
    if (draggingCardId) {
      deleteCard(draggingCardId);
      setDraggingCardId(null);
    }
  }, [draggingCardId, deleteCard]);

  const handleCardClick = (card: Card) => {
    setSelectedCard(card);
    setIsDetailOpen(true);
  };

  const handleCardSelect = (e: React.MouseEvent, card: Card) => {
    e.stopPropagation();
    const isMultiSelect = e.shiftKey;
    toggleCardSelection(card.id, isMultiSelect);
  };

  const handleBoardDoubleClick = (e: React.MouseEvent) => {
    if (e.target === boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - 100;
      const y = e.clientY - rect.top - 30;
      
      addNote({
        content: '',
        x: Math.max(0, x),
        y: Math.max(0, y),
        width: 200,
        height: 150,
        backgroundColor: '#FFF8C9',
      });
    }
  };

  const handleBoardClick = () => {
    if (selectedCardIds.length > 0) {
      clearSelection();
    }
  };

  const [columns, setColumns] = useState(4);

  useEffect(() => {
    const updateColumns = () => {
      setColumns(window.innerWidth <= 768 ? 2 : 4);
    };
    
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  const memoizedCards = useMemo(() => {
    return filteredCards.map((card, index) => (
      <CardItem
        key={`${card.id}-${filterAnimationKey}`}
        card={card}
        tags={tags}
        index={index}
        isDragging={dragState.dragItemId === card.id}
        isDragOver={dragState.dragOverIndex === index}
        onDragStart={handleCardDragStart}
        onDragEnd={handleCardDragEnd}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => handleCardClick(card)}
        onSelect={(e) => handleCardSelect(e, card)}
        animationDelay={Math.min(index * 30, 300)}
      />
    ));
  }, [filteredCards, tags, dragState, filterAnimationKey, handleCardDragStart, handleCardDragEnd, handleDragOver, handleDrop, handleCardClick, handleCardSelect]);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <span className="loading-text">加载中...</span>
      </div>
    );
  }

  return (
    <div className="board-layout">
      <div className="mobile-header">
        <button
          className="mobile-menu-btn"
          onClick={() => setIsMobileSidebarOpen(true)}
        >
          <Menu size={24} />
        </button>
        <h1 className="mobile-title">灵感看板</h1>
        <div className="mobile-header-spacer" />
      </div>
      
      <div className="board-container">
        <TagSidebar isMobile={false} />
        
        {isMobileSidebarOpen && (
          <>
            <div
              className="mobile-sidebar-overlay"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <TagSidebar
              isMobile={true}
              onClose={() => setIsMobileSidebarOpen(false)}
            />
          </>
        )}
        
        <main
          ref={boardRef}
          className="board-main"
          onClick={handleBoardClick}
          onDoubleClick={handleBoardDoubleClick}
        >
          <div className="board-header">
            <h1 className="board-title">
              {selectedTagId
                ? `标签: ${tags.find(t => t.id === selectedTagId)?.name}`
                : '全部灵感'}
            </h1>
            <div className="board-actions">
              {selectedCardIds.length > 0 && (
                <>
                  <span className="selected-count">
                    已选择 {selectedCardIds.length} 张
                  </span>
                  <button className="btn-primary" onClick={onOpenExport}>
                    <Download size={18} />
                    导出
                  </button>
                </>
              )}
            </div>
          </div>
          
          {filteredCards.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✨</div>
              <h2 className="empty-title">
                {selectedTagId ? '该标签下暂无素材' : '还没有采集任何素材'}
              </h2>
              <p className="empty-desc">
                点击右下角的 + 按钮开始采集你的灵感
              </p>
            </div>
          ) : (
            <div
              className="card-grid"
              style={{
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: '16px 12px',
              }}
            >
              {memoizedCards}
            </div>
          )}
          
          {notes.map((note) => (
            <StickyNote key={note.id} note={note} />
          ))}
          
          <TrashZone
            isDragging={dragState.isDragging}
            onDrop={handleTrashDrop}
          />
        </main>
      </div>
      
      <button className="fab-button" onClick={onOpenCapture}>
        <Plus size={28} />
      </button>
      
      <CardDetailModal
        card={selectedCard}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedCard(null);
        }}
      />
    </div>
  );
}
