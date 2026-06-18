import React, { useRef, useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import type { Particle, Shape, Transform } from '../hooks/useCanvasState';

interface PromptCanvasProps {
  particles: Particle[];
  shapes: Shape[];
  transform: Transform;
  colors: string[];
  isGenerated: boolean;
  onTransformChange: (transform: { x?: number; y?: number; scale?: number }) => void;
  onParticleHover: (index: number, isHovered: boolean) => void;
  canvasRef?: React.MutableRefObject<HTMLCanvasElement | null>;
  containerRef?: React.MutableRefObject<HTMLDivElement | null>;
}

export const PromptCanvas: React.FC<PromptCanvasProps> = ({
  particles,
  shapes,
  transform,
  colors: _colors,
  isGenerated,
  onTransformChange,
  onParticleHover,
  canvasRef: externalCanvasRef,
  containerRef: externalContainerRef,
}) => {
  const internalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const internalContainerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = externalCanvasRef || internalCanvasRef;
  const containerRef = externalContainerRef || internalContainerRef;

  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const hoveredParticleIndex = useRef<number>(-1);
  const renderRef = useRef<number | null>(null);

  const drawShape = useCallback(
    (ctx: CanvasRenderingContext2D, shape: Shape) => {
      ctx.save();
      ctx.translate(shape.x, shape.y);
      ctx.rotate(shape.rotation);
      ctx.globalAlpha = 0.3;

      let gradient: CanvasGradient | null = null;
      if (shape.gradient) {
        gradient = ctx.createLinearGradient(-shape.width / 2, -shape.height / 2, shape.width / 2, shape.height / 2);
        gradient.addColorStop(0, shape.gradient.start);
        gradient.addColorStop(1, shape.gradient.end);
      }

      ctx.fillStyle = gradient || shape.color;
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = 2;

      switch (shape.type) {
        case 'circle':
          ctx.beginPath();
          ctx.arc(0, 0, shape.width / 2, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'rect':
          ctx.fillRect(-shape.width / 2, -shape.height / 2, shape.width, shape.height);
          break;

        case 'wave':
          ctx.beginPath();
          ctx.moveTo(-shape.width / 2, 0);
          const segments = 20;
          for (let i = 0; i <= segments; i++) {
            const x = -shape.width / 2 + (shape.width * i) / segments;
            const y = Math.sin((i / segments) * Math.PI * 2) * (shape.height / 2);
            ctx.lineTo(x, y);
          }
          ctx.lineWidth = 3;
          ctx.stroke();
          break;
      }

      ctx.restore();
    },
    []
  );

  const drawParticle = useCallback(
    (ctx: CanvasRenderingContext2D, particle: Particle) => {
      const size = particle.size * particle.hoverScale;
      ctx.save();
      ctx.globalAlpha = particle.opacity;
      ctx.fillStyle = particle.color;

      const gradient = ctx.createRadialGradient(
        particle.x,
        particle.y,
        0,
        particle.x,
        particle.y,
        size
      );
      gradient.addColorStop(0, particle.color);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = particle.color;
      ctx.globalAlpha = particle.opacity * 0.8;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, size * 0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    },
    []
  );

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    ctx.scale(dpr, dpr);

    const bgGradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    bgGradient.addColorStop(0, '#1A1A2E');
    bgGradient.addColorStop(1, '#16213E');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, rect.width, rect.height);

    if (!isGenerated) {
      ctx.save();
      ctx.fillStyle = '#533483';
      ctx.font = '20px "Playfair Display", serif';
      ctx.textAlign = 'center';
      ctx.globalAlpha = 0.5;
      ctx.fillText('输入诗意文本，开启创作之旅', rect.width / 2, rect.height / 2);
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.translate(transform.x + rect.width / 2, transform.y + rect.height / 2);
    ctx.scale(transform.scale, transform.scale);
    ctx.translate(-rect.width / 2, -rect.height / 2);

    shapes.forEach(shape => drawShape(ctx, shape));
    particles.forEach(particle => drawParticle(ctx, particle));

    ctx.restore();
  }, [canvasRef, containerRef, transform, particles, shapes, isGenerated, drawShape, drawParticle]);

  useEffect(() => {
    const animate = () => {
      render();
      renderRef.current = requestAnimationFrame(animate);
    };

    renderRef.current = requestAnimationFrame(animate);

    return () => {
      if (renderRef.current) {
        cancelAnimationFrame(renderRef.current);
      }
    };
  }, [render]);

  const screenToCanvas = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };

      const rect = container.getBoundingClientRect();
      const x = (clientX - rect.left - rect.width / 2 - transform.x) / transform.scale + rect.width / 2;
      const y = (clientY - rect.top - rect.height / 2 - transform.y) / transform.scale + rect.height / 2;

      return { x, y };
    },
    [containerRef, transform]
  );

  const findHoveredParticle = useCallback(
    (x: number, y: number): number => {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        const dx = p.x - x;
        const dy = p.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < p.size * 2) {
          return i;
        }
      }
      return -1;
    },
    [particles]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        lastMousePos.current = { x: e.clientX, y: e.clientY };

        onTransformChange({
          x: transform.targetX + dx,
          y: transform.targetY + dy,
        });
      } else {
        const canvasPos = screenToCanvas(e.clientX, e.clientY);
        const particleIndex = findHoveredParticle(canvasPos.x, canvasPos.y);

        if (particleIndex !== hoveredParticleIndex.current) {
          if (hoveredParticleIndex.current >= 0) {
            onParticleHover(hoveredParticleIndex.current, false);
          }
          if (particleIndex >= 0) {
            onParticleHover(particleIndex, true);
          }
          hoveredParticleIndex.current = particleIndex;
        }
      }
    },
    [isDragging, transform, onTransformChange, screenToCanvas, findHoveredParticle, onParticleHover]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
    setIsHovering(false);
    if (hoveredParticleIndex.current >= 0) {
      onParticleHover(hoveredParticleIndex.current, false);
      hoveredParticleIndex.current = -1;
    }
  }, [onParticleHover]);

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - rect.width / 2;
      const mouseY = e.clientY - rect.top - rect.height / 2;

      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newScale = Math.max(0.5, Math.min(3, transform.targetScale + delta * transform.targetScale));
      const scaleRatio = newScale / transform.targetScale;

      const newX = transform.targetX - mouseX * (scaleRatio - 1);
      const newY = transform.targetY - mouseY * (scaleRatio - 1);

      onTransformChange({
        x: newX,
        y: newY,
        scale: newScale,
      });
    },
    [containerRef, transform, onTransformChange]
  );

  return (
    <motion.div
      ref={containerRef as React.Ref<HTMLDivElement>}
      className="prompt-canvas-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)',
        borderRadius: '12px',
        cursor: isDragging ? 'grabbing' : 'grab',
        border: isHovering ? '2px solid #E94560' : '2px dashed #E94560',
        transition: 'border 0.2s ease',
        overflow: 'hidden',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      onWheel={handleWheel}
    >
      <canvas
        ref={canvasRef as React.Ref<HTMLCanvasElement>}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />

      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.4)',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#E0E0E0',
          opacity: isHovering ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none',
        }}
      >
        <span>缩放: {Math.round(transform.scale * 100)}%</span>
      </div>
    </motion.div>
  );
};
