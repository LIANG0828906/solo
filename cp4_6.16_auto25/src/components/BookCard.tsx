import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';
import type { Book } from '@/types';
import { STATUS_LABELS, STATUS_COLORS } from '@/types';
import { cn } from '@/lib/utils';

interface BookCardProps {
  book: Book;
  index?: number;
}

export default function BookCard({ book, index = 0 }: BookCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/book/${book.id}`);
  };

  const statusColor = STATUS_COLORS[book.status];
  const statusLabel = STATUS_LABELS[book.status];
  const firstChar = book.title.charAt(0);

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group cursor-pointer overflow-hidden rounded-lg',
        'bg-cornsilk/60 shadow-card',
        'hover:shadow-card-hover hover:-translate-y-1',
        'transition-all duration-300 ease-out',
        'animate-fade-in-up'
      )}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-oak-200 to-oak-400">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : null}

        {!book.coverUrl ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-serif text-white/90 drop-shadow-lg">
              {firstChar}
            </span>
          </div>
        ) : null}

        <div
          className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium text-white shadow-sm"
          style={{ backgroundColor: statusColor }}
        >
          {statusLabel}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-serif text-base font-semibold text-oak-800 truncate mb-1 group-hover:text-oak-600 transition-colors">
          {book.title}
        </h3>
        <p className="text-sm text-oak-500 truncate mb-3">{book.author}</p>

        <div className="flex items-center text-xs text-oak-400">
          <Clock size={14} className="mr-1.5" />
          <span>{format(book.updatedAt, 'yyyy-MM-dd HH:mm')}</span>
        </div>
      </div>
    </div>
  );
}
