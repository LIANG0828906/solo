import React, { useCallback, useRef, useState } from 'react';
import { Trash2, Copy, Check } from 'lucide-react';
import type { PaletteItem } from '../types';
import { useGradientStore } from '../store';
import { generateGradientCss, generateFullCss } from '../utils/cssGenerator';

interface PaletteCardProps {
  item: PaletteItem;
  index: number;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  dragOverIndex: number | null;
}

export const PaletteCard: React.FC<PaletteCardProps> = React.memo(function PaletteCard({
  item,
  index,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
  dragOverIndex
}) {
  const deletePalette = useGradientStore((s) => s.deletePalette);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const deleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const gradientStyle = useCallback(
    () => ({
      background: generateGradientCss(item.gradient)
    }),
    [item.gradient]
  );

  const handleDelete = useCallback(() => {
    if (deleteTimer.current) clearTimeout(deleteTimer.current);
    setDeleting(true);
    deleteTimer.current = setTimeout(() => {
      deletePalette(item.id);
      setDeleting(false);
    }, 300);
  }, [deletePalette, item.id]);

  const handleCopy = useCallback(async () => {
    try {
      const css = generateFullCss(item.gradient);
      await navigator.clipboard.writeText(css);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error('复制失败:', e);
    }
  }, [item.gradient]);

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
      onDragStart(index);
    },
    [index, onDragStart]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      onDragOver(index);
    },
    [index, onDragOver]
  );

  const isDropTarget = dragOverIndex === index && !isDragging;

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={onDragEnd}
      className={deleting ? 'card-deleting' : ''}
      style={{
        width: 180,
        backgroundColor: 'var(--color-bg-card)',
        borderRadius: 8,
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? 'scale(1.05)' : 'none',
        boxShadow: isDragging ? 'var(--shadow-drag)' : 'none',
        outline: isDropTarget ? '2px dashed var(--color-accent)' : 'none',
        transition: isDragging ? 'none' : 'transform 200ms ease, box-shadow 200ms ease',
        userSelect: 'none'
      }}
    >
      <div
        style={{
          width: '100%',
          height: 100,
          ...gradientStyle()
        }}
      />
      <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--color-text-secondary)',
            lineHeight: 1.4,
            wordBreak: 'break-all'
          }}
          title={`linear-gradient(${item.gradient.angle}deg, ${item.gradient.startColor}, ${item.gradient.endColor})`}
        >
          linear-gradient({item.gradient.angle}deg, {item.gradient.startColor},{' '}
          {item.gradient.endColor})
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={handleCopy}
            style={{
              flex: 1,
              height: 28,
              borderRadius: 6,
              backgroundColor: 'var(--color-bg-input)',
              color: 'var(--color-text-primary)',
              fontSize: 11,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              transition: 'all 150ms ease',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform =
                'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform =
                'translateY(0)';
            }}
          >
            {copied ? (
              <>
                <Check size={13} color="#22c55e" />
                <span style={{ color: '#22c55e' }}>已复制</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                复制CSS
              </>
            )}
            {copied && (
              <span
                className="toast-copied"
                style={{
                  position: 'absolute',
                  top: -28,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#22c55e',
                  color: 'white',
                  padding: '4px 10px',
                  borderRadius: 4,
                  fontSize: 11,
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none'
                }}
              >
                已复制
              </span>
            )}
          </button>
          <button
            onClick={handleDelete}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              backgroundColor: 'var(--color-bg-input)',
              color: 'var(--color-danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 150ms ease'
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                'var(--color-danger)';
              (e.currentTarget as HTMLButtonElement).style.color = 'white';
              (e.currentTarget as HTMLButtonElement).style.transform =
                'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                'var(--color-bg-input)';
              (e.currentTarget as HTMLButtonElement).style.color =
                'var(--color-danger)';
              (e.currentTarget as HTMLButtonElement).style.transform =
                'translateY(0)';
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
});

export default PaletteCard;
