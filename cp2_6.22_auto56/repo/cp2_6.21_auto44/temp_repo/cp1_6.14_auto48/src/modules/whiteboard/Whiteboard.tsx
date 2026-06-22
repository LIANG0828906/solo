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
  SPRING_STIFFNESS,
  SPRING_DAMPING,
  ANIM_DURATION_DELETE,
  GridSnapResult,
  SpringAnimState,
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

function calcGridSnapEuclidean(x: number, y: number): GridSnapResult {
  const baseX = Math.round(x / GRID_SIZE) * GRID_SIZE;
  const baseY = Math.round(y / GRID_SIZE) * GRID_SIZE;
  const dx = baseX - x;
  const dy = baseY - y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance <= SNAP_DISTANCE) {
    return {
      snappedX: baseX,
      snappedY: baseY,
      offsetX: dx,
      offsetY: dy,
      distance,
      snapped: true,
    };
  }
  return {
    snappedX: x,
    snappedY: y,
    offsetX: 0,
    offsetY: 0,
    distance,
    snapped: false,
  };
}

function createPoint(x: number, y: number, pressure: number = 0.5): Point {
  return { x, y, pressure };
}

function drawSmoothStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke
): void {
  if (stroke.points.length < 2) return;

  const pts = stroke.points;
  const color = stroke.tool === 'eraser' ? '#FFFFFF' : stroke.color;
  const baseWidth = stroke.tool === 'eraser' ? stroke.width * 3 : stroke.width;

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = baseWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (stroke.tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
  }

  if (pts.length === 2) {
    const p0 = pts[0];
    const p1 = pts[1];
    const cx = (p0.x + p1.x) / 2;
    const cy = (p0.y + p1.y) / 2;
    ctx.moveTo(p0.x, p0.y);
    ctx.quadraticCurveTo(p0.x, p0.y, cx, cy);
    ctx.quadraticCurveTo(p1.x, p1.y, p1.x, p1.y);
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    return;
  }

  if (pts.length === 3) {
    const p0 = pts[0];
    const p1 = pts[1];
    const p2 = pts[2];
    const c1x = p0.x + (p1.x - p0.x) * 0.5;
    const c1y = p0.y + (p1.y - p0.y) * 0.5;
    const c2x = p1.x + (p2.x - p1.x) * 0.5;
    const c2y = p1.y + (p2.y - p1.y) * 0.5;
    ctx.moveTo(p0.x, p0.y);
    ctx.quadraticCurveTo(p0.x, p0.y, c1x, c1y);
    ctx.quadraticCurveTo(p1.x, p1.y, c2x, c2y);
    ctx.quadraticCurveTo(p2.x, p2.y, p2.x, p2.y);
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    return;
  }

  ctx.moveTo(pts[0].x, pts[0].y);

  const cp1x = pts[0].x + (pts[1].x - pts[0].x) / 3;
  const cp1y = pts[0].y + (pts[1].y - pts[0].y) / 3;
  ctx.quadraticCurveTo(cp1x, cp1y, pts[1].x, pts[1].y);

  for (let i = 1; i < pts.length - 2; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const next = pts[i + 1];
    const next2 = pts[i + 2];

    const v1x = curr.x - prev.x;
    const v1y = curr.y - prev.y;
    const v2x = next.x - curr.x;
    const v2y = next.y - curr.y;
    const v3x = next2.x - next.x;
    const v3y = next2.y - next.y;

    const c1x = curr.x + (v2x + v1x * 0.15) / 3;
    const c1y = curr.y + (v2y + v1y * 0.15) / 3;
    const c2x = next.x - (v3x + v2x * 0.15) / 3;
    const c2y = next.y - (v3y + v2y * 0.15) / 3;
    const midX = (curr.x + next.x) / 2;
    const midY = (curr.y + next.y) / 2;

    ctx.bezierCurveTo(c1x, c1y, c2x, c2y, midX, midY);
  }

  const last = pts[pts.length - 1];
  const lastPrev = pts[pts.length - 2];
  const cpLx = lastPrev.x + (last.x - lastPrev.x) * 2 / 3;
  const cpLy = lastPrev.y + (last.y - lastPrev.y) * 2 / 3;
  ctx.quadraticCurveTo(cpLx, cpLy, last.x, last.y);

  ctx.stroke();
  ctx.globalCompositeOperation = 'source-over';
}

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
  const [, setAnimTick] = useState(0);

  const drawingRef = useRef(false);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const dragRef = useRef<{
    type: 'sticky' | 'image';
    id: string;
    offsetX: number;
    offsetY: number;
    fromX: number;
    fromY: number;
  } | null>(null);
  const selectedRef = useRef<{ type: 'sticky' | 'image'; id: string } | null>(null);
  const strokesRef = useRef(strokes);
  const stickiesRef = useRef(stickies);
  const imagesRef = useRef(images);
  const animStatesRef = useRef(new Map<string, SpringAnimState>());
  const rafAnimRef = useRef<number>(0);

  useEffect(() => { strokesRef.current = strokes; }, [strokes]);
  useEffect(() => { stickiesRef.current = stickies; }, [stickies]);
  useEffect(() => { imagesRef.current = images; }, [images]);

  useEffect(() => {
    setStrokes(boardState.strokes);
    setStickies(boardState.stickies);
    setImages(boardState.images);
  }, [boardState]);

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
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(canvas.width, y + 0.5);
      ctx.stroke();
    }

    const allStrokes = currentStrokeRef.current
      ? [...strokesRef.current, currentStrokeRef.current]
      : strokesRef.current;

    allStrokes.forEach((stroke) => drawSmoothStroke(ctx, stroke));
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

  const runAnimationLoop = useCallback(() => {
    const now = performance.now();
    const dt = 1 / 60;
    let needsUpdate = false;

    animStatesRef.current.forEach((state, id) => {
      if (state.type === 'snap') {
        const dx = state.toX - state.fromX;
        const dy = state.toY - state.fromY;
        const k = SPRING_STIFFNESS * 0.00005;
        const d = SPRING_DAMPING * 0.001;
        state.velocity = state.velocity + k * (state.progress - 1) * dt * 1000;
        state.velocity *= (1 - d);
        state.progress += state.velocity;

        if (Math.abs(state.progress - 1) < 0.002 && Math.abs(state.velocity) < 0.002) {
          state.progress = 1;
          state.velocity = 0;
          animStatesRef.current.delete(id);
          if (state.fromX !== state.toX || state.fromY !== state.toY) {
            const targetType = id.startsWith('sticky-') ? 'sticky' : 'image';
            const targetId = id.replace(/^(sticky|image)-/, '');
            if (targetType === 'sticky') {
              setStickies((prev) => prev.map((s) => (s.id === targetId ? { ...s, x: state.toX, y: state.toY } : s)));
            } else {
              setImages((prev) => prev.map((i) => (i.id === targetId ? { ...i, x: state.toX, y: state.toY } : i)));
            }
          }
        } else {
          needsUpdate = true;
          if (state.fromX !== state.toX || state.fromY !== state.toY) {
            const newX = state.fromX + dx * state.progress;
            const newY = state.fromY + dy * state.progress;
            const targetType = id.startsWith('sticky-') ? 'sticky' : 'image';
            const targetId = id.replace(/^(sticky|image)-/, '');
            if (targetType === 'sticky') {
              const idx = stickiesRef.current.findIndex((s) => s.id === targetId);
              if (idx >= 0) {
                stickiesRef.current[idx] = { ...stickiesRef.current[idx], x: newX, y: newY };
                setStickies([...stickiesRef.current]);
              }
            } else {
              const idx = imagesRef.current.findIndex((i) => i.id === targetId);
              if (idx >= 0) {
                imagesRef.current[idx] = { ...imagesRef.current[idx], x: newX, y: newY };
                setImages([...imagesRef.current]);
              }
            }
          }
        }
      } else if (state.type === 'delete') {
        const elapsed = now - state.startTimestamp;
        state.progress = Math.min(1, elapsed / ANIM_DURATION_DELETE);
        if (state.progress >= 1) {
          animStatesRef.current.delete(id);
        } else {
          needsUpdate = true;
        }
      }
    });

    if (needsUpdate) {
      setAnimTick((t) => (t + 1) % 1000000);
      rafAnimRef.current = requestAnimationFrame(runAnimationLoop);
    } else {
      rafAnimRef.current = 0;
    }
  }, []);

  const startAnimLoopIfNeeded = useCallback(() => {
    if (rafAnimRef.current === 0 && animStatesRef.current.size > 0) {
      rafAnimRef.current = requestAnimationFrame(runAnimationLoop);
    }
  }, [runAnimationLoop]);

  useEffect(() => {
    return () => {
      if (rafAnimRef.current) cancelAnimationFrame(rafAnimRef.current);
    };
  }, []);

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
        const animId = `${sel.type}-${sel.id}`;
        const cur = sel.type === 'sticky'
          ? stickiesRef.current.find((s) => s.id === sel.id)
          : imagesRef.current.find((i) => i.id === sel.id);
        if (cur) {
          animStatesRef.current.set(animId, {
            id: animId,
            type: 'delete',
            progress: 0,
            fromX: cur.x,
            fromY: cur.y,
            toX: cur.x,
            toY: cur.y,
            scaleFrom: 1,
            scaleTo: 0,
            opacityFrom: 1,
            opacityTo: 0,
            velocity: 0,
            startTimestamp: performance.now(),
          });
          startAnimLoopIfNeeded();
        }
        setTimeout(() => {
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
          animStatesRef.current.delete(animId);
          setAnimTick((t) => (t + 1) % 1000000);
        }, ANIM_DURATION_DELETE + 10);
        selectedRef.current = null;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, saveSnapshot, startAnimLoopIfNeeded]);

  const getCanvasPoint = (e: React.MouseEvent, pressure: number = 0.5): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const nativePressure = (e as any).nativeEvent?.pressure;
    const p = typeof nativePressure === 'number' && nativePressure > 0 ? nativePressure : pressure;
    return createPoint(e.clientX - rect.left, e.clientY - rect.top, p);
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
      const pt = getCanvasPoint(e);
      const lastPt = currentStrokeRef.current.points[currentStrokeRef.current.points.length - 1];
      const dx = pt.x - lastPt.x;
      const dy = pt.y - lastPt.y;
      if (dx * dx + dy * dy > 0.25) {
        currentStrokeRef.current.points.push(pt);
        redraw();
      }
    }

    if (dragRef.current) {
      const pt = getCanvasPoint(e);
      const rawX = pt.x - dragRef.current.offsetX;
      const rawY = pt.y - dragRef.current.offsetY;
      if (dragRef.current.type === 'sticky') {
        stickiesRef.current = stickiesRef.current.map((s) =>
          s.id === dragRef.current!.id ? { ...s, x: rawX, y: rawY } : s
        );
        setStickies([...stickiesRef.current]);
      } else {
        imagesRef.current = imagesRef.current.map((i) =>
          i.id === dragRef.current!.id ? { ...i, x: rawX, y: rawY } : i
        );
        setImages([...imagesRef.current]);
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
      const { type, id, fromX, fromY } = dragRef.current;
      const curPos = type === 'sticky'
        ? stickiesRef.current.find((s) => s.id === id)!
        : imagesRef.current.find((i) => i.id === id)!;

      const snap = calcGridSnapEuclidean(curPos.x, curPos.y);
      const finalX = snap.snapped ? snap.snappedX : curPos.x;
      const finalY = snap.snapped ? snap.snappedY : curPos.y;

      if (finalX !== fromX || finalY !== fromY || snap.snapped) {
        const animId = `${type}-${id}`;
        animStatesRef.current.set(animId, {
          id: animId,
          type: 'snap',
          progress: 0,
          fromX: curPos.x,
          fromY: curPos.y,
          toX: finalX,
          toY: finalY,
          scaleFrom: 1,
          scaleTo: 1,
          opacityFrom: 1,
          opacityTo: 1,
          velocity: 0,
          startTimestamp: performance.now(),
        });
        startAnimLoopIfNeeded();

        const opType = type === 'sticky' ? 'moveSticky' : 'moveImage';
        recorder.record(opType, { id, x: finalX, y: finalY });
        wsService.sendOperation(opType, { id, x: finalX, y: finalY });
      }
      dragRef.current = null;
    }
  };

  const addSticky = () => {
    const canvas = canvasRef.current!;
    const rawX = canvas.width / 2 - STICKY_WIDTH / 2;
    const rawY = canvas.height / 2 - STICKY_HEIGHT / 2;
    const snap = calcGridSnapEuclidean(rawX, rawY);
    const note: StickyNote = {
      id: uuid(),
      x: snap.snapped ? snap.snappedX : rawX,
      y: snap.snapped ? snap.snappedY : rawY,
      width: STICKY_WIDTH,
      height: STICKY_HEIGHT,
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
        const rawX = canvas.width / 2 - w / 2;
        const rawY = canvas.height / 2 - h / 2;
        const snap = calcGridSnapEuclidean(rawX, rawY);
        const boardImg: BoardImage = {
          id: uuid(),
          x: snap.snapped ? snap.snappedX : rawX,
          y: snap.snapped ? snap.snappedY : rawY,
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

  const getAnimStyle = (type: 'sticky' | 'image', id: string): React.CSSProperties => {
    const animId = `${type}-${id}`;
    const state = animStatesRef.current.get(animId);
    if (!state) return {};
    if (state.type === 'delete') {
      const scale = 1 - state.progress;
      return {
        transform: `scale(${Math.max(0, scale)})`,
        opacity: Math.max(0, 1 - state.progress),
        transformOrigin: 'center center',
      };
    }
    return {};
  };

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
          {stickies.map((note) => {
            const animStyle = getAnimStyle('sticky', note.id);
            const isDragging = dragRef.current?.id === note.id;
            const isSelected = selectedRef.current?.id === note.id;
            return (
              <div
                key={note.id}
                className={`sticky-note ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
                style={{
                  left: note.x,
                  top: note.y,
                  width: note.width,
                  minHeight: note.height,
                  ...animStyle,
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  selectedRef.current = { type: 'sticky', id: note.id };
                  dragRef.current = {
                    type: 'sticky',
                    id: note.id,
                    offsetX: e.clientX - containerRef.current!.getBoundingClientRect().left - note.x,
                    offsetY: e.clientY - containerRef.current!.getBoundingClientRect().top - note.y,
                    fromX: note.x,
                    fromY: note.y,
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
            );
          })}
          {images.map((img) => {
            const animStyle = getAnimStyle('image', img.id);
            const isDragging = dragRef.current?.id === img.id;
            const isSelected = selectedRef.current?.id === img.id;
            return (
              <div
                key={img.id}
                className={`board-image ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
                style={{
                  left: img.x,
                  top: img.y,
                  width: img.width,
                  height: img.height,
                  ...animStyle,
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  selectedRef.current = { type: 'image', id: img.id };
                  dragRef.current = {
                    type: 'image',
                    id: img.id,
                    offsetX: e.clientX - containerRef.current!.getBoundingClientRect().left - img.x,
                    offsetY: e.clientY - containerRef.current!.getBoundingClientRect().top - img.y,
                    fromX: img.x,
                    fromY: img.y,
                  };
                }}
              >
                <img src={img.src} alt={img.originalName} draggable={false} />
              </div>
            );
          })}
        </div>
      </div>
    ),
  };
};

export default Whiteboard;
