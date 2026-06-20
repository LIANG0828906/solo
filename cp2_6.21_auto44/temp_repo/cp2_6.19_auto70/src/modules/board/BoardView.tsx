import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Plus, Download, Menu } from 'lucide-react';
import type { Card } from '@/types';
import useBoardStore from '@/store/boardStore';
import { CardItem } from './CardItem';
import { TagSidebar } from './TagSidebar';
import { StickyNote } from './StickyNote';
import { TrashZone } from './TrashZone';
import { CardDetailModal } from './CardDetailModal';
import { InlineNoteEditor } from './InlineNoteEditor';
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
  const [activeNoteCardId, setActiveNoteCardId] = useState<string | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

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
    ghostPosition,
    startDrag,
  } = useDragDrop(gridRef, filteredCards, reorderCards);

  const handleTrashDrop = useCallback(() => {
    if (dragState.dragItemId) {
      deleteCard(dragState.dragItemId);
    }
  }, [dragState.dragItemId, deleteCard]);

  const handleCardClick = (card: Card) => {
    setSelectedCard(card);
    setIsDetailOpen(true);
  };

  const handleCardSelect = (e: React.MouseEvent, card: Card) => {
    e.stopPropagation();
    const isMultiSelect = e.shiftKey;
    toggleCardSelection(card.id, isMultiSelect);
  };

  const handleCreateNote = useCallback((cardId: string) => {
    setActiveNoteCardId(prev => prev === cardId ? null : cardId);
  }, []);

  const handleSaveInlineNote = useCallback((content: string) => {
    if (content.trim()) {
      addNote({
        content: content.trim(),
        x: 50,
        y: 50,
        width: 220,
        height: 160,
        backgroundColor: '#FFF8C9',
      });
    }
    setActiveNoteCardId(null);
  }, [addNote]);

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
    setActiveNoteCardId(null);
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

  const draggedCard = useMemo(() => {
    if (!dragState.dragItemId) return null;
    return filteredCards.find(c => c.id === dragState.dragItemId);
  }, [dragState.dragItemId, filteredCards]);

  const memoizedCards = useMemo(() => {
    return filteredCards.map((card, index) => {
      const isDragging = dragState.dragItemId === card.id;
      const isDragOver = dragState.dragOverIndex === index && !isDragging;
      const isShiftTarget = dragState.isDragging && !isDragging && (
        (dragState.dragStartIndex < dragState.dragOverIndex && index > dragState.dragStartIndex && index <= dragState.dragOverIndex) ||
        (dragState.dragStartIndex > dragState.dragOverIndex && index < dragState.dragStartIndex && index >= dragState.dragOverIndex)
      );

      return (
        <div key={`${card.id}-${filterAnimationKey}`} className="card-item-wrapper">
          <CardItem
            card={card}
            tags={tags}
            isDragging={isDragging}
            isDragOver={isDragOver}
            isShiftTarget={isShiftTarget}
            onStartDrag={startDrag}
            onClick={() => handleCardClick(card)}
            onSelect={(e) => handleCardSelect(e, card)}
            onCreateNote={handleCreateNote}
            animationDelay={Math.min(index * 30, 300)}
          />
          {activeNoteCardId === card.id && (
            <InlineNoteEditor
              onSave={handleSaveInlineNote}
              onCancel={() => setActiveNoteCardId(null)}
            />
          )}
        </div>
      );
    });
  }, [filteredCards, tags, dragState, filterAnimationKey, startDrag, handleCardClick, handleCardSelect, handleCreateNote, activeNoteCardId, handleSaveInlineNote]);

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
              ref={gridRef}
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
      
      {dragState.isDragging && draggedCard && (
        <div
          className="drag-ghost"
          style={{
            left: ghostPosition.x - dragState.ghostOffsetX,
            top: ghostPosition.y - dragState.ghostOffsetY,
            width: dragState.ghostWidth,
            height: dragState.ghostHeight,
          }}
        >
          <img
            src={draggedCard.thumbnailUrl}
            alt="拖拽预览"
            className="drag-ghost-image"
          />
          <div className="drag-ghost-label">
            {draggedCard.caption || '移动素材'}
          </div>
        </div>
      )}
      
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
