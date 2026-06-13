import { memo } from 'react';
import { DraggableProvided } from '@hello-pangea/dnd';
import { ClothingItem } from '@/types';
import { cn } from '@/lib/utils';

interface ClosetItemProps {
  item: ClothingItem;
  provided: DraggableProvided;
  isDragging: boolean;
}

const ClosetItem = memo(function ClosetItem({ item, provided, isDragging }: ClosetItemProps) {
  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={cn(
        'group relative overflow-hidden rounded-xl bg-white card-shadow transition-all duration-300',
        isDragging && 'drag-shadow scale-105 z-50',
        !isDragging && 'hover:card-shadow-hover hover:-translate-y-1'
      )}
      style={{ height: '240px' }}
    >
      <div className="relative h-40 overflow-hidden">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
        />
        <div
          className="absolute right-2 top-2 h-5 w-5 rounded-full border-2 border-white shadow-md"
          style={{ backgroundColor: item.color }}
        />
      </div>
      <div className="p-3">
        <h3 className="truncate text-sm font-medium text-gray-800">{item.name}</h3>
        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
          <span>{item.category}</span>
          <span>·</span>
          <span>{item.season}</span>
        </div>
      </div>
    </div>
  );
});

export default ClosetItem;
