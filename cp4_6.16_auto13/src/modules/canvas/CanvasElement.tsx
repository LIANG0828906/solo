import { useState, useRef, useEffect, useCallback } from 'react';
import type { CanvasElement as CE, TextElement, ImageElement, ColorTheme } from '@/types';
import { RotateCw } from 'lucide-react';

export const CANVAS_W = 1080;
export const CANVAS_H = 1920;

type ResizeHandle =
  | 'nw'
  | 'n'
  | 'ne'
  | 'e'
  | 'se'
  | 's'
  | 'sw'
  | 'w'
  | 'rotate'
  | null;

interface CanvasElementProps {
  element: CE;
  isSelected: boolean;
  theme: ColorTheme;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<CE>) => void;
  onTextEdit: (content: string) => void;
}

function resolveTextColor(el: TextElement, theme: ColorTheme): string {
  if (el.colorKey === 'custom' && el.customColor) return el.customColor;
  if (el.colorKey === 'primary') return theme.colors.primary;
  if (el.colorKey === 'secondary') return theme.colors.secondary;
  return theme.colors.background;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function CanvasElement({
  element,
  isSelected,
  theme,
  onSelect,
  onUpdate,
  onTextEdit,
}: CanvasElementProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const elRef = useRef<HTMLDivElement>(null);
  const interactionRef = useRef<{
    mode: 'move' | 'resize' | 'rotate' | null;
    handle: ResizeHandle;
    startX: number;
    startY: number;
    startEl: CE | null;
    startAngle: number;
    shiftKey: boolean;
  }>({
    mode: null,
    handle: null,
    startX: 0,
    startY: 0,
    startEl: null,
    startAngle: 0,
    shiftKey: false,
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canvasContainerRef = useRef<HTMLElement | null>(null);

  const getCanvasRect = useCallback(() => {
    if (!canvasContainerRef.current) {
      canvasContainerRef.current = document.getElementById('canvas-inner-container');
    }
    return canvasContainerRef.current?.getBoundingClientRect();
  }, []);

  const getScale = useCallback(() => {
    const rect = getCanvasRect();
    if (!rect) return 1;
    return rect.width / CANVAS_W;
  }, [getCanvasRect]);

  const startTextEdit = useCallback(() => {
    if (element.type !== 'text') return;
    setEditContent((element as TextElement).content);
    setIsEditing(true);
  }, [element]);

  const finishTextEdit = useCallback(() => {
    if (isEditing) {
      onTextEdit(editContent);
      setIsEditing(false);
    }
  }, [isEditing, editContent, onTextEdit]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, mode: 'move' | 'resize' | 'rotate', handle?: ResizeHandle) => {
      e.stopPropagation();
      e.preventDefault();
      onSelect(element.id);

      const rect = getCanvasRect();
      if (!rect) return;
      const scale = getScale();

      interactionRef.current = {
        mode,
        handle: handle ?? null,
        startX: (e.clientX - rect.left) / scale,
        startY: (e.clientY - rect.top) / scale,
        startEl: { ...element },
        startAngle: 0,
        shiftKey: e.shiftKey,
      };

      if (mode === 'rotate') {
        const cx = element.x + element.width / 2;
        const cy = element.y + element.height / 2;
        interactionRef.current.startAngle =
          Math.atan2(interactionRef.current.startY - cy, interactionRef.current.startX - cx) -
          (element.rotation * Math.PI) / 180;
      }
    },
    [element, onSelect, getCanvasRect, getScale]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { mode, startEl, startX, startY, handle, startAngle, shiftKey } =
        interactionRef.current;
      if (!mode || !startEl) return;

      const rect = getCanvasRect();
      if (!rect) return;
      const scale = getScale();

      const curX = (e.clientX - rect.left) / scale;
      const curY = (e.clientY - rect.top) / scale;
      const dx = curX - startX;
      const dy = curY - startY;

      if (mode === 'move') {
        let newX = startEl.x + dx;
        let newY = startEl.y + dy;
        newX = clamp(newX, 0, CANVAS_W - startEl.width);
        newY = clamp(newY, 0, CANVAS_H - startEl.height);
        onUpdate(element.id, { x: newX, y: newY });
      } else if (mode === 'resize') {
        const ratio = startEl.width / startEl.height;
        const preserveRatio = e.shiftKey || shiftKey;
        let newX = startEl.x;
        let newY = startEl.y;
        let newW = startEl.width;
        let newH = startEl.height;

        switch (handle) {
          case 'nw': {
            newX = startEl.x + dx;
            newY = startEl.y + dy;
            newW = startEl.width - dx;
            newH = startEl.height - dy;
            if (preserveRatio) {
              const maxDim = Math.max(newW, newH * ratio);
              newW = maxDim;
              newH = maxDim / ratio;
              newX = startEl.x + startEl.width - newW;
              newY = startEl.y + startEl.height - newH;
            }
            break;
          }
          case 'n': {
            newY = startEl.y + dy;
            newH = startEl.height - dy;
            if (preserveRatio) {
              newW = newH * ratio;
              newX = startEl.x + (startEl.width - newW) / 2;
            }
            break;
          }
          case 'ne': {
            newY = startEl.y + dy;
            newW = startEl.width + dx;
            newH = startEl.height - dy;
            if (preserveRatio) {
              const maxDim = Math.max(newW, newH * ratio);
              newW = maxDim;
              newH = maxDim / ratio;
              newY = startEl.y + startEl.height - newH;
            }
            break;
          }
          case 'e': {
            newW = startEl.width + dx;
            if (preserveRatio) {
              newH = newW / ratio;
              newY = startEl.y + (startEl.height - newH) / 2;
            }
            break;
          }
          case 'se': {
            newW = startEl.width + dx;
            newH = startEl.height + dy;
            if (preserveRatio) {
              const maxDim = Math.max(newW, newH * ratio);
              newW = maxDim;
              newH = maxDim / ratio;
            }
            break;
          }
          case 's': {
            newH = startEl.height + dy;
            if (preserveRatio) {
              newW = newH * ratio;
              newX = startEl.x + (startEl.width - newW) / 2;
            }
            break;
          }
          case 'sw': {
            newX = startEl.x + dx;
            newW = startEl.width - dx;
            newH = startEl.height + dy;
            if (preserveRatio) {
              const maxDim = Math.max(newW, newH * ratio);
              newW = maxDim;
              newH = maxDim / ratio;
              newX = startEl.x + startEl.width - newW;
            }
            break;
          }
          case 'w': {
            newX = startEl.x + dx;
            newW = startEl.width - dx;
            if (preserveRatio) {
              newH = newW / ratio;
              newY = startEl.y + (startEl.height - newH) / 2;
            }
            break;
          }
        }

        const MIN_W = 20;
        const MIN_H = 20;

        if (newW < MIN_W || newH < MIN_H) return;

        newX = clamp(newX, 0, CANVAS_W - newW);
        newY = clamp(newY, 0, CANVAS_H - newH);
        newW = Math.min(newW, CANVAS_W - newX);
        newH = Math.min(newH, CANVAS_H - newY);

        onUpdate(element.id, { x: newX, y: newY, width: newW, height: newH });
      } else if (mode === 'rotate') {
        const cx = startEl.x + startEl.width / 2;
        const cy = startEl.y + startEl.height / 2;
        const curAngle = Math.atan2(curY - cy, curX - cx);
        let degrees = ((curAngle - startAngle) * 180) / Math.PI;
        if (e.shiftKey) {
          degrees = Math.round(degrees / 15) * 15;
        }
        onUpdate(element.id, { rotation: degrees });
      }
    };

    const handleMouseUp = () => {
      interactionRef.current.mode = null;
      interactionRef.current.startEl = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [element.id, onUpdate, getCanvasRect, getScale]);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (element.type === 'text') {
        startTextEdit();
      }
    },
    [element.type, startTextEdit]
  );

  const handleTextareaKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Escape') {
        finishTextEdit();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        finishTextEdit();
      }
    },
    [finishTextEdit]
  );

  const resizeHandles: Array<{
    key: ResizeHandle;
    style: React.CSSProperties;
    cursor: string;
  }> = [
    { key: 'nw', style: { top: -6, left: -6 }, cursor: 'nwse-resize' },
    { key: 'n', style: { top: -6, left: '50%', transform: 'translateX(-50%)' }, cursor: 'ns-resize' },
    { key: 'ne', style: { top: -6, right: -6 }, cursor: 'nesw-resize' },
    { key: 'e', style: { top: '50%', right: -6, transform: 'translateY(-50%)' }, cursor: 'ew-resize' },
    { key: 'se', style: { bottom: -6, right: -6 }, cursor: 'nwse-resize' },
    { key: 's', style: { bottom: -6, left: '50%', transform: 'translateX(-50%)' }, cursor: 'ns-resize' },
    { key: 'sw', style: { bottom: -6, left: -6 }, cursor: 'nesw-resize' },
    { key: 'w', style: { top: '50%', left: -6, transform: 'translateY(-50%)' }, cursor: 'ew-resize' },
  ];

  const elementStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: element.width,
    height: element.height,
    transform: `translate3d(${element.x}px, ${element.y}px, 0) rotate(${element.rotation}deg)`,
    transformOrigin: 'center center',
    zIndex: element.zIndex,
    opacity: element.opacity,
    willChange: 'transform',
    userSelect: isEditing ? 'auto' : 'none',
  };

  const renderContent = () => {
    if (element.type === 'text') {
      const t = element as TextElement;
      const color = resolveTextColor(t, theme);
      if (isEditing) {
        return (
          <textarea
            ref={textareaRef}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onBlur={finishTextEdit}
            onKeyDown={handleTextareaKeyDown}
            style={{
              width: '100%',
              height: '100%',
              resize: 'none',
              border: 'none',
              outline: '2px solid #6366f1',
              outlineOffset: 0,
              padding: 0,
              margin: 0,
              background: 'rgba(255,255,255,0.5)',
              color,
              fontFamily: `'${t.fontFamily}', sans-serif`,
              fontSize: t.fontSize,
              fontWeight: t.fontWeight,
              lineHeight: t.lineHeight,
              letterSpacing: t.letterSpacing,
              textAlign: t.textAlign,
              whiteSpace: 'pre-wrap',
              overflowWrap: 'break-word',
              boxSizing: 'border-box',
            }}
          />
        );
      }
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            color,
            fontFamily: `'${t.fontFamily}', sans-serif`,
            fontSize: t.fontSize,
            fontWeight: t.fontWeight,
            lineHeight: t.lineHeight,
            letterSpacing: t.letterSpacing,
            textAlign: t.textAlign,
            whiteSpace: 'pre-wrap',
            overflowWrap: 'break-word',
            display: 'flex',
            alignItems: 'center',
            justifyContent:
              t.textAlign === 'center'
                ? 'center'
                : t.textAlign === 'right'
                ? 'flex-end'
                : 'flex-start',
            wordBreak: 'break-word',
          }}
        >
          {t.content}
        </div>
      );
    }
    const img = element as ImageElement;
    return (
      <img
        src={img.src}
        alt=""
        draggable={false}
        style={{
          width: '100%',
          height: '100%',
          objectFit: img.objectFit,
          borderRadius: img.borderRadius,
          pointerEvents: 'none',
          display: 'block',
        }}
      />
    );
  };

  return (
    <div
      ref={elRef}
      style={elementStyle}
      onMouseDown={(e) => handleMouseDown(e, 'move')}
      onDoubleClick={handleDoubleClick}
    >
      {renderContent()}
      {isSelected && !isEditing && (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              border: '2px solid #6366f1',
              pointerEvents: 'none',
              boxSizing: 'border-box',
            }}
          />
          {resizeHandles.map((h) => (
            <div
              key={h.key}
              onMouseDown={(e) => handleMouseDown(e, 'resize', h.key)}
              style={{
                position: 'absolute',
                width: 12,
                height: 12,
                background: '#ffffff',
                border: '2px solid #6366f1',
                borderRadius: 2,
                cursor: h.cursor,
                zIndex: 10,
                ...h.style,
              }}
            />
          ))}
          <div
            onMouseDown={(e) => handleMouseDown(e, 'rotate', 'rotate')}
            style={{
              position: 'absolute',
              left: '50%',
              top: -38,
              transform: 'translateX(-50%)',
              width: 28,
              height: 28,
              background: '#ffffff',
              border: '2px solid #6366f1',
              borderRadius: '50%',
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            <RotateCw size={14} color="#6366f1" />
          </div>
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: -10,
              width: 2,
              height: 10,
              background: '#6366f1',
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
            }}
          />
        </>
      )}
    </div>
  );
}
