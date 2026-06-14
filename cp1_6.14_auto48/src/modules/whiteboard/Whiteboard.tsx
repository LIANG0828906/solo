import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  BoardState,
  Stroke,
  StickyNote,
  BoardImage,
  ToolMode,
  Point,
  GRID_SIZE,
  SNAP_DISTANCE,
} from '../../types';
import { wsService } from '../websocket/WebSocketService';
import { recorder } from '../recording/Recorder';
import { v4 as uuid } from 'uuid';

interface WhiteboardProps {
  sessionId: string;
  userId: string;
  boardState: BoardState;
  onStateChange: (state: BoardState) => void;
  tool: ToolMode;
  penColor: string;
  penWidth: number;
}

const STICKY_WIDTH = 180;
const STICKY_HEIGHT = 140;

const Whiteboard: React.FC<WhiteboardProps> = ({
  sessionId,
  userId,
  boardState,
  onStateChange,
  tool,
  penColor,
  penWidth,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>(boardState.strokes);
  const [stickies, setStickies] = useState<StickyNote[]>(boardState.stickies);
  const [images, setImages] = useState<BoardImage[]>(boardState.images);
  const [undoStack, setUndoStack] = useState<BoardState[]>([]);
  const [redoStack, setRedoStack] = useState<BoardState[]>([]);

  const drawingRef = useRef(false);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const dragRef = useRef<{
    type: 'sticky' | 'image';
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const selectedRef = useRef<{ type: 'sticky' | 'image'; id: string } | null>(null);
  const strokesRef = useRef(strokes);
  const stickiesRef = useRef(stickies);
  const imagesRef = useRef(images);

  useEffect(() => { strokesRef.current = strokes; }, [strokes]);
  useEffect(() => { stickiesRef.current = stickies; }, [stickies]);
  useEffect(() => { imagesRef.current = images; }, [images]);

  useEffect(() => {
    setStrokes(boardState.strokes);
    setStickies(boardState.stickies);
    setImages(boardState.images);
  }, [boardState]);

  const snapToGrid = (val: number): number => {
    const remainder = val % GRID_SIZE;
    if (remainder < SNAP_DISTANCE) return val - remainder;
    if (remainder > GRID_SIZE - SNAP_DISTANCE) return val + (GRID_SIZE - remainder);
    return val;
  };

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    const allStrokes = currentStrokeRef.current
      ? [...strokesRef.current, currentStrokeRef.current]
      : strokesRef.current;

    allStrokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.tool === 'eraser' ? '#FFFFFF' : stroke.color;
      ctx.lineWidth = stroke.tool === 'eraser' ? stroke.width * 3 : stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      }

      const pts = stroke.points;
      ctx.moveTo(pts[0].x, pts[0].y);

      if (pts.length === 2) {
        ctx.lineTo(pts[1].x, pts[1].y);
      } else {
        for (let i = 1; i < pts.length - 1; i++) {
          const midX = (pts[i].x + pts[i + 1].x) / 2;
          const midY = (pts[i].y + pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
        }
        const last = pts[pts.length - 1];
        ctx.lineTo(last.x, last.y);
      }

      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      redraw();
    };
    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [redraw]);

  useEffect(() => {
    redraw();
  }, [strokes, stickies, images, redraw]);

  const saveSnapshot = useCallback(() => {
    setUndoStack((prev) => [
      ...prev.slice(-49),
      { strokes: strokesRef.current, stickies: stickiesRef.current, images: imagesRef.current },
    ]);
    setRedoStack([]);
  }, []);

  const applyState = useCallback((state: BoardState) => {
    setStrokes(state.strokes);
    setStickies(state.stickies);
    setImages(state.images);
    onStateChange(state);
  }, [onStateChange]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setRedoStack((r) => [
      ...r,
      { strokes: strokesRef.current, stickies: stickiesRef.current, images: imagesRef.current },
    ]);
    applyState(prev);
  }, [undoStack, applyState]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((s) => s.slice(0, -1));
    setUndoStack((u) => [
      ...u,
      { strokes: strokesRef.current, stickies: stickiesRef.current, images: imagesRef.current },
    ]);
    applyState(next);
  }, [redoStack, applyState]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'Z') {
        e.preventDefault();
        redo();
      } else if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
      } else if (e.key === 'Delete' && selectedRef.current) {
        e.preventDefault();
        const sel = selectedRef.current;
        saveSnapshot();
        if (sel.type === 'sticky') {
          const newStickies = stickiesRef.current.filter((s) => s.id !== sel.id);
          setStickies(newStickies);
          recorder.record('deleteSticky', { id: sel.id });
          wsService.sendOperation('deleteSticky', { id: sel.id });
        } else {
          const newImages = imagesRef.current.filter((i) => i.id !== sel.id);
          setImages(newImages);
          recorder.record('deleteImage', { id: sel.id });
          wsService.sendOperation('deleteImage', { id: sel.id });
        }
        selectedRef.current = null;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, saveSnapshot]);

  const getCanvasPoint = (e: React.MouseEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pt = getCanvasPoint(e);

    if (tool === 'pen' || tool === 'eraser') {
      drawingRef.current = true;
      const stroke: Stroke = {
        id: uuid(),
        points: [pt],
        color: penColor,
        width: penWidth,
        tool,
      };
      currentStrokeRef.current = stroke;
      redraw();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (drawingRef.current && currentStrokeRef.current) {
      currentStrokeRef.current.points.push(getCanvasPoint(e));
      redraw();
    }

    if (dragRef.current) {
      const pt = getCanvasPoint(e);
      if (dragRef.current.type === 'sticky') {
        setStickies((prev) =>
          prev.map((s) =>
            s.id === dragRef.current!.id
              ? { ...s, x: pt.x - dragRef.current!.offsetX, y: pt.y - dragRef.current!.offsetY }
              : s
          )
        );
      } else {
        setImages((prev) =>
          prev.map((i) =>
            i.id === dragRef.current!.id
              ? { ...i, x: pt.x - dragRef.current!.offsetX, y: pt.y - dragRef.current!.offsetY }
              : i
          )
        );
      }
    }
  };

  const handleMouseUp = () => {
    if (drawingRef.current && currentStrokeRef.current) {
      drawingRef.current = false;
      const stroke = currentStrokeRef.current;
      currentStrokeRef.current = null;
      if (stroke.points.length >= 2) {
        saveSnapshot();
        const newStrokes = [...strokesRef.current, stroke];
        setStrokes(newStrokes);
        const opType = stroke.tool === 'eraser' ? 'erase' : 'draw';
        recorder.record(opType, { stroke });
        wsService.sendOperation(opType, { stroke });
      }
      redraw();
    }

    if (dragRef.current) {
      const { type, id } = dragRef.current;
      const snappedX = snapToGrid(type === 'sticky'
        ? stickiesRef.current.find((s) => s.id === id)!.x
        : imagesRef.current.find((i) => i.id === id)!.x);
      const snappedY = snapToGrid(type === 'sticky'
        ? stickiesRef.current.find((s) => s.id === id)!.y
        : imagesRef.current.find((i) => i.id === id)!.y);

      if (type === 'sticky') {
        setStickies((prev) =>
          prev.map((s) =>
            s.id === id ? { ...s, x: snappedX, y: snappedY } : s
          )
        );
        recorder.record('moveSticky', { id, x: snappedX, y: snappedY });
        wsService.sendOperation('moveSticky', { id, x: snappedX, y: snappedY });
      } else {
        setImages((prev) =>
          prev.map((i) =>
            i.id === id ? { ...i, x: snappedX, y: snappedY } : i
          )
        );
        recorder.record('moveImage', { id, x: snappedX, y: snappedY });
        wsService.sendOperation('moveImage', { id, x: snappedX, y: snappedY });
      }
      dragRef.current = null;
    }
  };

  const addSticky = () => {
    const canvas = canvasRef.current!;
    const note: StickyNote = {
      id: uuid(),
      x: snapToGrid(canvas.width / 2 - STICKY_WIDTH / 2),
      y: snapToGrid(canvas.height / 2 - STICKY_HEIGHT / 2),
      text: '',
      color: '#FEF08A',
    };
    saveSnapshot();
    const newStickies = [...stickiesRef.current, note];
    setStickies(newStickies);
    recorder.record('addSticky', { note });
    wsService.sendOperation('addSticky', { note });
  };

  const addImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > 200 || h > 200) {
          const scale = Math.min(200 / w, 200 / h);
          w = Math.round(w * scale);
          h = Math.round(h * scale);
        }
        const canvas = canvasRef.current!;
        const boardImg: BoardImage = {
          id: uuid(),
          x: snapToGrid(canvas.width / 2 - w / 2),
          y: snapToGrid(canvas.height / 2 - h / 2),
          width: w,
          height: h,
          src,
          originalName: file.name,
        };
        saveSnapshot();
        const newImages = [...imagesRef.current, boardImg];
        setImages(newImages);
        recorder.record('addImage', { image: boardImg });
        wsService.sendOperation('addImage', { image: boardImg });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleStickyTextChange = (id: string, text: string) => {
    if (text.length > 256) text = text.slice(0, 256);
    setStickies((prev) =>
      prev.map((s) => (s.id === id ? { ...s, text } : s))
    );
    recorder.record('updateStickyText', { id, text });
    wsService.sendOperation('updateStickyText', { id, text });
  };

  useEffect(() => {
    const unsub = wsService.onMessage((msg) => {
      if (msg.type === 'operation' && msg.params) {
        const { operation, params } = msg as { operation: string; params: Record<string, unknown> };
        switch (operation) {
          case 'draw':
          case 'erase': {
            const stroke = params.stroke as Stroke;
            if (stroke) setStrokes((prev) => [...prev, stroke]);
            break;
          }
          case 'addSticky': {
            const note = params.note as StickyNote;
            if (note) setStickies((prev) => [...prev, note]);
            break;
          }
          case 'moveSticky': {
            const { id, x, y } = params as { id: string; x: number; y: number };
            setStickies((prev) => prev.map((s) => (s.id === id ? { ...s, x, y } : s)));
            break;
          }
          case 'updateStickyText': {
            const { id, text } = params as { id: string; text: string };
            setStickies((prev) => prev.map((s) => (s.id === id ? { ...s, text } : s)));
            break;
          }
          case 'deleteSticky': {
            const { id } = params as { id: string };
            setStickies((prev) => prev.filter((s) => s.id !== id));
            break;
          }
          case 'addImage': {
            const img = params.image as BoardImage;
            if (img) setImages((prev) => [...prev, img]);
            break;
          }
          case 'moveImage': {
            const { id, x, y } = params as { id: string; x: number; y: number };
            setImages((prev) => prev.map((i) => (i.id === id ? { ...i, x, y } : i)));
            break;
          }
          case 'deleteImage': {
            const { id } = params as { id: string };
            setImages((prev) => prev.filter((i) => i.id !== id));
            break;
          }
        }
      }
    });
    return unsub;
  }, []);

  return {
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    addSticky,
    addImage,
    render: (
      <div ref={containerRef} className="whiteboard-container">
        <canvas
          ref={canvasRef}
          className="whiteboard-canvas"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        <div className="whiteboard-overlays">
          {stickies.map((note) => (
            <div
              key={note.id}
              className={`sticky-note ${selectedRef.current?.id === note.id ? 'selected' : ''}`}
              style={{
                left: note.x,
                top: note.y,
                width: STICKY_WIDTH,
                minHeight: STICKY_HEIGHT,
                opacity: dragRef.current?.id === note.id ? 0.7 : 1,
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                selectedRef.current = { type: 'sticky', id: note.id };
                dragRef.current = {
                  type: 'sticky',
                  id: note.id,
                  offsetX: e.clientX - containerRef.current!.getBoundingClientRect().left - note.x,
                  offsetY: e.clientY - containerRef.current!.getBoundingClientRect().top - note.y,
                };
              }}
            >
              <textarea
                value={note.text}
                onChange={(e) => handleStickyTextChange(note.id, e.target.value)}
                placeholder="输入便签内容..."
                maxLength={256}
                className="sticky-textarea"
              />
            </div>
          ))}
          {images.map((img) => (
            <div
              key={img.id}
              className={`board-image ${selectedRef.current?.id === img.id ? 'selected' : ''}`}
              style={{
                left: img.x,
                top: img.y,
                width: img.width,
                height: img.height,
                opacity: dragRef.current?.id === img.id ? 0.7 : 1,
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                selectedRef.current = { type: 'image', id: img.id };
                dragRef.current = {
                  type: 'image',
                  id: img.id,
                  offsetX: e.clientX - containerRef.current!.getBoundingClientRect().left - img.x,
                  offsetY: e.clientY - containerRef.current!.getBoundingClientRect().top - img.y,
                };
              }}
            >
              <img src={img.src} alt={img.originalName} draggable={false} />
            </div>
          ))}
        </div>
      </div>
    ),
  };
};

export default Whiteboard;
