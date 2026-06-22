import React, { useRef, useEffect, useCallback, useImperativeHandle, forwardRef, useState } from 'react';
import { StrokeAnalyzer, type Stroke } from '../modules/strokeAnalyzer';
import {
  renderOriginalStroke,
  renderProcessedStroke,
  PAPER_PRESETS,
  type ProcessedStroke,
  type PaperTexture,
  type PaperConfig
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

    drawPaperTexture(ctx, paperConfig);

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

  const drawPaperTexture = (ctx: CanvasRenderingContext2D, config: PaperConfig) => {
    ctx.save();
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();

    if (config.noiseOpacity <= 0 && !config.goldSpots) return;

    const imageData = ctx.createImageData(CANVAS_WIDTH, CANVAS_HEIGHT);
    const data = imageData.data;

    const bgR = parseInt(config.backgroundColor.substr(1, 2), 16);
    const bgG = parseInt(config.backgroundColor.substr(3, 2), 16);
    const bgB = parseInt(config.backgroundColor.substr(5, 2), 16);

    for (let i = 0; i < data.length; i += 4) {
      let noise: number;
      
      if (config.textureType === 'rough') {
        const baseNoise = (Math.random() - 0.5) * 40;
        const fineNoise = (Math.random() - 0.5) * 15;
        noise = baseNoise + fineNoise;
      } else if (config.textureType === 'splotch') {
        noise = (Math.random() - 0.5) * 20;
      } else {
        noise = (Math.random() - 0.5) * 25;
      }

      data[i] = Math.min(255, Math.max(0, bgR + noise));
      data[i + 1] = Math.min(255, Math.max(0, bgG + noise * 0.9));
      data[i + 2] = Math.min(255, Math.max(0, bgB + noise * 0.8));
      data[i + 3] = Math.floor(config.noiseOpacity * 255);
    }

    ctx.putImageData(imageData, 0, 0);

    if (config.textureType === 'rough' && config.fiberDensity > 0) {
      const fiberCount = Math.floor(CANVAS_WIDTH * CANVAS_HEIGHT * config.fiberDensity * 0.0003);
      ctx.save();
      ctx.strokeStyle = `rgba(${bgR - 30}, ${bgG - 35}, ${bgB - 40}, 0.12)`;
      ctx.lineCap = 'round';
      
      for (let i = 0; i < fiberCount; i++) {
        const x = Math.random() * CANVAS_WIDTH;
        const y = Math.random() * CANVAS_HEIGHT;
        const length = 15 + Math.random() * 40;
        const angle = (Math.random() - 0.5) * Math.PI * 0.3 + Math.random() * Math.PI;
        const width = 0.3 + Math.random() * 0.8;
        
        ctx.beginPath();
        ctx.lineWidth = width;
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (config.textureType === 'fine' && config.fiberDensity > 0) {
      const fiberCount = Math.floor(CANVAS_WIDTH * CANVAS_HEIGHT * config.fiberDensity * 0.00015);
      ctx.save();
      ctx.strokeStyle = `rgba(${bgR - 20}, ${bgG - 22}, ${bgB - 25}, 0.08)`;
      ctx.lineCap = 'round';
      
      for (let i = 0; i < fiberCount; i++) {
        const x = Math.random() * CANVAS_WIDTH;
        const y = Math.random() * CANVAS_HEIGHT;
        const length = 8 + Math.random() * 20;
        const angle = (Math.random() - 0.5) * Math.PI * 0.2;
        const width = 0.2 + Math.random() * 0.5;
        
        ctx.beginPath();
        ctx.lineWidth = width;
        ctx.moveTo(x, y);
        ctx.lineTo(x + length, y + Math.sin(angle) * length * 0.3);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (config.goldSpots && config.goldSpots > 0) {
      ctx.save();
      for (let i = 0; i < config.goldSpots; i++) {
        const x = Math.random() * CANVAS_WIDTH;
        const y = Math.random() * CANVAS_HEIGHT;
        const size = 1.5 + Math.random() * 4;
        const opacity = 0.3 + Math.random() * 0.5;
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
        gradient.addColorStop(0, `rgba(255, 223, 128, ${opacity})`);
        gradient.addColorStop(0.5, `rgba(255, 200, 80, ${opacity * 0.6})`);
        gradient.addColorStop(1, 'rgba(255, 200, 80, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      const smallSpots = Math.floor(config.goldSpots * 2.5);
      for (let i = 0; i < smallSpots; i++) {
        const x = Math.random() * CANVAS_WIDTH;
        const y = Math.random() * CANVAS_HEIGHT;
        const size = 0.5 + Math.random() * 1.2;
        const opacity = 0.2 + Math.random() * 0.4;
        
        ctx.fillStyle = `rgba(255, 215, 100, ${opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
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
    drawPaperTexture(ctx, paperConfig);

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

  const textureClass = `texture-${paperTexture}`;

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
