import React, { useRef, useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import {
  SHAPE_STROKE_COLORS,
  SHAPE_OPACITY,
  STROKE_WIDTH,
} from '@/types';
import type { Shape } from '@/types';

const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    colors,
    shapes,
    canvasSize,
    draggingShapeId,
    updateShapePosition,
    setDraggingShapeId,
    removeShape,
    addShapeAt,
  } = useStore();

  const dragStateRef = useRef({
    isDragging: false,
    shapeId: null as string | null,
    offsetX: 0,
    offsetY: 0,
  });

  const lastClickTimeRef = useRef(0);
  const lastClickPosRef = useRef({ x: 0, y: 0 });

  const getStrokeColor = (index: number): string => {
    return SHAPE_STROKE_COLORS[index % SHAPE_STROKE_COLORS.length];
  };

  const drawShape = useCallback(
    (ctx: CanvasRenderingContext2D, shape: Shape, isDragging: boolean) => {
      const color = colors[shape.colorIndex]?.color || '#ffffff';
      const strokeColor = getStrokeColor(shape.colorIndex);
      const { x, y, size } = shape;
      const halfSize = size / 2;

      ctx.save();
      ctx.globalAlpha = SHAPE_OPACITY;
      ctx.fillStyle = color;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = STROKE_WIDTH;

      if (isDragging) {
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
      }

      switch (shape.type) {
        case 'circle':
          ctx.beginPath();
          ctx.arc(x, y, halfSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          break;

        case 'triangle': {
          const height = (size * Math.sqrt(3)) / 2;
          const topY = y - height / 2;
          const bottomY = y + height / 2;
          const leftX = x - halfSize;
          const rightX = x + halfSize;
          ctx.beginPath();
          ctx.moveTo(x, topY);
          ctx.lineTo(leftX, bottomY);
          ctx.lineTo(rightX, bottomY);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;
        }

        case 'diamond':
          ctx.beginPath();
          ctx.moveTo(x, y - halfSize);
          ctx.lineTo(x + halfSize, y);
          ctx.lineTo(x, y + halfSize);
          ctx.lineTo(x - halfSize, y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;
      }

      ctx.restore();
    },
    [colors]
  );

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvasSize;

    ctx.clearRect(0, 0, width, height);

    const stripeHeight = height / colors.length;
    colors.forEach((colorItem, index) => {
      ctx.fillStyle = colorItem.color;
      ctx.fillRect(0, index * stripeHeight, width, stripeHeight + 1);
    });

    shapes.forEach((shape) => {
      drawShape(ctx, shape, shape.id === draggingShapeId);
    });
  }, [colors, shapes, canvasSize, draggingShapeId, drawShape]);

  useEffect(() => {
    draw();
  }, [draw]);

  const getCanvasCoordinates = (
    clientX: number,
    clientY: number
  ): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const hitTest = (x: number, y: number): Shape | null => {
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];
      const halfSize = shape.size / 2;
      const dx = x - shape.x;
      const dy = y - shape.y;

      switch (shape.type) {
        case 'circle':
          if (dx * dx + dy * dy <= halfSize * halfSize) {
            return shape;
          }
          break;

        case 'triangle': {
          const height = (shape.size * Math.sqrt(3)) / 2;
          const topY = shape.y - height / 2;
          const bottomY = shape.y + height / 2;

          if (y >= topY && y <= bottomY) {
            const t = (y - topY) / height;
            const halfWidth = halfSize * t;
            if (Math.abs(dx) <= halfWidth) {
              return shape;
            }
          }
          break;
        }

        case 'diamond':
          if (
            Math.abs(dx) / halfSize + Math.abs(dy) / halfSize <= 1
          ) {
            return shape;
          }
          break;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
    const hitShape = hitTest(x, y);

    const now = Date.now();
    const timeDiff = now - lastClickTimeRef.current;
    const posDiff = Math.sqrt(
      Math.pow(x - lastClickPosRef.current.x, 2) +
        Math.pow(y - lastClickPosRef.current.y, 2)
    );

    if (hitShape && timeDiff < 300 && posDiff < 10) {
      removeShape(hitShape.id);
      lastClickTimeRef.current = 0;
      return;
    }

    lastClickTimeRef.current = now;
    lastClickPosRef.current = { x, y };

    if (hitShape) {
      dragStateRef.current = {
        isDragging: true,
        shapeId: hitShape.id,
        offsetX: x - hitShape.x,
        offsetY: y - hitShape.y,
      };
      setDraggingShapeId(hitShape.id);
    } else if (e.shiftKey) {
      addShapeAt(x, y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragStateRef.current.isDragging || !dragStateRef.current.shapeId) return;

    const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
    const newX = x - dragStateRef.current.offsetX;
    const newY = y - dragStateRef.current.offsetY;

    updateShapePosition(dragStateRef.current.shapeId, newX, newY);
  };

  const handleMouseUp = () => {
    dragStateRef.current = {
      isDragging: false,
      shapeId: null,
      offsetX: 0,
      offsetY: 0,
    };
    setDraggingShapeId(null);
  };

  const handleMouseLeave = () => {
    if (dragStateRef.current.isDragging) {
      handleMouseUp();
    }
  };

  const getTouchCoordinates = (
    touch: React.Touch
  ): { x: number; y: number } => {
    return getCanvasCoordinates(touch.clientX, touch.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length !== 1) return;
    e.preventDefault();

    const touch = e.touches[0];
    const { x, y } = getTouchCoordinates(touch);
    const hitShape = hitTest(x, y);

    if (hitShape) {
      dragStateRef.current = {
        isDragging: true,
        shapeId: hitShape.id,
        offsetX: x - hitShape.x,
        offsetY: y - hitShape.y,
      };
      setDraggingShapeId(hitShape.id);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!dragStateRef.current.isDragging || !dragStateRef.current.shapeId) return;
    if (e.touches.length !== 1) return;
    e.preventDefault();

    const touch = e.touches[0];
    const { x, y } = getTouchCoordinates(touch);
    const newX = x - dragStateRef.current.offsetX;
    const newY = y - dragStateRef.current.offsetY;

    updateShapePosition(dragStateRef.current.shapeId, newX, newY);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    handleMouseUp();
  };

  return (
    <div ref={containerRef} style={styles.canvasContainer}>
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        style={styles.canvas}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  canvasContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    backgroundColor: '#1a1a2e',
    flex: 1,
    overflow: 'auto',
  },
  canvas: {
    border: '2px solid #e0e0e0',
    borderRadius: '4px',
    cursor: 'default',
    maxWidth: '100%',
    height: 'auto',
    touchAction: 'none',
  },
};

export default Canvas;
