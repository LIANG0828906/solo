import React, { useRef, useState } from 'react';
import { X, Plus } from 'lucide-react';
import { hexToHsl, PaletteColor } from './colorEngine';

export interface PalettePreviewProps {
  colors: PaletteColor[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (fromIdx: number, toIdx: number) => void;
  onRemove: (id: string) => void;
  onAddSlot: () => void;
  maxColors: number;
}

const PalettePreview: React.FC<PalettePreviewProps> = ({
  colors,
  selectedId,
  onSelect,
  onReorder,
  onRemove,
  onAddSlot,
  maxColors,
}) => {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const dragTimerRef = useRef<number | null>(null);

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    if (!colors[idx]?.hex) {
      e.preventDefault();
      return;
    }
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
    const target = e.currentTarget as HTMLElement;
    if (dragTimerRef.current) window.clearTimeout(dragTimerRef.current);
    dragTimerRef.current = window.setTimeout(() => {
      target.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '';
    if (dragTimerRef.current) {
      window.clearTimeout(dragTimerRef.current);
      dragTimerRef.current = null;
    }
    setDragIdx(null);
    setOverIdx(null);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (overIdx !== idx) {
      setOverIdx(idx);
    }
  };

  const handleDragLeave = () => {
    setOverIdx(null);
  };

  const handleDrop = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault();
    const fromData = e.dataTransfer.getData('text/plain');
    const fromIdx = fromData ? parseInt(fromData, 10) : dragIdx;
    setDragIdx(null);
    setOverIdx(null);
    if (fromIdx !== null && !isNaN(fromIdx) && fromIdx !== toIdx) {
      onReorder(fromIdx, toIdx);
    }
  };

  const getLabelColor = (hex: string): string => {
    const hsl = hexToHsl(hex);
    return hsl.l > 60 ? '#1a1a2e' : '#ffffff';
  };

  const canAddMore = colors.length < maxColors;

  return (
    <div className="palette-section">
      <div className="palette-header">
        <div className="emotion-tags">
          <span className="emotion-label">
            调色板 ({colors.filter((c) => c.hex).length}/{maxColors})
          </span>
        </div>
        <div className="palette-actions">
          <button
            className="btn btn-sm btn-ghost"
            onClick={onAddSlot}
            disabled={!canAddMore}
            style={{ opacity: canAddMore ? 1 : 0.4, cursor: canAddMore ? 'pointer' : 'not-allowed' }}
          >
            <Plus size={14} />
            扩展槽位
          </button>
        </div>
      </div>

      <div className="palette-grid">
        {colors.map((color, idx) => (
          <div
            key={color.id}
            className={`color-slot ${selectedId === color.id ? 'selected' : ''} ${
              dragIdx === idx ? 'dragging' : ''
            } ${overIdx === idx && dragIdx !== idx ? 'drag-over' : ''}`}
            draggable={!!color.hex}
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, idx)}
            onClick={() => color.hex && onSelect(color.id)}
          >
            {color.hex && (
              <>
                <div className="color-swatch" style={{ backgroundColor: color.hex }} />
                <span
                  className="color-label"
                  style={{ color: getLabelColor(color.hex) }}
                >
                  {color.hex}
                </span>
                <button
                  className="color-slot-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(color.id);
                  }}
                >
                  <X size={12} />
                </button>
              </>
            )}
            {!color.hex && (
              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                空槽位
              </span>
            )}
          </div>
        ))}

        {canAddMore && (
          <div className="color-slot color-slot-add" onClick={onAddSlot}>
            <Plus size={22} strokeWidth={1.5} />
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(PalettePreview);
