import React, { useEffect, useRef } from 'react';
import { WeatherEngine } from '../weatherEngine';
import { useAppStore } from '../store';

const ParticleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<WeatherEngine | null>(null);
  const fpsRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLDivElement>(null);
  const memoryRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const memoryUpdateTimer = useRef<number>(0);
  const { currentCity, isMobile } = useAppStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const engine = new WeatherEngine(currentCity);
    engineRef.current = engine;

    const handleResize = () => {
      if (!canvas || !container || !engineRef.current) return;
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      engineRef.current.setCanvasSize({
        width: rect.width,
        height: rect.height,
        dpr,
      });
    };

    handleResize();
    engine.setMobileReduction(isMobile);
    engine.setInitialConfig(currentCity);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const delta = Math.min(50, time - lastTimeRef.current);
      lastTimeRef.current = time;

      if (engineRef.current) {
        engineRef.current.update(delta);
        engineRef.current.render(ctx);

        if (fpsRef.current && countRef.current) {
          fpsRef.current.textContent = `FPS: ${engineRef.current.getFps()}`;
          countRef.current.textContent = `Particles: ${engineRef.current.getParticleCount()}`;
        }

        memoryUpdateTimer.current += delta;
        if (memoryUpdateTimer.current >= 1000 && memoryRef.current) {
          memoryUpdateTimer.current = 0;
          const memMB = engineRef.current.getMemoryMB();
          memoryRef.current.textContent = memMB !== null ? `Memory: ${memMB.toFixed(1)} MB` : 'Memory: N/A';
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', handleResize);
      lastTimeRef.current = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setMobileReduction(isMobile);
    }
  }, [isMobile]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.transitionTo(currentCity, 1500);
    }
  }, [currentCity]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 110,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          padding: '8px 12px',
          background: 'rgba(0, 0, 0, 0.6)',
          borderRadius: 8,
          fontFamily: 'monospace, "Courier New", Courier',
          fontSize: 13,
          color: '#00FF88',
          lineHeight: 1.7,
          minWidth: 130,
          textShadow: '0 0 4px rgba(0, 255, 136, 0.5)',
          zIndex: 5,
          pointerEvents: 'none',
          border: '1px solid rgba(0, 255, 136, 0.25)',
          boxShadow: '0 0 12px rgba(0, 255, 136, 0.1), inset 0 0 20px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(4px)',
        }}
      >
        <div
          ref={fpsRef}
          style={{
            letterSpacing: 0.5,
            borderBottom: '1px solid rgba(0, 255, 136, 0.15)',
            paddingBottom: 4,
            marginBottom: 2,
          }}
        >
          FPS: 0
        </div>
        <div
          ref={countRef}
          style={{
            letterSpacing: 0.5,
            borderBottom: '1px solid rgba(0, 255, 136, 0.15)',
            paddingBottom: 4,
            marginBottom: 2,
          }}
        >
          Particles: 0
        </div>
        <div ref={memoryRef} style={{ letterSpacing: 0.5 }}>
          Memory: --
        </div>
      </div>
    </div>
  );
};

export default ParticleCanvas;
