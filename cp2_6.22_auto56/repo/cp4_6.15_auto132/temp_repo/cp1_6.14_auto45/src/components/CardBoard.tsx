import { useState, useCallback, useRef } from 'react';
import type { Card, WSMessage, CreateCardPayload, MoveCardPayload } from '../types';
import IdeaCard from './IdeaCard';

interface CardBoardProps {
  cards: Card[];
  roomId: string;
  isVoting: boolean;
  userId: string;
  isHost: boolean;
  onVote: (cardId: string, value: 1 | -1) => void;
  sendMessage: (message: WSMessage) => void;
  onAddCard: (card: Card) => void;
}

export default function CardBoard({
  cards,
  roomId,
  isVoting,
  userId,
  isHost,
  onVote,
  sendMessage,
  onAddCard,
}: CardBoardProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sketchData, setSketchData] = useState<string>('');
  const dragItem = useRef<string | null>(null);
  const dragOverItem = useRef<string | null>(null);

  const handleSubmitCard = useCallback(() => {
    if (!title.trim()) return;

    const payload: CreateCardPayload = {
      roomId,
      authorId: userId,
      authorName: userId,
      title: title.trim(),
      description: description.trim(),
      sketchData: sketchData || undefined,
      position: cards.length,
    };

    sendMessage({
      type: 'CARD_CREATE',
      roomId,
      payload,
      timestamp: Date.now(),
    });

    const tempCard: Card = {
      id: `temp_${Date.now()}`,
      roomId,
      authorId: userId,
      authorName: userId,
      title: title.trim(),
      description: description.trim(),
      sketchData: sketchData || undefined,
      position: cards.length,
      createdAt: Date.now(),
      votes: [],
    };
    onAddCard(tempCard);

    setTitle('');
    setDescription('');
    setSketchData('');
    setShowForm(false);
  }, [title, description, sketchData, roomId, userId, cards.length, sendMessage, onAddCard]);

  const handleDragStart = useCallback((e: React.DragEvent, cardId: string) => {
    dragItem.current = cardId;
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetCardId: string) => {
      e.preventDefault();
      if (!dragItem.current || dragItem.current === targetCardId) return;

      const sourceId = dragItem.current;
      const sourceIndex = cards.findIndex((c) => c.id === sourceId);
      const targetIndex = cards.findIndex((c) => c.id === targetCardId);

      if (sourceIndex === -1 || targetIndex === -1) return;

      const movePayload: MoveCardPayload = {
        cardId: sourceId,
        position: targetIndex,
      };

      sendMessage({
        type: 'CARD_MOVE',
        roomId,
        payload: movePayload,
        timestamp: Date.now(),
      });

      dragItem.current = null;
      dragOverItem.current = null;
    },
    [cards, roomId, sendMessage]
  );

  const sortedCards = [...cards].sort((a, b) => {
    if (isVoting) {
      const scoreA = a.votes.reduce((sum, v) => sum + v.value, 0);
      const scoreB = b.votes.reduce((sum, v) => sum + v.value, 0);
      return scoreB - scoreA;
    }
    return a.position - b.position;
  });

  const getCardRank = (index: number): number | undefined => {
    if (!isVoting) return undefined;
    if (index < 3) return index + 1;
    return undefined;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#e0e0e0]">
          创意卡片
          <span className="ml-2 text-sm font-normal text-[#9ca3af]">({cards.length})</span>
        </h3>
        {!isVoting && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary text-sm px-4 py-2"
          >
            {showForm ? '取消' : '+ 添加卡片'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="card p-4 mb-4 fade-in">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="点子标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full"
              maxLength={100}
            />
            <textarea
              placeholder="详细说明..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[80px] resize-y"
              maxLength={500}
            />
            {sketchData && (
              <div className="relative rounded-lg overflow-hidden border border-white/10 bg-[#0f172a]">
                <img
                  src={sketchData}
                  alt="草图预览"
                  className="w-full h-auto max-h-32 object-contain"
                />
                <button
                  onClick={() => setSketchData('')}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-[#ff4757]/80 text-white text-xs flex items-center justify-center hover:bg-[#ff4757]"
                >
                  ×
                </button>
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  const getThumbnail = (window as unknown as { __getCanvasThumbnail?: () => string }).__getCanvasThumbnail;
                  if (getThumbnail) {
                    setSketchData(getThumbnail());
                  }
                }}
                className="btn-secondary text-sm px-3 py-1.5"
              >
                📎 从画布获取草图
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="btn-secondary text-sm px-3 py-1.5"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitCard}
                  disabled={!title.trim()}
                  className="btn-primary text-sm px-4 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  提交
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-4">
        {sortedCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#9ca3af]">
            <div className="text-5xl mb-4">💡</div>
            <p className="text-lg font-medium mb-1">还没有创意卡片</p>
            <p className="text-sm">点击上方按钮添加你的第一个点子吧！</p>
          </div>
        ) : (
          sortedCards.map((card, index) => (
            <IdeaCard
              key={card.id}
              card={card}
              rank={getCardRank(index)}
              isVoting={isVoting}
              userId={userId}
              onVote={onVote}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              draggable={!isVoting}
            />
          ))
        )}
      </div>
    </div>
  );
}
