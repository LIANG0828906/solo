import React from 'react';
import { X } from 'lucide-react';

interface TagChipProps {
  label: string;
  onRemove?: () => void;
  size?: 'sm' | 'md';
  active?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

const TagChip: React.FC<TagChipProps> = ({
  label,
  onRemove,
  size = 'md',
  active = false,
  onClick,
  style,
}) => {
  const padding = size === 'sm' ? '4px 10px' : '6px 12px';
  const fontSize = size === 'sm' ? 12 : 13;

  const bg = active ? '#3B82F6' : '#E0E7FF';
  const color = active ? '#FFFFFF' : '#4338CA';

  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding,
        backgroundColor: bg,
        color,
        fontSize,
        fontWeight: 500,
        borderRadius: 8,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      <span>{label}</span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color,
            borderRadius: '50%',
            padding: 1,
            opacity: 0.7,
            transition: 'opacity 0.2s ease',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.7')}
        >
          <X size={size === 'sm' ? 12 : 14} />
        </button>
      )}
    </span>
  );
};

export default TagChip;
