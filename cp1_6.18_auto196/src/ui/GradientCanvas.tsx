import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { useGradientStore } from '../store/useGradientStore';
import { colorEngine } from '../engine/ColorEngine';
import type { TransformState } from '../types';

const GradientCanvas: React.FC = () => {
  const { stops, angle, steps } = useGradientStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [transform, setTransform] = useState<TransformState>({ x: 0, y: 0, scale: 1 });
  const lastPosition = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 500 });

  const sortedStops = useMemo(() => {
    return [...stops].sort((a, b) => a.position - b.position);
  }, [stops]);

  const cssGradient = useMemo(() => {
    return colorEngine.generateCSSGradient({ stops, angle, steps });
  }, [stops, angle, steps]);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvasSize.width;
    const height = canvasSize.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2 + transform.x, height / 2 + transform.y);
    ctx.scale(transform.scale, transform.scale);
    ctx.translate(-width / 2, -height / 2);

    const gradient = colorEngine.createLinearGradient(
      ctx,
      { stops, angle, steps },
      width,
      height
    );
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.restore();

    ctx.save();
    const labelPositions = sortedStops.map((stop) => {
      const rad = ((angle - 90) * Math.PI) / 180;
      const gradientX = Math.cos(rad) * (stop.position / 100 - 0.5) * width + width / 2;
      const gradientY = Math.sin(rad) * (stop.position / 100 - 0.5) * height + height / 2;
      return { x: gradientX, y: gradientY, color: stop.color };
    });

    labelPositions.forEach(({ x, y, color }) => {
      const displayX = (x - width / 2) * transform.scale + width / 2 + transform.x;
      const displayY = (y - height / 2) * transform.scale + height / 2 + transform.y;

      if (displayX < -50 || displayX > width + 50 || displayY < -30 || displayY > height + 30) {
        return;
      }

      const isLight =
        parseInt(color.slice(1, 3), 16) * 0.299 +
          parseInt(color.slice(3, 5), 16) * 0.587 +
          parseInt(color.slice(5, 7), 16) * 0.114 >
        128;
      const textColor = isLight ? '#000000' : '#FFFFFF';

      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const text = color.toUpperCase();
      const textWidth = ctx.measureText(text).width;
      const paddingX = 6;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(
        displayX - textWidth / 2 - paddingX + 1,
        displayY - 8 + 1,
        textWidth + paddingX * 2,
        16
      );

      ctx.fillStyle = color;
      ctx.fillRect(
        displayX - textWidth / 2 - paddingX,
        displayY - 8,
        textWidth + paddingX * 2,
        16
      );

      ctx.fillStyle = textColor;
      ctx.fillText(text, displayX, displayY);
    });

    ctx.restore();
  }, [stops, angle, steps, sortedStops, transform, canvasSize]);

  useEffect(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(renderCanvas);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [renderCanvas]);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: 500 });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    lastPosition.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastPosition.current.x;
      const dy = e.clientY - lastPosition.current.y;
      setTransform((prev) => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy
      }));
      lastPosition.current = { x: e.clientX, y: e.clientY };
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform((prev) => ({
      ...prev,
      scale: Math.max(0.5, Math.min(5, prev.scale * delta))
    }));
  }, []);

  const handleReset = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={containerRef}
      className="gradient-canvas"
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <div className="gradient-canvas__fallback" style={{ background: cssGradient }} />
      <canvas ref={canvasRef} className="gradient-canvas__canvas" />
      <div className="gradient-canvas__controls">
        <span className="gradient-canvas__zoom">×{transform.scale.toFixed(1)}</span>
        <button className="gradient-canvas__reset" onClick={handleReset} title="重置视图">
          重置
        </button>
      </div>
      <div className="gradient-canvas__hint">拖拽平移 · 滚轮缩放</div>
    </div>
  );
};

export default GradientCanvas;
