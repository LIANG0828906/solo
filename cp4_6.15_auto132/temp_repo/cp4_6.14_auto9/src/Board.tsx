import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import Card from './Card';
import type { Board as BoardType, KanbanCard, Lane, CardMovePayload, CardAddPayload } from './types';
import { generateId } from './websocket';

interface BoardProps {
  board: BoardType;
  onCardAdd: (laneId: string, card: KanbanCard) => void;
  onCardMove: (fromLaneId: string, toLaneId: string, cardId: string, newIndex: number) => void;
  onLaneAdd: () => void;
  onLaneRemove: (laneId: string) => void;
  onLaneTitleUpdate: (laneId: string, title: string) => void;
  onCardDoubleClick: (card: KanbanCard) => void;
  moves: CardMovePayload[];
  cardAdds: CardAddPayload[];
  currentUserName: string;
  currentUserAvatar: string;
}

const MIN_LANES = 2;
const MAX_LANES = 6;

const preloadLaneImages = (lanes: Lane[]) => {
  lanes.forEach(lane => {
    lane.cards.forEach(card => {
      const img = new Image();
      img.src = card.lastEditorAvatar;
    });
  });
};

export const Board: React.FC<BoardProps> = ({
  board,
  onCardAdd,
  onCardMove,
  onLaneAdd,
  onLaneRemove,
  onLaneTitleUpdate,
  onCardDoubleClick,
  moves,
  cardAdds,
  currentUserName,
  currentUserAvatar
}) => {
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [dragOverLaneId, setDragOverLaneId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number>(-1);
  const [editingLaneId, setEditingLaneId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [justMovedCards, setJustMovedCards] = useState<Set<string>>(new Set());
  const [showAddCardLane, setShowAddCardLane] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const dragStartLaneRef = useRef<string | null>(null);
  const laneRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const boardRef = useRef<HTMLDivElement>(null);
  const newCardInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    preloadLaneImages(board.lanes);
  }, []);

  useEffect(() => {
    if (showAddCardLane && newCardInputRef.current) {
      setTimeout(() => newCardInputRef.current?.focus(), 50);
    }
  }, [showAddCardLane]);

  const handleMoveAnimation = useCallback((cardId: string) => {
    setJustMovedCards(prev => new Set(prev).add(cardId));
    setTimeout(() => {
      setJustMovedCards(prev => {
        const next = new Set(prev);
        next.delete(cardId);
        return next;
      });
    }, 600);
  }, []);

  useEffect(() => {
    if (moves.length > 0) {
      moves.forEach(move => {
        handleMoveAnimation(move.cardId);
      });
    }
  }, [moves, handleMoveAnimation]);

  useEffect(() => {
    if (cardAdds.length > 0) {
      cardAdds.forEach(add => {
        handleMoveAnimation(add.card.id);
      });
    }
  }, [cardAdds, handleMoveAnimation]);

  const handleDragStart = useCallback((e: React.DragEvent, cardId: string, laneId: string) => {
    setDraggingCardId(cardId);
    dragStartLaneRef.current = laneId;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingCardId(null);
    setDragOverLaneId(null);
    setDragOverIndex(-1);
    dragStartLaneRef.current = null;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, laneId: string) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }

    const laneEl = laneRefs.current.get(laneId);
    if (!laneEl || !draggingCardId) return;

    const cardsContainer = laneEl.querySelector('[data-cards-container]') as HTMLElement;
    if (!cardsContainer) return;

    const cardEls = Array.from(cardsContainer.querySelectorAll('[data-card-id]')) as HTMLElement[];
    const mouseY = e.clientY;

    let newIndex = cardEls.length;
    for (let i = 0; i < cardEls.length; i++) {
      const rect = cardEls[i].getBoundingClientRect();
      const cardMiddle = rect.top + rect.height / 2;
      if (mouseY < cardMiddle) {
        newIndex = i;
        break;
      }
    }

    if (dragOverLaneId !== laneId || dragOverIndex !== newIndex) {
      setDragOverLaneId(laneId);
      setDragOverIndex(newIndex);
    }
  }, [draggingCardId, dragOverLaneId, dragOverIndex]);

  const handleDragLeave = useCallback((e: React.DragEvent, laneId: string) => {
    const rect = laneRefs.current.get(laneId)?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX;
      const y = e.clientY;
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        if (dragOverLaneId === laneId) {
          setDragOverLaneId(null);
          setDragOverIndex(-1);
        }
      }
    }
  }, [dragOverLaneId]);

  const handleDrop = useCallback((e: React.DragEvent, toLaneId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const fromLaneId = dragStartLaneRef.current;
    if (!fromLaneId || !draggingCardId) return;

    const toLane = board.lanes.find(l => l.id === toLaneId);
    if (!toLane) return;

    let targetIndex = dragOverIndex;
    if (targetIndex < 0) {
      targetIndex = toLane.cards.length;
    }

    if (fromLaneId === toLaneId) {
      const fromLane = board.lanes.find(l => l.id === fromLaneId);
      if (fromLane) {
        const currentIndex = fromLane.cards.findIndex(c => c.id === draggingCardId);
        if (currentIndex !== -1 && currentIndex < targetIndex) {
          targetIndex = targetIndex - 1;
        }
      }
    }

    onCardMove(fromLaneId, toLaneId, draggingCardId, targetIndex);
    handleMoveAnimation(draggingCardId);

    setDraggingCardId(null);
    setDragOverLaneId(null);
    setDragOverIndex(-1);
    dragStartLaneRef.current = null;
  }, [draggingCardId, dragOverIndex, board.lanes, onCardMove, handleMoveAnimation]);

  const handleAddCard = useCallback((laneId: string) => {
    if (!newCardTitle.trim()) return;

    const newCard: KanbanCard = {
      id: generateId(),
      title: newCardTitle.trim(),
      description: '',
      assignee: currentUserName,
      priority: 'medium',
      dueDate: '',
      status: laneId,
      lastEditor: currentUserName,
      lastEditorAvatar: currentUserAvatar,
      lastEditTime: Date.now()
    };

    onCardAdd(laneId, newCard);
    handleMoveAnimation(newCard.id);
    setNewCardTitle('');
    setShowAddCardLane(null);
  }, [newCardTitle, currentUserName, currentUserAvatar, onCardAdd, handleMoveAnimation]);

  const handleQuickAddKeyDown = useCallback((e: React.KeyboardEvent, laneId: string) => {
    if (e.key === 'Enter') {
      handleAddCard(laneId);
    } else if (e.key === 'Escape') {
      setShowAddCardLane(null);
      setNewCardTitle('');
    }
  }, [handleAddCard]);

  const startEditingLane = useCallback((lane: Lane) => {
    setEditingLaneId(lane.id);
    setEditingTitle(lane.title);
  }, []);

  const finishEditingLane = useCallback((laneId: string) => {
    if (editingTitle.trim() && editingTitle.trim() !== board.lanes.find(l => l.id === laneId)?.title) {
      onLaneTitleUpdate(laneId, editingTitle.trim());
    }
    setEditingLaneId(null);
    setEditingTitle('');
  }, [editingTitle, board.lanes, onLaneTitleUpdate]);

  const canAddLane = board.lanes.length < MAX_LANES;
  const canRemoveLane = board.lanes.length > MIN_LANES;

  const renderCardsWithDropIndicators = useMemo(() => {
    return (lane: Lane) => {
      const cards = lane.cards;
      const result: React.ReactNode[] = [];
      const isDragOverThisLane = dragOverLaneId === lane.id;

      for (let i = 0; i <= cards.length; i++) {
        if (isDragOverThisLane && dragOverIndex === i) {
          result.push(
            <div
              key={`drop-${i}`}
              className="h-24 rounded-card border-2 border-dashed border-blue-400 bg-blue-50/50 my-2 transition-all duration-150"
              style={{ contain: 'layout' }}
            />
          );
        }

        if (i < cards.length) {
          const card = cards[i];
          const skipDrop = isDragOverThisLane && dragOverIndex === i && i === cards.length - 1;
          
          result.push(
            <div key={card.id} data-card-id={card.id} className="my-2">
              <Card
                card={card}
                laneId={lane.id}
                onDoubleClick={onCardDoubleClick}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                isDragging={draggingCardId === card.id}
                justMoved={justMovedCards.has(card.id)}
              />
            </div>
          );

          if (skipDrop) {
            result.push(
              <div
                key={`drop-end`}
                className="h-24 rounded-card border-2 border-dashed border-blue-400 bg-blue-50/50 my-2 transition-all duration-150"
                style={{ contain: 'layout' }}
              />
            );
          }
        }
      }

      if (cards.length === 0 && isDragOverThisLane) {
        result.push(
          <div
            key="drop-empty"
            className="h-24 rounded-card border-2 border-dashed border-blue-400 bg-blue-50/50 my-2 transition-all duration-150"
            style={{ contain: 'layout' }}
          />
        );
      }

      return result;
    };
  }, [dragOverLaneId, dragOverIndex, draggingCardId, justMovedCards, onCardDoubleClick, handleDragStart, handleDragEnd]);

  return (
    <div
      ref={boardRef}
      className="flex-1 overflow-x-auto overflow-y-hidden px-6 py-4"
    >
      <div className="flex items-start gap-5 h-full min-w-max">
        {board.lanes.map((lane) => (
          <div
            key={lane.id}
            ref={(el) => {
              if (el) laneRefs.current.set(lane.id, el);
              else laneRefs.current.delete(lane.id);
            }}
            className="flex-shrink-0 w-80 bg-board-bg rounded-xl shadow-card flex flex-col max-h-full"
            style={{
              contain: 'layout',
              willChange: 'transform'
            }}
            onDragOver={(e) => handleDragOver(e, lane.id)}
            onDragLeave={(e) => handleDragLeave(e, lane.id)}
            onDrop={(e) => handleDrop(e, lane.id)}
          >
            <div 
              className="px-4 py-3 border-b border-gray-100 rounded-t-xl"
              style={{
                backgroundImage: 'linear-gradient(to right, #f3f4f6, #ffffff)'
              }}
            >
              <div className="flex items-center justify-between gap-2">
                {editingLaneId === lane.id ? (
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={() => finishEditingLane(lane.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') finishEditingLane(lane.id);
                      if (e.key === 'Escape') {
                        setEditingLaneId(null);
                        setEditingTitle('');
                      }
                    }}
                    className="flex-1 px-2 py-1 text-sm font-semibold text-gray-800 bg-white border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                ) : (
                  <div 
                    className="flex-1 cursor-pointer"
                    onDoubleClick={() => startEditingLane(lane)}
                  >
                    <h3 className="text-sm font-semibold text-gray-800 leading-tight">
                      {lane.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {lane.cards.length} 张卡片
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => setShowAddCardLane(showAddCardLane === lane.id ? null : lane.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    title="添加卡片"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                  
                  {canRemoveLane && (
                    <button
                      onClick={() => onLaneRemove(lane.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      title="删除泳道"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div 
              data-cards-container
              className="flex-1 overflow-y-auto p-3 space-y-0"
              style={{
                contain: 'strict',
                maxHeight: 'calc(100vh - 280px)'
              }}
            >
              {renderCardsWithDropIndicators(lane)}
            </div>

            {showAddCardLane === lane.id && (
              <div className="px-3 pb-3">
                <div className="bg-gray-50 rounded-card p-2 border border-gray-200">
                  <input
                    ref={newCardInputRef}
                    type="text"
                    value={newCardTitle}
                    onChange={(e) => setNewCardTitle(e.target.value)}
                    onKeyDown={(e) => handleQuickAddKeyDown(e, lane.id)}
                    placeholder="输入卡片标题..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => handleAddCard(lane.id)}
                      disabled={!newCardTitle.trim()}
                      className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-500 rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      添加
                    </button>
                    <button
                      onClick={() => {
                        setShowAddCardLane(null);
                        setNewCardTitle('');
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!showAddCardLane && (
              <div className="px-3 pb-3">
                <button
                  onClick={() => setShowAddCardLane(lane.id)}
                  className="w-full py-2 px-3 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  添加卡片
                </button>
              </div>
            )}
          </div>
        ))}

        {canAddLane && (
          <button
            onClick={onLaneAdd}
            className="flex-shrink-0 w-80 h-32 bg-white/50 border-2 border-dashed border-gray-300 rounded-xl hover:bg-white hover:border-blue-400 transition-all flex flex-col items-center justify-center gap-2 group"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400 group-hover:text-blue-500 transition-colors">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="text-sm text-gray-400 group-hover:text-gray-600 transition-colors font-medium">
              添加泳道
            </span>
            <span className="text-xs text-gray-300">
              {board.lanes.length}/{MAX_LANES}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Board;
