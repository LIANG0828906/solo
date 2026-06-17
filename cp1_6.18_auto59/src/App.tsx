import { useEffect, useRef, useState, useCallback } from 'react';
import { useSimStore } from '@/store/useSimStore';
import { CanvasRenderer } from '@/engine/CanvasRenderer';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number; id: string } | null>(null);
  const [fps, setFps] = useState(60);
  const [isMobile, setIsMobile] = useState(false);

  const {
    inkPoints,
    addInkPoint,
    setCanvasSize,
    clearAll,
    undoLast,
  } = useSimStore();

  const handleResize = useCallback(() => {
    if (!canvasRef.current) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    canvasRef.current.width = width * dpr;
    canvasRef.current.height = height * dpr;
    canvasRef.current.style.width = `${width}px`;
    canvasRef.current.style.height = `${height}px`;

    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    setCanvasSize(width, height);
    rendererRef.current?.resize(width * dpr, height * dpr);
  }, [setCanvasSize]);

  const getCanvasCoords = useCallback((e: React.MouseEvent | MouseEvent | React.Touch): { x: number; y: number } => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDrawingRef.current = true;
    const { x, y } = getCanvasCoords(e);

    const tempId = `temp-${Date.now()}`;
    addInkPoint(x, y);
    lastPointRef.current = { x, y, id: tempId };
  }, [addInkPoint, getCanvasCoords]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawingRef.current || !lastPointRef.current) return;

    const { x, y } = getCanvasCoords(e);
    const { x: lastX, y: lastY } = lastPointRef.current;
    const distance = Math.sqrt((x - lastX) ** 2 + (y - lastY) ** 2);

    if (distance >= 40) {
      const prevPoint = inkPoints[inkPoints.length - 1];
      addInkPoint(x, y, prevPoint?.id);
      lastPointRef.current = { x, y, id: prevPoint?.id || '' };
    }
  }, [addInkPoint, getCanvasCoords, inkPoints]);

  const handleMouseUp = useCallback(() => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  }, []);

  const handleMouseLeave = useCallback(() => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    isDrawingRef.current = true;
    const { x, y } = getCanvasCoords(touch);

    addInkPoint(x, y);
    lastPointRef.current = { x, y, id: `temp-${Date.now()}` };
  }, [addInkPoint, getCanvasCoords]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawingRef.current || !lastPointRef.current) return;

    const touch = e.touches[0];
    const { x, y } = getCanvasCoords(touch);
    const { x: lastX, y: lastY } = lastPointRef.current;
    const distance = Math.sqrt((x - lastX) ** 2 + (y - lastY) ** 2);

    if (distance >= 40) {
      const prevPoint = inkPoints[inkPoints.length - 1];
      addInkPoint(x, y, prevPoint?.id);
      lastPointRef.current = { x, y, id: prevPoint?.id || '' };
    }
  }, [addInkPoint, getCanvasCoords, inkPoints]);

  const handleTouchEnd = useCallback(() => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    canvasRef.current.width = width * dpr;
    canvasRef.current.height = height * dpr;
    canvasRef.current.style.width = `${width}px`;
    canvasRef.current.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    setCanvasSize(width, height);

    const renderer = new CanvasRenderer(ctx, {
      store: useSimStore,
      onFpsUpdate: (newFps) => setFps(newFps),
    });
    rendererRef.current = renderer;
    renderer.start();

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(canvasRef.current);

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      renderer.destroy();
      resizeObserver.disconnect();
      window.removeEventListener('resize', checkMobile);
    };
  }, [setCanvasSize, handleResize]);

  const canUndo = inkPoints.length > 0;
  const canClear = inkPoints.length > 0;

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: '#F5F0E1',
    }}>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          cursor: 'crosshair',
          touchAction: 'none',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      <div style={{
        position: 'absolute',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: isMobile ? '72px' : '56px',
        padding: '8px 20px',
        backgroundColor: '#1A1A2EDD',
        borderRadius: '12px',
        gap: '16px',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}>
        <button
          onClick={clearAll}
          disabled={!canClear}
          style={{
            fontFamily: "'STKaiti', 'KaiTi', serif",
            fontSize: '16px',
            color: '#D4C5A9',
            backgroundColor: canClear ? '#333' : '#666',
            border: 'none',
            borderRadius: '8px',
            padding: isMobile ? '4px 16px' : '8px 20px',
            cursor: canClear ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center',
            gap: '4px',
            minWidth: isMobile ? '80px' : 'auto',
          }}
          onMouseEnter={(e) => {
            if (canClear) {
              e.currentTarget.style.backgroundColor = '#555';
            }
          }}
          onMouseLeave={(e) => {
            if (canClear) {
              e.currentTarget.style.backgroundColor = '#333';
            }
          }}
          onMouseDown={(e) => {
            if (canClear) {
              e.currentTarget.style.transform = 'translateY(1px)';
            }
          }}
          onMouseUp={(e) => {
            if (canClear) {
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          <span>清空</span>
          {isMobile && <span style={{ fontSize: '10px' }}>Clear</span>}
        </button>

        <button
          onClick={() => undoLast(10)}
          disabled={!canUndo}
          style={{
            fontFamily: "'STKaiti', 'KaiTi', serif",
            fontSize: '16px',
            color: '#D4C5A9',
            backgroundColor: canUndo ? '#333' : '#666',
            border: 'none',
            borderRadius: '8px',
            padding: isMobile ? '4px 16px' : '8px 20px',
            cursor: canUndo ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center',
            gap: '4px',
            minWidth: isMobile ? '80px' : 'auto',
          }}
          onMouseEnter={(e) => {
            if (canUndo) {
              e.currentTarget.style.backgroundColor = '#555';
            }
          }}
          onMouseLeave={(e) => {
            if (canUndo) {
              e.currentTarget.style.backgroundColor = '#333';
            }
          }}
          onMouseDown={(e) => {
            if (canUndo) {
              e.currentTarget.style.transform = 'translateY(1px)';
            }
          }}
          onMouseUp={(e) => {
            if (canUndo) {
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          <span>撤销</span>
          {isMobile && <span style={{ fontSize: '10px' }}>Undo</span>}
        </button>
      </div>

      <div style={{
        position: 'absolute',
        bottom: '16px',
        right: '16px',
        fontFamily: "'STKaiti', 'KaiTi', serif",
        fontSize: '12px',
        color: '#8B7355',
        userSelect: 'none',
      }}>
        {fps} FPS
      </div>
    </div>
  );
}

export default App;
