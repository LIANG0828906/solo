import { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import type { CanvasElement, CanvasSize, CanvasDimensions } from '../types';
import { DraggableElement } from './DraggableElement';
import { CANVAS_SIZES } from '../constants';

interface CanvasProps {
  elements: CanvasElement[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  editingId: string | null;
  onStartEditing: (id: string) => void;
  onEditChange: (text: string) => void;
  onEndEditing: () => void;
  canvasSize: CanvasSize;
  customDimensions?: CanvasDimensions;
  canvasRef?: React.RefObject<HTMLDivElement>;
}

export const Canvas = ({
  elements,
  selectedId,
  onSelect,
  onUpdateElement,
  editingId,
  onStartEditing,
  onEditChange,
  onEndEditing,
  canvasSize,
  customDimensions,
  canvasRef: externalRef,
}: CanvasProps) => {
  const internalRef = useRef<HTMLDivElement>(null);
  const canvasRef = externalRef || internalRef;
  const noiseCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasScale, setCanvasScale] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);

  const dimensions = useMemo((): CanvasDimensions => {
    if (canvasSize === 'custom' && customDimensions) {
      return customDimensions;
    }
    const size = CANVAS_SIZES[canvasSize as keyof typeof CANVAS_SIZES];
    return size ? { width: size.width, height: size.height } : { width: 420, height: 594 };
  }, [canvasSize, customDimensions]);

  useEffect(() => {
    const noiseCanvas = noiseCanvasRef.current;
    if (!noiseCanvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = noiseCanvas.getBoundingClientRect();
    noiseCanvas.width = rect.width * dpr;
    noiseCanvas.height = rect.height * dpr;

    const ctx = noiseCanvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    const imageData = ctx.createImageData(rect.width, rect.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random();
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = Math.floor(noise * 20);
    }

    ctx.putImageData(imageData, 0, 0);
  }, [dimensions]);

  useEffect(() => {
    const updateScale = () => {
      const container = containerRef.current;
      if (!container) return;
      const maxWidth = Math.min(900, container.clientWidth - 40);
      const minWidth = 400;
      const scale = Math.max(0.5, Math.min(maxWidth / dimensions.width, minWidth / dimensions.width));
      setCanvasScale(Math.min(scale, 2.5));
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [dimensions]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onSelect(null);
      if (editingId) {
        onEndEditing();
      }
    }
  }, [onSelect, editingId, onEndEditing]);

  const handleUpdateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    const element = elements.find((el) => el.id === id);
    if (!element) return;

    let finalUpdates = updates;

    if (updates.x !== undefined || updates.y !== undefined) {
      const minX = -element.width * 0.3;
      const maxX = dimensions.width - element.width * 0.7;
      const minY = -element.height * 0.3;
      const maxY = dimensions.height - element.height * 0.7;

      const clampedX = Math.max(minX, Math.min(maxX, updates.x ?? element.x));
      const clampedY = Math.max(minY, Math.min(maxY, updates.y ?? element.y));

      finalUpdates = { ...finalUpdates, x: clampedX, y: clampedY };
    }

    onUpdateElement(id, finalUpdates);
  }, [elements, dimensions, onUpdateElement]);

  const handleBounceBack = useCallback((id: string) => {
    const element = elements.find((el) => el.id === id);
    if (!element) return;

    const minX = 0;
    const maxX = dimensions.width - element.width;
    const minY = 0;
    const maxY = dimensions.height - element.height;

    let shouldBounce = false;
    let targetX = element.x;
    let targetY = element.y;

    if (element.x < minX) { targetX = minX; shouldBounce = true; }
    if (element.x > maxX) { targetX = maxX; shouldBounce = true; }
    if (element.y < minY) { targetY = minY; shouldBounce = true; }
    if (element.y > maxY) { targetY = maxY; shouldBounce = true; }

    if (shouldBounce) {
      setIsAnimating(true);
      setTimeout(() => {
        onUpdateElement(id, { x: targetX, y: targetY });
        setTimeout(() => setIsAnimating(false), 300);
      }, 50);
    }
  }, [elements, dimensions, onUpdateElement]);

  const sortedElements = useMemo(() => {
    return [...elements].sort((a, b) => a.zIndex - b.zIndex);
  }, [elements]);

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        padding: '20px',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          padding: '20px',
          backgroundColor: '#4A5568',
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        <div
          ref={canvasRef as React.RefObject<HTMLDivElement>}
          onClick={handleCanvasClick}
          style={{
            position: 'relative',
            width: dimensions.width,
            height: dimensions.height,
            backgroundColor: '#2B3A42',
            borderRadius: '6px',
            overflow: 'hidden',
            transform: `scale(${canvasScale})`,
            transformOrigin: 'center center',
            transition: isAnimating ? 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)' : 'none',
            boxShadow: 'inset 0 0 60px rgba(0,0,0,0.3)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              background: `
                radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.2) 100%),
                linear-gradient(to right, rgba(30,40,45,0.4) 0%, transparent 5%, transparent 95%, rgba(30,40,45,0.4) 100%),
                linear-gradient(to bottom, rgba(30,40,45,0.4) 0%, transparent 5%, transparent 95%, rgba(30,40,45,0.4) 100%)
              `,
            }}
          />

          <canvas
            ref={noiseCanvasRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              opacity: 0.08,
            }}
          />

          {sortedElements.map((element) => (
            <DraggableElement
              key={element.id}
              element={element}
              isSelected={selectedId === element.id}
              onSelect={onSelect}
              onUpdate={handleUpdateElement}
              onDoubleClick={onStartEditing}
              isEditing={editingId === element.id}
              onEditChange={onEditChange}
              onEditBlur={onEndEditing}
              canvasScale={canvasScale}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
