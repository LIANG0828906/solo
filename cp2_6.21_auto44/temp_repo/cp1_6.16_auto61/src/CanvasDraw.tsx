import { useRef, useEffect, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Stroke, Mood, Point } from './types';
import { PRESET_COLORS, BRUSH_SIZES, MOOD_LABELS } from './types';

interface CanvasDrawProps {
  onSave: (strokes: Stroke[], mood: Mood) => void;
}

const CANVAS_SIZE = 600;
const MAX_HISTORY = 20;

export default function CanvasDraw({ onSave }: CanvasDrawProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [selectedSize, setSelectedSize] = useState(BRUSH_SIZES[1]);
  const [selectedMood, setSelectedMood] = useState<Mood>('calm');
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [history, setHistory] = useState<Stroke[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const lastPointRef = useRef<Point | null>(null);

  const redrawCanvas = useCallback((strokeList: Stroke[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    for (const stroke of strokeList) {
      if (stroke.points.length < 2) continue;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
  }, []);

  const pushHistory = useCallback((newStrokes: Stroke[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newStrokes);
    if (newHistory.length > MAX_HISTORY + 1) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }
    setHistory(newHistory);
  }, [history, historyIndex]);

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    const point = getCanvasPoint(e);
    setIsDrawing(true);
    const newStroke: Stroke = {
      id: uuidv4(),
      color: selectedColor,
      width: selectedSize,
      points: [point]
    };
    currentStrokeRef.current = newStroke;
    lastPointRef.current = point;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentStrokeRef.current) return;
    const point = getCanvasPoint(e);
    const lastPoint = lastPointRef.current;
    if (!lastPoint) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = currentStrokeRef.current.color;
    ctx.lineWidth = currentStrokeRef.current.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();

    currentStrokeRef.current.points.push(point);
    lastPointRef.current = point;
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentStrokeRef.current) return;
    setIsDrawing(false);
    const newStrokes = [...strokes, currentStrokeRef.current];
    setStrokes(newStrokes);
    pushHistory(newStrokes);
    currentStrokeRef.current = null;
    lastPointRef.current = null;
  };

  const handleMouseLeave = () => {
    if (isDrawing) {
      handleMouseUp();
    }
  };

  const handleUndo = useCallback(() => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    const prevStrokes = history[newIndex];
    setStrokes(prevStrokes);
    redrawCanvas(prevStrokes);
  }, [history, historyIndex, redrawCanvas]);

  const handleClear = useCallback(() => {
    const emptyStrokes: Stroke[] = [];
    setStrokes(emptyStrokes);
    pushHistory(emptyStrokes);
    redrawCanvas(emptyStrokes);
  }, [pushHistory, redrawCanvas]);

  const handleSave = () => {
    if (strokes.length === 0) return;
    onSave(strokes, selectedMood);
    const emptyStrokes: Stroke[] = [];
    setStrokes(emptyStrokes);
    setHistory([[]]);
    setHistoryIndex(0);
    redrawCanvas(emptyStrokes);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        handleClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleClear]);

  useEffect(() => {
    redrawCanvas(strokes);
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <div style={styles.colorPicker}>
          {PRESET_COLORS.map((color) => (
            <div
              key={color}
              onClick={() => setSelectedColor(color)}
              style={{
                ...styles.colorDot,
                backgroundColor: color,
                border: selectedColor === color ? '3px solid #ffffff' : '3px solid transparent'
              }}
            />
          ))}
        </div>
        <div style={styles.sizePicker}>
          {BRUSH_SIZES.map((size) => (
            <div
              key={size}
              onClick={() => setSelectedSize(size)}
              style={{
                ...styles.sizeButton,
                backgroundColor: selectedSize === size ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                border: selectedSize === size ? '2px solid #ffffff' : '2px solid transparent'
              }}
            >
              <div style={{
                width: size * 2,
                height: size * 2,
                borderRadius: '50%',
                backgroundColor: '#ffffff'
              }} />
            </div>
          ))}
        </div>
        <select
          value={selectedMood}
          onChange={(e) => setSelectedMood(e.target.value as Mood)}
          style={styles.moodSelect}
        >
          {Object.entries(MOOD_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={styles.canvas}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />

      <div style={styles.actionBar}>
        <button onClick={handleUndo} style={styles.button} disabled={historyIndex <= 0}>
          撤销 (Ctrl+Z)
        </button>
        <button onClick={handleClear} style={styles.button} disabled={strokes.length === 0}>
          清空 (Ctrl+Shift+Z)
        </button>
        <button onClick={handleSave} style={{ ...styles.button, ...styles.saveButton }} disabled={strokes.length === 0}>
          保存画作
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '20px',
    padding: '20px'
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    padding: '12px 20px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
  },
  colorPicker: {
    display: 'flex',
    gap: '10px'
  },
  colorDot: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
    boxSizing: 'border-box' as const
  },
  sizePicker: {
    display: 'flex',
    gap: '8px',
    paddingLeft: '16px',
    borderLeft: '1px solid rgba(255,255,255,0.2)'
  },
  sizeButton: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box' as const
  },
  moodSelect: {
    padding: '8px 12px',
    borderRadius: '8px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#ffffff',
    border: '1px solid rgba(255,255,255,0.2)',
    fontSize: '14px',
    cursor: 'pointer',
    outline: 'none'
  },
  canvas: {
    width: '600px',
    height: '600px',
    borderRadius: '8px',
    cursor: 'crosshair',
    boxShadow: '0 0 10px rgba(255,255,255,0.2)',
    backgroundColor: '#000000'
  },
  actionBar: {
    display: 'flex',
    gap: '12px'
  },
  button: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#ffffff',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
  },
  saveButton: {
    backgroundColor: '#4ECDC4',
    color: '#1a1a2e',
    fontWeight: 'bold' as const
  }
};
