import React, { memo, useRef, useState, useEffect } from 'react';
import { PosterElement, TextElement, ImageElement, ElementType } from '../types';
import { LayoutManager } from '../layout/LayoutManager';

interface CanvasElementProps {
  element: PosterElement;
  isSelected: boolean;
  layoutManager: LayoutManager;
  canvasRect: DOMRect | null;
  scale: number;
}

const HANDLE_SIZE = 5;
const HANDLE_POSITIONS = [
  { name: 'nw', cursor: 'nwse-resize', x: -1, y: -1 },
  { name: 'n', cursor: 'ns-resize', x: 0, y: -1 },
  { name: 'ne', cursor: 'nesw-resize', x: 1, y: -1 },
  { name: 'e', cursor: 'ew-resize', x: 1, y: 0 },
  { name: 'se', cursor: 'nwse-resize', x: 1, y: 1 },
  { name: 's', cursor: 'ns-resize', x: 0, y: 1 },
  { name: 'sw', cursor: 'nesw-resize', x: -1, y: 1 },
  { name: 'w', cursor: 'ew-resize', x: -1, y: 0 },
] as const;

export const CanvasElement: React.FC<CanvasElementProps> = memo(
  ({ element, isSelected, layoutManager, canvasRect, scale }) => {
    const elementRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingText, setEditingText] = useState('');

    const renderHandles = () => {
      if (!isSelected) return null;
      return HANDLE_POSITIONS.map((h) => {
        const left = h.x === 0 ? `calc(50% - ${HANDLE_SIZE / 2}px)` : h.x === 1 ? `calc(100% - ${HANDLE_SIZE / 2}px)` : `-${HANDLE_SIZE / 2}px`;
        const top = h.y === 0 ? `calc(50% - ${HANDLE_SIZE / 2}px)` : h.y === 1 ? `calc(100% - ${HANDLE_SIZE / 2}px)` : `-${HANDLE_SIZE / 2}px`;
        return (
          <div
            key={h.name}
            data-handle="true"
            data-handle-name={h.name}
            style={{
              position: 'absolute',
              width: HANDLE_SIZE,
              height: HANDLE_SIZE,
              left,
              top,
              backgroundColor: 'rgba(74, 107, 140, 0.7)',
              border: '1px solid #2B3A4D',
              cursor: h.cursor,
              zIndex: 10000,
              boxSizing: 'border-box',
            }}
            onMouseDown={(e) => handleResizeStart(e, h.name)}
          />
        );
      });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      if (isEditing) return;
      if ((e.target as HTMLElement).dataset.handle === 'true') return;
      e.stopPropagation();
      layoutManager.selectElement(element.id);

      if (!canvasRect) return;
      setIsDragging(true);
      const startX = e.clientX;
      const startY = e.clientY;
      const origX = element.x;
      const origY = element.y;
      let rafId: number;
      let pendingX = origX;
      let pendingY = origY;

      const onMove = (ev: MouseEvent) => {
        pendingX = origX + (ev.clientX - startX) / scale;
        pendingY = origY + (ev.clientY - startY) / scale;
        if (!rafId) {
          rafId = requestAnimationFrame(() => {
            layoutManager.moveElement(element.id, pendingX, pendingY);
            rafId = 0;
          });
        }
      };

      const onUp = () => {
        if (rafId) cancelAnimationFrame(rafId);
        layoutManager.moveElement(element.id, pendingX, pendingY);
        setIsDragging(false);
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    };

    const handleResizeStart = (e: React.MouseEvent, handleName: string) => {
      e.stopPropagation();
      e.preventDefault();
      setIsResizing(true);
      const startX = e.clientX;
      const startY = e.clientY;
      const origW = element.width;
      const origH = element.height;
      const ratio = origW / origH;
      let rafId: number;
      let pendingW = origW;
      let pendingH = origH;

      const onMove = (ev: MouseEvent) => {
        let dx = (ev.clientX - startX) / scale;
        let dy = (ev.clientY - startY) / scale;
        if (handleName.includes('w')) dx = -dx;
        if (handleName.includes('n')) dy = -dy;

        let newW = origW;
        let newH = origH;

        if (handleName === 'se' || handleName === 'nw' || handleName === 'ne' || handleName === 'sw') {
          if (Math.abs(dx) > Math.abs(dy * ratio)) {
            newW = Math.max(20, origW + dx);
            newH = newW / ratio;
          } else {
            newH = Math.max(20, origH + dy);
            newW = newH * ratio;
          }
        } else if (handleName === 'e' || handleName === 'w') {
          newW = Math.max(20, origW + dx);
          newH = newW / ratio;
        } else if (handleName === 'n' || handleName === 's') {
          newH = Math.max(20, origH + dy);
          newW = newH * ratio;
        }

        pendingW = newW;
        pendingH = newH;
        if (!rafId) {
          rafId = requestAnimationFrame(() => {
            layoutManager.resizeElement(element.id, pendingW, pendingH);
            rafId = 0;
          });
        }
      };

      const onUp = () => {
        if (rafId) cancelAnimationFrame(rafId);
        layoutManager.resizeElement(element.id, pendingW, pendingH);
        setIsResizing(false);
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (element.type === ElementType.TEXT) {
        setEditingText((element as TextElement).content);
        setIsEditing(true);
      } else if (element.type === ElementType.IMAGE && !(element as ImageElement).src) {
        fileInputRef.current?.click();
      }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const maxDim = 400;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            const r = Math.min(maxDim / w, maxDim / h);
            w = w * r;
            h = h * r;
          }
          layoutManager.updateElement(element.id, {
            src: dataUrl,
            width: w,
            height: h,
          } as Partial<ImageElement>);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    };

    useEffect(() => {
      if (isEditing && elementRef.current) {
        const ta = elementRef.current.querySelector('textarea');
        ta?.focus();
        ta?.select();
      }
    }, [isEditing]);

    const commitTextEdit = () => {
      layoutManager.updateElement(element.id, {
        content: editingText,
      } as Partial<TextElement>);
      setIsEditing(false);
    };

    const renderContent = () => {
      if (element.type === ElementType.TEXT) {
        const textEl = element as TextElement;
        if (isEditing) {
          return (
            <textarea
              value={editingText}
              onChange={(e) => setEditingText(e.target.value)}
              onBlur={commitTextEdit}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsEditing(false);
                }
              }}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                outline: '2px solid #4A6B8C',
                resize: 'none',
                padding: 0,
                margin: 0,
                background: 'transparent',
                fontFamily: textEl.fontFamily,
                fontSize: textEl.fontSize,
                color: textEl.color,
                lineHeight: textEl.lineHeight,
                textAlign: textEl.textAlign,
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
              fontFamily: textEl.fontFamily,
              fontSize: textEl.fontSize,
              color: textEl.color,
              lineHeight: textEl.lineHeight,
              textAlign: textEl.textAlign,
              wordBreak: 'break-word',
              overflow: 'hidden',
              whiteSpace: 'pre-wrap',
              userSelect: 'none',
            }}
          >
            {textEl.content}
          </div>
        );
      } else {
        const imgEl = element as ImageElement;
        if (imgEl.src) {
          return (
            <img
              src={imgEl.src}
              alt=""
              draggable={false}
              style={{
                width: '100%',
                height: '100%',
                objectFit: imgEl.objectFit,
                display: 'block',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            />
          );
        }
        return (
          <div
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            style={{
              width: '100%',
              height: '100%',
              background: '#C8CED6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#5A6B7D',
              fontSize: 13,
              fontFamily: 'system-ui, sans-serif',
              cursor: 'pointer',
              userSelect: 'none',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ fontSize: 28 }}>🖼️</div>
            <div>点击上传图片</div>
          </div>
        );
      }
    };

    const transition = isDragging || isResizing ? 'none' : 'transform 0.1s ease-out';

    return (
      <>
        <div
          ref={elementRef}
          data-selected={isSelected}
          data-element-id={element.id}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: element.width,
            height: element.height,
            transform: `translate(${element.x}px, ${element.y}px) rotate(${element.rotation}deg)`,
            transformOrigin: 'center center',
            zIndex: element.zIndex + 1,
            transition,
            boxSizing: 'border-box',
            cursor: isDragging ? 'grabbing' : 'move',
            outline: isSelected ? '2px dashed #4A6B8C' : 'none',
            outlineOffset: '0px',
            background: element.type === ElementType.IMAGE && !(element as ImageElement).src ? 'transparent' : undefined,
          }}
        >
          {renderContent()}
          {renderHandles()}
        </div>
        {element.type === ElementType.IMAGE && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />
        )}
      </>
    );
  },
  (prev, next) => {
    return (
      prev.element === next.element &&
      prev.isSelected === next.isSelected &&
      prev.scale === next.scale &&
      prev.canvasRect === next.canvasRect
    );
  }
);

CanvasElement.displayName = 'CanvasElement';
