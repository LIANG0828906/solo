import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
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

interface DragState {
  idx: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  currentX: number;
  currentY: number;
  color: PaletteColor;
  slotRect: DOMRect;
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
  const [drag, setDrag] = useState<DragState | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);

  const getLabelColor = useCallback((hex: string): string => {
    const hsl = hexToHsl(hex);
    return hsl.l > 60 ? '#1a1a2e' : '#ffffff';
  }, []);

  const filledCount = colors.filter((c) => c.hex).length;
  const atMax = filledCount >= maxColors;
  const canAddMore = colors.length < maxColors;

  const handleMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    idx: number
  ) => {
    if (!colors[idx]?.hex) return;
    if ((e.target as HTMLElement).closest('.color-slot-remove')) return;

    const slotEl = slotRefs.current[idx];
    if (!slotEl) return;
    const rect = slotEl.getBoundingClientRect();

    const dragState: DragState = {
      idx,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      currentX: e.clientX,
      currentY: e.clientY,
      color: colors[idx],
      slotRect: rect,
    };
    setDrag(dragState);
    e.preventDefault();
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!drag) return;
      setDrag((prev) =>
        prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : prev
      );

      let foundOver: number | null = null;
      for (let i = 0; i < slotRefs.current.length; i++) {
        const el = slotRefs.current[i];
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (
          e.clientX >= r.left &&
          e.clientX <= r.right &&
          e.clientY >= r.top &&
          e.clientY <= r.bottom
        ) {
          foundOver = i;
          break;
        }
      }
      setOverIdx((prev) => (prev === foundOver ? prev : foundOver));
    },
    [drag]
  );

  const handleMouseUp = useCallback(() => {
    if (!drag) return;
    if (overIdx !== null && overIdx !== drag.idx) {
      onReorder(drag.idx, overIdx);
    }
    setDrag(null);
    setOverIdx(null);
  }, [drag, overIdx, onReorder]);

  useEffect(() => {
    if (!drag) return;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [drag, handleMouseMove, handleMouseUp]);

  const handleTouchStart = (
    e: React.TouchEvent<HTMLDivElement>,
    idx: number
  ) => {
    if (!colors[idx]?.hex) return;
    if (e.touches.length === 0) return;
    const t = e.touches[0];
    const slotEl = slotRefs.current[idx];
    if (!slotEl) return;
    const rect = slotEl.getBoundingClientRect();
    setDrag({
      idx,
      startX: t.clientX,
      startY: t.clientY,
      offsetX: t.clientX - rect.left,
      offsetY: t.clientY - rect.top,
      currentX: t.clientX,
      currentY: t.clientY,
      color: colors[idx],
      slotRect: rect,
    });
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!drag || e.touches.length === 0) return;
    const t = e.touches[0];
    setDrag((prev) =>
      prev ? { ...prev, currentX: t.clientX, currentY: t.clientY } : prev
    );
    let foundOver: number | null = null;
    for (let i = 0; i < slotRefs.current.length; i++) {
      const el = slotRefs.current[i];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (
        t.clientX >= r.left &&
        t.clientX <= r.right &&
        t.clientY >= r.top &&
        t.clientY <= r.bottom
      ) {
        foundOver = i;
        break;
      }
    }
    setOverIdx(foundOver);
    e.preventDefault();
  }, [drag]);

  const handleTouchEnd = useCallback(() => {
    if (!drag) return;
    if (overIdx !== null && overIdx !== drag.idx) {
      onReorder(drag.idx, overIdx);
    }
    setDrag(null);
    setOverIdx(null);
  }, [drag, overIdx, onReorder]);

  useEffect(() => {
    if (!drag) return;
    const tmo = { passive: false } as AddEventListenerOptions;
    window.addEventListener('touchmove', handleTouchMove, tmo);
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [drag, handleTouchMove, handleTouchEnd]);

  const handleAddWithWarning = () => {
    if (atMax) return;
    onAddSlot();
  };

  const ghostStyle: React.CSSProperties | null = drag
    ? {
        position: 'fixed',
        left: drag.currentX - drag.offsetX,
        top: drag.currentY - drag.offsetY,
        width: drag.slotRect.width,
        height: drag.slotRect.height,
        zIndex: 9999,
        opacity: 0.5,
        pointerEvents: 'none',
        transform: 'rotate(2deg) scale(1.02)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 16px rgba(0,180,216,0.4)',
      }
    : null;

  return (
    <div className="palette-section" ref={containerRef}>
      <div className="palette-header">
        <div className="emotion-tags">
          <span className="emotion-label">
            调色板 ({filledCount}/{maxColors})
          </span>
          {atMax && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                color: 'var(--accent-yellow)',
                fontWeight: 600,
              }}
            >
              <AlertCircle size={12} />
              已达上限
            </span>
          )}
        </div>
        <div className="palette-actions">
          <button
            className="btn btn-sm btn-ghost"
            onClick={handleAddWithWarning}
            disabled={!canAddMore || atMax}
            style={{
              opacity: !canAddMore || atMax ? 0.4 : 1,
              cursor: !canAddMore || atMax ? 'not-allowed' : 'pointer',
            }}
            title={atMax ? '颜色数量已达上限 12 个' : canAddMore ? '添加空槽位' : '槽位已达上限'}
          >
            <Plus size={14} />
            扩展槽位
          </button>
        </div>
      </div>

      <div className="palette-grid">
        {colors.map((color, idx) => {
          const isDragging = drag?.idx === idx;
          const isOver = overIdx === idx && drag && drag.idx !== idx;
          return (
            <div
              key={color.id}
              ref={(el) => { slotRefs.current[idx] = el; }}
              className={`color-slot ${selectedId === color.id ? 'selected' : ''} ${
                isOver ? 'drag-over' : ''
              }`}
              onMouseDown={(e) => handleMouseDown(e, idx)}
              onTouchStart={(e) => handleTouchStart(e, idx)}
              onClick={() => color.hex && onSelect(color.id)}
              style={{
                opacity: isDragging ? 0.2 : 1,
                cursor: color.hex ? (drag ? 'grabbing' : 'grab') : 'default',
              }}
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
          );
        })}

        {canAddMore && !atMax && (
          <div className="color-slot color-slot-add" onClick={handleAddWithWarning}>
            <Plus size={22} strokeWidth={1.5} />
          </div>
        )}
      </div>

      {ghostStyle && drag && (
        <div className="color-slot" style={ghostStyle}>
          <div className="color-swatch" style={{ backgroundColor: drag.color.hex }} />
          <span
            className="color-label"
            style={{ color: getLabelColor(drag.color.hex) }}
          >
            {drag.color.hex}
          </span>
        </div>
      )}
    </div>
  );
};

export default React.memo(PalettePreview);
