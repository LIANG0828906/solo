import { useState, useCallback, useEffect } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from 'react-beautiful-dnd';
import { Star, Plus, Trash2, Sparkles, GripVertical } from 'lucide-react';
import { v4 } from 'uuid';
import type { InspirationCard } from '../types';
import { useStore } from '../store';
import { inspirationApi } from '../utils/api';
import {
  playDragSound,
  playDropSound,
  playStarSound,
  playClickSound,
} from '../utils/audio';
import { useWebSocket } from '../hooks/useWebSocket';

function sortCards(cards: InspirationCard[]): InspirationCard[] {
  const starred = cards
    .filter((c) => c.starred)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const unstarred = cards
    .filter((c) => !c.starred)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return [...starred, ...unstarred];
}

export default function InspirationBoard() {
  const cards = useStore((s) => s.inspirationCards);
  const currentUser = useStore((s) => s.currentUser);
  const addInspirationCard = useStore((s) => s.addInspirationCard);
  const updateInspirationCard = useStore((s) => s.updateInspirationCard);
  const removeInspirationCard = useStore((s) => s.removeInspirationCard);
  const setInspirationCards = useStore((s) => s.setInspirationCards);

  const [newContent, setNewContent] = useState('');
  const [animatingStarId, setAnimatingStarId] = useState<string | null>(null);

  const { send } = useWebSocket(null);

  useEffect(() => {
    (window as any).__notifyCardInserted = (card: InspirationCard) => {
      send({
        type: 'card_drag',
        poemId: 'any',
        payload: {
          cardId: card.id,
          cardContent: card.content,
          userId: currentUser.id,
        },
      });
    };
    return () => {
      delete (window as any).__notifyCardInserted;
    };
  }, [send, currentUser.id]);

  const sorted = sortCards(cards);

  const handleCreate = useCallback(async () => {
    const trimmed = newContent.trim();
    if (!trimmed) return;
    playClickSound();
    const card: InspirationCard = {
      id: v4(),
      userId: currentUser.id,
      content: trimmed,
      starred: false,
      createdAt: new Date().toISOString(),
    };
    addInspirationCard(card);
    setNewContent('');
    try {
      await inspirationApi.create({ content: trimmed });
    } catch {}
  }, [newContent, currentUser.id, addInspirationCard]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleCreate();
      }
    },
    [handleCreate],
  );

  const handleToggleStar = useCallback(
    async (card: InspirationCard) => {
      playStarSound();
      setAnimatingStarId(card.id);
      const next = !card.starred;
      updateInspirationCard(card.id, { starred: next });
      setTimeout(() => setAnimatingStarId(null), 600);
      try {
        await inspirationApi.update(card.id, { starred: next });
      } catch {}
    },
    [updateInspirationCard],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      playClickSound();
      removeInspirationCard(id);
      try {
        await inspirationApi.delete(id);
      } catch {}
    },
    [removeInspirationCard],
  );

  const handleDragStart = useCallback(() => {
    playDragSound();
  }, []);

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      playDropSound();
      if (!result.destination) return;
      const sourceIdx = result.source.index;
      const destIdx = result.destination.index;
      if (sourceIdx === destIdx) return;
      const reordered = [...sorted];
      const [moved] = reordered.splice(sourceIdx, 1);
      reordered.splice(destIdx, 0, moved);
      setInspirationCards(reordered);
    },
    [sorted, setInspirationCards],
  );

  return (
    <div className="min-h-screen bg-rice-50 px-4 py-8 font-wenkai">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-center gap-3">
          <Sparkles className="h-7 w-7 text-jade-400" />
          <h1 className="text-2xl font-bold text-ink-500">灵感板</h1>
        </header>

        <div className="mb-6 flex gap-3">
          <input
            type="text"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="记下你的灵感…"
            className="flex-1 rounded-lg border border-jade-200 bg-white px-4 py-2.5 text-ink-500 placeholder:text-ink-100 focus:border-jade-400 focus:outline-none focus:ring-2 focus:ring-jade-100 transition-all duration-200"
          />
          <button
            onClick={handleCreate}
            disabled={!newContent.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-jade-400 px-4 py-2.5 text-white hover:bg-jade-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <Plus className="h-4 w-4" />
            <span>添加</span>
          </button>
        </div>

        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-ink-200">
            <Sparkles className="mb-4 h-12 w-12" />
            <p className="text-lg">还没有灵感卡片</p>
            <p className="mt-1 text-sm">在上方输入框写下你的第一个灵感吧</p>
          </div>
        ) : (
          <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <Droppable droppableId="inspiration-board" type="CARD">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                >
                  {sorted.map((card, index) => (
                    <Draggable key={card.id} draggableId={card.id} index={index}>
                      {(dragProvided, snapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          draggable={true}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('application/inspiration-card', JSON.stringify(card));
                            e.dataTransfer.effectAllowed = 'copy';
                            e.dataTransfer.setData('text/plain', card.content);
                          }}
                          className={`group relative rounded-xl border border-jade-100 bg-jade-50 px-5 py-4 shadow-sm transition-all duration-200 hover:translate-y-[-4px] hover:shadow-lg ${
                            snapshot.isDragging ? 'shadow-xl ring-2 ring-jade-300' : ''
                          } ${card.starred ? 'bg-jade-100' : ''}`}
                        >
                          <div className="mb-3 flex items-start justify-between gap-2">
                            <div
                              {...dragProvided.dragHandleProps}
                              className="mt-0.5 cursor-grab text-ink-100 hover:text-ink-300 transition-colors"
                            >
                              <GripVertical className="h-4 w-4" />
                            </div>
                            <p className="flex-1 text-ink-500 leading-relaxed text-sm whitespace-pre-wrap break-words">
                              {card.content}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-xs text-ink-100">
                            <span>
                              {new Date(card.createdAt).toLocaleDateString('zh-CN', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleToggleStar(card)}
                                className={`p-1 rounded transition-colors ${
                                  card.starred
                                    ? 'text-amber-400'
                                    : 'text-ink-100 hover:text-amber-400'
                                } ${animatingStarId === card.id ? 'animate-star-pulse' : ''}`}
                              >
                                <Star
                                  className="h-4 w-4"
                                  fill={card.starred ? 'currentColor' : 'none'}
                                />
                              </button>
                              <button
                                onClick={() => handleDelete(card.id)}
                                className="p-1 rounded text-ink-100 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </div>
  );
}
