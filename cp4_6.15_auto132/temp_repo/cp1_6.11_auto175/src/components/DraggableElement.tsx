import { useRef, useState, useCallback, useEffect } from 'react';
import type { CanvasElement, TextElement, IconElement, PriceTagElement } from '../types';
import { ChalkText } from './ChalkText';
import { Icon } from './Icon';
import { PriceTag } from './PriceTag';

interface DraggableElementProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  onDoubleClick: (id: string) => void;
  isEditing: boolean;
  onEditChange: (text: string) => void;
  onEditBlur: () => void;
  canvasScale: number;
}

type HandleType = 'move' | 'rotate' | 'tl' | 'tr' | 'bl' | 'br' | null;

export const DraggableElement = ({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onDoubleClick,
  isEditing,
  onEditChange,
  onEditBlur,
  canvasScale,
}: DraggableElementProps) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [handleType, setHandleType] = useState<HandleType>(null);
  const dragStartRef = useRef({
    startX: 0,
    startY: 0,
    startElementX: 0,
    startElementY: 0,
    startWidth: 0,
    startHeight: 0,
    startRotation: 0,
    centerX: 0,
    centerY: 0,
  });

  const getElementCenter = useCallback(() => {
    const rect = elementRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent, type: HandleType) => {
    e.stopPropagation();
    e.preventDefault();

    if (isEditing && type === 'move') return;

    setHandleType(type);
    setIsDragging(true);
    onSelect(element.id);

    const center = getElementCenter();
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startElementX: element.x,
      startElementY: element.y,
      startWidth: element.width,
      startHeight: element.height,
      startRotation: element.rotation,
      centerX: center.x,
      centerY: center.y,
    };
  }, [element, isEditing, onSelect, getElementCenter]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const {
        startX,
        startY,
        startElementX,
        startElementY,
        startWidth,
        startHeight,
        startRotation,
        centerX,
        centerY,
      } = dragStartRef.current;

      const dx = (e.clientX - startX) / canvasScale;
      const dy = (e.clientY - startY) / canvasScale;

      switch (handleType) {
        case 'move':
          onUpdate(element.id, {
            x: startElementX + dx,
            y: startElementY + dy,
          });
          break;

        case 'rotate': {
          const angleStart = Math.atan2(startY - centerY, startX - centerX);
          const angleEnd = Math.atan2(e.clientY - centerY, e.clientX - centerX);
          const angleDelta = (angleEnd - angleStart) * (180 / Math.PI);
          let newRotation = startRotation + angleDelta;
          if (e.shiftKey) {
            newRotation = Math.round(newRotation / 15) * 15;
          }
          onUpdate(element.id, { rotation: newRotation });
          break;
        }

        case 'br':
        case 'tr':
        case 'bl':
        case 'tl': {
          const aspectRatio = startWidth / startHeight;
          let newWidth = startWidth;
          let newHeight = startHeight;
          let newX = startElementX;
          let newY = startElementY;

          if (handleType === 'br') {
            newWidth = Math.max(20, startWidth + dx);
            newHeight = newWidth / aspectRatio;
          } else if (handleType === 'tr') {
            newWidth = Math.max(20, startWidth + dx);
            newHeight = newWidth / aspectRatio;
            newY = startElementY + startHeight - newHeight;
          } else if (handleType === 'bl') {
            newWidth = Math.max(20, startWidth - dx);
            newHeight = newWidth / aspectRatio;
            newX = startElementX + startWidth - newWidth;
          } else if (handleType === 'tl') {
            newWidth = Math.max(20, startWidth - dx);
            newHeight = newWidth / aspectRatio;
            newX = startElementX + startWidth - newWidth;
            newY = startElementY + startHeight - newHeight;
          }

          if (element.type === 'icon') {
            newWidth = Math.min(120, Math.max(20, newWidth));
            newHeight = newWidth;
          }

          onUpdate(element.id, {
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight,
          });
          break;
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setHandleType(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleType, element.id, element.type, onUpdate, canvasScale]);

  const renderContent = () => {
    switch (element.type) {
      case 'text':
        return (
          <ChalkText
            text={(element as TextElement).content}
            color={(element as TextElement).color}
            fontFamily={(element as TextElement).fontFamily}
            fontSize={(element as TextElement).fontSize}
            width={element.width}
            isEditing={isEditing}
            onChange={onEditChange}
            onBlur={onEditBlur}
          />
        );
      case 'icon':
        return (
          <Icon
            type={(element as IconElement).iconType}
            color={(element as IconElement).color}
            size={element.width}
          />
        );
      case 'priceTag':
        return (
          <PriceTag
            price={(element as PriceTagElement).price}
            bgColor={(element as PriceTagElement).bgColor}
            width={element.width}
            height={element.height}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={elementRef}
      onMouseDown={(e) => handleMouseDown(e, 'move')}
      onDoubleClick={() => element.type === 'text' && onDoubleClick(element.id)}
      style={{
        position: 'absolute',
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        transform: `rotate(${element.rotation}deg)`,
        opacity: element.opacity,
        zIndex: element.zIndex,
        cursor: isEditing ? 'text' : (isDragging ? 'grabbing' : 'grab'),
        transition: isDragging ? 'none' : 'transform 0.15s ease-out',
        userSelect: 'none',
      }}
    >
      {renderContent()}

      {isSelected && !isEditing && (
        <>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: '1px dashed rgba(255, 224, 102, 0.6)',
              pointerEvents: 'none',
            }}
          />

          <div
            onMouseDown={(e) => handleMouseDown(e, 'rotate')}
            title="旋转 (按住Shift对齐15°)"
            style={{
              position: 'absolute',
              top: -28,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 16,
              height: 16,
              borderRadius: '50%',
              backgroundColor: '#4A5568',
              border: '2px solid #FFE066',
              cursor: 'grab',
              zIndex: 10,
            }}
          />

          {(['tl', 'tr', 'bl', 'br'] as const).map((corner) => {
            const positions: Record<string, React.CSSProperties> = {
              tl: { top: -6, left: -6, cursor: 'nwse-resize' },
              tr: { top: -6, right: -6, cursor: 'nesw-resize' },
              bl: { bottom: -6, left: -6, cursor: 'nesw-resize' },
              br: { bottom: -6, right: -6, cursor: 'nwse-resize' },
            };
            return (
              <div
                key={corner}
                onMouseDown={(e) => handleMouseDown(e, corner)}
                style={{
                  position: 'absolute',
                  width: 12,
                  height: 12,
                  backgroundColor: '#4A5568',
                  border: '2px solid #FFE066',
                  ...positions[corner],
                  zIndex: 10,
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLDivElement).style.backgroundColor = '#FFE066';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLDivElement).style.backgroundColor = '#4A5568';
                }}
              />
            );
          })}
        </>
      )}
    </div>
  );
};
