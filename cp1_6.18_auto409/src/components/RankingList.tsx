import React, { useEffect, useState } from 'react';
import type { RankingMember } from '@/types';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface RankingListProps {
  data: RankingMember[];
}

export default function RankingList({ data }: RankingListProps) {
  const navigate = useNavigate();
  const [showArrows, setShowArrows] = useState<Set<number>>(new Set());
  const [flashCards, setFlashCards] = useState<Set<number>>(new Set());

  useEffect(() => {
    const membersWithChange = data.filter((item) => item.rank_change && item.rank_change !== 'same');
    if (membersWithChange.length > 0) {
      const ids = new Set(membersWithChange.map((item) => item.id));
      setShowArrows(ids);
      setFlashCards(ids);

      const timer = setTimeout(() => {
        setShowArrows(new Set());
        setFlashCards(new Set());
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [data]);

  const getRankColor = (index: number): string => {
    switch (index) {
      case 0:
        return '#FFD700';
      case 1:
        return '#C0C0C0';
      case 2:
        return '#CD7F32';
      default:
        return '#4A90D9';
    }
  };

  const getRankClass = (index: number): string => {
    switch (index) {
      case 0:
        return 'rank-1';
      case 1:
        return 'rank-2';
      case 2:
        return 'rank-3';
      default:
        return '';
    }
  };

  const getInitial = (nickname: string): string => {
    return nickname.charAt(0).toUpperCase();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {data.map((item, index) => {
        const rankColor = getRankColor(index);
        const rankClass = getRankClass(index);
        const showArrow = showArrows.has(item.id);
        const hasFlash = flashCards.has(item.id);

        return (
          <div
            key={item.id}
            onClick={() => navigate(`/member/${item.id}`)}
            className={`
              flex items-center gap-4 rounded-2xl p-5 cursor-pointer
              border border-[#2A2A3E] bg-[#1E1E2E]
              transition-all duration-300 ease-out
              hover:-translate-y-1 hover:shadow-[0_8px_24px_#00D4AA30]
              ${rankClass}
              ${hasFlash ? 'card-flash' : ''}
            `}
          >
            <div className="relative flex-shrink-0">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: rankColor }}
              >
                {getInitial(item.nickname)}
              </div>
              {showArrow && item.rank_change && item.rank_change !== 'same' && (
                <div className="absolute -top-1 -right-1">
                  {item.rank_change === 'up' ? (
                    <ArrowUp className="w-4 h-4 text-green-400" />
                  ) : (
                    <ArrowDown className="w-4 h-4 text-red-400" />
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white font-semibold truncate">{item.nickname}</span>
                <span
                  className="text-sm font-bold ml-2"
                  style={{ color: rankColor }}
                >
                  #{index + 1}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#A0A0B8]">
                  {item.total_steps.toLocaleString()} 步
                </span>
                <span className="text-[#A0A0B8]">
                  {item.total_calories.toLocaleString()} kcal
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
