import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { CanvasBlock, TextStyle, FONT_OPTIONS } from '../types';
import { RotationControl } from './RotationControl';
import styles from './MaterialItem.module.css';

interface MaterialItemProps {
  block: CanvasBlock;
  isSelected: boolean;
  zoom: number;
  onSelect: (id: string) => void;
  onDragStart: (id: string, e: React.MouseEvent) => void;
  onUpdate: (id: string, updates: Partial<CanvasBlock>) => void;
  onUpdateComplete: (id: string, updates: Partial<CanvasBlock>) => void;
  onImageClick: (imageEl: HTMLImageElement, x: number, y: number) => void;
  onDelete: (id: string) => void;
}

interface ResizeHandle {
  position: 'nw' | 'ne' | 'sw' | 'se';
  cursor: string;
}

const RESIZE_HANDLES: ResizeHandle[] = [
  { position: 'nw', cursor: 'nw-resize' },
  { position: 'ne', cursor: 'ne-resize' },
  { position: 'sw', cursor: 'sw-resize' },
  { position: 'se', cursor: 'se-resize' },
];

const FONT_LABELS: Record<string, string> = {
  "'Playfair Display', serif": 'Playfair Display',
  "'Space Mono', monospace": 'Space Mono',
  "'Cormorant Garamond', serif": 'Cormorant Garamond',
};

