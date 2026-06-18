import React, { memo, useEffect, useState } from 'react';
import { Trash2, Heart } from 'lucide-react';
import type { Card } from '../types';
import { useAppStore } from '../store';
import type { Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../types';

interface IdeaCardProps {
  card: Card;
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
}

export const IdeaCard = memo(({ card, socket }: IdeaCardProps) => {
  const { isCreator, voteState, myVotes, castVote, roomId } = useAppStore();
  const currentRoomId = roomId!;
  const [isAnimating, setIsAnimating] = useState(card.isNew || false);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    if (card.isNew) {
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [card.isNew]);

  useEffect(() => {
    setHasVoted(myVotes.includes(card.id));
  }, [myVotes, card.id]);

  const handleDelete = () => {
    if (isCreator && socket) {
      socket.emit('card:delete', { roomId: currentRoomId, cardId: card.id });
    }
  };

  const handleVote = () => {
    if (!voteState?.isOpen || !socket) return;
    if (!voteState.cardIds.includes(card.id)) return;
    if (myVotes.length >= 3 && !hasVoted) return;
    
    castVote(card.id);
    socket.emit('vote:cast', { roomId: currentRoomId, cardId: card.id });
  };

  const canVote = voteState?.isOpen && voteState.cardIds.includes(card.id);

  return (
    <div
      className={`
        idea-card relative p-4 mb-3 rounded-2xl cursor-default
        bg-gradient-to-br from-[#1A1A2E] to-[#16213E]
        text-[#E0E0E0] border border-white/5
        transition-all duration-200 ease-out
        hover:translate-y-[-4px] hover:shadow-xl
        hover:shadow-[#FF8906]/10 hover:border-[#FF8906]/30
        hover:inner-shadow-[0_0_20px_rgba(255,137,6,0.15)]
        ${isAnimating ? 'animate-card-enter' : ''}
        ${canVote ? 'cursor-pointer' : ''}
      `}
      style={{ borderRadius: '16px' }}
    >
      <p className="text-sm leading-relaxed mb-3 break-words">
        {card.content}
      </p>
      
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#888899]">
          {card.nickname}
        </span>
        
        <div className="flex items-center gap-2">
          {canVote && (
            <button
              onClick={handleVote}
              className={`
                flex items-center gap-1 px-2 py-1 rounded-lg
                transition-all duration-200
                ${hasVoted 
                  ? 'bg-[#FF4D6D]/20 text-[#FF4D6D]' 
                  : 'bg-transparent text-[#888899] hover:text-[#FF4D6D] hover:bg-[#FF4D6D]/10'
                }
              `}
            >
              <Heart 
                size={14} 
                fill={hasVoted ? '#FF4D6D' : 'none'}
                className={hasVoted ? 'animate-pulse' : ''}
              />
              <span className="text-[10px]">
                {voteState?.votes[card.id] || 0}
              </span>
            </button>
          )}
          
          {isCreator && (
            <button
              onClick={handleDelete}
              className="
                p-1.5 rounded-lg
                text-[#888899] hover:text-[#FF4D6D]
                hover:bg-[#FF4D6D]/10
                transition-all duration-200
              "
              title="删除卡片"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

IdeaCard.displayName = 'IdeaCard';
