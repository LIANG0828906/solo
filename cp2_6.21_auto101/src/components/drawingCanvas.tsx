import React, { useRef, useEffect, useCallback, useImperativeHandle, forwardRef, useState } from 'react';
import { StrokeAnalyzer, type Stroke } from '../modules/strokeAnalyzer';
import {
  renderOriginalStroke,
  renderProcessedStroke,
  PAPER_PRESETS,
  type ProcessedStroke,
  type PaperTexture
} from '../modules/styleTransfer';

export interface DrawingCanvasHandle {
  getStrokes: () => Stroke[];
  getProcessedStrokes: () => ProcessedStroke[];
  setProcessedStrokes: (strokes: ProcessedStroke[]) => void;
  clearCanvas: () => void;
  undoStroke: () => void;
  renderForExport: () => HTMLCanvasElement;
}

interface DrawingCanvasProps {
  brushColor: string;
  brushWidth: number;
  inkDepth: number;
  paperTexture: PaperTexture;
  showLoading: boolean;
  showCompare: boolean;
  comparePosition: number;
  onComparePositionChange: (pos: number) => void;
  processedStrokes: ProcessedStroke[];
  onStrokesChange: (strokes: Stroke[]) => void;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;

const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>((
  {
    brushColor,
    brushWidth,
    inkDepth,
    paperTexture,
    showLoading,
    showCompare,
    comparePosition,
    onComparePositionChange,
    processedStrokes,
    onStrokesChange
  },
  ref
) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const analyzerRef = useRef<StrokeAnalyzer | null>(null);
  const isDrawingRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);
  const pendingRedrawRef = useRef(false);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const processedStrokesRef = useRef<ProcessedStroke[]>([]);
  const paperConfig = PAPER_PRESETS[paperTexture];

  useImperativeHandle(ref, () => ({
    getStrokes: () => analyzerRef.current?.getStrokes() ?? [],
    getProcessedStrokes: () => processedStrokesRef.current,
    setProcessedStrokes: (strokes: ProcessedStroke[]) => {
      processedStrokesRef.current = strokes;
      scheduleRedraw();
    },
    clearCanvas: () => {
      analyzerRef.current?.clearStrokes();
      processedStrokesRef.current = [];
      scheduleRedraw();
    },
    undoStroke: () => {
      analyzerRef.current?.undoLastStroke();
      processedStrokesRef.current = [];
      scheduleRedraw();
    },
    renderForExport: () => renderExportCanvas()
  }));

  const onStrokesChangeRef = useRef(onStrokesChange);
  
  useEffect(() => {
    onStrokesChangeRef.current = onStrokesChange;
  }, [onStrokesChange]);

  useEffect(() => {
    analyzerRef.current = new StrokeAnalyzer();
    analyzerRef.current.on('strokeEnd', () => {
      const strokes = analyzerRef.current?.getStrokes() ?? [];
      onStrokesChangeRef.current(strokes);
    });
    analyzerRef.current.on('strokesCleared', () => {
      onStrokesChangeRef.current([]);
    });
    analyzerRef.current.on('strokeUndone', () => {
      const strokes = analyzerRef.current?.getStrokes() ?? [];
      onStrokesChangeRef.current(strokes);
    });
  }, []);

  useEffect(() => {
    processedStrokesRef.current = processedStrokes;
    scheduleRedraw();
  }, [processedStrokes]);

  useEffect(() => {
    setupCanvas();
    scheduleRedraw();
    window.addEventListener('resize', setupCanvas);
    return () => {
      window.removeEventListener('resize', setupCanvas);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [paperTexture, inkDepth]);

  useEffect(() => {
    scheduleRedraw();
  }, [showCompare, comparePosition]);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const overlay = overlayCanvasRef.current;
    if (!canvas || !overlay) return;

    const container = canvas.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = CANVAS_WIDTH * dpr;
    canvas.height = CANVAS_HEIGHT * dpr;
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    overlay.width = CANVAS_WIDTH * dpr;
    overlay.height = CANVAS_HEIGHT * dpr;
    overlay.style.width = '100%';
    overlay.style.height = '100%';

    const ctx = canvas.getContext('2d');
    const overlayCtx = overlay.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
    if (overlayCtx) {
      overlayCtx.scale(dpr, dpr);
    }

    void rect;
  }, []);

