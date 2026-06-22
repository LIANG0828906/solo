import { cn } from '@/lib/utils';
import { Heart, MessageCircle } from 'lucide-react';
import type { Poem } from '@/types';

interface PoemCardProps {
  poem: Poem;
  index?: number;
  onClick?: () => void;
}

export default function PoemCard({ poem, index = 0, onClick }: PoemCardProps) {
  const animationDelay = `${index * 0.08}s`;

  return (
    <div
      className={cn(
        'bg-white rounded-xl p-5 shadow-sm cursor-pointer',
        'transition-all duration-300 ease-out',
        'hover:-translate-y-1 hover:shadow-md',
        'opacity-0',
        'animate-fade-scale-in'
      )}
      style={{ animationDelay, animationFillMode: 'forwards' }}
      onClick={onClick}
    >
      <h3 className="font-serif text-lg font-semibold text-brown-500 mb-2 line-clamp-1">
        {poem.title}
      </h3>
      <p className="text-brown-400 text-sm mb-3 line-clamp-3 font-sans leading-relaxed whitespace-pre-line">
        {poem.content}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {poem.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs bg-cream-200 text-brown-400 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs text-brown-300">
          <span className="flex items-center gap-1">
            <Heart className="w-4 h-4" fill={poem.liked ? 'currentColor' : 'none'} />
            {poem.likes}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            {typeof poem.comments === 'number' ? poem.comments : poem.comments.length}
          </span>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-cream-200 text-xs text-brown-300">
        {poem.authorName}
      </div>
    </div>
  );
}
