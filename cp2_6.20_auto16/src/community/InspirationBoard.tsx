import { useState, useCallback, useEffect, useRef } from 'react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from 'react-beautiful-dnd';
import { Star, Plus, Trash2, Sparkles, GripVertical, X } from 'lucide-react';
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

const PRESET_TAGS = ['意象', '动词', '开头句', '结尾句', '情感', '山水'];

let _draggingCard: InspirationCard | null = null;

function sortCards(cards: InspirationCard[]): InspirationCard[] {
  const starred = cards
    .filter((c) => c.starred)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const unstarred = cards
    .filter((c) => !c.starred)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return [...starred, ...unstarred];
}

const blankImg =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export default function InspirationBoard() {
  const cards = useStore((s) => s.inspirationCards);
  const currentUser = useStore((s) => s.currentUser);
  const addInspirationCard = useStore((s) => s.addInspirationCard);
  const updateInspirationCard = useStore((s) => s.updateInspirationCard);
  const removeInspirationCard = useStore((s) => s.removeInspirationCard);
  const setInspirationCards = useStore((s) => s.setInspirationCards);

  const [newContent, setNewContent] = useState('');
  const [animatingStarId, setAnimatingStarId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggingCard, setDraggingCard] = useState<InspirationCard | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [editingTagCardId, setEditingTagCardId] = useState<string | null>(null);
  const [tagInputValue, setTagInputValue] = useState('');
  const [tagWarning, setTagWarning] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const { send } = useWebSocket(null);

  useEffect(() => {
    if (!imgRef.current) {
      const img = new Image();
      img.src = blankImg;
      imgRef.current = img;
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setMousePos({ x: e.clientX, y: e.clientY });
      }
    };
    const handleDragEnd = () => {
      setIsDragging(false);
      setDraggingCard(null);
      _draggingCard = null;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('dragend', handleDragEnd);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('dragend', handleDragEnd);
    };
  }, [isDragging]);

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

  const allTags = Array.from(new Set(cards.flatMap((c) => c.tags || []))).sort();

  const tagCounts = allTags.reduce<Record<string, number>>((acc, tag) => {
    acc[tag] = cards.filter((c) => c.tags?.includes(tag)).length;
    return acc;
  }, {});

  const filteredCards = selectedTag
    ? sorted.filter((c) => c.tags?.includes(selectedTag))
    : sorted;

  const handleCreate = useCallback(async () => {
    const trimmed = newContent.trim();
    if (!trimmed) return;
    playClickSound();
    const card: InspirationCard = {
      id: v4(),
      userId: currentUser.id,
      content: trimmed,
      starred: false,
      tags: [],
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

  const handleNativeDragStart = useCallback(
    (e: React.DragEvent, card: InspirationCard) => {
      e.dataTransfer.setData('application/inspiration-card', JSON.stringify(card));
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData('text/plain', card.content);
      if (imgRef.current) {
        e.dataTransfer.setDragImage(imgRef.current, 0, 0);
      }
      _draggingCard = card;
      setDraggingCard(card);
      setIsDragging(true);
      setMousePos({ x: e.clientX, y: e.clientY });
    },
    [],
  );

  const handleDragStart = useCallback(() => {
    playDragSound();
  }, []);

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      playDropSound();
      setIsDragging(false);
      setDraggingCard(null);
      _draggingCard = null;
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

  const handleAddTag = useCallback(
    async (card: InspirationCard, tag: string) => {
      const trimmed = tag.trim();
      if (!trimmed) return;
      const currentTags = card.tags || [];
      if (currentTags.includes(trimmed)) {
        setTagInputValue('');
        return;
      }
      if (currentTags.length >= 3) {
        setTagWarning('最多3个标签');
        setTimeout(() => setTagWarning(null), 2000);
        return;
      }
      playClickSound();
      const newTags = [...currentTags, trimmed];
      updateInspirationCard(card.id, { tags: newTags });
      setTagInputValue('');
      try {
        await inspirationApi.update(card.id, { tags: newTags });
      } catch {}
    },
    [updateInspirationCard],
  );

  const handleRemoveTag = useCallback(
    async (card: InspirationCard, tag: string) => {
      playClickSound();
      const newTags = (card.tags || []).filter((t) => t !== tag);
      updateInspirationCard(card.id, { tags: newTags });
      try {
        await inspirationApi.update(card.id, { tags: newTags });
      } catch {}
    },
    [updateInspirationCard],
  );

  const handleTagInputKeyDown = useCallback(
    (e: React.KeyboardEvent, card: InspirationCard) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddTag(card, tagInputValue);
      }
    },
    [tagInputValue, handleAddTag],
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

        {allTags.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag(null)}
              className={`rounded-full px-4 py-1.5 text-sm transition-all duration-200 ${
                selectedTag === null
                  ? 'bg-bark-500 text-white'
                  : 'bg-rice-300 text-ink-400 hover:bg-rice-400'
              }`}
            >
              全部
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`rounded-full px-4 py-1.5 text-sm transition-all duration-200 ${
                  selectedTag === tag
                    ? 'bg-bark-500 text-white'
                    : 'bg-rice-300 text-ink-400 hover:bg-rice-400'
                }`}
              >
                {tag} <span className="ml-1 opacity-70">({tagCounts[tag]})</span>
              </button>
            ))}
          </div>
        )}

        <div className="transition-all duration-300 ease-in-out">
          {filteredCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-bark-300">
              <Sparkles className="mb-4 h-12 w-12 text-jade-400" />
              <p className="text-lg text-jade-400">暂无匹配灵感</p>
              <p className="mt-1 text-sm text-bark-300">试试其他标签或创建新的灵感卡片</p>
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
                    {filteredCards.map((card, index) => (
                      <Draggable key={card.id} draggableId={card.id} index={index}>
                        {(dragProvided, snapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            draggable={true}
                            onDragStart={(e) => handleNativeDragStart(e, card)}
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

                            <div className="mb-3 flex flex-wrap gap-1.5">
                              {(card.tags || []).map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center gap-1 rounded-full bg-rice-100 px-2.5 py-0.5 text-xs text-ink-500"
                                >
                                  {tag}
                                  <button
                                    onClick={() => handleRemoveTag(card, tag)}
                                    className="ml-0.5 text-ink-200 hover:text-ink-400 transition-colors"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              ))}
                              {(card.tags || []).length < 3 && (
                                <>
                                  {editingTagCardId === card.id ? (
                                    <div className="flex flex-col gap-1.5">
                                      <input
                                        type="text"
                                        autoFocus
                                        value={tagInputValue}
                                        onChange={(e) => setTagInputValue(e.target.value)}
                                        onKeyDown={(e) => handleTagInputKeyDown(e, card)}
                                        onBlur={() => {
                                          setEditingTagCardId(null);
                                          setTagInputValue('');
                                          setTagWarning(null);
                                        }}
                                        placeholder="输入标签…"
                                        className="w-24 rounded-full border border-jade-200 bg-white px-2.5 py-0.5 text-xs text-ink-500 focus:border-jade-400 focus:outline-none"
                                      />
                                      <div className="flex flex-wrap gap-1">
                                        {PRESET_TAGS.filter(
                                          (pt) => !(card.tags || []).includes(pt),
                                        ).map((pt) => (
                                          <button
                                            key={pt}
                                            onClick={(e) => {
                                              e.preventDefault();
                                              handleAddTag(card, pt);
                                            }}
                                            className="rounded-full bg-jade-100 px-2 py-0.5 text-[10px] text-jade-500 hover:bg-jade-200 transition-colors"
                                          >
                                            {pt}
                                          </button>
                                        ))}
                                      </div>
                                      {tagWarning && (
                                        <span className="text-[10px] text-red-400">
                                          {tagWarning}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        playClickSound();
                                        setEditingTagCardId(card.id);
                                        setTagInputValue('');
                                        setTagWarning(null);
                                      }}
                                      className="inline-flex items-center rounded-full border border-dashed border-ink-100 px-2 py-0.5 text-xs text-ink-200 hover:border-jade-300 hover:text-jade-400 transition-colors"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </button>
                                  )}
                                </>
                              )}
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

      {isDragging && draggingCard && (
        <div
          className="pointer-events-none fixed z-50 rounded-xl border border-jade-200 bg-jade-50 px-4 py-3 shadow-lg backdrop-blur-sm"
          style={{
            top: mousePos.y + 16,
            left: mousePos.x + 16,
            width: 260,
            opacity: 0.85,
            transform: 'rotate(-1deg)',
          }}
        >
          <p className="text-sm text-ink-500 leading-relaxed line-clamp-4 whitespace-pre-wrap break-words">
            {draggingCard.content.length > 80
              ? draggingCard.content.slice(0, 80) + '…'
              : draggingCard.content}
          </p>
          {(draggingCard.tags || []).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {draggingCard.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-rice-100 px-2 py-0.5 text-[10px] text-ink-500"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
