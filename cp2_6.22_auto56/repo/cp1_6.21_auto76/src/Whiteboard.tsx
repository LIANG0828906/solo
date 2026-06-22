import React, { useEffect, useRef, useState, useCallback } from 'react';

type ToolType = 'pen' | 'rect' | 'circle' | 'line' | 'text';
type PenColor = '#E74C3C' | '#3498DB' | '#2C3E50';
type PenWidth = 2 | 4 | 6;

interface DrawOperation {
  tool: ToolType;
  color: string;
  width: number;
  points: { x: number; y: number }[];
  timestamp: number;
  page: number;
  text?: string;
}

interface WhiteboardProps {
  role: 'teacher' | 'student';
  roomName: string;
  onOperation: (op: DrawOperation) => void;
  remoteOperations: DrawOperation[];
  pdfPages: string[];
  currentPage: number;
  onPageChange: (page: number) => void;
  locked: boolean;
  zoom: number;
  onZoomChange: (z: number) => void;
}

const COLORS: PenColor[] = ['#E74C3C', '#3498DB', '#2C3E50'];
const WIDTHS: PenWidth[] = [2, 4, 6];

export default function Whiteboard({
  role,
  roomName,
  onOperation,
  remoteOperations,
  pdfPages,
  currentPage,
  onPageChange,
  locked,
  zoom,
  onZoomChange,
}: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<ToolType>('pen');
  const [color, setColor] = useState<PenColor>('#2C3E50');
  const [penWidth, setPenWidth] = useState<PenWidth>(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [history, setHistory] = useState<DrawOperation[]>([]);
  const [undoStack, setUndoStack] = useState<DrawOperation[][]>([]);
  const [textInput, setTextInput] = useState<{ show: boolean; x: number; y: number }>({
    show: false,
    x: 0,
    y: 0,
  });
  const [textValue, setTextValue] = useState('');
  const [showTeacherToast, setShowTeacherToast] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastRemoteSeqRef = useRef(0);
  const animFrameRef = useRef<number>(0);

  const getCanvasSize = useCallback(() => {
    if (!containerRef.current) return { width: 800, height: 600 };
    return {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight - 52,
    };
  }, []);

  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#E0E0E0';
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= w; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    },
    []
  );

  const drawPdfBackground = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
      if (pdfPages.length > 0 && pdfPages[currentPage]) {
        const img = new Image();
        img.src = pdfPages[currentPage];
        img.onload = () => {
          const scale = Math.min(w / img.width, h / img.height);
          const iw = img.width * scale;
          const ih = img.height * scale;
          ctx.drawImage(img, (w - iw) / 2, (h - ih) / 2, iw, ih);
        };
      } else {
        drawGrid(ctx, w, h);
      }
    },
    [pdfPages, currentPage, drawGrid]
  );

  const redrawAll = useCallback(
    (ops: DrawOperation[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const { width, height } = getCanvasSize();
      ctx.clearRect(0, 0, width, height);
      const pageOps = ops.filter((o) => o.page === currentPage);
      for (const op of pageOps) {
        renderOperation(ctx, op);
      }
    },
    [currentPage, getCanvasSize]
  );

  const renderOperation = (ctx: CanvasRenderingContext2D, op: DrawOperation) => {
    ctx.save();
    ctx.strokeStyle = op.color;
    ctx.lineWidth = op.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (op.tool) {
      case 'pen':
        if (op.points.length < 2) break;
        ctx.beginPath();
        ctx.moveTo(op.points[0].x, op.points[0].y);
        for (let i = 1; i < op.points.length; i++) {
          ctx.lineTo(op.points[i].x, op.points[i].y);
        }
        ctx.stroke();
        break;
      case 'rect':
        if (op.points.length >= 2) {
          const rx = Math.min(op.points[0].x, op.points[op.points.length - 1].x);
          const ry = Math.min(op.points[0].y, op.points[op.points.length - 1].y);
          const rw = Math.abs(op.points[op.points.length - 1].x - op.points[0].x);
          const rh = Math.abs(op.points[op.points.length - 1].y - op.points[0].y);
          ctx.strokeRect(rx, ry, rw, rh);
        }
        break;
      case 'circle':
        if (op.points.length >= 2) {
          const cx = (op.points[0].x + op.points[op.points.length - 1].x) / 2;
          const cy = (op.points[0].y + op.points[op.points.length - 1].y) / 2;
          const radX = Math.abs(op.points[op.points.length - 1].x - op.points[0].x) / 2;
          const radY = Math.abs(op.points[op.points.length - 1].y - op.points[0].y) / 2;
          ctx.beginPath();
          ctx.ellipse(cx, cy, radX || 1, radY || 1, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        break;
      case 'line':
        if (op.points.length >= 2) {
          ctx.beginPath();
          ctx.moveTo(op.points[0].x, op.points[0].y);
          ctx.lineTo(op.points[op.points.length - 1].x, op.points[op.points.length - 1].y);
          ctx.stroke();
        }
        break;
      case 'text':
        if (op.text && op.points.length >= 1) {
          ctx.fillStyle = op.color;
          ctx.font = `${Math.max(op.width * 6, 16)}px sans-serif`;
          ctx.fillText(op.text, op.points[0].x, op.points[0].y);
        }
        break;
    }
    ctx.restore();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const bgCanvas = bgCanvasRef.current;
    if (!canvas || !bgCanvas) return;
    const { width, height } = getCanvasSize();
    canvas.width = width;
    canvas.height = height;
    bgCanvas.width = width;
    bgCanvas.height = height;
    const bgCtx = bgCanvas.getContext('2d');
    if (bgCtx) drawPdfBackground(bgCtx, width, height);
    redrawAll(history);
  }, [getCanvasSize, pdfPages, currentPage]);

  useEffect(() => {
    const newOps = remoteOperations.slice(lastRemoteSeqRef.current);
    if (newOps.length === 0) return;
    lastRemoteSeqRef.current = remoteOperations.length;
    setHistory((prev) => {
      const updated = [...prev, ...newOps];
      requestAnimationFrame(() => redrawAll(updated));
      return updated;
    });
    if (role === 'student') {
      setShowTeacherToast(true);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setShowTeacherToast(false), 2000);
    }
  }, [remoteOperations]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const bgCanvas = bgCanvasRef.current;
      if (!canvas || !bgCanvas || !containerRef.current) return;
      const { width, height } = getCanvasSize();
      canvas.width = width;
      canvas.height = height;
      bgCanvas.width = width;
      bgCanvas.height = height;
      const bgCtx = bgCanvas.getContext('2d');
      if (bgCtx) drawPdfBackground(bgCtx, width, height);
      redrawAll(history);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [history, getCanvasSize, drawPdfBackground, redrawAll]);

  const getCanvasCoords = (e: React.MouseEvent): { x: number; y: number } => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (locked && role === 'student') return;
    const pt = getCanvasCoords(e);
    if (tool === 'text') {
      setTextInput({ show: true, x: e.clientX, y: e.clientY });
      setPoints([pt]);
      drawStartRef.current = pt;
      return;
    }
    setIsDrawing(true);
    setPoints([pt]);
    drawStartRef.current = pt;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || (locked && role === 'student')) return;
    const pt = getCanvasCoords(e);
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const currentPts = [...points, pt];
    setPoints(currentPts);

    if (tool === 'pen') {
      ctx.strokeStyle = color;
      ctx.lineWidth = penWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      if (currentPts.length >= 2) {
        const prev = currentPts[currentPts.length - 2];
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
    } else {
      redrawAll(history);
      const op: DrawOperation = {
        tool,
        color,
        width: penWidth,
        points: [drawStartRef.current!, pt],
        timestamp: Date.now(),
        page: currentPage,
      };
      renderOperation(ctx, op);
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing && tool !== 'text') return;
    if (tool === 'text') return;
    setIsDrawing(false);
    if (points.length < 1) return;
    const op: DrawOperation = {
      tool,
      color,
      width: penWidth,
      points:
        tool === 'pen'
          ? [...points]
          : [drawStartRef.current!, points[points.length - 1]],
      timestamp: Date.now(),
      page: currentPage,
    };
    setHistory((prev) => [...prev, op]);
    setUndoStack((prev) => [...prev.slice(-9), [...history]]);
    onOperation(op);
    setPoints([]);
    drawStartRef.current = null;
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setHistory(prev);
    redrawAll(prev);
  };

  const handleClear = () => {
    setUndoStack((prev) => [...prev.slice(-9), [...history]]);
    setHistory([]);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleTextSubmit = () => {
    if (!textValue.trim()) {
      setTextInput({ show: false, x: 0, y: 0 });
      return;
    }
    const op: DrawOperation = {
      tool: 'text',
      color,
      width: penWidth,
      points: [points[0]],
      timestamp: Date.now(),
      page: currentPage,
      text: textValue,
    };
    setHistory((prev) => [...prev, op]);
    setUndoStack((prev) => [...prev.slice(-9), [...history]]);
    onOperation(op);
    setTextValue('');
    setTextInput({ show: false, x: 0, y: 0 });
  };

  const totalPages = pdfPages.length > 0 ? pdfPages.length : 1;

  const toolButtons: { type: ToolType; label: string; icon: string }[] = [
    { type: 'pen', label: '画笔', icon: '✏️' },
    { type: 'rect', label: '矩形', icon: '⬜' },
    { type: 'circle', label: '圆形', icon: '⭕' },
    { type: 'line', label: '直线', icon: '📏' },
    { type: 'text', label: '文本', icon: '🔤' },
  ];

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: 52,
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          gap: 8,
          background: '#FFFFFF',
          borderBottom: '1px solid #DEE2E6',
          flexShrink: 0,
        }}
      >
        {toolButtons.map((tb) => (
          <button
            key={tb.type}
            onClick={() => setTool(tb.type)}
            title={tb.label}
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              border: '1px solid #DEE2E6',
              background: tool === tb.type ? '#EBF5FB' : '#FFFFFF',
              cursor: 'pointer',
              fontSize: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
            }}
          >
            {tb.icon}
          </button>
        ))}

        <div style={{ width: 1, height: 28, background: '#DEE2E6', margin: '0 4px' }} />

        {tool === 'pen' &&
          COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                border: color === c ? '3px solid #3498DB' : '2px solid #DEE2E6',
                background: c,
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              }}
            />
          ))}

        {tool === 'pen' &&
          WIDTHS.map((w) => (
            <button
              key={w}
              onClick={() => setPenWidth(w)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                border: penWidth === w ? '2px solid #3498DB' : '1px solid #DEE2E6',
                background: penWidth === w ? '#EBF5FB' : '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              }}
            >
              <div
                style={{
                  width: w * 3,
                  height: w * 3,
                  borderRadius: '50%',
                  background: color,
                }}
              />
            </button>
          ))}

        <div style={{ width: 1, height: 28, background: '#DEE2E6', margin: '0 4px' }} />

        <button
          onClick={handleUndo}
          disabled={undoStack.length === 0}
          title="撤销"
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            border: '1px solid #DEE2E6',
            background: undoStack.length === 0 ? '#F0F0F0' : '#FFFFFF',
            cursor: undoStack.length === 0 ? 'not-allowed' : 'pointer',
            fontSize: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s',
            opacity: undoStack.length === 0 ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (undoStack.length > 0) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
          }}
        >
          ↩️
        </button>
        <button
          onClick={handleClear}
          title="清空"
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            border: '1px solid #DEE2E6',
            background: '#FFFFFF',
            cursor: 'pointer',
            fontSize: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
          }}
        >
          🗑️
        </button>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas
          ref={bgCanvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'center center',
          }}
        />
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'center center',
            cursor: tool === 'text' ? 'text' : 'crosshair',
          }}
        />

        {locked && role === 'student' && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#E74C3C',
              fontSize: 18,
              fontWeight: 'bold',
              zIndex: 10,
            }}
          >
            🔒 教师已锁定板书
          </div>
        )}
      </div>

      <div
        style={{
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          background: '#FAFAFA',
          borderTop: '1px solid #DEE2E6',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 14, color: '#666' }}>
          第{currentPage + 1}页/共{totalPages}页
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#999' }}>50%</span>
          <input
            type="range"
            min={50}
            max={200}
            value={zoom}
            onChange={(e) => onZoomChange(Number(e.target.value))}
            style={{ width: 120 }}
          />
          <span style={{ fontSize: 12, color: '#999' }}>200%</span>
          <span style={{ fontSize: 13, color: '#333', marginLeft: 8 }}>{zoom}%</span>
        </div>
      </div>

      {showTeacherToast && (
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#27AE60',
            color: '#FFFFFF',
            padding: '8px 24px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            animation: 'toastIn 0.3s ease',
            zIndex: 20,
          }}
        >
          教师正在板书...
        </div>
      )}

      {textInput.show && (
        <div
          style={{
            position: 'fixed',
            left: textInput.x,
            top: textInput.y,
            zIndex: 100,
          }}
        >
          <input
            autoFocus
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTextSubmit();
              if (e.key === 'Escape') setTextInput({ show: false, x: 0, y: 0 });
            }}
            placeholder="输入文本..."
            style={{
              padding: '6px 12px',
              border: '2px solid #3498DB',
              borderRadius: 6,
              fontSize: 14,
              outline: 'none',
              minWidth: 160,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
