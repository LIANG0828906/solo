import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useCanvasStore } from '@/store/useCanvasStore';
import { StrokeRenderer } from '@/modules/StrokeRenderer';
import { GestureEngine } from '@/modules/GestureEngine';
import { FormulaRecognizer } from '@/modules/FormulaRecognizer';
import type { Point, ToolType } from '@/store/useCanvasStore';

const TOOL_LIST: { key: ToolType | 'clear' | 'export'; icon: string; label: string }[] = [
  { key: 'select', icon: 'near_me', label: '选择' },
  { key: 'pen', icon: 'edit', label: '笔触' },
  { key: 'eraser', icon: 'auto_fix_high', label: '橡皮擦' },
  { key: 'clear', icon: 'delete_outline', label: '清空' },
  { key: 'export', icon: 'content_copy', label: '导出' },
];

const recognizer = new FormulaRecognizer();

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<StrokeRenderer | null>(null);
  const gestureRef = useRef<GestureEngine>(new GestureEngine());
  const animFrameRef = useRef<number>(0);
  const lastPointerRef = useRef<Point | null>(null);

  const {
    strokes, currentTool, zoom, offset, recognitionResult,
    isDrawing, currentPoints, selectedStrokeId, showClearConfirm,
    addStroke, removeLastStroke, clearStrokes,
    setCurrentTool, setZoom, setOffset,
    setRecognitionResult, setIsDrawing,
    setCurrentPoints, addPoint,
    eraseAt, setSelectedStrokeId, setShowClearConfirm,
  } = useCanvasStore();

  const [copied, setCopied] = useState(false);

  const screenToCanvas = useCallback(
    (clientX: number, clientY: number): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0, pressure: 0, timestamp: 0 };
      const rect = canvas.getBoundingClientRect();
      const x = (clientX - rect.left - offset.x) / zoom;
      const y = (clientY - rect.top - offset.y) / zoom;
      return { x, y, pressure: 0, timestamp: performance.now() };
    },
    [offset, zoom]
  );

  const runRecognition = useCallback(() => {
    const currentStrokes = useCanvasStore.getState().strokes;
    if (currentStrokes.length === 0) {
      setRecognitionResult({ latex: '', confidence: 0, timestamp: 0, segments: [] });
      return;
    }
    const start = performance.now();
    const result = recognizer.recognize(currentStrokes);
    const elapsed = performance.now() - start;
    result.timestamp = Date.now();
    setRecognitionResult(result);
  }, [setRecognitionResult]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true,
    });
    if (!ctx) return;

    rendererRef.current = new StrokeRenderer(ctx, rect.width, rect.height);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      if (rendererRef.current) {
        rendererRef.current.resize(rect.width, rect.height);
      }
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(canvas.parentElement!);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    const render = () => {
      renderer.renderAll(
        strokes, currentPoints, zoom, offset, selectedStrokeId, currentTool
      );
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [strokes, currentPoints, zoom, offset, selectedStrokeId, currentTool]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(zoom * delta);
      } else {
        setOffset({
          x: offset.x - e.deltaX,
          y: offset.y - e.deltaY,
        });
      }
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [zoom, offset, setZoom, setOffset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gestureEngine = gestureRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      gestureEngine.onTouchStart(e.touches);

      if (e.touches.length === 1 && currentTool === 'pen') {
        const pt = screenToCanvas(e.touches[0].clientX, e.touches[0].clientY);
        pt.pressure = e.touches[0].force || 0.5;
        setIsDrawing(true);
        setCurrentPoints([pt]);
        lastPointerRef.current = pt;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();

      if (e.touches.length >= 2) {
        const result = gestureEngine.onTouchMove(e.touches);
        if (result.type === 'three-finger-swipe-left') {
          removeLastStroke();
          gestureEngine.reset();
        } else if (result.type === 'pinch' && result.params.scale) {
          setZoom(zoom * result.params.scale);
        } else if (result.type === 'rotate' && result.params.angle) {
          setOffset({
            x: offset.x,
            y: offset.y,
          });
        }
        return;
      }

      if (e.touches.length === 1) {
        const pt = screenToCanvas(e.touches[0].clientX, e.touches[0].clientY);
        pt.pressure = e.touches[0].force || 0.5;

        if (currentTool === 'pen' && isDrawing) {
          addPoint(pt);
        } else if (currentTool === 'eraser') {
          eraseAt(pt.x, pt.y, 20);
        }

        lastPointerRef.current = pt;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      gestureEngine.onTouchEnd(e.touches);

      if (e.touches.length === 0 && isDrawing && currentTool === 'pen') {
        const points = useCanvasStore.getState().currentPoints;
        if (points.length >= 2) {
          addStroke(points);
          setTimeout(runRecognition, 50);
        }
        setIsDrawing(false);
        setCurrentPoints([]);
      }
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [
    currentTool, isDrawing, zoom, offset,
    addStroke, addPoint, setCurrentPoints, setIsDrawing,
    eraseAt, removeLastStroke, setZoom, setOffset,
    screenToCanvas, runRecognition,
  ]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (e.pointerType === 'touch') return;

      const pt = screenToCanvas(e.clientX, e.clientY);
      pt.pressure = e.pressure;

      if (currentTool === 'pen') {
        setIsDrawing(true);
        setCurrentPoints([pt]);
        lastPointerRef.current = pt;
        (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
      } else if (currentTool === 'eraser') {
        setIsDrawing(true);
        eraseAt(pt.x, pt.y, 20);
        lastPointerRef.current = pt;
        (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
      } else if (currentTool === 'select') {
        const hitId = rendererRef.current?.hitTestStroke(strokes, pt.x, pt.y) ?? null;
        setSelectedStrokeId(hitId);
      }
    },
    [currentTool, strokes, screenToCanvas, setIsDrawing, setCurrentPoints, eraseAt, setSelectedStrokeId]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (e.pointerType === 'touch') return;
      if (!isDrawing && currentTool !== 'eraser') return;

      const pt = screenToCanvas(e.clientX, e.clientY);
      pt.pressure = e.pressure;

      if (currentTool === 'pen' && isDrawing) {
        addPoint(pt);
      } else if (currentTool === 'eraser' && isDrawing) {
        eraseAt(pt.x, pt.y, 20);
      }

      lastPointerRef.current = pt;
    },
    [currentTool, isDrawing, screenToCanvas, addPoint, eraseAt]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (e.pointerType === 'touch') return;

      if (currentTool === 'pen' && isDrawing) {
        const points = useCanvasStore.getState().currentPoints;
        if (points.length >= 2) {
          addStroke(points);
          setTimeout(runRecognition, 50);
        }
      }

      setIsDrawing(false);
      setCurrentPoints([]);
    },
    [currentTool, isDrawing, addStroke, setIsDrawing, setCurrentPoints, runRecognition]
  );

  const handleToolClick = useCallback(
    (key: ToolType | 'clear' | 'export') => {
      if (key === 'clear') {
        if (strokes.length > 0) {
          setShowClearConfirm(true);
        }
        return;
      }
      if (key === 'export') {
        const latex = useCanvasStore.getState().recognitionResult.latex;
        if (latex) {
          navigator.clipboard.writeText(latex).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          });
        }
        return;
      }
      setCurrentTool(key);
    },
    [strokes.length, setCurrentTool, setShowClearConfirm]
  );

  const handleCopyLatex = useCallback(() => {
    if (recognitionResult.latex) {
      navigator.clipboard.writeText(recognitionResult.latex).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }, [recognitionResult.latex]);

  return (
    <div style={styles.root}>
      <div style={styles.toolbar}>
        {TOOL_LIST.map(({ key, icon, label }) => {
          const isActive = key === currentTool;
          const isAction = key === 'clear' || key === 'export';

          return (
            <button
              key={key}
              title={label}
              onClick={() => handleToolClick(key as ToolType | 'clear' | 'export')}
              style={{
                ...styles.toolBtn,
                ...(isActive && !isAction ? styles.toolBtnActive : {}),
              }}
            >
              <span className="material-icons" style={styles.toolIcon}>
                {icon}
              </span>
            </button>
          );
        })}
      </div>

      <div style={styles.canvasWrap}>
        <canvas
          ref={canvasRef}
          style={styles.canvas}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>

      <div style={styles.resultPanel}>
        <div style={styles.resultHeader}>
          <span style={styles.resultLabel}>LaTeX</span>
          <button
            style={{
              ...styles.copyBtn,
              ...(copied ? styles.copyBtnDone : {}),
            }}
            onClick={handleCopyLatex}
            disabled={!recognitionResult.latex}
          >
            {copied ? '已复制' : '复制'}
          </button>
        </div>
        <div style={styles.resultContent}>
          {recognitionResult.latex || (
            <span style={styles.placeholder}>在画布上书写公式...</span>
          )}
        </div>
      </div>

      {showClearConfirm && (
        <div style={styles.modalOverlay} onClick={() => setShowClearConfirm(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <p style={styles.modalText}>确定要清空画布吗？</p>
            <div style={styles.modalBtns}>
              <button style={styles.modalCancel} onClick={() => setShowClearConfirm(false)}>
                取消
              </button>
              <button
                style={styles.modalConfirm}
                onClick={() => {
                  clearStrokes();
                  setShowClearConfirm(false);
                }}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    width: '100vw',
    height: '100vh',
    backgroundColor: '#F5F0E1',
    overflow: 'hidden',
    fontFamily: "'Noto Sans Math', sans-serif",
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    padding: '8px 12px',
    backgroundColor: '#F5F0E1',
    borderBottom: '1px solid #E0D8C8',
    flexShrink: 0,
    zIndex: 10,
  },
  toolBtn: {
    width: 36,
    height: 36,
    borderRadius: 6,
    border: '2px solid transparent',
    backgroundColor: '#ECEFF1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease-out',
    outline: 'none',
    padding: 0,
  },
  toolBtnActive: {
    border: '2px solid #3F51B5',
    borderRadius: '50%',
  },
  toolIcon: {
    fontSize: 20,
    color: '#3F51B5',
    transition: 'font-size 0.3s ease-out',
  },
  canvasWrap: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  canvas: {
    display: 'block',
    width: '100%',
    height: '100%',
    touchAction: 'none',
    cursor: 'crosshair',
  },
  resultPanel: {
    height: 200,
    maxHeight: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: '12px 12px 0 0',
    margin: '0 8px',
    padding: 16,
    overflowY: 'auto',
    flexShrink: 0,
    boxShadow: '0 -2px 8px rgba(0,0,0,0.08)',
  },
  resultHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: '#3F51B5',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  copyBtn: {
    padding: '4px 14px',
    fontSize: 12,
    border: '1px solid #3F51B5',
    borderRadius: 6,
    backgroundColor: 'transparent',
    color: '#3F51B5',
    cursor: 'pointer',
    transition: 'all 0.3s ease-out',
  },
  copyBtnDone: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
    color: '#fff',
  },
  resultContent: {
    fontFamily: "'Noto Sans Math', monospace",
    fontSize: 16,
    color: '#333',
    lineHeight: 1.6,
    wordBreak: 'break-all',
    minHeight: 40,
  },
  placeholder: {
    color: '#BDBDBD',
    fontStyle: 'italic',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: '24px 32px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    color: '#333',
  },
  modalBtns: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
  },
  modalCancel: {
    padding: '8px 24px',
    borderRadius: 8,
    border: '1px solid #ccc',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: 14,
    transition: 'all 0.3s ease-out',
  },
  modalConfirm: {
    padding: '8px 24px',
    borderRadius: 8,
    border: 'none',
    backgroundColor: '#FF7043',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 14,
    transition: 'all 0.3s ease-out',
  },
};