export const MaterialItem: React.FC<MaterialItemProps> = ({
  block,
  isSelected,
  zoom,
  onSelect,
  onDragStart,
  onUpdate,
  onUpdateComplete,
  onImageClick,
  onDelete,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showRotation, setShowRotation] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const elementRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isEditingText) return;
      e.stopPropagation();
      onSelect(block.id);
      setIsDragging(true);
      onDragStart(block.id, e);
    },
    [block.id, onSelect, onDragStart, isEditingText]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [isDragging]);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, handle: ResizeHandle) => {
      e.stopPropagation();
      e.preventDefault();
      setIsResizing(true);
      onSelect(block.id);

      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = block.width;
      const startHeight = block.height;
      const startXPos = block.x;
      const startYPos = block.y;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = (moveEvent.clientX - startX) / zoom;
        const deltaY = (moveEvent.clientY - startY) / zoom;

        let newWidth = startWidth;
        let newHeight = startHeight;
        let newX = startXPos;
        let newY = startYPos;

        if (handle.position.includes('e')) {
          newWidth = Math.max(50, startWidth + deltaX);
        } else if (handle.position.includes('w')) {
          newWidth = Math.max(50, startWidth - deltaX);
          newX = startXPos + (startWidth - newWidth);
        }

        if (handle.position.includes('s')) {
          newHeight = Math.max(50, startHeight + deltaY);
        } else if (handle.position.includes('n')) {
          newHeight = Math.max(50, startHeight - deltaY);
          newY = startYPos + (startHeight - newHeight);
        }

        onUpdate(block.id, { width: newWidth, height: newHeight, x: newX, y: newY });
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [block, zoom, onSelect, onUpdate]
  );

  const handleImageClick = useCallback(
    (e: React.MouseEvent<HTMLImageElement>) => {
      if (!imageRef.current) return;
      const rect = imageRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      onImageClick(imageRef.current, x, y);
    },
    [onImageClick]
  );

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (block.type === 'text') {
      setIsEditingText(true);
    } else {
      setShowRotation(true);
    }
  }, [block.type]);

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onUpdate(block.id, { content: e.target.value });
    },
    [block.id, onUpdate]
  );

  const handleTextBlur = useCallback(() => {
    setIsEditingText(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsEditingText(false);
      }
    },
    []
  );

  useEffect(() => {
    if (isEditingText && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditingText]);

  const handleRipple = useCallback((e: React.MouseEvent) => {
    const rect = elementRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 400);
  }, []);

  const handleTextStyleChange = useCallback(
    (styleUpdates: Partial<TextStyle>) => {
      const currentStyle = block.textStyle || {};
      onUpdate(block.id, {
        textStyle: { ...currentStyle, ...styleUpdates } as TextStyle,
      });
    },
    [block.id, block.textStyle, onUpdate]
  );

  const textStyle = block.textStyle;
  const transform = `translate3d(${block.x}px, ${block.y}px, 0) rotate(${block.rotation}deg) scale(${block.scale})`;

  return (
    <div
      ref={elementRef}
      className={`${styles.block} ${isSelected ? styles.selected : ''} ${
        isDragging || isResizing ? styles.dragging : ''
      }`}
      style={{
        width: block.width,
        height: block.height,
        transform,
        zIndex: block.zIndex,
        transition: isDragging || isResizing ? 'none' : 'transform 0.3s ease-out',
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onClick={handleRipple}
    >
      {block.type === 'image' ? (
        <img
          ref={imageRef}
          src={block.content}
          alt=""
          className={styles.image}
          draggable={false}
          onClick={handleImageClick}
          style={{ pointerEvents: isDragging || isResizing ? 'none' : 'auto' }}
        />
      ) : (
        <div
          className={`${styles.textBlock} ${
            textStyle?.backgroundType === 'glass' ? styles.glass : ''
          }`}
          style={{
            fontFamily: textStyle?.fontFamily,
            fontSize: textStyle?.fontSize,
            color: textStyle?.color,
            opacity: (textStyle?.opacity ?? 100) / 100,
            backgroundColor:
              textStyle?.backgroundType === 'solid'
                ? textStyle.backgroundColor
                : 'transparent',
          }}
        >
          {isEditingText ? (
            <textarea
              ref={textareaRef}
              value={block.content}
              onChange={handleTextChange}
              onBlur={handleTextBlur}
              onKeyDown={handleKeyDown}
              className={styles.textarea}
              style={{
                fontFamily: textStyle?.fontFamily,
                fontSize: textStyle?.fontSize,
                color: textStyle?.color,
              }}
            />
          ) : (
            <span className={styles.textContent}>{block.content}</span>
          )}
        </div>
      )}

      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className={styles.ripple}
          style={{ left: ripple.x, top: ripple.y }}
        />
      ))}

      {isSelected && (
        <>
          {RESIZE_HANDLES.map((handle) => (
            <div
              key={handle.position}
              className={`${styles.resizeHandle} ${styles[handle.position]}`}
              style={{ cursor: handle.cursor }}
              onMouseDown={(e) => handleResizeStart(e, handle)}
            />
          ))}

          {block.type === 'text' && textStyle && (
            <div className={styles.textControls}>
              <select
                className={styles.controlSelect}
                value={textStyle.fontFamily}
                onChange={(e) => handleTextStyleChange({ fontFamily: e.target.value })}
                onClick={(e) => e.stopPropagation()}
              >
                {Object.entries(FONT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <input
                type="range"
                min="12"
                max="48"
                step="2"
                value={textStyle.fontSize}
                onChange={(e) =>
                  handleTextStyleChange({ fontSize: parseInt(e.target.value) })
                }
                onClick={(e) => e.stopPropagation()}
                className={styles.controlSlider}
                title={`字号: ${textStyle.fontSize}px`}
              />
              <input
                type="color"
                value={textStyle.color}
                onChange={(e) => handleTextStyleChange({ color: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                className={styles.controlColor}
                title="文字颜色"
              />
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={textStyle.opacity}
                onChange={(e) =>
                  handleTextStyleChange({ opacity: parseInt(e.target.value) })
                }
                onClick={(e) => e.stopPropagation()}
                className={styles.controlSlider}
                title={`透明度: ${textStyle.opacity}%`}
              />
              <button
                className={`${styles.glassToggle} ${
                  textStyle.backgroundType === 'glass' ? styles.active : ''
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleTextStyleChange({
                    backgroundType:
                      textStyle.backgroundType === 'glass' ? 'solid' : 'glass',
                  });
                }}
                title="毛玻璃背景"
              >
                ◐
              </button>
              <button
                className={styles.deleteBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(block.id);
                }}
                title="删除"
              >
                ✕
              </button>
            </div>
          )}

          {showRotation && (
            <RotationControl
              rotation={block.rotation}
              onChange={(rotation) => onUpdate(block.id, { rotation })}
              onChangeComplete={(rotation) => {
                onUpdateComplete(block.id, { rotation });
                setShowRotation(false);
              }}
            />
          )}
        </>
      )}
    </div>
  );
};
