import { useRef, useEffect, useCallback, useState } from 'react';
import { useScoreStore } from '@/stores/useScoreStore';
import { recognizeNotes } from '@/services/recognitionService';
import type { Stroke as RecStroke } from '@/services/recognitionService';
import { v4 as uuidv4 } from 'uuid';
import { Trash2 } from 'lucide-react';

interface Point { x: number; y: number; timestamp: number; }
interface Stroke { points: Point[]; tool: 'pencil' | 'eraser'; }
interface FlashState { id: string; type: 'green' | 'red'; x: number; y: number; w: number; h: number; }

export default function CanvasBoard() {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const activeCanvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const isDrawingRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const rafRef = useRef<number>(0);
  const flashesRef = useRef<FlashState[]>([]);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [flashes, setFlashes] = useState<FlashState[]>([]);
  const activeTool = useScoreStore((s) => s.activeTool);
  const addNote = useScoreStore((s) => s.addNote);
  const setFlashState = useScoreStore((s) => s.setFlashState);

  const PARCHMENT = '#f5ead0', STROKE_COLOR = '#3e2723', ERASER_SIZE = 20, LINE_WIDTH = 2, DEBOUNCE_MS = 500;

  const drawParchment = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.fillStyle = PARCHMENT; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 8000; i++) {
      const x = Math.random() * w, y = Math.random() * h, alpha = Math.random() * 0.06;
      ctx.fillStyle = `rgba(139,119,80,${alpha})`; ctx.fillRect(x, y, 1, 1);
    }
  }, []);

  const drawStroke = useCallback((ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.points.length < 2) return;
    ctx.save();
    if (stroke.tool === 'eraser') { ctx.globalCompositeOperation = 'destination-out'; ctx.lineWidth = ERASER_SIZE; ctx.strokeStyle = 'rgba(0,0,0,1)'; }
    else { ctx.lineWidth = LINE_WIDTH; ctx.strokeStyle = STROKE_COLOR; }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    ctx.stroke(); ctx.restore();
  }, []);

  const redrawBackground = useCallback(() => {
    const canvas = bgCanvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    drawParchment(ctx, canvas.width, canvas.height);
    for (const stroke of strokesRef.current) drawStroke(ctx, stroke);
  }, [drawParchment, drawStroke]);

  const renderActive = useCallback(() => {
    const canvas = activeCanvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (currentStrokeRef.current) drawStroke(ctx, currentStrokeRef.current);
    if (activeTool === 'eraser' && currentStrokeRef.current && currentStrokeRef.current.points.length > 0) {
      const last = currentStrokeRef.current.points[currentStrokeRef.current.points.length - 1];
      ctx.save(); ctx.strokeStyle = '#999'; ctx.lineWidth = 1; ctx.beginPath();
      ctx.arc(last.x, last.y, ERASER_SIZE / 2, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
    for (const flash of flashesRef.current) {
      ctx.save();
      if (flash.type === 'green') {
        ctx.shadowColor = 'rgba(34,197,94,0.7)'; ctx.shadowBlur = 16;
        ctx.strokeStyle = 'rgba(34,197,94,0.6)'; ctx.lineWidth = 2;
        ctx.strokeRect(flash.x, flash.y, flash.w, flash.h);
      } else {
        ctx.setLineDash([6, 4]); ctx.strokeStyle = 'rgba(239,68,68,0.8)'; ctx.lineWidth = 2;
        ctx.strokeRect(flash.x, flash.y, flash.w, flash.h);
      }
      ctx.restore();
    }
  }, [drawStroke, activeTool]);

  const renderLoop = useCallback(() => { renderActive(); rafRef.current = requestAnimationFrame(renderLoop); }, [renderActive]);

  useEffect(() => { rafRef.current = requestAnimationFrame(renderLoop); return () => cancelAnimationFrame(rafRef.current); }, [renderLoop]);

  useEffect(() => {
    const container = containerRef.current; if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setCanvasSize({ width: Math.floor(width), height: Math.floor(height) });
    });
    observer.observe(container); return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (canvasSize.width === 0 || canvasSize.height === 0) return;
    for (const ref of [bgCanvasRef, activeCanvasRef]) {
      const canvas = ref.current;
      if (canvas) { canvas.width = canvasSize.width; canvas.height = canvasSize.height; }
    }
    redrawBackground();
  }, [canvasSize, redrawBackground]);

  const getPos = useCallback((e: MouseEvent | TouchEvent): { x: number; y: number } => {
    const canvas = activeCanvasRef.current!; const rect = canvas.getBoundingClientRect();
    const src = 'touches' in e ? e.touches[0] : (e as MouseEvent);
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  }, []);

  const handleStart = useCallback((e: MouseEvent | TouchEvent) => {
    if (activeTool === 'select') return; e.preventDefault(); isDrawingRef.current = true;
    const { x, y } = getPos(e);
    currentStrokeRef.current = { points: [{ x, y, timestamp: Date.now() }], tool: activeTool as 'pencil' | 'eraser' };
  }, [activeTool, getPos]);

  const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return; e.preventDefault();
    const { x, y } = getPos(e); currentStrokeRef.current.points.push({ x, y, timestamp: Date.now() });
  }, [getPos]);

  const handleEnd = useCallback(() => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return;
    isDrawingRef.current = false; const stroke = currentStrokeRef.current;
    currentStrokeRef.current = null; strokesRef.current.push(stroke); redrawBackground();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { triggerRecognition(); }, DEBOUNCE_MS);
  }, [redrawBackground]);

  const computeStrokeBounds = useCallback((strokes: Stroke[]): { x: number; y: number; w: number; h: number } => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const s of strokes) for (const p of s.points) {
      if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y;
    }
    return { x: minX - 4, y: minY - 4, w: maxX - minX + 8, h: maxY - minY + 8 };
  }, []);

  const triggerRecognition = useCallback(async () => {
    const canvas = activeCanvasRef.current; if (!canvas) return;
    const pendingStrokes = [...strokesRef.current]; if (pendingStrokes.length === 0) return;
    try {
      const recStrokes: RecStroke[] = pendingStrokes.filter(s => s.tool === 'pencil').map(s => ({ points: s.points }));
      const results = recognizeNotes(recStrokes, canvas.width, canvas.height);
      const newFlashes: FlashState[] = [];
      for (const result of results) {
        const noteData = {
          pitch: result.pitch, octave: result.octave, duration: result.duration,
          type: result.type, velocity: 80, x: result.x, y: result.y,
        };
        const noteId = addNote({ ...noteData, isValid: result.valid });
        const color: 'green' | 'red' = result.valid ? 'green' : 'red';
        setFlashState(noteId, color);
        setTimeout(() => setFlashState(noteId, 'none'), 1200);
        newFlashes.push({ id: uuidv4(), type: color, ...result.bounds });
      }
      flashesRef.current = newFlashes; setFlashes(newFlashes);
      setTimeout(() => { flashesRef.current = []; setFlashes([]); }, 1200);
      strokesRef.current = [];
    } catch {
      const bounds = computeStrokeBounds(pendingStrokes);
      const errFlash: FlashState = { id: uuidv4(), type: 'red', ...bounds };
      flashesRef.current = [errFlash]; setFlashes([errFlash]);
      setTimeout(() => { flashesRef.current = []; setFlashes([]); }, 1200);
    }
  }, [addNote, setFlashState, computeStrokeBounds]);

  const handleClear = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    strokesRef.current = []; currentStrokeRef.current = null;
    isDrawingRef.current = false; flashesRef.current = [];
    setFlashes([]); redrawBackground();
  }, [redrawBackground]);

  useEffect(() => {
    const canvas = activeCanvasRef.current; if (!canvas) return;
    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('mouseleave', handleEnd);
    canvas.addEventListener('touchstart', handleStart, { passive: false });
    canvas.addEventListener('touchmove', handleMove, { passive: false });
    canvas.addEventListener('touchend', handleEnd);
    return () => {
      canvas.removeEventListener('mousedown', handleStart);
      canvas.removeEventListener('mousemove', handleMove);
      canvas.removeEventListener('mouseup', handleEnd);
      canvas.removeEventListener('mouseleave', handleEnd);
      canvas.removeEventListener('touchstart', handleStart);
      canvas.removeEventListener('touchmove', handleMove);
      canvas.removeEventListener('touchend', handleEnd);
    };
  }, [handleStart, handleMove, handleEnd]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      <canvas ref={bgCanvasRef} className="absolute inset-0" />
      <canvas ref={activeCanvasRef} className="absolute inset-0" />
      <button onClick={handleClear} className="absolute top-3 right-3 z-10 p-2 bg-white/90 hover:bg-white rounded-lg shadow-md border border-gray-200 text-gray-600 hover:text-red-500 transition-colors" title="清除画布">
        <Trash2 size={18} />
      </button>
      {flashes.map((f) => (
        <div key={f.id} className={`pointer-events-none absolute ${f.type === 'green' ? 'animate-flash-green' : 'animate-flash-red'}`}
          style={{ left: f.x, top: f.y, width: f.w, height: f.h,
            border: f.type === 'red' ? '2px dashed rgba(239,68,68,0.8)' : '2px solid rgba(34,197,94,0.6)', borderRadius: 4 }}
        />
      ))}
    </div>
  );
}
