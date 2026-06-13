import { memo, useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { ClothingItem } from '@/types';
import { cn } from '@/lib/utils';

interface ClosetItemProps {
  item: ClothingItem;
  index: number;
  draggable?: boolean;
  droppableId?: string;
  selected?: boolean;
  onSelect?: (id: string) => void;
  compact?: boolean;
}

const ClosetItem = memo(function ClosetItem({
  item,
  index,
  draggable = false,
  droppableId = 'closet',
  selected = false,
  onSelect,
  compact = false,
}: ClosetItemProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const cardContent = (
    <div
      onClick={draggable ? undefined : onSelect ? () => onSelect(item.id) : undefined}
      className={cn(
        'group relative overflow-hidden bg-white transition-all duration-200',
        compact ? 'rounded-lg' : 'rounded-xl',
        selected && 'ring-2 ring-blue-500 ring-offset-2',
        !draggable && onSelect && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg',
        !draggable && !onSelect && 'hover:-translate-y-0.5 hover:shadow-lg'
      )}
      style={{
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        borderRadius: compact ? 8 : 12,
      }}
    >
      <div className={cn('relative overflow-hidden', compact ? 'h-24' : 'h-40')}>
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 animate-pulse bg-gray-100" />
        )}
        {imgError ? (
          <div className="flex h-full w-full items-center justify-center bg-gray-50">
            <div
              className="h-12 w-12 rounded-full"
              style={{ backgroundColor: item.color }}
            />
          </div>
        ) : (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            decoding="async"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
          />
        )}
        <div
          className="absolute right-2 top-2 rounded-full border-2 border-white shadow-sm"
          style={{
            backgroundColor: item.color,
            width: compact ? 14 : 20,
            height: compact ? 14 : 20,
          }}
        />
        {selected && (
          <div className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white">
            ✓
          </div>
        )}
      </div>
      <div className={cn('px-2', compact ? 'py-1.5' : 'p-3')}>
        <h3 className={cn('truncate font-medium text-gray-800', compact ? 'text-xs' : 'text-sm')}>
          {item.name}
        </h3>
        {!compact && (
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
            <span>{item.category}</span>
            <span>·</span>
            <span>{item.season}</span>
          </div>
        )}
      </div>
    </div>
  );

  if (!draggable) {
    return cardContent;
  }

  return (
    <Draggable draggableId={`${droppableId}-${item.id}`} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            'transition-shadow duration-200',
            snapshot.isDragging && 'z-50 scale-110'
          )}
          style={{
            ...provided.draggableProps.style,
            boxShadow: snapshot.isDragging
              ? '0 8px 32px rgba(0,0,0,0.25)'
              : undefined,
          }}
        >
          {cardContent}
        </div>
      )}
    </Draggable>
  );
});

export default ClosetItem;
