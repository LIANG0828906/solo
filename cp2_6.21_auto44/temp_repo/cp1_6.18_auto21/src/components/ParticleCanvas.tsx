import React, { useRef, useEffect, useCallback, useState } from 'react';
import { usePoemStore } from '@/stores/poemStore';
import { Particle, Ripple } from '@/utils/textToParticles';

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  particle: Particle | null;
}

const ParticleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const fpsRef = useRef<number[]>([]);

  const {
    particles,
    ripples,
    hoveredParticleId,
    fontSize,
    isAnimating,
    updateParticles,
    setCanvasSize,
    setHoveredParticle,
    addRipple,
  } = usePoemStore();

  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    particle: null,
  });

  const drawGlow = useCallback(
    (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, opacity: number) => {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, color + Math.floor(opacity * 255).toString(16).padStart(2, '0'));
      gradient.addColorStop(0.5, color + Math.floor(opacity * 128).toString(16).padStart(2, '0'));
      gradient.addColorStop(1, color + '00');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    },
    []
  );

  const drawParticle = useCallback(
    (ctx: CanvasRenderingContext2D, particle: Particle, time: number) => {
      const { x, y, char, color, glowColor, glowRadius, glowOpacity, scale, rotation, opacity } = particle;

      const breathScale = 1 + Math.sin(time * 0.002 + particle.unicode) * 0.05;
      const finalScale = scale * breathScale;

      drawGlow(ctx, x, y, glowRadius * finalScale, glowColor, glowOpacity);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.scale(finalScale, finalScale);
      ctx.globalAlpha = opacity;

      ctx.font = `bold ${fontSize}px "Microsoft YaHei", "SimHei", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = color;
      ctx.fillText(char, 0, 0);

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      ctx.restore();
    },
    [drawGlow, fontSize]
  );

  const drawRipple = useCallback((ctx: CanvasRenderingContext2D, ripple: Ripple) => {
    ctx.save();
    ctx.strokeStyle = `rgba(255, 255, 255, ${ripple.opacity})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }, []);

  const render = useCallback(
    (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const ripple of ripples) {
        drawRipple(ctx, ripple);
      }

      for (const particle of particles) {
        drawParticle(ctx, particle, time);
      }

      if (hoveredParticleId) {
        const hovered = particles.find((p) => p.id === hoveredParticleId);
        if (hovered) {
          ctx.save();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(hovered.x, hovered.y, fontSize * hovered.scale * 0.8, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }
    },
    [particles, ripples, hoveredParticleId, drawParticle, drawRipple, fontSize]
  );

  const animate = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      const deltaTime = lastTimeRef.current ? time - lastTimeRef.current : 16.67;
      lastTimeRef.current = time;

      fpsRef.current.push(1000 / deltaTime);
      if (fpsRef.current.length > 60) fpsRef.current.shift();

      if (isAnimating) {
        updateParticles(deltaTime);
      }

      render(ctx, canvas, time);

      animationFrameRef.current = requestAnimationFrame(animate);
    },
    [isAnimating, updateParticles, render]
  );

  const getParticleAtPosition = useCallback(
    (clientX: number, clientY: number): Particle | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const x = (clientX - rect.left) * (canvas.width / rect.width);
      const y = (clientY - rect.top) * (canvas.height / rect.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        const distance = Math.sqrt(Math.pow(x - p.x, 2) + Math.pow(y - p.y, 2));
        if (distance < fontSize * p.scale * 0.8) {
          return p;
        }
      }
      return null;
    },
    [particles, fontSize]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const particle = getParticleAtPosition(e.clientX, e.clientY);
      if (particle) {
        setHoveredParticle(particle.id);
        setTooltip({
          visible: true,
          x: e.clientX,
          y: e.clientY,
          particle,
        });
      } else {
        setHoveredParticle(null);
        setTooltip({ visible: false, x: 0, y: 0, particle: null });
      }
    },
    [getParticleAtPosition, setHoveredParticle]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);

      const particle = getParticleAtPosition(e.clientX, e.clientY);
      if (particle) {
        addRipple(particle.x, particle.y);
      } else {
        addRipple(x, y);
      }
    },
    [getParticleAtPosition, addRipple]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredParticle(null);
    setTooltip({ visible: false, x: 0, y: 0, particle: null });
  }, [setHoveredParticle]);

  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      setCanvasSize(width, height);

      const canvas = canvasRef.current;
      if (canvas) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(dpr, dpr);
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setCanvasSize]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animate]);

  const emotionLabels: Record<string, string> = {
    joy: '喜悦',
    sadness: '悲伤',
    calm: '平静',
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '80vh',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onMouseLeave={handleMouseLeave}
        style={{
          cursor: hoveredParticleId ? 'pointer' : 'default',
          display: 'block',
        }}
      />
      {tooltip.visible && tooltip.particle && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x + 15,
            top: tooltip.y + 15,
            background: '#FFFFFF',
            color: '#1A1A2E',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '14px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            pointerEvents: 'none',
            zIndex: 1000,
            whiteSpace: 'nowrap',
            transition: 'all 200ms cubic-bezier(0.25, 0.1, 0.25, 1)',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            字符：{tooltip.particle.char}
          </div>
          <div style={{ color: '#666', fontSize: '12px' }}>
            Unicode：U+{tooltip.particle.unicode.toString(16).toUpperCase().padStart(4, '0')}
          </div>
          <div style={{ color: '#666', fontSize: '12px' }}>
            笔画数：{tooltip.particle.strokeCount}
          </div>
          <div style={{ color: '#666', fontSize: '12px' }}>
            情感：{emotionLabels[tooltip.particle.emotion]}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticleCanvas;
