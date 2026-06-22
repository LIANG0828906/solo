import { cn } from '@/lib/utils';
import type { Mood } from '@/types';

interface MoodCardProps {
  mood: Mood;
  selected?: boolean;
  onClick?: () => void;
}

export default function MoodCard({ mood, selected, onClick }: MoodCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-2xl p-5 transition-all duration-300',
        'bg-gradient-to-br shadow-lg hover:shadow-xl hover:scale-105',
        mood.gradient,
        selected && 'ring-4 ring-white/60 scale-105 shadow-2xl'
      )}
    >
      <div className="flex flex-col items-center gap-2 text-white">
        <span className="text-4xl drop-shadow-md">{mood.emoji}</span>
        <span className="text-sm font-semibold tracking-wide drop-shadow-sm">
          {mood.label}
        </span>
      </div>
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </button>
  );
}
