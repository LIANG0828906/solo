import { Link } from 'react-router-dom';
import { Tag } from 'lucide-react';
import type { Instrument } from '../types';
import { CATEGORY_LABELS, INSTRUMENT_STATUS_LABELS } from '../types';
import { cn } from '@/lib/utils';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

interface Props {
  instrument: Instrument;
  onDelete?: (id: string) => void;
  showDelete?: boolean;
}

export default function InstrumentCard({ instrument, onDelete, showDelete }: Props) {
  const { ref, isIntersecting } = useIntersectionObserver<HTMLDivElement>({ rootMargin: '100px' });
  const coverImage = instrument.images?.[0];

  return (
    <div
      ref={ref}
      className={cn(
        'group bg-white rounded-xl shadow-md overflow-hidden',
        'transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
        'opacity-0 animate-fade-in'
      )}
      style={{ animationFillMode: 'forwards', animationDelay: '0ms' }}
    >
      <Link to={`/instrument/${instrument.id}`} className="block">
        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
          {isIntersecting && coverImage ? (
            <img
              src={coverImage}
              alt={instrument.name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Tag className="w-12 h-12" />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <span
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium',
                instrument.status === 'available'
                  ? 'bg-green-100 text-green-700'
                  : instrument.status === 'pending'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-gray-200 text-gray-600'
              )}
            >
              {INSTRUMENT_STATUS_LABELS[instrument.status]}
            </span>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
              {instrument.name}
            </h3>
            <span className="shrink-0 px-2 py-0.5 text-xs bg-amber-50 text-amber-700 rounded-md">
              {CATEGORY_LABELS[instrument.category]}
            </span>
          </div>

          <p className="text-sm text-gray-500 mb-3">
            {instrument.brand} · {instrument.purchaseYear}年
          </p>

          <div className="flex items-end justify-between">
            <div>
              <span className="text-2xl font-bold text-[#8B5A2B]">
                ¥{instrument.dailyRate}
              </span>
              <span className="text-sm text-gray-500">/天</span>
            </div>
            <div className="text-xs text-gray-400">
              押金 ¥{instrument.deposit}
            </div>
          </div>
        </div>
      </Link>

      {showDelete && onDelete && (
        <div className="px-4 pb-4">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(instrument.id);
            }}
            className={cn(
              'w-full py-2 rounded-lg text-sm font-medium',
              'bg-red-50 text-red-600 hover:bg-red-100 transition-colors'
            )}
          >
            删除
          </button>
        </div>
      )}
    </div>
  );
}
