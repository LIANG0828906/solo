import React, { useState, useRef, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import StickyNote, { StickyNoteData } from './StickyNote';
import ArrowAnnotation, { ArrowAnnotationData } from './ArrowAnnotation';
import './Whiteboard.css';

type ToolType = 'pencil' | 'highlighter' | 'eraser' | 'select';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  id: string;
  type: 'pencil' | 'highlighter' | 'eraser';
  points: Point[];
  color: string;
  lineWidth: number;
}

const ARROW_COLORS = ['#F44336', '#2196F3', '#4CAF50', '#FF9800'];
const PENCIL_COLORS = ['#333333', '#F44336', '#2196F3', '#4CAF50', '#FF9800', '#9C27B0'];

const Whiteboard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const eraserCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [tool, setTool] = useState<ToolType>('pencil');
  const [pencilColor, setPencilColor] = useState('#333333');
  const [arrowColor, setArrowColor] = useState('#F44336');
  const [lineWidth, setLineWidth] = useState(3);
  const [eraserSize, setEraserSize] = useState(20);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [stickyNotes, setStickyNotes] = useState<StickyNoteData[]>([]);
  const [arrows, setArrows] = useState<ArrowAnnotationData[]>([]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'sticky' | 'arrow' | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [tempArrow, setTempArrow] = useState<ArrowAnnotationData | null>(null);

  const drawStartRef = useRef({ x: 0, y: 0, canvasX: 0, canvasY: 0 });
  const panStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

  const screenToCanvas = useCallback(
    (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: (clientX - rect.left - offset.x) / scale,
        y: (clientY - rect.top - offset.y) / scale,
      };
    },
    [offset, scale]
  );

  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    canvas.width = rect.width;
    canvas.height = rect.height;

    const gridSpacing = 20 * scale;
    const startX = offset.x % gridSpacing;
    const startY = offset.y % gridSpacing;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 0.5;

    ctx.beginPath();
    for (let x = startX; x < canvas.width; x += gridSpacing) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
    }
    for (let y = startY; y < canvas.height; y += gridSpacing) {
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();
  }, [offset, scale]);

  const drawStrokes = useCallback(() => {
    const canvas = eraserCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    strokes.forEach((stroke) => {
      if (stroke.type === 'eraser') {
        if (stroke.points.length > 0) {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.strokeStyle = 'rgba(0,0,0,1)';
          ctx.lineWidth = stroke.lineWidth;
          ctx.beginPath();
          const first = stroke.points[0];
          ctx.moveTo(first.x, first.y);
          stroke.points.forEach((p) => ctx.lineTo(p.x, p.y));
          ctx.stroke();
          ctx.globalCompositeOperation = 'source-over';
        }
      } else if (stroke.points.length > 1) {
        ctx.lineCap = stroke.type === 'highlighter' ? 'round' : 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.lineWidth;

        if (stroke.type === 'highlighter') {
          ctx.globalAlpha = 0.3;
        } else {
          ctx.globalAlpha = 0.8;
        }

        ctx.beginPath();
        const first = stroke.points[0];
        ctx.moveTo(first.x, first.y);

        for (let i = 1; i < stroke.points.length - 1; i++) {
          const midX = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
          const midY = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
          ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, midX, midY);
        }

        if (stroke.points.length > 1) {
          const last = stroke.points[stroke.points.length - 1];
          ctx.lineTo(last.x, last.y);
        }

        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    });

    if (currentStroke && currentStroke.points.length > 0) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = currentStroke.color;
      ctx.lineWidth = currentStroke.lineWidth;

      if (currentStroke.type === 'highlighter') {
        ctx.globalAlpha = 0.3;
      } else if (currentStroke.type === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalAlpha = 0.8;
      }

      ctx.beginPath();
      const first = currentStroke.points[0];
      ctx.moveTo(first.x, first.y);

      for (let i = 1; i < currentStroke.points.length - 1; i++) {
        const midX = (currentStroke.points[i].x + currentStroke.points[i + 1].x) / 2;
        const midY = (currentStroke.points[i].y + currentStroke.points[i + 1].y) / 2;
        ctx.quadraticCurveTo(currentStroke.points[i].x, currentStroke.points[i].y, midX, midY);
      }

      if (currentStroke.points.length > 1) {
        const last = currentStroke.points[currentStroke.points.length - 1];
        ctx.lineTo(last.x, last.y);
      }

      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.restore();
  }, [strokes, currentStroke, offset, scale]);

  useEffect(() => {
    drawGrid();
    drawStrokes();
  }, [drawGrid, drawStrokes]);

  useEffect(() => {
    const handleResize = () => {
      drawGrid();
      drawStrokes();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawGrid, drawStrokes]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.5, Math.min(3, scale * delta));

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newOffsetX = mouseX - ((mouseX - offset.x) * newScale) / scale;
    const newOffsetY = mouseY - ((mouseY - offset.y) * newScale) / scale;

    setScale(newScale);
    setOffset({ x: newOffsetX, y: newOffsetY });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;

    const pos = screenToCanvas(e.clientX, e.clientY);
    drawStartRef.current = { x: e.clientX, y: e.clientY, canvasX: pos.x, canvasY: pos.y };

    if (e.shiftKey) {
      setTempArrow({
        id: uuidv4(),
        startX: pos.x,
        startY: pos.y,
        endX: pos.x,
        endY: pos.y,
        color: arrowColor,
        text: '',
      });
      setSelectedId(null);
      setSelectedType(null);
      return;
    }

    if (tool === 'select') {
      setSelectedId(null);
      setSelectedType(null);
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY, offsetX: offset.x, offsetY: offset.y };
      return;
    }

    if (tool === 'pencil' || tool === 'highlighter' || tool === 'eraser') {
      setIsDrawing(true);
      setSelectedId(null);
      setSelectedType(null);

      const newStroke: Stroke = {
        id: uuidv4(),
        type: tool,
        points: [{ x: pos.x, y: pos.y }],
        color: tool === 'eraser' ? '#000' : pencilColor,
        lineWidth: tool === 'eraser' ? eraserSize : lineWidth,
      };
      setCurrentStroke(newStroke);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (tempArrow) {
      const pos = screenToCanvas(e.clientX, e.clientY);
      setTempArrow((prev) => (prev ? { ...prev, endX: pos.x, endY: pos.y } : null));
      return;
    }

    if (isPanning) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setOffset({
        x: panStartRef.current.offsetX + dx,
        y: panStartRef.current.offsetY + dy,
      });
      return;
    }

    if (isDrawing && currentStroke) {
      const pos = screenToCanvas(e.clientX, e.clientY);

      if (tool === 'pencil') {
        const jitter = 0.5;
        const jitterX = (Math.random() - 0.5) * jitter;
        const jitterY = (Math.random() - 0.5) * jitter;
        setCurrentStroke((prev) =>
          prev
            ? {
                ...prev,
                points: [...prev.points, { x: pos.x + jitterX, y: pos.y + jitterY }],
              }
            : null
        );
      } else {
        setCurrentStroke((prev) =>
          prev ? { ...prev, points: [...prev.points, { x: pos.x, y: pos.y }] } : null
        );
      }
    }
  };

  const handleMouseUp = () => {
    if (tempArrow) {
      const dx = tempArrow.endX - tempArrow.startX;
      const dy = tempArrow.endY - tempArrow.startY;
      const length = Math.sqrt(dx * dx + dy * dy);

      if (length > 10) {
        setArrows((prev) => [...prev, tempArrow]);
        setSelectedId(tempArrow.id);
        setSelectedType('arrow');
      }
      setTempArrow(null);
      return;
    }

    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDrawing && currentStroke) {
      if (currentStroke.points.length > 1) {
        setStrokes((prev) => [...prev, currentStroke]);
      }
      setCurrentStroke(null);
      setIsDrawing(false);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (e.target !== canvasRef.current && e.target !== eraserCanvasRef.current) return;

    const pos = screenToCanvas(e.clientX, e.clientY);
    const newNote: StickyNoteData = {
      id: uuidv4(),
      x: pos.x - 75,
      y: pos.y - 75,
      text: '',
      color: '#FFF9C4',
      width: 150,
      height: 150,
    };
    setStickyNotes((prev) => [...prev, newNote]);
    setSelectedId(newNote.id);
    setSelectedType('sticky');
  };

  const handleSelectSticky = (id: string) => {
    setSelectedId(id);
    setSelectedType('sticky');
  };

  const handleUpdateSticky = (id: string, updates: Partial<StickyNoteData>) => {
    setStickyNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)));
  };

  const handleDeleteSticky = (id: string) => {
    setStickyNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
      setSelectedType(null);
    }
  };

  const handleSelectArrow = (id: string) => {
    setSelectedId(id);
    setSelectedType('arrow');
  };

  const handleUpdateArrow = (id: string, updates: Partial<ArrowAnnotationData>) => {
    setArrows((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  const handleDeleteArrow = (id: string) => {
    setArrows((prev) => prev.filter((a) => a.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
      setSelectedType(null);
    }
  };

  const handleToolChange = (newTool: ToolType) => {
    setTool(newTool);
    setSelectedId(null);
    setSelectedType(null);
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId && selectedType === 'sticky') {
          handleDeleteSticky(selectedId);
        } else if (selectedId && selectedType === 'arrow') {
          handleDeleteArrow(selectedId);
        }
      }
      if (e.key === 'Escape') {
        setSelectedId(null);
        setSelectedType(null);
        setTempArrow(null);
      }
    },
    [selectedId, selectedType]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="whiteboard-container" ref={containerRef}>
      <div className="toolbar">
        <div className="tool-group">
          <button
            className={`tool-btn ${tool === 'select' ? 'active' : ''}`}
            onClick={() => handleToolChange('select')}
            title="选择/平移"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 3l6 6 3-3 6 6V3H5z" />
              <path d="M3 5l6 6-3 3-6-6V5z" />
            </svg>
            <span className="tooltip">选择/平移</span>
          </button>
          <button
            className={`tool-btn ${tool === 'pencil' ? 'active' : ''}`}
            onClick={() => handleToolChange('pencil')}
            title="铅笔"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
            <span className="tooltip">铅笔</span>
          </button>
          <button
            className={`tool-btn ${tool === 'highlighter' ? 'active' : ''}`}
            onClick={() => handleToolChange('highlighter')}
            title="荧光笔"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l-6 6v4h4l6-6" />
              <path d="M22 12l-5 5-5-5 5-5 5 5z" />
              <path d="M12 2l-5 5 5 5 5-5-5-5z" />
            </svg>
            <span className="tooltip">荧光笔</span>
          </button>
          <button
            className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`}
            onClick={() => handleToolChange('eraser')}
            title="橡皮擦"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 20H7L3 16c-2-2-2-6 0-8l10-10c2-2 6-2 8 0l6 6c2 2 2 6 0 8l-7 7z" />
              <path d="M18 14L10 6" />
            </svg>
            <span className="tooltip">橡皮擦</span>
          </button>
        </div>

        {tool === 'pencil' && (
          <div className="color-group">
            {PENCIL_COLORS.map((color) => (
              <button
                key={color}
                className={`color-btn ${pencilColor === color ? 'active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setPencilColor(color)}
              />
            ))}
          </div>
        )}

        <div className="divider" />

        <div className="color-group">
          <span className="label">箭头:</span>
          {ARROW_COLORS.map((color) => (
            <button
              key={color}
              className={`color-btn ${arrowColor === color ? 'active' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => setArrowColor(color)}
            />
          ))}
        </div>

        <div className="divider" />

        <div className="size-control">
          <span className="label">粗细:</span>
          <input
            type="range"
            min="1"
            max="30"
            value={tool === 'eraser' ? eraserSize : lineWidth}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (tool === 'eraser') {
                setEraserSize(val);
              } else {
                setLineWidth(val);
              }
            }}
          />
        </div>

        <div className="divider" />

        <div className="zoom-control">
          <button
            className="icon-btn"
            onClick={() => setScale((s) => Math.max(0.5, s * 0.9))}
            title="缩小"
          >
            −
          </button>
          <span className="zoom-text">{Math.round(scale * 100)}%</span>
          <button
            className="icon-btn"
            onClick={() => setScale((s) => Math.min(3, s * 1.1))}
            title="放大"
          >
            +
          </button>
        </div>
      </div>

      <div
        className="canvas-wrapper"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        style={{ cursor: isPanning ? 'grabbing' : tool === 'select' ? 'grab' : 'crosshair' }}
      >
        <canvas ref={canvasRef} className="grid-canvas" />
        <canvas ref={eraserCanvasRef} className="drawing-canvas" />

        <svg
          className="arrow-svg"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: '0 0',
          }}
        >
          {arrows.map((arrow) => (
            <ArrowAnnotation
              key={arrow.id}
              arrow={arrow}
              scale={1}
              isSelected={selectedId === arrow.id && selectedType === 'arrow'}
              onSelect={handleSelectArrow}
              onUpdate={handleUpdateArrow}
              onDelete={handleDeleteArrow}
            />
          ))}
          {tempArrow && (
            <ArrowAnnotation
              arrow={tempArrow}
              scale={1}
              isSelected={false}
              onSelect={() => {}}
              onUpdate={() => {}}
              onDelete={() => {}}
            />
          )}
        </svg>

        <div
          className="elements-layer"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px)`,
          }}
        >
          {stickyNotes.map((note) => (
            <div
              key={note.id}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                transform: `translate(${note.x * scale}px, ${note.y * scale}px) scale(${scale})`,
                transformOrigin: 'top left',
                willChange: 'transform',
              }}
            >
              <StickyNote
                note={{ ...note, x: 0, y: 0 }}
                scale={1}
                isSelected={selectedId === note.id && selectedType === 'sticky'}
                onSelect={() => handleSelectSticky(note.id)}
                onUpdate={(id, updates) => handleUpdateSticky(id, updates)}
                onDelete={handleDeleteSticky}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="hint-bar">
        <span>提示: 双击添加便利贴 · Shift+拖拽创建箭头 · 滚轮缩放 · 选择工具可平移画布</span>
      </div>
    </div>
  );
};

export default Whiteboard;
