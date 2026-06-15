import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  PixelArray,
  CANVAS_SIZE,
  renderPixelsToCanvas,
  deepClonePixels,
  getMirrorX,
} from '../../utils/pixelUtils';

interface EditorCanvasProps {
  pixels: PixelArray;
  currentColor: string;
  brushSize: 1 | 3;
  symmetricMode: boolean;
  onPixelsChange: (pixels: PixelArray) => void;
  onColorPick: (color: string) => void;
}

type ToolMode = 'draw' | 'erase' | 'pick';

const DISPLAY_SIZE = 200;
const CELL_SIZE = DISPLAY_SIZE / CANVAS_SIZE;

const EditorCanvas: React.FC<EditorCanvasProps> = ({
  pixels,
  currentColor,
  brushSize,
  symmetricMode,
  onPixelsChange,
  onColorPick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  const [toolMode, setToolMode] = useState<ToolMode>('draw');
  const rippleIdRef = useRef(0);

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.15)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= CANVAS_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, DISPLAY_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(DISPLAY_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }
  }, []);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, DISPLAY_SIZE, DISPLAY_SIZE);
    ctx.fillStyle = 'rgba(30, 30, 35, 1)';
    ctx.fillRect(0, 0, DISPLAY_SIZE, DISPLAY_SIZE);
    renderPixelsToCanvas(ctx, pixels, CELL_SIZE);
    drawGrid(ctx);
  }, [pixels, drawGrid]);

  const redrawOverlay = useCallback(() => {
    const overlay = overlayCanvasRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, DISPLAY_SIZE, DISPLAY_SIZE);

    if (hoverPos) {
      const { x, y } = hoverPos;
      const color = pixels[y]?.[x];
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 1;
      ctx.strokeRect(x * CELL_SIZE + 0.5, y * CELL_SIZE + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);

      ctx.fillStyle = 'rgba(0, 212, 255, 0.25)';
      ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

      if (symmetricMode) {
        const mx = getMirrorX(x);
        if (mx !== x) {
          ctx.strokeStyle = 'rgba(0, 212, 255, 0.6)';
          ctx.setLineDash([2, 2]);
          ctx.strokeRect(mx * CELL_SIZE + 0.5, y * CELL_SIZE + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
          ctx.setLineDash([]);
          ctx.fillStyle = 'rgba(0, 212, 255, 0.12)';
          ctx.fillRect(mx * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      }
    }

    const now = Date.now();
    setRipples((prev) => prev.filter((r) => now - r.id < 400));
    for (const ripple of ripples) {
      const age = (now - ripple.id) / 400;
      if (age >= 1) continue;
      const maxRadius = CELL_SIZE * 2.2;
      const radius = maxRadius * age;
      const alpha = 1 - age;
      ctx.beginPath();
      ctx.arc(
        ripple.x * CELL_SIZE + CELL_SIZE / 2,
        ripple.y * CELL_SIZE + CELL_SIZE / 2,
        radius,
        0,
        Math.PI * 2
      );
      ctx.strokeStyle = ripple.color + Math.round(alpha * 200).toString(16).padStart(2, '0');
      ctx.lineWidth = 2;
      ctx.stroke();

      const fillAlpha = alpha * 0.35;
      ctx.beginPath();
      ctx.arc(
        ripple.x * CELL_SIZE + CELL_SIZE / 2,
        ripple.y * CELL_SIZE + CELL_SIZE / 2,
        radius * 0.55,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = ripple.color + Math.round(fillAlpha * 255).toString(16).padStart(2, '0');
      ctx.fill();
    }
  }, [hoverPos, pixels, symmetricMode, ripples]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  useEffect(() => {
    let rafId: number;
    const loop = () => {
      redrawOverlay();
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [redrawOverlay]);

  const getGridPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = DISPLAY_SIZE / rect.width;
    const scaleY = DISPLAY_SIZE / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;
    const x = Math.floor(px / CELL_SIZE);
    const y = Math.floor(py / CELL_SIZE);
    if (x < 0 || x >= CANVAS_SIZE || y < 0 || y >= CANVAS_SIZE) return null;
    return { x, y };
  };

  const applyBrush = useCallback(
    (x: number, y: number, newPixels: PixelArray, color: string | null) => {
      const half = Math.floor(brushSize / 2);
      for (let dy = -half; dy <= half; dy++) {
        for (let dx = -half; dx <= half; dx++) {
          const px = x + dx;
          const py = y + dy;
          if (px >= 0 && px < CANVAS_SIZE && py >= 0 && py < CANVAS_SIZE) {
            newPixels[py][px] = color;
          }
        }
      }
      if (symmetricMode) {
        for (let dy = -half; dy <= half; dy++) {
          for (let dx = -half; dx <= half; dx++) {
            const srcX = x + dx;
            const px = getMirrorX(srcX);
            const py = y + dy;
            if (px >= 0 && px < CANVAS_SIZE && py >= 0 && py < CANVAS_SIZE) {
              newPixels[py][px] = color;
            }
          }
        }
      }
    },
    [brushSize, symmetricMode]
  );

  const triggerRipple = (x: number, y: number, color: string) => {
    rippleIdRef.current = Date.now() + Math.random();
    setRipples((prev) => [...prev, { id: rippleIdRef.current, x, y, color }]);
  };

  const handleAction = useCallback(
    (gridX: number, gridY: number) => {
      if (toolMode === 'pick') {
        const color = pixels[gridY]?.[gridX];
        if (color) {
          onColorPick(color);
          setToolMode('draw');
        }
        return;
      }

      const newPixels = deepClonePixels(pixels);
      const colorToApply = toolMode === 'erase' ? null : currentColor;
      applyBrush(gridX, gridY, newPixels, colorToApply);
      triggerRipple(gridX, gridY, colorToApply || '#555555');
      onPixelsChange(newPixels);
    },
    [toolMode, pixels, currentColor, applyBrush, onPixelsChange, onColorPick]
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getGridPos(e);
    if (!pos) return;
    setIsDrawing(true);
    handleAction(pos.x, pos.y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getGridPos(e);
    setHoverPos(pos);
    if (!pos || !isDrawing) return;
    handleAction(pos.x, pos.y);
  };

  const handleMouseUp = () => setIsDrawing(false);
  const handleMouseLeave = () => {
    setIsDrawing(false);
    setHoverPos(null);
  };

  const hoverColor = hoverPos ? pixels[hoverPos.y]?.[hoverPos.x] : null;

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <button
          style={{
            ...styles.toolBtn,
            ...(toolMode === 'draw' ? styles.toolBtnActive : {}),
          }}
          onClick={() => setToolMode('draw')}
          title="画笔"
        >
          ✏️
        </button>
        <button
          style={{
            ...styles.toolBtn,
            ...(toolMode === 'erase' ? styles.toolBtnActive : {}),
          }}
          onClick={() => setToolMode('erase')}
          title="橡皮擦"
        >
          🧹
        </button>
        <button
          style={{
            ...styles.toolBtn,
            ...(toolMode === 'pick' ? styles.toolBtnActive : {}),
          }}
          onClick={() => setToolMode('pick')}
          title="取色器"
        >
          💧
        </button>
      </div>

      <div style={styles.canvasWrapper}>
        <canvas
          ref={canvasRef}
          width={DISPLAY_SIZE}
          height={DISPLAY_SIZE}
          style={styles.canvas}
        />
        <canvas
          ref={overlayCanvasRef}
          width={DISPLAY_SIZE}
          height={DISPLAY_SIZE}
          style={styles.overlay}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
      </div>

      {hoverPos && (
        <div style={styles.coordBox}>
          <span style={styles.coordText}>
            ({hoverPos.x}, {hoverPos.y})
          </span>
          {hoverColor ? (
            <span style={{ ...styles.colorSwatch, background: hoverColor }} />
          ) : null}
          <span style={styles.colorHex}>
            {hoverColor || '透明'}
          </span>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  toolbar: {
    display: 'flex',
    gap: 8,
    marginBottom: 4,
  },
  toolBtn: {
    width: 36,
    height: 36,
    border: '1px solid rgba(0, 212, 255, 0.3)',
    borderRadius: 6,
    background: 'rgba(40, 40, 45, 0.8)',
    color: '#e0e0e0',
    fontSize: 16,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  toolBtnActive: {
    borderColor: '#00d4ff',
    boxShadow: '0 0 10px rgba(0, 212, 255, 0.5), inset 0 0 8px rgba(0, 212, 255, 0.1)',
    background: 'rgba(0, 212, 255, 0.12)',
  },
  canvasWrapper: {
    position: 'relative',
    width: DISPLAY_SIZE,
    height: DISPLAY_SIZE,
    border: '1px solid #00d4ff',
    borderRadius: 4,
    boxShadow:
      'inset 0 0 20px rgba(0, 212, 255, 0.1), 0 0 12px rgba(0, 212, 255, 0.15)',
    overflow: 'hidden',
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    // @ts-ignore - cross-browser pixel rendering
    imageRendering: 'pixelated',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    cursor: 'crosshair',
    // @ts-ignore - cross-browser pixel rendering
    imageRendering: 'pixelated',
  },
  coordBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '6px 12px',
    background: 'rgba(15, 15, 20, 0.9)',
    border: '1px solid rgba(0, 212, 255, 0.4)',
    borderRadius: 4,
    fontSize: 12,
    fontFamily: "'JetBrains Mono', monospace",
    boxShadow: '0 0 10px rgba(0, 212, 255, 0.2)',
  },
  coordText: {
    color: '#00d4ff',
    fontWeight: 600,
  },
  colorSwatch: {
    width: 16,
    height: 16,
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: 2,
    display: 'inline-block',
  },
  colorHex: {
    color: '#c0c0c0',
    fontSize: 11,
    textTransform: 'uppercase',
  },
};

export default EditorCanvas;
