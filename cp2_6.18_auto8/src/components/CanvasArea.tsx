import { useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useCanvasStore } from '../store/canvasStore';
import { CanvasEngine } from '../modules/canvasEngine';
import { storageManager } from '../modules/storageManager';
import type { Stroke, Doodle } from '../types';

export default function CanvasArea() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<CanvasEngine | null>(null);
  const isDrawingRef = useRef(false);
  const wheelPanningRef = useRef(false);
  const lastPanPosRef = useRef({ x: 0, y: 0 });

  const {
    brushSettings,
    viewport,
    currentStrokes,
    setViewport,
    addStroke,
    currentDoodleId,
    addDoodle
  } = useCanvasStore();

  const initEngine = useCallback(() => {
    if (!canvasRef.current || engineRef.current) return;
    engineRef.current = new CanvasEngine(canvasRef.current);
    engineRef.current.setViewport(viewport);
    engineRef.current.setSavedStrokes(currentStrokes);
    engineRef.current.forceRender();
  }, [viewport, currentStrokes]);

  useEffect(() => {
    initEngine();
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, [initEngine]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setViewport(viewport);
    }
  }, [viewport]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setSavedStrokes(currentStrokes);
    }
  }, [currentStrokes]);

  const getCanvasPoint = (clientX: number, clientY: number) => {
    if (!canvasRef.current || !engineRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    return engineRef.current.screenToCanvas(clientX - rect.left, clientY - rect.top, rect);
  };

  const saveDoodleAsync = useCallback(async (strokes: Stroke[]) => {
    if (!engineRef.current) return;
    try {
      const thumbnail = engineRef.current.generateThumbnail();
      const now = Date.now();
      const doodle: Doodle = {
        id: currentDoodleId || uuidv4(),
        name: `Doodle ${new Date(now).toLocaleString()}`,
        strokes: JSON.parse(JSON.stringify(strokes)),
        thumbnail,
        createdAt: now,
        updatedAt: now,
        width: CanvasEngine.CANVAS_WIDTH,
        height: CanvasEngine.CANVAS_HEIGHT
      };
      await storageManager.saveDoodle(doodle);
      addDoodle(doodle);
    } catch (e) {
      console.error('Save doodle failed:', e);
    }
  }, [currentDoodleId, addDoodle]);

  const startDrawing = useCallback((clientX: number, clientY: number) => {
    if (!engineRef.current) return;
    const point = getCanvasPoint(clientX, clientY);
    if (!point) return;
    isDrawingRef.current = true;
    const stroke: Stroke = {
      id: uuidv4(),
      points: [point],
      color: brushSettings.color,
      size: brushSettings.size,
      blendMode: brushSettings.blendMode
    };
    engineRef.current.setPendingStroke(stroke);
  }, [brushSettings]);

  const continueDrawing = useCallback((clientX: number, clientY: number) => {
    if (!isDrawingRef.current || !engineRef.current) return;
    const point = getCanvasPoint(clientX, clientY);
    if (!point) return;
    engineRef.current.updatePendingStrokePoint(point);
  }, []);

  const endDrawing = useCallback(() => {
    if (!isDrawingRef.current || !engineRef.current) return;
    isDrawingRef.current = false;
    const finalStroke = engineRef.current.finishPendingStroke();
    if (finalStroke && finalStroke.points.length > 0) {
      const newStrokes = [...currentStrokes, finalStroke];
      engineRef.current.setSavedStrokes(newStrokes);
      addStroke(finalStroke);
      queueMicrotask(() => saveDoodleAsync(newStrokes));
    }
  }, [currentStrokes, addStroke, saveDoodleAsync]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (e.shiftKey) {
      wheelPanningRef.current = true;
      lastPanPosRef.current = { x: e.clientX, y: e.clientY };
      return;
    }
    startDrawing(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (wheelPanningRef.current) {
      const dx = e.clientX - lastPanPosRef.current.x;
      const dy = e.clientY - lastPanPosRef.current.y;
      lastPanPosRef.current = { x: e.clientX, y: e.clientY };
      setViewport(viewport.offsetX + dx, viewport.offsetY + dy);
      return;
    }
    continueDrawing(e.clientX, e.clientY);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (e.button === 0 && wheelPanningRef.current) {
      wheelPanningRef.current = false;
      return;
    }
    if (e.button === 0) endDrawing();
  };

  const handleMouseLeave = () => {
    if (isDrawingRef.current) endDrawing();
    if (wheelPanningRef.current) wheelPanningRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setViewport(viewport.offsetX - e.deltaX, viewport.offsetY - e.deltaY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    startDrawing(t.clientX, t.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    e.preventDefault();
    const t = e.touches[0];
    continueDrawing(t.clientX, t.clientY);
  };

  const handleTouchEnd = () => {
    endDrawing();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div
      ref={containerRef}
      style={styles.container}
      onContextMenu={handleContextMenu}
    >
      <div style={styles.scrollWrapper}>
        <canvas
          ref={canvasRef}
          style={styles.canvas}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      </div>
      <div style={styles.hint}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4 }}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        滚轮平移视口 · 按住 Shift + 左键拖动也可平移 · 左键拖动绘制
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    top: 56,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'auto',
    background: '#1A1A2E',
    cursor: 'crosshair'
  },
  scrollWrapper: {
    position: 'relative',
    width: 'max-content',
    height: 'max-content',
    padding: 40
  },
  canvas: {
    display: 'block',
    width: 2000,
    height: 2000,
    background: '#1A1A2E',
    boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
    borderRadius: 4,
    touchAction: 'none'
  },
  hint: {
    position: 'fixed',
    bottom: 16,
    left: 20,
    display: 'flex',
    alignItems: 'center',
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    background: 'rgba(0,0,0,0.5)',
    padding: '6px 12px',
    borderRadius: 20,
    backdropFilter: 'blur(10px)',
    pointerEvents: 'none'
  }
};
