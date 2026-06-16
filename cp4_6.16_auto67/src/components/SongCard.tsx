import { Play, Pause } from 'lucide-react';
import type { Work } from '../types';
import { COLORS } from '../utils/constants';

interface SongCardProps {
  work: Work;
  isSelected: boolean;
  isPlaying: boolean;
  onClick: () => void;
  onPlayToggle: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
  className?: string;
}

export function SongCard({
  work,
  isSelected,
  isPlaying,
  onClick,
  onPlayToggle,
  style,
  className = '',
}: SongCardProps) {
  const initial = work.title.charAt(0).toUpperCase();

  return (
    <div
      onClick={onClick}
      style={style}
      className={`
        relative group cursor-pointer rounded-card overflow-hidden glass-card
        transition-all duration-300 ease-out
        hover:translate-y-[-8px] hover:shadow-card-hover
        ${isSelected ? 'ring-2 ring-accent shadow-glow' : ''}
        ${className}
      `}
    >
      <div
        className="relative h-24 flex items-center justify-center"
        style={{ background: work.coverColor }}
      >
        <span className="text-4xl font-bold text-white/90 drop-shadow-lg">
          {initial}
        </span>

        <button
          onClick={onPlayToggle}
          className="
            absolute bottom-2 right-2 w-8 h-8 rounded-full
            bg-black/40 backdrop-blur-sm flex items-center justify-center
            opacity-0 group-hover:opacity-100 transition-all duration-200
            hover:bg-accent hover:scale-110
          "
        >
          {isPlaying && isSelected ? (
            <Pause className="w-4 h-4 text-white" />
          ) : (
            <Play className="w-4 h-4 text-white ml-0.5" />
          )}
        </button>

        <span
          className="
            absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium text-white
          "
          style={{
            background:
              work.status === 'published'
                ? COLORS.publishedGradient
                : COLORS.draftGradient,
          }}
        >
          {work.status === 'published' ? '已发布' : '草稿'}
        </span>
      </div>

      <div className="p-3">
        <h3 className="font-medium text-text-primary truncate text-sm">
          {work.title}
        </h3>
        <p className="text-xs text-text-secondary mt-1">
          {work.milestones.length} 个里程碑
        </p>
      </div>
    </div>
  );
}
