import React, { useState, useCallback } from 'react';
import type { ColorItem } from '../../store/colorStore';
import {
  rgbToString,
  hslToString,
  copyToClipboard,
} from '../../utils/colorUtils';

interface ColorCardProps {
  color: ColorItem;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onToggleLock: (id: string) => void;
  onRemove: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: (id: string) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isDragOver: boolean;
}

const ColorCard: React.FC<ColorCardProps> = ({
  color,
  isSelected,
  onSelect,
  onToggleLock,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
  isDragOver,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = useCallback(async (text: string, field: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 800);
    }
  }, []);

  const handleLockClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleLock(color.id);
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(color.id);
  };

  const getTextColor = (bg: string) => {
    const { r, g, b } = color.rgb;
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.55 ? '#1F2937' : '#FFFFFF';
  };

  const textColor = getTextColor(color.hex);

  return (
    <div
      draggable
      onDragStart={() => onDragStart(color.id)}
      onDragOver={(e) => onDragOver(e, color.id)}
      onDrop={() => onDrop(color.id)}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      style={{
        width: 160,
        background: '#2D2E44',
        borderRadius: 12,
        boxShadow: isSelected
          ? '0 8px 24px rgba(139, 92, 246, 0.35)'
          : '0 4px 12px rgba(139, 92, 246, 0.12)',
        overflow: 'hidden',
        cursor: 'pointer',
        transform: isSelected ? 'scale(1.04)' : 'scale(1)',
        transition: 'all 0.3s ease-out',
        opacity: isDragging ? 0.4 : 1,
        outline: isDragOver ? '2px solid #8B5CF6' : 'none',
        outlineOffset: 2,
      }}
    >
      <div
        style={{
          height: 80,
          background: color.hex,
          borderRadius: '12px 12px 0 0',
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: 6,
        }}
      >
        <button
          onClick={handleLockClick}
          title={color.locked ? '点击解锁' : '点击锁定'}
          style={{
            width: 24,
            height: 24,
            border: 'none',
            background: 'rgba(0,0,0,0.25)',
            backdropFilter: 'blur(4px)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: textColor,
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.4)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.25)')}
        >
          {color.locked ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
            </svg>
          )}
        </button>
        <button
          onClick={handleRemoveClick}
          title="删除颜色"
          style={{
            width: 24,
            height: 24,
            border: 'none',
            background: 'rgba(0,0,0,0.25)',
            backdropFilter: 'blur(4px)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: textColor,
            opacity: 0.9,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(220, 38, 38, 0.7)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.25)')}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
          <span
            style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: '#E4E4E7',
              letterSpacing: 0.2,
              textTransform: 'uppercase',
            }}
          >
            {color.hex}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
            {color.percentage > 0 ? `${color.percentage.toFixed(1)}%` : '—'}
          </span>
        </div>

        <div
          style={{
            maxHeight: isSelected ? 200 : 0,
            overflow: 'hidden',
            transition: 'max-height 0.3s ease-out, opacity 0.3s ease-out, margin 0.3s ease-out',
            opacity: isSelected ? 1 : 0,
            marginTop: isSelected ? 10 : 0,
          }}
        >
          {[
            { key: 'hex', label: 'HEX', value: color.hex.toUpperCase() },
            { key: 'rgb', label: 'RGB', value: rgbToString(color.rgb) },
            { key: 'hsl', label: 'HSL', value: hslToString(color.hsl) },
          ].map(({ key, label, value }) => (
            <div
              key={key}
              onClick={(e) => {
                e.stopPropagation();
                handleCopy(value, key);
              }}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 8px',
                marginBottom: 4,
                borderRadius: 6,
                background: 'rgba(255,255,255,0.04)',
                cursor: 'pointer',
                transition: 'background 0.15s',
                position: 'relative',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(165, 180, 252, 0.12)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
            >
              <span style={{ fontSize: '0.7rem', color: '#6B7280', minWidth: 32 }}>{label}</span>
              <span
                style={{
                  fontSize: '0.72rem',
                  color: copiedField === key ? '#10B981' : '#A5B4FC',
                  fontWeight: copiedField === key ? 700 : 500,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
                  transition: 'all 0.2s',
                }}
              >
                {copiedField === key ? '✓ 已复制' : value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default React.memo(ColorCard);
