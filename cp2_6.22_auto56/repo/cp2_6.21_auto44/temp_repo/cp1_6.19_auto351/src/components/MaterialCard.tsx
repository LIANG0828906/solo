import { motion } from 'framer-motion';
import type { Item } from '@/types';

interface MaterialCardProps {
  item: Item;
  onDragStart: (itemId: string) => void;
  compact?: boolean;
}

export default function MaterialCard({ item, onDragStart, compact = false }: MaterialCardProps) {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ itemId: item.id, source: 'backpack' }));
    e.dataTransfer.effectAllowed = 'move';
    onDragStart(item.id);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={`
        relative cursor-grab active:cursor-grabbing
        bg-[#2c2c2c] rounded-lg
        border border-[#424242]
        select-none
        transition-all duration-150
        hover:border-[var(--color-primary)] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.5)]
        ${compact ? 'px-2 py-1.5' : 'p-3'}
      `}
      style={item.color ? { borderLeftColor: item.color, borderLeftWidth: 3 } : undefined}
    >
      <div className={`flex items-center gap-2 ${compact ? '' : 'flex-col'}`}>
        <span className={compact ? 'text-base' : 'text-2xl'}>{item.icon}</span>
        <div className={compact ? 'flex items-center gap-2' : 'text-center'}>
          <span className={`text-[var(--color-text)] ${compact ? 'text-xs' : 'text-xs font-semibold'}`}>
            {item.name}
          </span>
          <span
            className="mono text-xs font-bold rounded px-1.5 py-0.5 ml-1"
            style={{ backgroundColor: 'rgba(255,183,77,0.15)', color: 'var(--color-primary)' }}
          >
            x{item.count}
          </span>
        </div>
      </div>

      {item.slots > 1 && (
        <div className="absolute top-1 right-1 text-[9px] mono text-[var(--color-text-muted)] bg-[#1a1a1a] px-1 rounded">
          {item.slots}格
        </div>
      )}
    </div>
  );
}
