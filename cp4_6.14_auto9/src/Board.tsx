import React, { memo, useState, useRef, useCallback, useEffect } from 'react';
import type { Board, KanbanCard, Lane } from './types';
import { Card } from './Card';
import { Modal } from './Modal';
import { generateId } from './websocket';

interface BoardProps {
  board: Board;
  onBoardChange: (board: Board) => void;
  currentUser: { name: string; avatar: string };
  onCardAdd: (card: KanbanCard, laneId: string) => void;
  onCardUpdate: (card: KanbanCard, laneId: string) => void;
  onCardMove: (cardId: string, fromLaneId: string, toLaneId: string, newIndex: number) => void;
  onAddLane: (title: string) => void;
  onRemoveLane: (laneId: string) => void;
  onUpdateLaneTitle: (laneId: string, title: string) => void;
}

export const Board: React.FC<BoardProps> = memo(function Board({
  board,
  onBoardChange,
  currentUser,
  onCardAdd,
  onCardUpdate,
  onCardMove,
  onAddLane,
  onRemoveLane,
  onUpdateLaneTitle
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<KanbanCard | null>(null);
  const [defaultLaneStatus, setDefaultLaneStatus] = useState<string>('todo');
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [draggingFromLane, setDraggingFromLane] = useState<string | null>(null);
  const [dragOverLane, setDragOverLane] = useState<string | null>(null);
  const [dragOverCardId, setDragOverCardId] = useState<string | null>(null);
  const [justMovedCards, setJustMovedCards] = useState<Set<string>>(new Set());
  const [newLaneTitle, setNewLaneTitle] = useState('');
  const [showAddLane, setShowAddLane] = useState(false);
  const [editingLaneId, setEditingLaneId] = useState<string | null>(null);
  const [editingLaneTitleValue, setEditingLaneTitleValue] = useState('');
  const laneRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (board.lanes.length > 0 && board.lanes[0].id && defaultLaneStatus === 'todo') {
      setDefaultLaneStatus(board.lanes[0].id);
    }
  }, [board.lanes]);

  const markJustMoved = useCallback((cardId: string) => {
    setJustMovedCards((prev) => {
      const next = new Set(prev);
      next.add(cardId);
      return next;
    });
    setTimeout(() => {
      setJustMovedCards((prev) => {
        const next = new Set(prev);
        next.delete(cardId);
        return next;
      });
    }, 500);
  }, []);

  const handleDragStart = useCallback(
    (e: React.DragEvent, cardId: string, laneId: string) => {
      setDraggingCardId(cardId);
      setDraggingFromLane(laneId);
      e.dataTransfer.effectAllowed = 'move';
      try {
        e.dataTransfer.setData('text/plain', cardId);
      } catch {}
    },
    []
  );

  const handleDragEnd = useCallback(() => {
    setDraggingCardId(null);
    setDraggingFromLane(null);
    setDragOverLane(null);
    setDragOverCardId(null);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, laneId: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (dragOverLane !== laneId) {
        setDragOverLane(laneId);
      }
    },
    [dragOverLane]
  );

  const handleCardDragOver = useCallback(
    (_e: React.DragEvent, cardId: string, _laneId: string) => {
      if (dragOverCardId !== cardId) {
        setDragOverCardId(cardId);
      }
    },
    [dragOverCardId]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, targetLaneId: string, targetCardId?: string) => {
      e.preventDefault();
      e.stopPropagation();

      if (!draggingCardId || !draggingFromLane) {
        handleDragEnd();
        return;
      }

      if (draggingCardId === targetCardId) {
        handleDragEnd();
        return;
      }

      const targetLane = board.lanes.find((l) => l.id === targetLaneId);
      if (!targetLane) {
        handleDragEnd();
        return;
      }

      let newIndex = targetLane.cards.length;
      if (targetCardId) {
        const idx = targetLane.cards.findIndex((c) => c.id === targetCardId);
        if (idx !== -1) {
          newIndex = idx;
        }
      }

      onCardMove(draggingCardId, draggingFromLane, targetLaneId, newIndex);
      markJustMoved(draggingCardId);
      handleDragEnd();
    },
    [draggingCardId, draggingFromLane, board.lanes, onCardMove, markJustMoved, handleDragEnd]
  );

  const handleCardDrop = useCallback(
    (e: React.DragEvent, targetCardId: string, targetLaneId: string) => {
      handleDrop(e, targetLaneId, targetCardId);
    },
    [handleDrop]
  );

  const handleLaneDrop = useCallback(
    (e: React.DragEvent, laneId: string) => {
      handleDrop(e, laneId);
    },
    [handleDrop]
  );

  const handleDoubleClickCard = useCallback(
    (card: KanbanCard) => {
      setEditingCard(card);
      setModalOpen(true);
    },
    []
  );

  const handleAddCardClick = useCallback(
    (laneId: string) => {
      setEditingCard(null);
      setDefaultLaneStatus(laneId);
      setModalOpen(true);
    },
    []
  );

  const handleModalSave = useCallback(
    (card: KanbanCard) => {
      const isNew = !card.id;
      const finalCard: KanbanCard = {
        ...card,
        id: isNew ? generateId() : card.id,
        lastEditor: currentUser.name,
        lastEditorAvatar: currentUser.avatar,
        lastEditTime: Date.now()
      };

      const lane = board.lanes.find((l) => l.id === finalCard.status);
      const laneId = lane ? lane.id : (board.lanes[0]?.id ?? 'todo');
      finalCard.status = laneId;

      if (isNew) {
        onCardAdd(finalCard, laneId);
        markJustMoved(finalCard.id);
      } else {
        const currentLane = board.lanes.find((l) => l.cards.some((c) => c.id === finalCard.id));
        const curLaneId = currentLane?.id ?? laneId;
        onCardUpdate(finalCard, curLaneId);
      }

      setModalOpen(false);
      setEditingCard(null);
    },
    [board.lanes, currentUser, onCardAdd, onCardUpdate, markJustMoved]
  );

  const handleAddLane = useCallback(() => {
    const title = newLaneTitle.trim() || `泳道 ${board.lanes.length + 1}`;
    if (board.lanes.length < 6) {
      onAddLane(title);
    }
    setNewLaneTitle('');
    setShowAddLane(false);
  }, [board.lanes.length, newLaneTitle, onAddLane]);

  const handleRemoveLaneClick = useCallback(
    (laneId: string) => {
      if (board.lanes.length <= 2) return;
      const lane = board.lanes.find((l) => l.id === laneId);
      if (lane && lane.cards.length > 0) {
        if (!window.confirm(`泳道"${lane.title}"仍有 ${lane.cards.length} 张卡片，删除后卡片将一并移除，确定吗？`)) {
          return;
        }
      }
      onRemoveLane(laneId);
    },
    [board.lanes, onRemoveLane]
  );

  const handleLaneTitleDoubleClick = useCallback(
    (lane: Lane) => {
      setEditingLaneId(lane.id);
      setEditingLaneTitleValue(lane.title);
    },
    []
  );

  const handleLaneTitleBlur = useCallback(
    (laneId: string) => {
      const newTitle = editingLaneTitleValue.trim();
      if (newTitle && editingLaneId === laneId) {
        onUpdateLaneTitle(laneId, newTitle);
      }
      setEditingLaneId(null);
    },
    [editingLaneId, editingLaneTitleValue, onUpdateLaneTitle]
  );

  const handleLaneTitleKeyDown = useCallback(
    (e: React.KeyboardEvent, laneId: string) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleLaneTitleBlur(laneId);
      } else if (e.key === 'Escape') {
        setEditingLaneId(null);
      }
    },
    [handleLaneTitleBlur]
  );

  const setLaneRef = useCallback((laneId: string) => (el: HTMLDivElement | null) => {
    if (el) {
      laneRefs.current.set(laneId, el);
    } else {
      laneRefs.current.delete(laneId);
    }
  }, []);

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <div className="flex-1 flex gap-4 overflow-x-auto overflow-y-hidden pb-6 px-6 pt-2">
        {board.lanes.map((lane, laneIndex) => (
          <div
            key={lane.id}
            ref={setLaneRef(lane.id)}
            className={`flex-shrink-0 w-80 flex flex-col bg-board-bg rounded-xl shadow-sm overflow-hidden transition-colors duration-150 ${
              dragOverLane === lane.id && draggingCardId ? 'ring-2 ring-blue-400/40' : ''
            }`}
            onDragOver={(e) => handleDragOver(e, lane.id)}
            onDragLeave={() => {
              if (dragOverLane === lane.id) setDragOverLane(null);
            }}
            onDrop={(e) => handleLaneDrop(e, lane.id)}
          >
            <div
              className="flex items-center justify-between px-4 py-3 border-b border-gray-100 cursor-default"
              style={{
                background: 'linear-gradient(180deg, #f3f4f6 0%, #ffffff 100%)'
              }}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {editingLaneId === lane.id ? (
                  <input
                    type="text"
                    value={editingLaneTitleValue}
                    onChange={(e) => setEditingLaneTitleValue(e.target.value)}
                    onBlur={() => handleLaneTitleBlur(lane.id)}
                    onKeyDown={(e) => handleLaneTitleKeyDown(e, lane.id)}
                    autoFocus
                    className="w-full px-2 py-1 text-sm font-semibold text-gray-800 border border-blue-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <h3
                    className="text-sm font-semibold text-gray-800 truncate flex-1 select-none"
                    onDoubleClick={() => handleLaneTitleDoubleClick(lane)}
                    title="双击重命名"
                  >
                    {lane.title}
                  </h3>
                )}
                <span className="flex-shrink-0 inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-full">
                  {lane.cards.length}
                </span>
              </div>

              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={() => handleAddCardClick(lane.id)}
                  title="添加卡片"
                  className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
                {board.lanes.length > 2 && (
                  <button
                    onClick={() => handleRemoveLaneClick(lane.id)}
                    title="删除泳道"
                    className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div
              className={`flex-1 flex flex-col gap-3 p-3 min-h-[120px] overflow-y-auto transition-colors duration-150 ${
                dragOverLane === lane.id && lane.cards.length === 0 && draggingCardId ? 'drop-zone-highlight' : ''
              }`}
            >
              {lane.cards.map((card) => (
                <Card
                  key={card.id}
                  card={card}
                  laneId={lane.id}
                  onDoubleClick={handleDoubleClickCard}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleCardDragOver}
                  onDrop={handleCardDrop}
                  isDragging={draggingCardId === card.id}
                  isDropTarget={dragOverCardId === card.id && draggingCardId !== card.id}
                  justMoved