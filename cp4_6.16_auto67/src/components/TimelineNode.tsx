import { useState, useEffect } from 'react';
import {
  PenLine,
  Music,
  Mic,
  SlidersHorizontal,
  Rocket,
  ChevronDown,
  Play,
  Pause,
  Calendar,
  MessageSquare,
  Star,
} from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Milestone, AudioPlayerState, VoteStats } from '../types';
import { MILESTONE_TYPES, COLORS } from '../utils/constants';
import { AudioPlayerUI } from './AudioPlayerUI';
import { StarRating } from './StarRating';

interface TimelineNodeProps {
  milestone: Milestone;
  index: number;
  isExpanded: boolean;
  isSelectedSong: boolean;
  audioState: AudioPlayerState;
  voteStats: VoteStats;
  recentComments: { id: string; comment: string; score: number; createdAt: string }[];
  onToggle: () => void;
  onPlayToggle: () => void;
  onSeek: (progress: number) => void;
  onVote: (score: number, comment?: string) => void;
  workTitle: string;
}

const iconMap: Record<string, React.ElementType> = {
  writing: PenLine,
  arrangement: Music,
  recording: Mic,
  mixing: SlidersHorizontal,
  release: Rocket,
};

export function TimelineNode({
  milestone,
  index,
  isExpanded,
  isSelectedSong,
  audioState,
  voteStats,
  recentComments,
  onToggle,
  onPlayToggle,
  onSeek,
  onVote,
  workTitle,
}: TimelineNodeProps) {
  const milestoneInfo = MILESTONE_TYPES[milestone.type] || MILESTONE_TYPES.writing;
  const Icon = iconMap[milestone.type] || PenLine;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [animatingStats, setAnimatingStats] = useState(false);

  const handleSubmitVote = async () => {
    if (rating === 0 || isSubmitting) return;
    setIsSubmitting(true);
    onVote(rating, comment);
    setComment('');
    setRating(0);
    setAnimatingStats(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setAnimatingStats(false);
    }, 600);
  };

  useEffect(() => {
    if (!isExpanded) {
      setRating(0);
      setComment('');
    }
  }, [isExpanded]);

  const isLast = false;

  return (
    <div className="relative flex gap-4">
      <div className="relative flex flex-col items-center">
        <div
          className={`
            relative w-12 h-12 rounded-full flex items-center justify-center
            transition-all duration-500 ease-out z-10
            ${isExpanded ? 'scale-125 shadow-glow' : 'scale-100'}
          `}
          style={{
            background: `linear-gradient(135deg, ${milestoneInfo.color}, ${milestoneInfo.color}88)`,
          }}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>

        {!isLast && (
          <div
            className="absolute top-12 w-0.5 h-full"
            style={{
              background: `linear-gradient(180deg, ${milestoneInfo.color} 0%, rgba(99,102,241,0.3) 100%)`,
              backgroundImage: `repeating-linear-gradient(
                180deg,
                ${milestoneInfo.color},
                ${milestoneInfo.color} 4px,
                transparent 4px,
                transparent 8px
              )`,
              opacity: 0.6,
            }}
          />
        )}
      </div>

      <div className="flex-1 pb-8">
        <div
          onClick={onToggle}
          className={`
            glass-card rounded-card p-4 cursor-pointer
            transition-all duration-500 ease-out
            hover:shadow-card-hover
            ${isExpanded ? 'scale-100 shadow-card-hover' : 'hover:translate-x-1'}
            ${!isSelectedSong && !isExpanded ? 'opacity-70 scale-[0.98]' : ''}
          `}
          style={{ transformOrigin: 'center center' }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: milestoneInfo.color + '40' }}
                >
                  {milestoneInfo.label}
                </span>
                <span className="text-xs text-text-secondary flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(milestone.date), 'yyyy年MM月dd日', { locale: zhCN })}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-text-primary mt-2">
                {milestone.title}
              </h3>
            </div>

            <button
              className={`
                p-1 rounded-full hover:bg-white/10 transition-all duration-300
                ${isExpanded ? 'rotate-180' : ''}
              `}
            >
              <ChevronDown className="w-5 h-5 text-text-secondary" />
            </button>
          </div>

          <p className="text-sm text-text-secondary mt-2 line-clamp-2">
            {milestone.description}
          </p>

          {isExpanded && (
            <div className="mt-4 space-y-4 animate-fade-in">
              <div className="border-t border-white/10 pt-4">
                <AudioPlayerUI
                  audioState={audioState}
                  onPlayPause={onPlayToggle}
                  onSeek={onSeek}
                  workTitle={workTitle}
                />
              </div>

              <div className="border-t border-white/10 pt-4">
                <h4 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-accent" />
                  粉丝评分
                </h4>

                <div className="flex items-center gap-4 mb-4">
                  <div className="text-3xl font-bold gradient-text">
                    <span className={animatingStats ? 'animate-count-up' : ''}>
                      {voteStats.averageScore.toFixed(1)}
                    </span>
                  </div>
                  <div>
                    <StarRating
                      value={Math.round(voteStats.averageScore)}
                      readOnly
                      size="sm"
                    />
                    <p className="text-xs text-text-secondary mt-1">
                      共{' '}
                      <span className={animatingStats ? 'animate-count-up' : ''}>
                        {voteStats.totalVotes}
                      </span>{' '}
                      票
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <StarRating value={rating} onChange={setRating} size="lg" />

                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value.slice(0, 200))}
                    placeholder="写下你的想法... (不超过200字)"
                    className="
                      w-full h-20 p-3 rounded-lg
                      bg-black/20 border border-white/10
                      text-text-primary text-sm
                      placeholder:text-text-secondary/50
                      resize-none
                      focus:outline-none focus:border-accent/50
                      transition-colors duration-200
                    "
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">
                      {comment.length}/200
                    </span>
                    <button
                      onClick={handleSubmitVote}
                      disabled={rating === 0 || isSubmitting}
                      className={`
                        px-4 py-2 rounded-lg text-sm font-medium
                        transition-all duration-200
                        ${rating > 0 && !isSubmitting
                          ? 'bg-gradient-to-r from-accent to-accent-dark text-white hover:shadow-glow hover:scale-105 active:scale-95'
                          : 'bg-white/10 text-text-secondary cursor-not-allowed'}
                      `}
                    >
                      {isSubmitting ? '提交中...' : '提交评分'}
                    </button>
                  </div>
                </div>
              </div>

              {recentComments.length > 0 && (
                <div className="border-t border-white/10 pt-4">
                  <h4 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-accent" />
                    最新评论
                  </h4>

                  <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                    {recentComments.map((c, i) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-lg bg-black/20 animate-bounce-in"
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, s) => (
                              <Star
                                key={s}
                                className="w-3 h-3"
                                fill={s < c.score ? '#ffb347' : 'none'}
                                stroke={s < c.score ? '#ffb347' : '#4b5563'}
                                strokeWidth={2}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-text-secondary">
                            {format(new Date(c.createdAt), 'MM-dd HH:mm')}
                          </span>
                        </div>
                        {c.comment && (
                          <p className="text-sm text-text-secondary">{c.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
