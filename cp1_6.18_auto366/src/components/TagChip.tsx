import { X } from 'lucide-react';
import { getColorForTag } from '../utils/colors';

interface TagChipProps {
  tag: string;
  onRemove?: () => void;
  onClick?: () => void;
  active?: boolean;
  showRemove?: boolean;
}

export default function TagChip({ tag, onRemove, onClick, active, showRemove = true }: TagChipProps) {
  const color = getColorForTag(tag);

  return (
    <span
      onClick={onClick}
      className="inline-flex items-center h-6 px-2 rounded-full text-xs cursor-pointer transition-all duration-200 select-none"
      style={{
        backgroundColor: active ? color : '#E8E0F0',
        color: active ? '#fff' : '#4A3B6B',
        paddingLeft: '8px',
        paddingRight: showRemove ? '4px' : '8px',
      }}
    >
      <span className="truncate max-w-[80px]">{tag}</span>
      {showRemove && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 w-4 h-4 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors"
        >
          <X size={12} />
        </button>
      )}
    </span>
  );
}
