import { useMemo } from 'react';
import type { Card } from '../types';
import { GripVertical, ThumbsUp, ThumbsDown, Trophy, User } from 'lucide-react';

interface IdeaCardProps {
  card: Card;
  rank?: number;
  isVoting: boolean;
  userId: string;
  onVote?: (cardId: string, value: 1 | -1) => void;
  onDragStart?: (e: React.DragEvent, cardId: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, cardId: string) => void;
  draggable?: boolean;
}

const RANK_STYLES: Record<number, { border: string; glow: string; text: string; label: string }> = {
  1: {
    border: 'border-[#ffd700]',
    glow: 'shadow-[0_0_20px_rgba(255,215,0,0.4)] animate-[pulseGold_2s_infinite]',
    text: 'text-[#ffd700]',
    label: '🥇 第一名',
  },
  2: {
    border: 'border-[#c0c0c0]',
    glow: 'shadow-[0_0_20px_rgba(192,192,192,0.4)] animate-[pulseSilver_2s_infinite]',
    text: 'text-[#c0c0c0]',
    label: '🥈 第二名',
  },
  3: {
    border: 'border-[#cd7f32]',
    glow: 'shadow-[0_0_20px_rgba(205,127,50,0.4)] animate-[pulseBronze_2s_infinite]',
    text: 'text-[#cd7f32]',
    label: '🥉 第三名',
  },
};

export default function IdeaCard({
  card,
  rank,
  isVoting,
  userId,
  onVote,
  onDragStart,
  onDragOver,
  onDrop,
  draggable = false,
}: IdeaCardProps) {
  const { score, upvotes, downvotes, totalVotes, userVoted } = useMemo(() => {
    const ups = card.votes.filter((v) => v.value === 1).length;
    const downs = card.votes.filter((v) => v.value === -1).length;
    return {
      score: ups - downs,
      upvotes: ups,
      downvotes: downs,
      totalVotes: card.votes.length,
      userVoted: card.votes.find((v) => v.userId === userId)?.value,
    };
  }, [card.votes, userId]);

  const progressPercent = useMemo(() => {
    if (totalVotes === 0) return 0;
    return Math.round((upvotes / totalVotes) * 100);
  }, [upvotes, totalVotes]);

  const rankStyle = rank ? RANK_STYLES[rank] : null;

  const progressColor = (pct: number) => {
    if (pct < 33) return 'from-[#ff4757] to-[#ff6b7a]';
    if (pct < 66) return 'from-[#ffa502] to-[#ffbe4d]';
    return 'from-[#2ed573] to-[#5be394]';
  };

  return (
    <div
      className={`card p-4 transition-all duration-200 ${
        rankStyle ? `${rankStyle.border} border-2 ${rankStyle.glow}` : ''
      }`}
      draggable={draggable && !isVoting}
      onDragStart={onDragStart ? (e) => onDragStart(e, card.id) : undefined}
      onDragOver={onDragOver}
      onDrop={onDrop ? (e) => onDrop(e, card.id) : undefined}
    >
      <div className="flex items-start gap-3">
        {draggable && !isVoting && (
          <div className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 pt-1">
            <GripVertical size={18} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-[#ffd700]/20 flex items-center justify-center flex-shrink-0">
                <User size={14} className="text-[#ffd700]" />
              </div>
              <span className="text-sm text-[#9ca3af] truncate">{card.authorName}</span>
            </div>

            {rankStyle && (
              <div className={`flex items-center gap-1 ${rankStyle.text} text-xs font-bold flex-shrink-0`}>
                <Trophy size={14} />
                <span>{rankStyle.label}</span>
              </div>
            )}
          </div>

          <h4 className="font-semibold text-[#e0e0e0] mb-1 break-words">{card.title}</h4>
          <p className="text-sm text-[#9ca3af] mb-3 line-clamp-3 whitespace-pre-wrap break-words">
            {card.description}
          </p>

          {card.sketchData && (
            <div className="mb-3 rounded-lg overflow-hidden border border-white/10 bg-[#0f172a]">
              <img
                src={card.sketchData}
                alt="手绘草图"
                className="w-full h-auto max-h-40 object-contain"
              />
            </div>
          )}

          {isVoting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-[#9ca3af]">
                  {totalVotes} 人投票 · 赞成率 {progressPercent}%
                </span>
                <span className="text-[#e0e0e0] font-bold">
                  {score > 0 ? '+' : ''}
                  {score}
                </span>
              </div>

              <div className="h-2 rounded-full bg-[#0f172a] overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${progressColor(progressPercent)} transition-all duration-500`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => onVote?.(card.id, 1)}
                  disabled={!!userVoted}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    userVoted === 1
                      ? 'bg-[#2ed573]/20 text-[#2ed573] border border-[#2ed573]/30'
                      : userVoted
                      ? 'bg-[#16213e] text-[#666] cursor-not-allowed border border-white/5'
                      : 'bg-[#16213e] text-[#2ed573] hover:bg-[#2ed573]/10 border border-white/10 hover:border-[#2ed573]/30'
                  }`}
                >
                  <ThumbsUp size={14} />
                  <span>{upvotes}</span>
                </button>

                <button
                  onClick={() => onVote?.(card.id, -1)}
                  disabled={!!userVoted}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    userVoted === -1
                      ? 'bg-[#ff4757]/20 text-[#ff4757] border border-[#ff4757]/30'
                      : userVoted
                      ? 'bg-[#16213e] text-[#666] cursor-not-allowed border border-white/5'
                      : 'bg-[#16213e] text-[#ff4757] hover:bg-[#ff4757]/10 border border-white/10 hover:border-[#ff4757]/30'
                  }`}
                >
                  <ThumbsDown size={14} />
                  <span>{downvotes}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulseGold {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4); }
          50% { box-shadow: 0 0 0 10px rgba(255, 215, 0, 0); }
        }
        @keyframes pulseSilver {
          0%, 100% { box-shadow: 0 0 0 0 rgba(192, 192, 192, 0.4); }
          50% { box-shadow: 0 0 0 10px rgba(192, 192, 192, 0); }
        }
        @keyframes pulseBronze {
          0%, 100% { box-shadow: 0 0 0 0 rgba(205, 127, 50, 0.4); }
          50% { box-shadow: 0 0 0 10px rgba(205, 127, 50, 0); }
        }
      `}</style>
    </div>
  );
}
