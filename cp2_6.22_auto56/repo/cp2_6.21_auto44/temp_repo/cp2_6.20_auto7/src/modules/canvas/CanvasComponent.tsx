import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
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

type ResizeDir = 'nw' | 'ne' | 'sw' | 'se';

interface CanvasComponentProps {
  comp: ResumeComponent;
  isSelected: boolean;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onSelect: () => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, w: number, h: number) => void;
  onRemove: (id: string) => void;
}

export default function CanvasComponent({
  comp,
  isSelected,
  canvasRef,
  onSelect,
  onMove,
  onResize,
  onRemove,
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
    startX: 0,
    startY: 0,
    startW: 0,
    startH: 0,
    dir: 'se' as ResizeDir,
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
    (e: React.MouseEvent, dir: ResizeDir) => {
      e.stopPropagation();
      e.preventDefault();

      const coords = getCanvasCoords(e.clientX, e.clientY);
      if (!coords) return;

      resizeState.current = {
        startCanvasX: coords.x,
        startCanvasY: coords.y,
        startX: comp.x,
        startY: comp.y,
        startW: comp.width,
        startH: comp.height,
        dir,
      };

      setIsResizing(true);
    },
    [comp.x, comp.y, comp.width, comp.height, getCanvasCoords]
  );

  const handleRemoveClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onRemove(comp.id);
    },
    [comp.id, onRemove]
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
      const { startX, startY, startW, startH, dir } = resizeState.current;

      let newX = startX;
      let newY = startY;
      let newW = startW;
      let newH = startH;

      switch (dir) {
        case 'se':
          newW = startW + dx;
          newH = startH + dy;
          break;
        case 'sw':
          newX = Math.max(0, Math.min(startX + dx, startX + startW - 60));
          newW = startW - (newX - startX);
          newH = startH + dy;
          break;
        case 'ne':
          newW = startW + dx;
          newY = Math.max(0, Math.min(startY + dy, startY + startH - 30));
          newH = startH - (newY - startY);
          break;
        case 'nw':
          newX = Math.max(0, Math.min(startX + dx, startX + startW - 60));
          newW = startW - (newX - startX);
          newY = Math.max(0, Math.min(startY + dy, startY + startH - 30));
          newH = startH - (newY - startY);
          break;
      }

      newW = Math.max(60, newW);
      newH = Math.max(30, newH);

      if (newX !== startX || newY !== startY) {
        onMove(comp.id, newX, newY);
      }
      onResize(comp.id, newW, newH);
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
  }, [isResizing, comp.id, onMove, onResize, getCanvasCoords]);

  const isSkillBar = comp.type === 'skill-bar';
  const showControls = isSelected;

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
        transition: isDragging || isResizing ? 'none' : 'box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: isDragging
          ? '0 2px 8px 0 rgba(107,123,141,0.2)'
          : isSelected
            ? '0 0 0 2px rgba(107,123,141,0.4), 0 2px 8px rgba(107,123,141,0.1)'
            : 'none',
        transform: isDragging ? 'scale(1.01)' : 'scale(1)',
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

      <button
        onClick={handleRemoveClick}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        className={`absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-300 hover:bg-rose-50 transition-all duration-150 shadow-sm z-40 ${
          showControls ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto'
        }`}
        title="删除组件"
      >
        <X size={11} strokeWidth={2.5} />
      </button>

      <div className="w-full h-full px-3 py-2 overflow-hidden whitespace-pre-wrap leading-relaxed break-words">
        {isSkillBar ? (
          <SkillBar content={comp.content} color={comp.style.color} />
        ) : (
          comp.content
        )}
      </div>

      {isSelected && (
        <>
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
            className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full bg-white border-2 border-slate-400 cursor-nw-resize z-30 hover:border-slate-600 hover:scale-110 transition-transform"
            title="左上缩放"
          />
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
            className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-white border-2 border-slate-400 cursor-ne-resize z-30 hover:border-slate-600 hover:scale-110 transition-transform"
            title="右上缩放"
          />
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
            className="absolute -bottom-1.5 -left-1.5 w-3 h-3 rounded-full bg-white border-2 border-slate-400 cursor-sw-resize z-30 hover:border-slate-600 hover:scale-110 transition-transform"
            title="左下缩放"
          />
          <div
            onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-full bg-white border-2 border-slate-400 cursor-se-resize z-30 hover:border-slate-600 hover:scale-110 transition-transform"
            title="右下缩放"
          />
        </>
      )}
    </div>
  );
}
