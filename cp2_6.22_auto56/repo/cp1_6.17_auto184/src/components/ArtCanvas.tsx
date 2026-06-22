import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useArtworkStore } from '@/store/artworkStore';
import { drawShape, drawShapeOutline, isPointInShape } from '@/utils/shapes';
import { applyTextureToShape } from '@/utils/textures';
import { CANVAS_PIXEL_SIZE, RippleEffect } from '@/types';
import './ArtCanvas.css';

const ArtCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [ripples, setRipples] = useState<RippleEffect[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const animationRef = useRef<number>();

  const shapes = useArtworkStore((state) => state.shapes);
  const selectedShapeId = useArtworkStore((state) => state.selectedShapeId);
  const gradientConnections = useArtworkStore((state) => state.gradientConnections);
  const gradientMode = useArtworkStore((state) => state.gradientMode);
  const gradientStartId = useArtworkStore((state) => state.gradientStartId);
  const addShape = useArtworkStore((state) => state.addShape);
  const moveShape = useArtworkStore((state) => state.moveShape);
  const selectShape = useArtworkStore((state) => state.selectShape);
  const addGradientConnection = useArtworkStore((state) => state.addGradientConnection);
  const setGradientStartId = useArtworkStore((state) => state.setGradientStartId);

  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const findShapeAtPoint = useCallback((x: number, y: number) => {
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];
      if (isPointInShape(shape.type, x, y, shape.x, shape.y, shape.size, shape.rotation)) {
        return shape;
      }
    }
    return null;
  }, [shapes]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) return;

    const { x, y } = getCanvasCoords(e);
    const clickedShape = findShapeAtPoint(x, y);

    if (gradientMode) {
      if (clickedShape) {
        if (gradientStartId === null) {
          setGradientStartId(clickedShape.id);
        } else if (clickedShape.id !== gradientStartId) {
          addGradientConnection(gradientStartId, clickedShape.id);
        }
      }
      return;
    }

    if (clickedShape) {
      selectShape(clickedShape.id);
    } else {
      addRipple(x, y);
      addShape(x, y);
    }
  }, [isDragging, gradientMode, gradientStartId, getCanvasCoords, findShapeAtPoint, selectShape, addShape, addGradientConnection, setGradientStartId]);

  const addRipple = (x: number, y: number) => {
    const ripple: RippleEffect = {
      x,
      y,
      startTime: Date.now(),
      duration: 300,
    };
    setRipples((prev) => [...prev, ripple]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.startTime !== ripple.startTime));
    }, ripple.duration);
  };

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gradientMode) return;

    const { x, y } = getCanvasCoords(e);
    const clickedShape = findShapeAtPoint(x, y);

    if (clickedShape) {
      setIsDragging(true);
      selectShape(clickedShape.id);
      setDragOffset({
        x: x - clickedShape.x,
        y: y - clickedShape.y,
      });
    } else {
      selectShape(null);
    }
  }, [gradientMode, getCanvasCoords, findShapeAtPoint, selectShape]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedShapeId) return;

    const { x, y } = getCanvasCoords(e);
    const newX = Math.max(40, Math.min(CANVAS_PIXEL_SIZE - 40, x - dragOffset.x));
    const newY = Math.max(40, Math.min(CANVAS_PIXEL_SIZE - 40, y - dragOffset.y));
    moveShape(selectedShapeId, newX, newY);
  }, [isDragging, selectedShapeId, getCanvasCoords, dragOffset, moveShape]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#1A1A2E');
      gradient.addColorStop(1, '#3D3D6B');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 64; i++) {
        const pos = i * 10;
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(canvas.width, pos);
        ctx.stroke();
      }

      gradientConnections.forEach((conn) => {
        const fromShape = shapes.find((s) => s.id === conn.fromShapeId);
        const toShape = shapes.find((s) => s.id === conn.toShapeId);
        if (fromShape && toShape) {
          const lineGradient = ctx.createLinearGradient(
            fromShape.x, fromShape.y, toShape.x, toShape.y
          );
          lineGradient.addColorStop(0, fromShape.color);
          lineGradient.addColorStop(1, toShape.color);
          ctx.strokeStyle = lineGradient;
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(fromShape.x, fromShape.y);
          ctx.lineTo(toShape.x, toShape.y);
          ctx.stroke();
        }
      });

      shapes.forEach((shape) => {
        drawShape(ctx, shape.type, shape.x, shape.y, shape.size, shape.color, shape.rotation);
        if (shape.texture !== 'none') {
          applyTextureToShape(ctx, shape.texture, shape.color, shape.x, shape.y, shape.size);
        }
      });

      if (selectedShapeId) {
        const selectedShape = shapes.find((s) => s.id === selectedShapeId);
        if (selectedShape) {
          drawShapeOutline(
            ctx,
            selectedShape.type,
            selectedShape.x,
            selectedShape.y,
            selectedShape.size + 8,
            '#ffffff',
            2,
            selectedShape.rotation
          );
        }
      }

      if (gradientMode && gradientStartId) {
        const startShape = shapes.find((s) => s.id === gradientStartId);
        if (startShape) {
          drawShapeOutline(
            ctx,
            startShape.type,
            startShape.x,
            startShape.y,
            startShape.size + 12,
            '#6C63FF',
            3,
            startShape.rotation
          );
        }
      }

      ripples.forEach((ripple) => {
        const elapsed = Date.now() - ripple.startTime;
        const progress = Math.min(elapsed / ripple.duration, 1);
        const scale = progress * 3;
        const opacity = 0.7 * (1 - progress);
        const radius = 20 * scale;

        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [shapes, selectedShapeId, gradientConnections, gradientMode, gradientStartId, ripples]);

  return (
    <div className="canvas-container" ref={containerRef}>
      <canvas
        ref={canvasRef}
        width={CANVAS_PIXEL_SIZE}
        height={CANVAS_PIXEL_SIZE}
        className="art-canvas"
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
    </div>
  );
};

export default ArtCanvas;
