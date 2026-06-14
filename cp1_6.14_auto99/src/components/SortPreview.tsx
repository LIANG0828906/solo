import { useMemo, useState } from 'react';
import { SortQuestion, FontSize, SortItem } from '../types/question';
import { parseRichText } from '../utils/questionParser';
import { cn } from '@/lib/utils';

interface SortPreviewProps {
  value: SortQuestion;
  fontSize: FontSize;
}

const fontSizeMap = {
  small: 'text-sm',
  medium: 'text-base',
  large: 'text-lg',
};

export default function SortPreview({ value, fontSize }: SortPreviewProps) {
  const stemHtml = useMemo(() => parseRichText(value.stem), [value.stem]);
  const fontClass = fontSizeMap[fontSize];
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const sortedItems = useMemo(() => {
    const itemMap = new Map(value.items.map((item) => [item.id, item]));
    return value.correctOrder
      .map((id) => itemMap.get(id))
      .filter((item): item is SortItem => item !== undefined);
  }, [value.items, value.correctOrder]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="w-full">
      <style>{`
        .sort-card {
          transition: all 0.2s ease;
          cursor: grab;
        }
        .sort-card:active {
          cursor: grabbing;
        }
        .sort-card.dragging {
          opacity: 0.5;
          transform: rotate(15deg);
        }
        .sort-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(26, 54, 93, 0.15);
        }
        .sort-order-badge {
          background-color: #1a365d;
        }
      `}</style>

      <div
        className={cn('mb-6 font-medium text-gray-800', fontClass)}
        dangerouslySetInnerHTML={{ __html: stemHtml }}
      />

      <div className="flex flex-wrap gap-4">
        {sortedItems.map((item, index) => {
          const itemHtml = parseRichText(item.content);
          const isDragging = draggedIndex === index;

          return (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                'sort-card relative flex items-center gap-3 rounded-xl border-2 border-gray-200 bg-white px-4 py-3',
                isDragging && 'dragging',
                fontClass
              )}
              style={{ borderRadius: '12px', minWidth: '120px' }}
            >
              <div className="sort-order-badge flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-white text-xs font-semibold">
                {index + 1}
              </div>
              <div
                className="text-gray-700 whitespace-nowrap"
                dangerouslySetInnerHTML={{ __html: itemHtml }}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-sm text-gray-500">
        <span className="font-medium" style={{ color: '#1a365d' }}>正确排序：</span>
        {sortedItems.map((item, index) => (
          <span key={item.id}>
            {index > 0 && ' → '}
            <span className="font-medium">{item.content}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
