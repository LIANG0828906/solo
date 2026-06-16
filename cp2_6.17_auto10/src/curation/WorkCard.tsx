import { TagChip } from '@/components/TagChip';
import type { Work } from '@/types';

interface WorkCardProps {
  work: Work;
  onClick?: () => void;
  highlighted?: boolean;
  style?: React.CSSProperties;
  index?: number;
}

export function WorkCard({ work, onClick, highlighted, style, index = 0 }: WorkCardProps) {
  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer overflow-hidden rounded-xl bg-[#2D2D44] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] ${
        highlighted ? 'ring-2 ring-[#FF6B6B]' : ''
      }`}
      style={{
        ...style,
        animationDelay: `${index * 50}ms`,
        opacity: 0,
        animation: `fadeInUp 0.5s ease-out ${index * 50}ms forwards`,
      }}
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={work.cover}
          alt={work.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>
      
      <div className="p-4">
        <h3 className="mb-2 truncate text-base font-semibold text-white">
          {work.title}
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {work.tags.slice(0, 3).map((tag) => (
            <TagChip key={tag} tag={tag} size="sm" />
          ))}
          {work.tags.length > 3 && (
            <span className="inline-flex items-center rounded-full bg-white/10 px-2 py-0.5 text-xs text-gray-400">
              +{work.tags.length - 3}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
