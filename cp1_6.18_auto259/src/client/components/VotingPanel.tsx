import React, { useState, useMemo } from 'react';
import { Vote, Play, Square, BarChart3, Heart, X } from 'lucide-react';
import { VoteBar } from './VoteBar';
import { useAppStore } from '../store';
import type { Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../types';

interface VotingPanelProps {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  isMobile?: boolean;
  onClose?: () => void;
}

export const VotingPanel = ({ socket, isMobile, onClose }: VotingPanelProps) => {
  const { cards, voteState, isCreator, roomId, myVotes } = useAppStore();
  const currentRoomId = roomId!;
  const [selectedCards, setSelectedCards] = useState<string[]>([]);

  const voteCards = useMemo(() => {
    if (!voteState) return [];
    return voteState.cardIds
      .map(id => cards.find(c => c.id === id))
      .filter(Boolean)
      .sort((a, b) => (voteState.votes[b!.id] || 0) - (voteState.votes[a!.id] || 0));
  }, [voteState, cards]);

  const maxVotes = useMemo(() => {
    if (!voteState || voteCards.length === 0) return 0;
    return Math.max(...voteCards.map(c => voteState.votes[c!.id] || 0));
  }, [voteState, voteCards]);

  const handleCardSelect = (cardId: string) => {
    if (voteState?.isOpen) return;
    
    setSelectedCards(prev => 
      prev.includes(cardId)
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  };

  const handleOpenVote = () => {
    if (selectedCards.length < 2 || !socket) return;
    socket.emit('vote:open', { roomId: currentRoomId, cardIds: selectedCards });
    setSelectedCards([]);
  };

  const handleCloseVote = () => {
    if (!socket) return;
    socket.emit('vote:close', { roomId: currentRoomId });
  };

  const remainingVotes = 3 - myVotes.length;

  return (
    <div 
      className={`
        h-full flex flex-col
        ${!isMobile ? 'rounded-2xl p-5 border border-white/10' : 'p-4'}
      `}
      style={{
        background: isMobile 
          ? '#0F0E17' 
          : 'rgba(26, 26, 46, 0.85)',
        backdropFilter: !isMobile ? 'blur(12px)' : 'none',
        WebkitBackdropFilter: !isMobile ? 'blur(12px)' : 'none',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#FF8906]" />
          <h2 className="text-lg font-semibold text-white">投票看板</h2>
        </div>
        
        {isMobile && onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#888899] hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={20} />
          </button>
        )}

        {voteState?.isOpen && (
          <span className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-[#FF4D6D]/20 text-[#FF4D6D] animate-pulse">
            <span className="w-2 h-2 rounded-full bg-[#FF4D6D]" />
            投票进行中
          </span>
        )}
      </div>

      {isCreator && !voteState?.isOpen && cards.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-[#888899] mb-2">
            选择要投票的选项（至少选2个）
          </p>
          <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
            {cards.map((card) => (
              <button
                key={card.id}
                onClick={() => handleCardSelect(card.id)}
                className={`
                  w-full text-left p-2.5 rounded-lg text-sm
                  transition-all duration-200
                  ${selectedCards.includes(card.id)
                    ? 'bg-[#FF8906]/20 border border-[#FF8906] text-white'
                    : 'bg-[#0F0E17] border border-white/5 text-[#E0E0E0] hover:border-white/20'
                  }
                `}
              >
                <p className="truncate">{card.content}</p>
                <p className="text-xs text-[#888899] mt-1">{card.nickname}</p>
              </button>
            ))}
          </div>
          
          <button
            onClick={handleOpenVote}
            disabled={selectedCards.length < 2}
            className="
              w-full mt-3 py-2.5 rounded-xl
              bg-[#FF8906] text-white font-medium text-sm
              hover:bg-[#FF9500] hover:shadow-lg hover:shadow-[#FF8906]/30
              disabled:bg-[#333344] disabled:text-[#555566] disabled:cursor-not-allowed disabled:hover:shadow-none
              active:scale-98
              transition-all duration-200
              flex items-center justify-center gap-2
            "
          >
            <Play size={16} />
            开始投票 ({selectedCards.length}个选项)
          </button>
        </div>
      )}

      {voteState?.isOpen && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-[#888899]">
              <Heart size={14} className="inline mr-1 text-[#FF4D6D]" />
              剩余投票：{remainingVotes}/3
            </span>
            <span className="text-[#888899]">
              总票数：{voteState.totalVotes}
            </span>
          </div>
          
          {isCreator && (
            <button
              onClick={handleCloseVote}
              className="
                w-full py-2.5 rounded-xl mb-4
                bg-[#FF4D6D] text-white font-medium text-sm
                hover:bg-[#FF6B6B] hover:shadow-lg hover:shadow-[#FF4D6D]/30
                active:scale-98
                transition-all duration-200
                flex items-center justify-center gap-2
              "
            >
              <Square size={16} />
              结束投票
            </button>
          )}
        </div>
      )}

      {voteState && voteCards.length > 0 && (
        <div className="flex-1 overflow-y-auto pr-2">
          {voteCards.map((card) => (
            <VoteBar
              key={card!.id}
              card={card!}
              votes={voteState.votes[card!.id] || 0}
              totalVotes={voteState.totalVotes}
              maxVotes={maxVotes}
            />
          ))}
          
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-xl bg-[#0F0E17]">
                <p className="text-2xl font-bold text-[#FF8906]">
                  {voteState.totalVotes}
                </p>
                <p className="text-xs text-[#888899]">总投票数</p>
              </div>
              <div className="p-3 rounded-xl bg-[#0F0E17]">
                <p className="text-2xl font-bold text-[#6BCB77]">
                  {voteCards.length}
                </p>
                <p className="text-xs text-[#888899]">选项数量</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!voteState && cards.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-[#555566]">
          <Vote className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">暂无投票数据</p>
          {isCreator && (
            <p className="text-xs mt-1">先发送一些想法卡片后再开始投票</p>
          )}
        </div>
      )}

      {!voteState && !isCreator && cards.length > 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-[#555566]">
          <Vote className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">等待管理者开启投票...</p>
        </div>
      )}
    </div>
  );
};