  const scheduleRedraw = useCallback(() => {
    pendingRedrawRef.current = true;
    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(performRedraw);
    }
  }, []);

  const performRedraw = useCallback(() => {
    rafIdRef.current = null;
    if (!pendingRedrawRef.current) return;
    pendingRedrawRef.current = false;
    draw();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const paperBg = paperConfig.backgroundColor;
    ctx.fillStyle = paperBg;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    drawPaperNoise(ctx, paperConfig.noiseOpacity);

    const strokes = analyzerRef.current?.getStrokes() ?? [];
    const currentStroke = analyzerRef.current?.getCurrentStroke();
    const processed = processedStrokesRef.current;

    if (showCompare && processed.length > 0) {
      const splitX = CANVAS_WIDTH * comparePosition;

      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, splitX, CANVAS_HEIGHT);
      ctx.clip();
      strokes.forEach(s => renderOriginalStroke(ctx, s, inkDepth));
      if (currentStroke) renderOriginalStroke(ctx, currentStroke, inkDepth);
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.rect(splitX, 0, CANVAS_WIDTH - splitX, CANVAS_HEIGHT);
      ctx.clip();
      processed.forEach(p => renderProcessedStroke(ctx, p, inkDepth));
      ctx.restore();
    } else if (processed.length > 0) {
      processed.forEach(p => renderProcessedStroke(ctx, p, inkDepth));
    } else {
      strokes.forEach(s => renderOriginalStroke(ctx, s, inkDepth));
      if (currentStroke) renderOriginalStroke(ctx, currentStroke, inkDepth);
    }
  }, [paperConfig, inkDepth, showCompare, comparePosition]);

  const drawPaperNoise = (ctx: CanvasRenderingContext2D, opacity: number) => {
    if (opacity <= 0) return;
    const imageData = ctx.createImageData(CANVAS_WIDTH, CANVAS_HEIGHT);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 30;
      data[i] = 245 + noise;
      data[i + 1] = 240 + noise;
      data[i + 2] = 232 + noise;
      data[i + 3] = Math.floor(opacity * 255);
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const renderExportCanvas = (): HTMLCanvasElement => {
    const exportCanvas = document.createElement('canvas');
    const scale = 2;
    exportCanvas.width = CANVAS_WIDTH * scale;
    exportCanvas.height = CANVAS_HEIGHT * scale;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return exportCanvas;

    ctx.scale(scale, scale);

    ctx.fillStyle = paperConfig.backgroundColor;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawPaperNoise(ctx, paperConfig.noiseOpacity);

    const processed = processedStrokesRef.current;
    const strokes = analyzerRef.current?.getStrokes() ?? [];

    if (processed.length > 0) {
      processed.forEach(p => renderProcessedStroke(ctx, p, inkDepth));
    } else {
      strokes.forEach(s => renderOriginalStroke(ctx, s, inkDepth));
    }

    return exportCanvas;
  };

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number; pressure?: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    let clientX: number, clientY: number;
    let pressure: number | undefined;

    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
      pressure = (touch as unknown as { force?: number }).force;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
      const mouseEvent = e as React.MouseEvent & { pressure?: number };
      pressure = mouseEvent.pressure;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
      pressure
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (showLoading || isDraggingSlider) return;
    e.preventDefault();

    const { x, y, pressure } = getCanvasCoords(e);
    isDrawingRef.current = true;
    analyzerRef.current?.startStroke(x, y, brushColor, brushWidth, pressure);
    scheduleRedraw();
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (isDraggingSlider) {
      handleSliderDrag(e);
      return;
    }
    if (!isDrawingRef.current || showLoading) return;
    e.preventDefault();

    const { x, y, pressure } = getCanvasCoords(e);
    analyzerRef.current?.addPoint(x, y, pressure);
    scheduleRedraw();
  };

  const handleEnd = () => {
    if (isDraggingSlider) {
      setIsDraggingSlider(false);
      return;
    }
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    analyzerRef.current?.endStroke();
    scheduleRedraw();
  };

  const handleSliderDrag = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX: number;

    if ('touches' in e) {
      clientX = e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX ?? 0;
    } else {
      clientX = e.clientX;
    }

    const relativeX = (clientX - rect.left) / rect.width;
    onComparePositionChange(Math.max(0, Math.min(1, relativeX)));
  };

  const handleSliderMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingSlider(true);
    handleSliderDrag(e);
  };

  const textureClass = paperTexture === 'rice' ? 'texture-rice' : paperTexture === 'kraft' ? 'texture-kraft' : '';

  return (
    <div className={`canvas-wrapper ${textureClass}`}>
      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          className="drawing-canvas"
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />
        {(showCompare && processedStrokes.length > 0) && (
          <div className={`compare-slider-container active`}>
            <div
              className="compare-slider-handle"
              style={{ left: `${comparePosition * 100}%` }}
            />
            <div
              className="compare-slider-draggable"
              style={{ left: `${comparePosition * 100}%` }}
              onMouseDown={handleSliderMouseDown}
              onTouchStart={handleSliderMouseDown}
            />
            <span className="compare-original-label">原始笔迹</span>
            <span className="compare-styled-label">风格化后</span>
          </div>
        )}
        <div className={`loading-overlay ${showLoading ? 'active' : ''}`}>
          <div className="loading-spinner" />
        </div>
        <canvas
          ref={overlayCanvasRef}
          style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0, pointerEvents: 'none' }}
        />
      </div>
    </div>
  );
});

DrawingCanvas.displayName = 'DrawingCanvas';

export default DrawingCanvas;
