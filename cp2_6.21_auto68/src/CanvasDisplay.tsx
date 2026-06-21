import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  renderPoster,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  type PosterConfig,
  type DecorElement,
} from './CanvasRenderer';

interface CanvasDisplayProps {
  config: PosterConfig;
  selectedDecorId: string | null;
  onSelectDecor: (id: string | null) => void;
  onUpdateDecor: (id: string, updates: Partial<DecorElement>) => void;
  isBgTransitioning: boolean;
}

export const CanvasDisplay: React.FC<CanvasDisplayProps> = ({
  config,
  selectedDecorId,
  onSelectDecor,
  onUpdateDecor,
  isBgTransitioning,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragDecorId, setDragDecorId] = useState<string | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0, decorX: 0, decorY: 0 });
  const rafRef = useRef<number | null>(null);
  const pendingConfigRef = useRef<PosterConfig>(config);

  const draw = useCallback((context: CanvasRenderingContext2D, cfg: PosterConfig) => {
    renderPoster(context, cfg, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (selectedDecorId) {
      const decor = cfg.decorations.find((d) => d.id === selectedDecorId);
      if (decor) {
        const px = (decor.x / 100) * CANVAS_WIDTH;
        const py = (decor.y / 100) * CANVAS_HEIGHT;
        const halfSize = decor.size / 2 + 8;

        context.save();
        context.strokeStyle = 'rgba(116, 185, 255, 0.4)';
        context.lineWidth = 2;
        context.setLineDash([4, 4]);
        context.strokeRect(
          px - halfSize,
          py - halfSize,
          halfSize * 2,
          halfSize * 2
        );
        context.restore();
      }
    }
  }, [selectedDecorId]);

  useEffect(() => {
    pendingConfigRef.current = config;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext('2d');
      if (!context) return;
      draw(context, pendingConfigRef.current);
      rafRef.current = null;
    });

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [config, draw]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const hitTestDecor = (x: number, y: number): DecorElement | null => {
    for (let i = config.decorations.length - 1; i >= 0; i--) {
      const decor = config.decorations[i];
      const dx = (decor.x / 100) * CANVAS_WIDTH - x;
      const dy = (decor.y / 100) * CANVAS_HEIGHT - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= decor.size / 2 + 10) {
        return decor;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    const decor = hitTestDecor(x, y);
    
    if (decor) {
      setIsDragging(true);
      setDragDecorId(decor.id);
      onSelectDecor(decor.id);
      dragStartRef.current = {
        x,
        y,
        decorX: decor.x,
        decorY: decor.y,
      };
    } else {
      onSelectDecor(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragDecorId) return;
    
    const { x, y } = getCanvasCoords(e);
    const dx = x - dragStartRef.current.x;
    const dy = y - dragStartRef.current.y;
    
    const newX = Math.max(0, Math.min(100, dragStartRef.current.decorX + (dx / CANVAS_WIDTH) * 100));
    const newY = Math.max(0, Math.min(100, dragStartRef.current.decorY + (dy / CANVAS_HEIGHT) * 100));
    
    onUpdateDecor(dragDecorId, { x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragDecorId(null);
  };

  return (
    <div
      style={{
        position: 'relative',
        border: '2px solid #dee2e6',
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s ease',
        backgroundColor: '#fff',
      }}
      className="canvas-wrapper"
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
          cursor: isDragging ? 'grabbing' : 'default',
          opacity: isBgTransitioning ? 0 : 1,
          transition: 'opacity 0.3s ease',
        }}
      />
    </div>
  );
};
