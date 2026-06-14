import { useRef, useState, useEffect, useCallback } from 'react';
import type { CanvasTool } from '../types';
import { Pencil, Minus, Circle, Eraser, Trash2, Download } from 'lucide-react';

interface CanvasDrawProps {
  onSketchReady?: (dataUrl: string) => void;
  width?: number;
  height?: number;
}

const COLORS = [
  '#ffffff',
  '#ff4757',
  '#ffa502',
  '#2ed573',
  '#1e90ff',
  '#a55eea',
  '#ffd700',
  '#00d2d3',
];

const TOOLS: { id: CanvasTool; icon: typeof Pencil; label: string }[] = [
  { id: 'pen', icon: Pencil, label: '画笔' },
  { id: 'line', icon: Minus, label: '直线' },
  { id: 'circle', icon: Circle, label: '圆形' },
  { id: 'eraser', icon: Eraser, label: '橡皮擦' },
];

export default function CanvasDraw({
  onSketchReady,
  width = 500,
  height = 400,
}: CanvasDrawProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<CanvasTool>('pen');
  const [color, setColor] = useState(COLORS[0]);
  const [lineWidth, setLineWidth] = useState(3);

  const startPoint = useRef<{ x: number; y: number } | null>(null);
  const snapshot = useRef<ImageData | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width, height });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const updateSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const w = Math.max(containerWidth, 400);
        const h = Math.max(Math.floor(w * 0.75), 300);
        setCanvasSize({ width: w, height: h });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const oldData = canvas.toDataURL();
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#16213e';
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
      ctx.drawImage(img, 0, 0, canvasSize.width, canvasSize.height);
    };
    img.src = oldData;
  }, [canvasSize]);

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    e.preventDefault();
    setIsDrawing(true);

    const pos = getPos(e);
    startPoint.current = pos;

    if (tool === 'line' || tool === 'circle') {
      snapshot.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    if (tool === 'pen' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  }, [tool, getPos]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas || !startPoint.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    e.preventDefault();
    const pos = getPos(e);

    if (tool === 'pen' || tool === 'eraser') {
      ctx.strokeStyle = tool === 'eraser' ? '#16213e' : color;
      ctx.lineWidth = tool === 'eraser' ? lineWidth * 4 : lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (tool === 'line' && snapshot.current) {
      ctx.putImageData(snapshot.current, 0, 0);
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.moveTo(startPoint.current.x, startPoint.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (tool === 'circle' && snapshot.current) {
      ctx.putImageData(snapshot.current, 0, 0);
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      const radiusX = Math.abs(pos.x - startPoint.current.x);
      const radiusY = Math.abs(pos.y - startPoint.current.y);
      const radius = Math.max(radiusX, radiusY);
      ctx.arc(startPoint.current.x, startPoint.current.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }, [isDrawing, tool, color, lineWidth, getPos]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    startPoint.current = null;
    snapshot.current = null;

    const canvas = canvasRef.current;
    if (canvas && onSketchReady) {
      const thumbnail = canvas.toDataURL('image/png', 0.6);
      onSketchReady(thumbnail);
    }
  }, [onSketchReady]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (onSketchReady) {
      onSketchReady('');
    }
  }, [onSketchReady]);

  const exportSketch = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `sketch-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }, []);

  const getThumbnail = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return '';
    return canvas.toDataURL('image/png', 0.5);
  }, []);

  useEffect(() => {
    (window as unknown as { __getCanvasThumbnail?: () => string }).__getCanvasThumbnail = getThumbnail;
    return () => {
      delete (window as unknown as { __getCanvasThumbnail?: () => string }).__getCanvasThumbnail;
    };
  }, [getThumbnail]);

  return (
    <div className="flex flex-col gap-3 w-full" ref={containerRef}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          {TOOLS.map((t) => {
            const Icon = t.icon;
            const isActive = tool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTool(t.id)}
                className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all ${
                  isActive
                    ? 'bg-[#ffd700] text-[#1a1a2e] shadow-lg shadow-[#ffd700]/30'
                    : 'bg-[#16213e] text-[#e0e0e0] hover:bg-[#1f3460] border border-white/10'
                }`}
                title={t.label}
              >
                <Icon size={18} />
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#16213e] rounded-lg p-1 border border-white/10">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-md transition-transform ${
                  color === c ? 'scale-110 ring-2 ring-white/50' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <input
            type="range"
            min="1"
            max="20"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="w-20 h-2"
            title="线条粗细"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={clearCanvas}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#16213e] text-[#ff4757] hover:bg-[#2a1a2e] border border-white/10 transition-all"
            title="清空画布"
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={exportSketch}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#16213e] text-[#e0e0e0] hover:bg-[#1f3460] border border-white/10 transition-all"
            title="导出图片"
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-lg">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="block w-full h-auto touch-none cursor-crosshair"
          style={{ minHeight: '300px', background: '#16213e' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
    </div>
  );
}
