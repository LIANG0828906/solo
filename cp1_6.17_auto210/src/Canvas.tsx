import { useEffect, useRef, useCallback } from 'react';
import { ParticlesEngine } from './ParticlesEngine';

interface CanvasProps {
  color: string;
  brushSize: number;
  onClear: () => void;
  onUndo: () => void;
  onExport: () => void;
  engineRef: React.MutableRefObject<ParticlesEngine | null>;
}

export default function Canvas({
  color,
  brushSize,
  onClear,
  onUndo,
  onExport,
  engineRef,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const strokeIdRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const particlesPerFrame = 15;

  const getCanvasCoords = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      return {
        x: (clientX - rect.left) * (canvas.width / rect.width / dpr),
        y: (clientY - rect.top) * (canvas.height / rect.height / dpr),
      };
    },
    []
  );

  const emitParticles = useCallback(
    (fromX: number, fromY: number, toX: number, toY: number) => {
      const engine = engineRef.current;
      if (!engine || strokeIdRef.current === null) return;

      const dx = toX - fromX;
      const dy = toY - fromY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 1) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 80;
        const offset = (Math.random() - 0.5) * 10 * (Math.PI / 180);
        engine.addParticle(
          toX,
          toY,
          Math.cos(angle + offset) * speed,
          Math.sin(angle + offset) * speed,
          color,
          brushSize,
          strokeIdRef.current
        );
        return;
      }

      for (let i = 0; i < particlesPerFrame; i++) {
        const t = i / particlesPerFrame;
        const x = fromX + dx * t;
        const y = fromY + dy * t;

        const baseAngle = Math.atan2(dy, dx);
        const randomOffset = (Math.random() - 0.5) * 10 * (Math.PI / 180);
        const angle = baseAngle + randomOffset;
        const speed = 80;

        engine.addParticle(
          x,
          y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          color,
          brushSize,
          strokeIdRef.current
        );
      }
    },
    [color, brushSize, engineRef]
  );

  const startDrawing = useCallback(
    (x: number, y: number) => {
      const engine = engineRef.current;
      if (!engine) return;

      isDrawingRef.current = true;
      lastPointRef.current = { x, y };
      strokeIdRef.current = engine.addStroke(x, y);

      const angle = Math.random() * Math.PI * 2;
      const speed = 80;
      for (let i = 0; i < 5; i++) {
        const offset = (Math.random() - 0.5) * 10 * (Math.PI / 180);
        engine.addParticle(
          x,
          y,
          Math.cos(angle + offset) * speed,
          Math.sin(angle + offset) * speed,
          color,
          brushSize,
          strokeIdRef.current
        );
      }
    },
    [color, brushSize, engineRef]
  );

  const moveDrawing = useCallback(
    (x: number, y: number) => {
      if (!isDrawingRef.current || lastPointRef.current === null) return;

      const last = lastPointRef.current;
      emitParticles(last.x, last.y, x, y);
      lastPointRef.current = { x, y };
    },
    [emitParticles]
  );

  const endDrawing = useCallback(() => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
    strokeIdRef.current = null;
  }, []);

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      e.preventDefault();
      const { x, y } = getCanvasCoords(e.clientX, e.clientY);
      startDrawing(x, y);
    },
    [getCanvasCoords, startDrawing]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();
      const { x, y } = getCanvasCoords(e.clientX, e.clientY);
      moveDrawing(x, y);
    },
    [getCanvasCoords, moveDrawing]
  );

  const handleMouseUp = useCallback(() => {
    endDrawing();
  }, [endDrawing]);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      e.preventDefault();
      const touch = e.touches[0];
      const { x, y } = getCanvasCoords(touch.clientX, touch.clientY);
      startDrawing(x, y);
    },
    [getCanvasCoords, startDrawing]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      const { x, y } = getCanvasCoords(touch.clientX, touch.clientY);
      moveDrawing(x, y);
    },
    [getCanvasCoords, moveDrawing]
  );

  const handleTouchEnd = useCallback(() => {
    endDrawing();
  }, [endDrawing]);

  const exportCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) return;

    const exportWidth = 1920;
    const exportHeight = 1080;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = exportWidth;
    exportCanvas.height = exportHeight;
    const exportCtx = exportCanvas.getContext('2d');
    if (!exportCtx) return;

    exportCtx.fillStyle = '#0D0D0D';
    exportCtx.fillRect(0, 0, exportWidth, exportHeight);

    const scaleX = exportWidth / engine.width;
    const scaleY = exportHeight / engine.height;

    exportCtx.save();
    exportCtx.scale(scaleX, scaleY);
    engine.render(exportCtx);
    exportCtx.restore();

    const link = document.createElement('a');
    link.download = `fluid-particle-art-${Date.now()}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  }, [engineRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      if (!engineRef.current) {
        engineRef.current = new ParticlesEngine(width, height);
      } else {
        engineRef.current.resize(width, height);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = (time: number) => {
      const deltaTime = lastTimeRef.current ? time - lastTimeRef.current : 16;
      lastTimeRef.current = time;

      const engine = engineRef.current;
      if (engine) {
        const updateSteps = Math.max(1, Math.round(deltaTime / (1000 / 30)));
        for (let i = 0; i < updateSteps; i++) {
          engine.update(deltaTime / updateSteps);
        }

        ctx.fillStyle = '#0D0D0D';
        ctx.fillRect(0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));

        engine.render(ctx);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    engineRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  ]);

  useEffect(() => {
    const handleClear = () => {
      engineRef.current?.clear();
    };
    const handleUndo = () => {
      engineRef.current?.undoStroke();
    };
    const handleExport = () => {
      exportCanvas();
    };

    window.addEventListener('clear-canvas', handleClear);
    window.addEventListener('undo-stroke', handleUndo);
    window.addEventListener('export-canvas', handleExport);

    return () => {
      window.removeEventListener('clear-canvas', handleClear);
      window.removeEventListener('undo-stroke', handleUndo);
      window.removeEventListener('export-canvas', handleExport);
    };
  }, [engineRef, exportCanvas]);

  useEffect(() => {
    const checkState = () => {
      onClear();
      onUndo();
      onExport();
    };
    const interval = setInterval(checkState, 500);
    return () => clearInterval(interval);
  }, [onClear, onUndo, onExport]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: '#0D0D0D',
        touchAction: 'none',
        cursor: 'crosshair',
      }}
    />
  );
}
