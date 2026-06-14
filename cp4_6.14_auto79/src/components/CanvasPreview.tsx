import React, { useCallback, useMemo, useRef, useState } from 'react';
import { MousePointer } from 'lucide-react';
import { useGradientStore } from '../store';
import { generateGradientCss } from '../utils/cssGenerator';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const RECT_WIDTH = 200;
const RECT_HEIGHT = 120;
const RECT_RADIUS = 16;

export const CanvasPreview: React.FC = () => {
  const currentGradient = useGradientStore((s) => s.currentGradient);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const gradientBg = useMemo(
    () => ({
      background: generateGradientCss(currentGradient),
      transition: 'background 200ms ease-out'
    }),
    [currentGradient]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      const container = containerRef.current.getBoundingClientRect();
      let newX = e.clientX - container.left - dragOffset.current.x;
      let newY = e.clientY - container.top - dragOffset.current.y;
      newX = Math.max(0, Math.min(newX, CANVAS_WIDTH - RECT_WIDTH));
      newY = Math.max(0, Math.min(newY, CANVAS_HEIGHT - RECT_HEIGHT));
      setPos({ x: Math.round(newX), y: Math.round(newY) });
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <MousePointer size={20} color="#3b82f6" />
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>画布预览</h2>
        <span
          style={{
            fontSize: 13,
            color: 'var(--color-text-secondary)',
            marginLeft: 4
          }}
        >
          拖拽矩形测试视觉效果
        </span>
      </div>

      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          width: CANVAS_WIDTH,
          maxWidth: '100%',
          height: CANVAS_HEIGHT,
          backgroundColor: 'var(--color-bg-card)',
          borderRadius: 12,
          position: 'relative',
          overflow: 'hidden',
          backgroundImage:
            'linear-gradient(45deg, rgba(148,163,184,0.08) 25%, transparent 25%), linear-gradient(-45deg, rgba(148,163,184,0.08) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(148,163,184,0.08) 75%), linear-gradient(-45deg, transparent 75%, rgba(148,163,184,0.08) 75%)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
        }}
      >
        <div
          onMouseDown={handleMouseDown}
          style={{
            position: 'absolute',