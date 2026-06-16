import { CATEGORY_COLORS, EMOTION_TAGS } from '@/constants/tags';
import type { EmotionCategory } from '@/types';

interface TagChipProps {
  tag: string;
  selected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  size?: 'sm' | 'md';
}

export function TagChip({ tag, selected, onClick, onRemove, size = 'md' }: TagChipProps) {
  const tagInfo = EMOTION_TAGS.find((t) => t.name === tag);
  const color = tagInfo ? CATEGORY_COLORS[tagInfo.category] : '#666';
  
  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs' 
    : 'px-3 py-1 text-sm';

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full font-medium transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:opacity-80' : ''
      } ${sizeClasses}`}
      style={{
        backgroundColor: selected ? color : `${color}20`,
        color: selected ? '#fff' : color,
        border: `2px solid ${selected ? color : 'transparent'}`,
      }}
    >
      {tag}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:opacity-70"
          style={{ color: selected ? '#fff' : color }}
        >
          ×
        </button>
      )}
    </span>
  );
}

export function getTagCategory(tag: string): EmotionCategory {
  const tagInfo = EMOTION_TAGS.find((t) => t.name === tag);
  return tagInfo?.category || 'mystery';
}
