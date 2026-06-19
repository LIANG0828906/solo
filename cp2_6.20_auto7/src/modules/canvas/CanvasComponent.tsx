import { useCallback, useEffect, useRef, useState } from 'react';
import { useResumeStore } from '@/store/resumeStore';
import type { ResumeComponent } from '@/store/types';

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
  onSelect: () => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, w: number, h: number) => void;
}

export default function CanvasComponent({ comp, isSelected, onSelect, onMove, onResize }: CanvasComponentProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, compX: 0, compY: 0 });
  const resizeStart = useRef({ mouseX: 0, mouseY: 0, compW: 0, compH: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect();
      setIsDragging(true);
      dragStart.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        compX: comp.x,
        compY: comp.y,
      };
    },
    [comp.x, comp.y, onSelect]
  );

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setIsResizing(true);
      resizeStart.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        compW: comp.width,
        compH: comp.height,
      };
    },
    [comp.width, comp.height]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStart.current.mouseX;
      const dy = e.clientY - dragStart.current.mouseY;
      onMove(comp.id, dragStart.current.compX + dx, dragStart.current.compY + dy);
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
  }, [isDragging, comp.id, onMove]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - resizeStart.current.mouseX;
      const dy = e.clientY - resizeStart.current.mouseY;
      onResize(comp.id, resizeStart.current.compW + dx, resizeStart.current.compH + dy);
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
  }, [isResizing, comp.id, onResize]);

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
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-20"
            style={{
              background: 'linear-gradient(135deg, transparent 50%, rgba(107,123,141,0.5) 50%)',
              borderRadius: '0 0 4px 0',
            }}
          />
          <div
            onMouseDown={handleResizeMouseDown}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-1.5 cursor-s-resize z-20 rounded-full"
            style={{ backgroundColor: 'rgba(107,123,141,0.4)' }}
          />
          <div
            onMouseDown={handleResizeMouseDown}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 cursor-e-resize z-20 rounded-full"
            style={{ backgroundColor: 'rgba(107,123,141,0.4)' }}
          />
        </>
      )}
    </div>
  );
}
