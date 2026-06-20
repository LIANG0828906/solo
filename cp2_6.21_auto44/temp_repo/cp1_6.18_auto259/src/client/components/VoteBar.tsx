import React, { memo } from 'react';
import type { Card } from '../types';

interface VoteBarProps {
  card: Card;
  votes: number;
  totalVotes: number;
  maxVotes: number;
}

export const VoteBar = memo(({ card, votes, totalVotes, maxVotes }: VoteBarProps) => {
  const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
  const widthPercentage = maxVotes > 0 ? (votes / maxVotes) * 100 : 0;

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-[#E0E0E0] truncate flex-1 mr-2" title={card.content}>
          {card.content.length > 40 ? card.content.substring(0, 40) + '...' : card.content}
        </span>
        <span className="text-sm font-medium text-[#FF8906] whitespace-nowrap">
          {votes} 票 ({percentage.toFixed(1)}%)
        </span>
      </div>
      
      <div 
        className="relative h-10 rounded-lg overflow-hidden bg-[#0F0E17] border border-white/5"
      >
        <div
          className="h-full rounded-lg transition-all duration-500 ease-out"
          style={{
            width: `${Math.max(widthPercentage, votes > 0 ? 2 : 0)}%`,
            background: 'linear-gradient(90deg, #FF6B6B 0%, #FFD93D 50%, #6BCB77 100%)',
            boxShadow: '0 0 20px rgba(255, 107, 107, 0.3)',
          }}
        />
        
        <div className="absolute inset-0 flex items-center justify-end pr-3">
          <span className="text-xs text-white/80 font-medium">
            {card.nickname}
          </span>
        </div>
      </div>
    </div>
  );
});

VoteBar.displayName = 'VoteBar';
