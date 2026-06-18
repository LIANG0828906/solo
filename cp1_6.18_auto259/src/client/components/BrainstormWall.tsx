import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Lightbulb } from 'lucide-react';
import { IdeaCard } from './IdeaCard';
import { useAppStore } from '../store';
import type { Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../types';

interface BrainstormWallProps {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
}

export const BrainstormWall = ({ socket }: BrainstormWallProps) => {
  const { cards, nickname, roomId } = useAppStore();
  const currentRoomId = roomId!;
  const currentNickname = nickname!;
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [cards]);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const content = input.trim();
    if (!content || !socket || isSending) return;
    if (content.length > 140) return;

    setIsSending(true);
    socket.emit('card:add', {
      roomId: currentRoomId,
      content,
      nickname: currentNickname,
    });

    setInput('');
    setTimeout(() => setIsSending(false), 200);
  }, [input, socket, isSending, roomId, nickname]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const charCount = input.length;
  const isOverLimit = charCount > 140;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-[#FF8906]" />
        <h2 className="text-lg font-semibold text-white">
          想法墙
        </h2>
        <span className="text-xs text-[#888899]">
          ({cards.length} 条想法)
        </span>
      </div>

      <div
        ref={containerRef}
        className="
          flex-1 overflow-y-auto pr-2
          scrollbar-thin scrollbar-thumb-[#1A1A2E] scrollbar-track-transparent
        "
      >
        {cards.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[#555566]">
            <Lightbulb className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">还没有想法，发送第一条吧！</p>
          </div>
        ) : (
          <div className="space-y-1">
            {cards.map((card) => (
              <IdeaCard key={card.id} card={card} socket={socket} />
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-white/5">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你的想法（140字以内）..."
            className="
              w-full px-4 py-3 pr-24 rounded-xl
              bg-[#1A1A2E] border border-white/10
              text-white text-sm resize-none
              placeholder-[#555566]
              focus:outline-none focus:border-[#FF8906] focus:ring-2 focus:ring-[#FF8906]/30
              transition-all duration-200
            "
            rows={2}
            maxLength={160}
          />
          
          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            <span className={`text-xs ${isOverLimit ? 'text-[#FF4D6D]' : 'text-[#555566]'}`}>
              {charCount}/140
            </span>
            <button
              type="submit"
              disabled={!input.trim() || isOverLimit || isSending}
              className="
                p-2 rounded-lg
                bg-[#FF8906] text-white
                hover:bg-[#FF9500] hover:shadow-lg hover:shadow-[#FF8906]/30
                disabled:bg-[#333344] disabled:text-[#555566] disabled:cursor-not-allowed disabled:hover:shadow-none
                active:scale-95
                transition-all duration-200
              "
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
