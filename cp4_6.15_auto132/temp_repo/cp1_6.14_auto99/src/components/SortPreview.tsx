import { useMemo, useState } from 'react';
import { SortQuestion, FontSize, SortItem } from '../types/question';
import { parseRichText } from '../utils/questionParser';

interface SortPreviewProps {
  value: SortQuestion;
  fontSize: FontSize;
}

const fontSizeValueMap: Record<FontSize, number> = {
  small: 14,
  medium: 16,
  large: 18,
};

export default function SortPreview({ value, fontSize }: SortPreviewProps) {
  const stemHtml = useMemo(() => parseRichText(value.stem), [value.stem]);
  const fontSizeValue = fontSizeValueMap[fontSize];
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const sortedItems = useMemo(() => {
    const itemMap = new Map(value.items.map((item) => [item.id, item]));
    return value.correctOrder
      .map((id) => itemMap.get(id))
      .filter((item): item is SortItem => item !== undefined);
  }, [value.items, value.correctOrder]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div style={{ width: '100%' }}>
      <style>{`
        .sort-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
          cursor: grab;
          display: flex;
          align-items: center;
          gap: 12px;
          border: 2px solid #e5e7eb;
          background-color: #ffffff;
          padding: 12px 16px;
          border-radius: 12px;
          min-width: 120px;
          position: relative;
        }
        .sort-card:active {
          cursor: grabbing;
        }
        .sort-card.dragging {
          opacity: 0.5;
          transform: scale(1.05) rotate(15deg);
        }
        .sort-card:hover:not(.dragging) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(26, 54, 93, 0.15);
        }
        .sort-order-badge {
          background-color: #1a365d;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          flex-shrink: 0;
          border-radius: 50%;
          color: #ffffff;
          font-size: 12px;
          font-weight: 600;
        }
      `}</style>

      <div
        style={{
          marginBottom: 24,
          fontWeight: 500,
          color: '#1f2937',
          fontSize: fontSizeValue,
          transition: 'font-size 0.3s ease',
        }}
        dangerouslySetInnerHTML={{ __html: stemHtml }}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {sortedItems.map((item, index) => {
          const itemHtml = parseRichText(item.content);
          const isDragging = draggedIndex === index;

          return (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              className={`sort-card${isDragging ? ' dragging' : ''}`}
              style={{
                fontSize: fontSizeValue,
                transition: 'font-size 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease',
              }}
            >
              <div className="sort-order-badge">
                {index + 1}
              </div>
              <div
                style={{ color: '#374151', whiteSpace: 'nowrap' }}
                dangerouslySetInnerHTML={{ __html: itemHtml }}
              />
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 24, fontSize: 14, color: '#6b7280' }}>
        <span style={{ fontWeight: 500, color: '#1a365d' }}>正确排序：</span>
        {sortedItems.map((item, index) => (
          <span key={item.id}>
            {index > 0 && ' → '}
            <span style={{ fontWeight: 500 }}>{item.content}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
