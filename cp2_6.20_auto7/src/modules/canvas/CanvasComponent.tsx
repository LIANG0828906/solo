import { useCallback, useEffect, useRef, useState } from 'react';
import { useResumeStore } from '@/store/resumeStore';
import type { ResumeComponent } from '@/store/types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/store/types';

function SkillBar({ content, color }: { content: string; color: string }) {
  const match = content.match(/^(.+?)\s+(\d+)%$/);
  const label = match ? match[1] : content;
  const percent = match ? parseInt(match[2], 10) : 75;

  return (
    <div className="w-full">
      <div className="text-xs mb-1" style={{ color }}>{label}</div>
      <div className="w-full h-2 rounded-full bg-slate-200/80">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percent}%`, backgroundColor: color === '#334155' ? '#6B7B8D' : color }}
        />
      </div>
    </div>
  );
}

interface CanvasComponentProps {
  comp: ResumeComponent;
  isSelected: boolean;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onSelect: () => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, w: number, h: number) => void;
}

export default function CanvasComponent({
  comp,
  isSelected,
  canvasRef,
  onSelect,
  onMove,
  onResize,
}: CanvasComponentProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const dragState = useRef({
    offsetX: 0,
    offsetY: 0,
  });

  const resizeState = useRef({
    startCanvasX: 0,
    startCanvasY: 0,
    startW: 0,
    startH: 0,
  });

  const getCanvasCoords = useCallback((clientX: number, clientY: number): { x: number; y: number } | null => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return null;
    const rect = canvasEl.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }, [canvasRef]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isResizing) return;
      e.stopPropagation();
      onSelect();

      const coords = getCanvasCoords(e.clientX, e.clientY);
      if (!coords) return;

      dragState.current = {
        offsetX: coords.x - comp.x,
        offsetY: coords.y - comp.y,
      };

      setIsDragging(true);
    },
    [comp.x, comp.y, isResizing, onSelect, getCanvasCoords]
  );

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      const coords = getCanvasCoords(e.clientX, e.clientY);
      if (!coords) return;

      resizeState.current = {
        startCanvasX: coords.x,
        startCanvasY: coords.y,
        startW: comp.width,
        startH: comp.height,
      };

      setIsResizing(true);
    },
    [comp.width, comp.height, getCanvasCoords]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      if (!coords) return;

      const newX = coords.x - dragState.current.offsetX;
      const newY = coords.y - dragState.current.offsetY;
      onMove(comp.id, newX, newY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      useResumeStore.getState().pushHistory();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, comp.id, onMove, getCanvasCoords]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      if (!coords) return;

      const dx = coords.x - resizeState.current.startCanvasX;
      const dy = coords.y - resizeState.current.startCanvasY;
      onResize(comp.id, resizeState.current.startW + dx, resizeState.current.startH + dy);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      useResumeStore.getState().pushHistory();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, comp.id, onResize, getCanvasCoords]);

  const isSkillBar = comp.type === 'skill-bar';

  return (
    <div
      onMouseDown={handleMouseDown}
      className="absolute group cursor-move select-none"
      style={{
        left: comp.x,
        top: comp.y,
        width: comp.width,
        height: comp.height,
        fontFamily: comp.style.fontFamily,
        fontSize: comp.style.fontSize,
        color: comp.style.color,
        backgroundColor: comp.style.backgroundColor,
        fontWeight: Number(comp.style.fontWeight) || 400,
        transition: isDragging || isResizing ? 'none' : 'box-shadow 0.2s ease, transform 0.15s ease',
        boxShadow: isDragging
          ? '0 12px 40px -8px rgba(107,123,141,0.25), 0 4px 12px -2px rgba(107,123,141,0.15)'
          : isSelected
            ? '0 0 0 2px rgba(107,123,141,0.4), 0 2px 8px rgba(107,123,141,0.1)'
            : 'none',
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
        zIndex: isSelected ? 10 : 1,
        borderRadius: 6,
        overflow: 'hidden',
      }}
    >
      <div
        className={`absolute inset-0 rounded-md pointer-events-none transition-opacity duration-200 ${
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
        style={{
          border: isSelected ? '2px dashed rgba(107,123,141,0.5)' : '1px solid rgba(107,123,141,0.15)',
        }}
      />

      <div className="w-full h-full px-3 py-2 overflow-hidden whitespace-pre-wrap leading-relaxed">
        {isSkillBar ? (
          <SkillBar content={comp.content} color={comp.style.color} />
        ) : (
          comp.content
        )}
      </div>

      {isSelected && (
        <>
          <div
            onMouseDown={handleResizeMouseDown}
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-30"
            style={{
              background: 'linear-gradient(135deg, transparent 50%, rgba(107,123,141,0.5) 50%)',
              borderRadius: '0 0 4px 0',
            }}
          />
          <div
            onMouseDown={handleResizeMouseDown}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-1.5 cursor-s-resize z-30 rounded-full"
            style={{ backgroundColor: 'rgba(107,123,141,0.4)' }}
          />
          <div
            onMouseDown={handleResizeMouseDown}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 cursor-e-resize z-30 rounded-full"
            style={{ backgroundColor: 'rgba(107,123,141,0.4)' }}
          />
        </>
      )}
    </div>
  );
}
