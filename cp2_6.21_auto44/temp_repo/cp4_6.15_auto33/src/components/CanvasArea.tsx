import { useRef, useState, useEffect, useCallback } from 'react';
import type { TextStyle, Sticker } from '@/types';

interface CanvasAreaProps {
  image: string | null;
  topText: TextStyle;
  bottomText: TextStyle;
  stickers: Sticker[];
  selectedStickerId: string | null;
  selectedTextType: 'top' | 'bottom' | null;
  onSelectSticker: (id: string | null) => void;
  onSelectText: (type: 'top' | 'bottom' | null) => void;
  onUpdateSticker: (id: string, updates: Partial<Sticker>) => void;
  onUpdateText: (type: 'top' | 'bottom', updates: Partial<TextStyle>) => void;
  canvasSize: { width: number; height: number };
  onCanvasSizeChange: (size: { width: number; height: number }) => void;
}

type DragType = 'sticker' | 'text-top' | 'text-bottom' | 'resize' | 'rotate' | null;

export default function CanvasArea({
  image,
  topText,
  bottomText,
  stickers,
  selectedStickerId,
  selectedTextType,
  onSelectSticker,
  onSelectText,
  onUpdateSticker,
  onUpdateText,
  canvasSize,
  onCanvasSizeChange,
}: CanvasAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<DragType>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialValues, setInitialValues] = useState<any>(null);
  const [showGuides, setShowGuides] = useState(false);
  const [positionIndicator, setPositionIndicator] = useState<{ x: number; y: number; label: string } | null>(null);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const maxWidth = container.clientWidth;
        const maxHeight = container.clientHeight;
        const aspectRatio = 16 / 9;
        
        let width = maxWidth;
        let height = width / aspectRatio;
        
        if (height > maxHeight) {
          height = maxHeight;
          width = height * aspectRatio;
        }
        
        onCanvasSizeChange({ width, height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [onCanvasSizeChange]);

  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent, type: DragType, data?: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    const coords = getCanvasCoords(e.clientX, e.clientY);
    setIsDragging(true);
    setDragType(type);
    setDragStart(coords);
    setInitialValues(data);
    setShowGuides(true);
  }, [getCanvasCoords]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragType) return;
    
    const coords = getCanvasCoords(e.clientX, e.clientY);
    const dx = coords.x - dragStart.x;
    const dy = coords.y - dragStart.y;

    if (dragType === 'sticker' && selectedStickerId) {
      const newX = initialValues.x + dx;
      const newY = initialValues.y + dy;
      onUpdateSticker(selectedStickerId, { x: newX, y: newY });
      setPositionIndicator({ x: coords.x, y: coords.y - 30, label: `X: ${Math.round(newX)} Y: ${Math.round(newY)}` });
    } else if (dragType === 'text-top') {
      const newX = initialValues.x + dx;
      const newY = initialValues.y + dy;
      onUpdateText('top', { x: newX, y: newY });
      setPositionIndicator({ x: coords.x, y: coords.y - 30, label: `X: ${Math.round(newX)} Y: ${Math.round(newY)}` });
    } else if (dragType === 'text-bottom') {
      const newX = initialValues.x + dx;
      const newY = initialValues.y + dy;
      onUpdateText('bottom', { x: newX, y: newY });
      setPositionIndicator({ x: coords.x, y: coords.y - 30, label: `X: ${Math.round(newX)} Y: ${Math.round(newY)}` });
    } else if (dragType === 'resize' && selectedStickerId) {
      const distance = Math.sqrt(dx * dx + dy * dy);
      const scale = Math.max(0.2, Math.min(3, initialValues.scale + distance / 100));
      onUpdateSticker(selectedStickerId, { scale });
    } else if (dragType === 'rotate' && selectedStickerId) {
      const centerX = initialValues.x;
      const centerY = initialValues.y;
      const angle = Math.atan2(coords.y - centerY, coords.x - centerX) * (180 / Math.PI) - 90;
      onUpdateSticker(selectedStickerId, { rotation: angle });
    }
  }, [isDragging, dragType, dragStart, initialValues, selectedStickerId, getCanvasCoords, onUpdateSticker, onUpdateText]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragType(null);
    setShowGuides(false);
    setPositionIndicator(null);
    setInitialValues(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('canvas-container')) {
      onSelectSticker(null);
      onSelectText(null);
    }
  };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!selectedStickerId) return;
    e.preventDefault();
    
    const sticker = stickers.find(s => s.id === selectedStickerId);
    if (!sticker) return;
    
    const delta = e.deltaY > 0 ? -5 : 5;
    const newRotation = sticker.rotation + delta;
    onUpdateSticker(selectedStickerId, { rotation: newRotation });
  }, [selectedStickerId, stickers, onUpdateSticker]);

  const sortedStickers = [...stickers].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div className="canvas-wrapper" ref={containerRef} onClick={handleCanvasClick}>
      <div
        className="canvas-container"
        style={{ width: canvasSize.width, height: canvasSize.height }}
        onWheel={handleWheel}
      >
        {showGuides && (
          <div className="guides">
            <div 
              className="guide-line horizontal" 
              style={{ top: canvasSize.height / 2 }} 
            />
            <div 
              className="guide-line vertical" 
              style={{ left: canvasSize.width / 2 }} 
            />
          </div>
        )}

        {image ? (
          <img
            src={image}
            alt="Meme"
            className="canvas-image"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            draggable={false}
          />
        ) : (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--color-text-muted)',
            fontSize: '16px',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>🖼️</div>
              <div>请上传图片或选择模板</div>
            </div>
          </div>
        )}

        <div
          className={`canvas-text ${isDragging && dragType === 'text-top' ? 'dragging' : ''} ${selectedTextType === 'top' ? 'selected' : ''}`}
          style={{
            left: '50%',
            top: '10%',
            transform: `translate(calc(-50% + ${topText.x}px), ${topText.y}px)`,
            fontFamily: topText.fontFamily,
            fontSize: `${topText.fontSize}px`,
            color: topText.color,
            WebkitTextStroke: `${topText.strokeWidth}px ${topText.strokeColor}`,
            paintOrder: 'stroke fill',
          }}
          onMouseDown={(e) => {
            onSelectText('top');
            handleMouseDown(e, 'text-top', { x: topText.x, y: topText.y });
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelectText('top');
          }}
        >
          {topText.text || '顶部文字'}
        </div>

        <div
          className={`canvas-text ${isDragging && dragType === 'text-bottom' ? 'dragging' : ''} ${selectedTextType === 'bottom' ? 'selected' : ''}`}
          style={{
            left: '50%',
            bottom: '10%',
            transform: `translate(calc(-50% + ${bottomText.x}px), ${-bottomText.y}px)`,
            fontFamily: bottomText.fontFamily,
            fontSize: `${bottomText.fontSize}px`,
            color: bottomText.color,
            WebkitTextStroke: `${bottomText.strokeWidth}px ${bottomText.strokeColor}`,
            paintOrder: 'stroke fill',
          }}
          onMouseDown={(e) => {
            onSelectText('bottom');
            handleMouseDown(e, 'text-bottom', { x: bottomText.x, y: bottomText.y });
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelectText('bottom');
          }}
        >
          {bottomText.text || '底部文字'}
        </div>

        {sortedStickers.map((sticker) => (
          <div
            key={sticker.id}
            className={`canvas-sticker ${selectedStickerId === sticker.id ? 'selected' : ''} ${isDragging && dragType === 'sticker' ? 'dragging' : ''}`}
            style={{
              left: sticker.x,
              top: sticker.y,
              transform: `translate(-50%, -50%) scale(${sticker.scale}) rotate(${sticker.rotation}deg)`,
              fontSize: '48px',
              zIndex: sticker.zIndex,
            }}
            onMouseDown={(e) => {
              onSelectSticker(sticker.id);
              handleMouseDown(e, 'sticker', { x: sticker.x, y: sticker.y });
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelectSticker(sticker.id);
            }}
          >
            {sticker.content}
            {selectedStickerId === sticker.id && (
              <>
                <div
                  className="sticker-resize-handle"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleMouseDown(e, 'resize', { scale: sticker.scale });
                  }}
                />
                <div
                  className="sticker-rotate-handle"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleMouseDown(e, 'rotate', { x: sticker.x, y: sticker.y });
                  }}
                />
              </>
            )}
          </div>
        ))}

        {positionIndicator && (
          <div
            className="position-indicator"
            style={{
              left: positionIndicator.x,
              top: positionIndicator.y,
              transform: 'translateX(-50%)',
            }}
          >
            {positionIndicator.label}
          </div>
        )}
      </div>
    </div>
  );
}
