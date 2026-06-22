import { useRef, useEffect, useState, useCallback } from 'react';
import { X, Undo2, Eraser, Send, Tag, Palette } from 'lucide-react';

interface CanvasDrawProps {
  onSave: (dataUrl: string) => void;
  onClose: () => void;
  tags: string[];
  tagInput: string;
  setTagInput: (v: string) => void;
  addTag: () => void;
  removeTag: (t: string) => void;
  onConfirm: () => void;
  allTags: string[];
}

const COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#1E293B', '#FFFFFF',
];

export default function CanvasDraw({
  onSave,
  onClose,
  tags,
  tagInput,
  setTagInput,
  addTag,
  removeTag,
  onConfirm,
  allTags,
}: CanvasDrawProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const history = useRef<ImageData[]>([]);
  const [color, setColor] = useState('#3B82F6');
  const [lineWidth, setLineWidth] = useState(4);
  const [showPalette, setShowPalette] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const t = e.touches[0];
      return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    history.current.push(snapshot);
    if (history.current.length > 30) history.current.shift();
  }, []);

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    saveState();
    drawing.current = true;
    lastPos.current = getPos(e);
  };

  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !lastPos.current) return;
    const pos = getPos(e);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  };

  const end = () => {
    drawing.current = false;
    lastPos.current = null;
  };

  const undo = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || history.current.length === 0) return;
    const prev = history.current.pop()!;
    ctx.putImageData(prev, 0, 0);
  };

  const clear = () => {
    saveState();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const generateThumbnail = (srcCanvas: HTMLCanvasElement, maxW = 200, maxH = 150): string => {
    const img = document.createElement('canvas');
    img.width = maxW;
    img.height = maxH;
    const ctx = img.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, maxW, maxH);
      const ratio = Math.min(maxW / srcCanvas.width, maxH / srcCanvas.height);
      const w = srcCanvas.width * ratio;
      const h = srcCanvas.height * ratio;
      ctx.drawImage(srcCanvas, (maxW - w) / 2, (maxH - h) / 2, w, h);
    }
    return img.toDataURL('image/png');
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const thumb = generateThumbnail(canvas);
    onSave(thumb);
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-[60]" onClick={onClose}>
      <canvas
        ref={canvasRef}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
        className="absolute inset-0"
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'rgba(0,0,0,0.7)' }}
      />

      <div
        className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/95 backdrop-blur rounded-2xl px-4 py-3 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="w-px h-6 bg-gray-200" />

        <div className="relative">
          <button
            onClick={() => setShowPalette(!showPalette)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Palette size={18} />
            <div className="w-5 h-5 rounded-full border-2 border-gray-200" style={{ background: color }} />
          </button>
          {showPalette && (
            <div
              className="absolute top-full left-0 mt-2 p-2 bg-white rounded-xl shadow-2xl border border-gray-100 grid grid-cols-4 gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setColor(c);
                    setShowPalette(false);
                  }}
                  className="w-7 h-7 rounded-full border-2 transition-all hover:scale-110"
                  style={{ background: c, borderColor: color === c ? '#1E293B' : 'transparent' }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 px-3">
          <span className="text-xs text-gray-500 w-8">{lineWidth}px</span>
          <input
            type="range"
            min={2}
            max={12}
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="w-24 accent-blue-500"
          />
        </div>

        <div className="w-px h-6 bg-gray-200" />

        <button
          onClick={undo}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <Undo2 size={18} />
          <span className="text-sm">撤销</span>
        </button>
        <button
          onClick={clear}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-white bg-[#EF4444] hover:bg-red-600 transition-colors"
        >
          <Eraser size={16} />
          清空
        </button>

        <div className="w-px h-6 bg-gray-200" />

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-gray-500 text-xs">
            <Tag size={12} />
            标签
          </div>
          <div className="flex flex-wrap gap-1 mr-1 max-w-[180px]">
            {tags.map((t) => (
              <span key={t} className="px-2 py-0.5 bg-blue-50 text-accent-blue text-xs rounded-full">
                #{t}
                <button onClick={() => removeTag(t)} className="ml-1 hover:text-blue-700">×</button>
              </span>
            ))}
          </div>
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
            onBlur={addTag}
            placeholder="添加标签"
            className="w-28 px-2 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:border-accent-blue"
            list="canvas-tags"
          />
          <datalist id="canvas-tags">
            {allTags.filter((t) => !tags.includes(t)).map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>

        <div className="w-px h-6 bg-gray-200" />

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-blue hover:bg-blue-600 text-white text-sm font-medium shadow-md hover:shadow-lg transition-all"
        >
          <Send size={16} />
          保存
        </button>
      </div>
    </div>
  );
}
