import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { AuctionItem } from '@/types';
import { formatFullPrice } from '@/utils/formatters';
import { useAuctionStore } from '@/stores/auctionStore';

interface DragHandlers {
  draggableProps?: React.HTMLAttributes<HTMLDivElement>;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

interface FavoriteCardProps {
  item: AuctionItem;
  index: number;
  delay?: number;
  dragHandlers?: DragHandlers;
}

export default function FavoriteCard({ item, index, delay, dragHandlers }: FavoriteCardProps) {
  const toggleFavorite = useAuctionStore((s) => s.toggleFavorite);
  const [isDragging, setIsDragging] = useState(false);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(item.id);
  };

  const isDraggable = !!dragHandlers;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay ?? 0, duration: 0.3 }}
      whileHover={{ y: -4 }}
      className={cn(
        'relative w-[200px] h-[280px] rounded-2xl overflow-hidden',
        'bg-primary-card backdrop-blur-xl border border-primary-border',
        'shadow-gold-glow hover:shadow-hover-soft',
        'transition-all duration-300 flex flex-col',
        isDraggable && (isDragging ? 'cursor-grabbing' : 'cursor-grab'),
      )}
      {...(dragHandlers?.draggableProps as Record<string, unknown>)}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
    >
      <div
        className="relative w-full h-[160px] overflow-hidden flex-shrink-0"
        {...(dragHandlers?.dragHandleProps as Record<string, unknown>)}
      >
        <motion.img
          src={item.thumbnail}
          alt={item.name}
          className="w-full h-full object-cover"
          whileHover={{ scale: 1.08, filter: 'brightness(1.05)' }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary-bg/80 via-transparent to-transparent" />
      </div>

      <button
        onClick={handleRemove}
        className={cn(
          'absolute top-2 right-2 z-10',
          'w-7 h-7 rounded-full',
          'bg-red-500/90 hover:bg-red-600',
          'flex items-center justify-center',
          'shadow-lg backdrop-blur-sm',
          'transition-all duration-200',
          'hover:scale-110 active:scale-95',
        )}
      >
        <X className="w-4 h-4 text-white" strokeWidth={2.5} />
      </button>

      <div className="flex-1 flex flex-col justify-between p-3 gap-2">
        <h3 className="text-sm font-semibold text-white line-clamp-2 leading-snug">
          {item.name}
        </h3>
        <div className="flex items-baseline justify-between">
          <span className="text-primary-gold font-display text-lg font-bold">
            {formatFullPrice(item.currentPrice)}
          </span>
          <span className="text-xs text-primary-text/60">
            {item.bidCount}次出价
          </span>
        </div>
      </div>
    </motion.div>
  );
}
