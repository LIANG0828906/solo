import React, { useRef } from 'react';
import { useDrop } from 'react-dnd';
import { ItemTypes, BookDragItem, ITheme } from '../types';

interface ThemeTagProps {
  theme: ITheme;
  isActive?: boolean;
  isPulsing?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  onDropBook?: (bookId: string) => void;
}

const ThemeTag: React.FC<ThemeTagProps> = ({ theme, isActive, isPulsing, onClick, onRemove, onDropBook }) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isOver, canDrop }, drop] = useDrop<BookDragItem, unknown, { isOver: boolean; canDrop: boolean }>(() => ({
    accept: ItemTypes.BOOK,
    drop: (item) => {
      onDropBook?.(item.bookId);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [onDropBook]);

  drop(ref);

  const isDarkColor = (color: string) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 150;
  };

  return (
    <div
      ref={ref}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        borderRadius: '20px',
        backgroundColor: theme.color,
        color: isDarkColor(theme.color) ? '#FFFFFF' : '#2C2C2C',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        boxShadow: isActive
          ? `0 0 0 2px var(--primary-color), 0 4px 6px rgba(0, 0, 0, 0.1)`
          : isOver && canDrop
          ? `0 0 0 2px var(--primary-color), 0 4px 6px rgba(0, 0, 0, 0.1)`
          : '0 1px 2px rgba(0, 0, 0, 0.05)',
        transform: isActive ? 'scale(1.05)' : isOver && canDrop ? 'scale(1.02)' : 'scale(1)',
        animation: isPulsing ? 'theme-pulse 0.6s ease-out' : undefined,
        userSelect: 'none',
      }}
    >
      <span>{theme.name}</span>
      <span
        style={{
          fontSize: '12px',
          opacity: 0.8,
          backgroundColor: isDarkColor(theme.color) ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
          padding: '2px 8px',
          borderRadius: '10px',
        }}
      >
        {theme.bookIds.length}
      </span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'inherit',
            fontSize: '16px',
            cursor: 'pointer',
            padding: '0 4px',
            lineHeight: 1,
            opacity: 0.7,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};

export default ThemeTag;
