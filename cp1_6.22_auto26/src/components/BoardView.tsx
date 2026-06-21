import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { RecipeBoard, RecipeCard } from '../types';
import { CardFlip } from './CardFlip';
import { CardModal } from './CardModal';
import './BoardView.css';

interface BoardViewProps {
  board: RecipeBoard;
  cards: RecipeCard[];
  allBoards: RecipeBoard[];
  onBack: () => void;
  onUpdateBoard: (boardId: string, data: Partial<RecipeBoard>) => void;
  onCreateCard: (data: Omit<RecipeCard, 'id' | 'order' | 'boardId'>) => void;
  onUpdateCard: (cardId: string, data: Partial<RecipeCard>) => void;
  onDeleteCard: (cardId: string) => void;
  onMoveCard: (cardId: string, toBoardId: string, newIndex: number) => void;
}

export function BoardView({
  board,
  cards,
  allBoards,
  onBack,
  onUpdateBoard,
  onCreateCard,
  onUpdateCard,
  onDeleteCard,
  onMoveCard,
}: BoardViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState<RecipeCard | null>(null);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [newCardId, setNewCardId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [boardName, setBoardName] = useState(board.name);
  const [dragOverBoardId, setDragOverBoardId] = useState<string | null>(null);
  const [showBoardSelector, setShowBoardSelector] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setBoardName(board.name);
  }, [board.name]);

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  const filteredCards = cards.filter(
    (card) =>
      card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDragStart = useCallback((e: React.DragEvent, cardId: string) => {
    setDraggedCardId(cardId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', cardId);
    try {
      e.dataTransfer.setDragImage(e.currentTarget as HTMLElement, 20, 20);
    } catch (err) {
      // Ignore if setDragImage fails
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedCardId(null);
    setDragOverIndex(null);
    setDragOverBoardId(null);
    setShowBoardSelector(false);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (!draggedCardId) return;
      e.dataTransfer.dropEffect = 'move';

      const card = filteredCards[index];
      if (card && card.id !== draggedCardId) {
        setDragOverIndex(index);
      }
    },
    [draggedCardId, filteredCards]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      e.stopPropagation();

      if (!draggedCardId) return;

      const draggedCard = cards.find((c) => c.id === draggedCardId);
      if (!draggedCard || draggedCard.boardId !== board.id) {
        setDragOverIndex(null);
        return;
      }

      const currentIndex = cards.findIndex((c) => c.id === draggedCardId);
      if (currentIndex === dropIndex) {
        setDragOverIndex(null);
        return;
      }

      const newOrder = [...board.cardOrder];
      const [removed] = newOrder.splice(currentIndex, 1);
      newOrder.splice(dropIndex, 0, removed);

      onUpdateBoard(board.id, { cardOrder: newOrder });

      setDragOverIndex(null);
      setDraggedCardId(null);
    },
    [draggedCardId, cards, board, onUpdateBoard]
  );

  const handleBoardDragOver = (e: React.DragEvent, targetBoardId: string) => {
    e.preventDefault();
    if (draggedCardId && targetBoardId !== board.id) {
      setDragOverBoardId(targetBoardId);
    }
  };

  const handleBoardDrop = (e: React.DragEvent, targetBoardId: string) => {
    e.preventDefault();
    if (draggedCardId && targetBoardId !== board.id) {
      onMoveCard(draggedCardId, targetBoardId, 0);
    }
    setDragOverBoardId(null);
    setShowBoardSelector(false);
    setDraggedCardId(null);
  };

  const handleAddCard = (data: Omit<RecipeCard, 'id' | 'order' | 'boardId'>) => {
    onCreateCard(data);
    setTimeout(() => {
      setNewCardId(null);
    }, 600);
  };

  const handleEditCard = (card: RecipeCard) => {
    setEditingCard(card);
    setShowModal(true);
  };

  const handleModalSubmit = (data: Omit<RecipeCard, 'id' | 'order' | 'boardId'>) => {
    if (editingCard) {
      onUpdateCard(editingCard.id, data);
    } else {
      handleAddCard(data);
    }
    setEditingCard(null);
  };

  const handleNameDoubleClick = () => {
    setEditingName(true);
  };

  const handleNameSubmit = () => {
    if (boardName.trim() && boardName !== board.name) {
      onUpdateBoard(board.id, { name: boardName.trim() });
    } else {
      setBoardName(board.name);
    }
    setEditingName(false);
  };

  const displayCards = filteredCards;

  return (
    <div className="board-view-page">
      <div className="board-view-banner" style={{ background: board.gradient }}>
        <div className="banner-overlay" />
        <div className="board-view-header">
          <button className="back-btn" onClick={onBack}>
            ← 返回
          </button>
          <div className="board-view-title-wrap">
            {editingName ? (
              <input
                ref={nameInputRef}
                type="text"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                onBlur={handleNameSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNameSubmit();
                  if (e.key === 'Escape') {
                    setBoardName(board.name);
                    setEditingName(false);
                  }
                }}
                className="board-name-edit"
              />
            ) : (
              <h1 className="board-view-title" onDoubleClick={handleNameDoubleClick} title="双击编辑">
                {board.name}
              </h1>
            )}
            <p className="board-view-count">{cards.length} 个食谱卡片</p>
          </div>
          <div className="board-header-actions">
            <button
              className="add-card-btn"
              onClick={() => {
                setEditingCard(null);
                setShowModal(true);
              }}
            >
              <span className="add-icon">+</span>
              添加食谱
            </button>
          </div>
        </div>

        <div className="board-search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="搜索食谱名称或标签..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="board-search-input"
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery('')}>
              ✕
            </button>
          )}
        </div>
      </div>

      {draggedCardId && (
        <div className="move-to-board-section">
          <span className="move-hint">拖到以下画板移动：</span>
          <div className="board-quick-list">
            {allBoards
              .filter((b) => b.id !== board.id)
              .map((b) => (
                <div
                  key={b.id}
                  className={`board-quick-item ${dragOverBoardId === b.id ? 'drag-highlight' : ''}`}
                  onDragOver={(e) => handleBoardDragOver(e, b.id)}
                  onDragLeave={() => setDragOverBoardId(null)}
                  onDrop={(e) => handleBoardDrop(e, b.id)}
                  onClick={() => onMoveCard(draggedCardId, b.id, 0)}
                >
                  <div className="board-quick-banner" style={{ background: b.gradient }} />
                  <span className="board-quick-name">{b.name}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="cards-container" ref={gridRef}>
        {displayCards.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🍽️</div>
            <h3 className="empty-title">
              {searchQuery ? '没有找到匹配的食谱' : '这个画板还是空的'}
            </h3>
            <p className="empty-desc">
              {searchQuery ? '试试其他关键词吧' : '点击上方按钮添加你的第一个食谱'}
            </p>
          </div>
        ) : (
          <div className="cards-grid">
            {displayCards.map((card, index) => (
              <div
                key={card.id}
                className={`card-wrapper ${dragOverIndex === index ? 'drag-over' : ''}`}
                style={{ transitionDelay: `${index * 0.03}s` }}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnter={(e) => handleDragOver(e, index)}
              >
                <CardFlip
                  card={card}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, card.id)}
                  onDragEnd={handleDragEnd}
                  isDragging={draggedCardId === card.id}
                  isNew={newCardId === card.id}
                  onEdit={() => handleEditCard(card)}
                  onDelete={() => onDeleteCard(card.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <CardModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingCard(null);
        }}
        onSubmit={handleModalSubmit}
        initialData={editingCard}
      />
    </div>
  );
}
