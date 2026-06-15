import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ToolType, Point, Shape, PenPath, Rectangle, Circle, StickyNote as StickyNoteType, User } from '../types';
import StickyNote from './StickyNote';

interface CanvasProps {
  tool: ToolType;
  penColor: string;
  penThickness: number;
  currentUser: User;
  shapes: Shape[];
  onShapeAdd: (shape: Shape) => void;
  onShapeUpdate: (shape: Shape) => void;
  onShapeDelete: (shapeId: string, shape: Shape) => void;
  scale: number;
  offsetX: number;
  offsetY: number;
  onScaleChange: (scale: number, offsetX: number, offsetY: number) => void;
  onOffsetChange: (offsetX: number, offsetY: number) => void;
  undoAnimatingIds: Set<string>;
}

interface RemoteCursor {
  userId: string;
  user: User;
  position: Point;
  lastUpdate: number;
}

const Canvas: React.FC<CanvasProps> = ({
  tool,
  penColor,
  penThickness,
  currentUser,
  shapes,
  onShapeAdd,
  onShapeUpdate,
  onShapeDelete,
  scale,
  offsetX,
  offsetY,
  onScaleChange,
  onOffsetChange,
  undoAnimatingIds,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);
  const [spacePressed, setSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const [remoteCursors] = useState<Map<string, RemoteCursor>>(new Map());
  const [localCursor, setLocalCursor] = useState<Point>({ x: 0, y: 0 });
  const animatingShapesRef = useRef<Map<string, { shape: Shape; startTime: number; duration: number; type: 'draw' | 'undo' }>>(new Map());
  const rafRef = useRef<number | null>(null);
  const newShapeIdsRef = useRef<Set<string>>(new Set());

  const screenToWorld = useCallback((screenX: number, screenY: number): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (screenX - rect.left - offsetX) / scale,
      y: (screenY - rect.top - offsetY) / scale,
    };
  }, [offsetX, offsetY, scale]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    canvas.width = container.clientWidth * window.devicePixelRatio;
    canvas.height = container.clientHeight * window.devicePixelRatio;
    canvas.style.width = `${container.clientWidth}px`;
    canvas.style.height = `${container.clientHeight}px`;
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    ctx.fillStyle = '#F0F0F0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gridSize = 5 * scale;
    if (gridSize < 3) return;

    ctx.strokeStyle = '#D0D0D0';
    ctx.lineWidth = 1 * window.devicePixelRatio;
    ctx.setLineDash([2 * window.devicePixelRatio, 2 * window.devicePixelRatio]);

    const startX = (offsetX % gridSize) * window.devicePixelRatio;
    const startY = (offsetY % gridSize) * window.devicePixelRatio;

    ctx.beginPath();
    for (let x = startX; x < canvas.width; x += gridSize * window.devicePixelRatio) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
    }
    for (let y = startY; y < canvas.height; y += gridSize * window.devicePixelRatio) {
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }, [scale, offsetX, offsetY]);

  const drawShape = useCallback((ctx: CanvasRenderingContext2D, shape: Shape, progress: number = 1, isUndo: boolean = false) => {
    ctx.save();
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    if (isUndo) {
      ctx.globalAlpha = 1 - progress;
    }

    switch (shape.type) {
      case 'pen': {
        const points = shape.points;
        const endIndex = Math.ceil(points.length * progress);
        if (endIndex < 2) break;
        
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = shape.thickness * scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        const first = points[0];
        ctx.moveTo(first.x * scale + offsetX, first.y * scale + offsetY);
        for (let i = 1; i < endIndex; i++) {
          const p = points[i];
          ctx.lineTo(p.x * scale + offsetX, p.y * scale + offsetY);
        }
        ctx.stroke();
        break;
      }
      case 'rectangle': {
        const { startPoint, endPoint } = shape;
        const currentEndX = startPoint.x + (endPoint.x - startPoint.x) * progress;
        const currentEndY = startPoint.y + (endPoint.y - startPoint.y) * progress;
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = shape.thickness * scale;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeRect(
          startPoint.x * scale + offsetX,
          startPoint.y * scale + offsetY,
          (currentEndX - startPoint.x) * scale,
          (currentEndY - startPoint.y) * scale
        );
        break;
      }
      case 'circle': {
        const { center, radius } = shape;
        const currentRadius = radius * progress;
        ctx.strokeStyle = shape.color;
        ctx.lineWidth = shape.thickness * scale;
        ctx.beginPath();
        ctx.arc(
          center.x * scale + offsetX,
          center.y * scale + offsetY,
          currentRadius * scale,
          0,
          Math.PI * 2
        );
        ctx.stroke();
        break;
      }
    }
    ctx.restore();
  }, [scale, offsetX, offsetY]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawGrid(ctx);

    const now = performance.now();
    const shapesToRemove: string[] = [];

    const stickyNoteShapes: StickyNoteType[] = [];
    const drawableShapes: Exclude<Shape, StickyNoteType>[] = [];

    for (const shape of shapes) {
      if (shape.type === 'sticky') {
        stickyNoteShapes.push(shape);
      } else {
        drawableShapes.push(shape);
      }
    }

    for (const shape of drawableShapes) {
      const animInfo = animatingShapesRef.current.get(shape.id);
      if (animInfo) {
        const elapsed = now - animInfo.startTime;
        const progress = Math.min(1, elapsed / animInfo.duration);
        drawShape(ctx, animInfo.shape, progress, animInfo.type === 'undo');
        if (progress >= 1) {
          shapesToRemove.push(shape.id);
          if (animInfo.type === 'undo') {
            // undo animation complete - shape already removed from state
          }
        }
      } else {
        const isUndoAnimating = undoAnimatingIds.has(shape.id);
        if (!isUndoAnimating) {
          drawShape(ctx, shape, 1, false);
        }
      }
    }

    if (currentShape && currentShape.type !== 'sticky') {
      drawShape(ctx, currentShape, 1, false);
    }

    for (const id of shapesToRemove) {
      animatingShapesRef.current.delete(id);
    }

    rafRef.current = requestAnimationFrame(render);
  }, [shapes, currentShape, drawGrid, drawShape, undoAnimatingIds]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(render);
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [render]);

  useEffect(() => {
    for (const shape of shapes) {
      if (newShapeIdsRef.current.has(shape.id) && shape.type !== 'sticky') {
        const points = shape.type === 'pen' ? shape.points.length : 1;
        const duration = Math.max(100, points * 100);
        animatingShapesRef.current.set(shape.id, {
          shape,
          startTime: performance.now(),
          duration,
          type: 'draw',
        });
        newShapeIdsRef.current.delete(shape.id);
      }
    }
  }, [shapes]);

  const addShapeWithAnimation = (shape: Shape) => {
    if (shape.type !== 'sticky') {
      const points = shape.type === 'pen' ? shape.points.length : 1;
      const duration = Math.max(100, points * 100);
      animatingShapesRef.current.set(shape.id, {
        shape,
        startTime: performance.now(),
        duration,
        type: 'draw',
      });
    }
    onShapeAdd(shape);
  };

  const startDrawing = (e: React.MouseEvent) => {
    if (tool === 'none') return;
    const worldPos = screenToWorld(e.clientX, e.clientY);

    if (tool === 'sticky') {
      const newNote: StickyNoteType = {
        id: `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'sticky',
        userId: currentUser.id,
        color: '#FFEB9C',
        position: worldPos,
        text: '',
        width: 200,
        height: 150,
      };
      addShapeWithAnimation(newNote);
      return;
    }

    setIsDrawing(true);

    if (tool === 'pen') {
      const newPath: PenPath = {
        id: `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'pen',
        userId: currentUser.id,
        color: penColor,
        points: [worldPos],
        thickness: penThickness,
      };
      setCurrentShape(newPath);
    } else if (tool === 'rectangle') {
      const newRect: Rectangle = {
        id: `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'rectangle',
        userId: currentUser.id,
        color: penColor,
        startPoint: worldPos,
        endPoint: worldPos,
        thickness: penThickness,
      };
      setCurrentShape(newRect);
    } else if (tool === 'circle') {
      const newCircle: Circle = {
        id: `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'circle',
        userId: currentUser.id,
        color: penColor,
        center: worldPos,
        radius: 0,
        thickness: penThickness,
      };
      setCurrentShape(newCircle);
    }
  };

  const continueDrawing = (e: React.MouseEvent) => {
    const worldPos = screenToWorld(e.clientX, e.clientY);
    setLocalCursor({ x: e.clientX, y: e.clientY });

    if (!isDrawing || !currentShape) return;

    if (currentShape.type === 'pen') {
      const lastPoint = currentShape.points[currentShape.points.length - 1];
      const dist = Math.hypot(worldPos.x - lastPoint.x, worldPos.y - lastPoint.y);
      if (dist > 0.5) {
        setCurrentShape({
          ...currentShape,
          points: [...currentShape.points, worldPos],
        });
      }
    } else if (currentShape.type === 'rectangle') {
      setCurrentShape({
        ...currentShape,
        endPoint: worldPos,
      });
    } else if (currentShape.type === 'circle') {
      const dx = worldPos.x - currentShape.center.x;
      const dy = worldPos.y - currentShape.center.y;
      const radius = Math.hypot(dx, dy);
      setCurrentShape({
        ...currentShape,
        radius,
      });
    }
  };

  const finishDrawing = () => {
    if (!isDrawing || !currentShape) {
      setIsDrawing(false);
      return;
    }

    let finalShape = currentShape;
    if (finalShape.type === 'pen' && finalShape.points.length < 2) {
      const p = finalShape.points[0];
      finalShape = {
        ...finalShape,
        points: [p, { x: p.x + 0.1, y: p.y + 0.1 }],
      };
    }

    newShapeIdsRef.current.add(finalShape.id);
    addShapeWithAnimation(finalShape);
    setCurrentShape(null);
    setIsDrawing(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(true);
        if (containerRef.current) {
          containerRef.current.style.cursor = 'grab';
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
        setIsPanning(false);
        panStartRef.current = null;
        if (containerRef.current && !isPanning) {
          containerRef.current.style.cursor = getCursorForTool(tool);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [tool, isPanning]);

  const getCursorForTool = (t: ToolType): string => {
    if (spacePressed) return 'grab';
    switch (t) {
      case 'pen': return 'crosshair';
      case 'rectangle': return 'crosshair';
      case 'circle': return 'crosshair';
      case 'sticky': return 'copy';
      default: return 'default';
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (spacePressed) {
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        offsetX,
        offsetY,
      };
      if (containerRef.current) {
        containerRef.current.style.cursor = 'grabbing';
      }
      return;
    }
    startDrawing(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cursorWorldX = e.clientX - rect.left;
    const cursorWorldY = e.clientY - rect.top;

    if (isPanning && panStartRef.current) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      onOffsetChange(
        panStartRef.current.offsetX + dx,
        panStartRef.current.offsetY + dy
      );
    } else {
      continueDrawing(e);
    }

    setLocalCursor({ x: cursorWorldX, y: cursorWorldY });
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      panStartRef.current = null;
      if (containerRef.current) {
        containerRef.current.style.cursor = getCursorForTool(tool);
      }
      return;
    }
    finishDrawing();
  };

  const handleMouseLeave = () => {
    if (isPanning) {
      setIsPanning(false);
      panStartRef.current = null;
    }
    finishDrawing();
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = -e.deltaY * 0.001;
    const newScale = Math.max(0.3, Math.min(5, scale * (1 + delta)));
    const scaleRatio = newScale / scale;

    const newOffsetX = mouseX - (mouseX - offsetX) * scaleRatio;
    const newOffsetY = mouseY - (mouseY - offsetY) * scaleRatio;

    onScaleChange(newScale, newOffsetX, newOffsetY);
  };

  const stickyNotes = shapes.filter(s => s.type === 'sticky') as StickyNoteType[];

  return (
    <div 
      ref={containerRef}
      style={{ 
        width: '100%', 
        height: '100%', 
        position: 'relative',
        cursor: getCursorForTool(tool),
        overflow: 'hidden',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />

      {stickyNotes.filter(note => !undoAnimatingIds.has(note.id)).map((note) => (
        <StickyNote
          key={note.id}
          note={note}
          scale={scale}
          offsetX={offsetX}
          offsetY={offsetY}
          onUpdate={onShapeUpdate}
          onDelete={(id) => onShapeDelete(id, note)}
          isOwn={note.userId === currentUser.id}
        />
      ))}

      {tool !== 'none' && tool !== 'sticky' && (
        <div
          style={{
            position: 'absolute',
            left: localCursor.x,
            top: localCursor.y,
            pointerEvents: 'none',
            zIndex: 200,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            border: `2px solid ${currentUser.color}`,
            backgroundColor: 'rgba(255,255,255,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '9px',
            fontWeight: 'bold',
            color: currentUser.color,
          }}>
            {currentUser.avatarInitials}
          </div>
        </div>
      )}

      {Array.from(remoteCursors.values()).map(({ user, position }) => (
        <div
          key={user.id}
          style={{
            position: 'absolute',
            left: position.x,
            top: position.y,
            pointerEvents: 'none',
            zIndex: 200,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            border: `2px solid ${user.color}`,
            backgroundColor: 'rgba(255,255,255,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '9px',
            fontWeight: 'bold',
            color: user.color,
          }}>
            {user.avatarInitials}
          </div>
          <div style={{
            position: 'absolute',
            left: '12px',
            top: '-2px',
            backgroundColor: user.color,
            color: 'white',
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '4px',
            whiteSpace: 'nowrap',
          }}>
            {user.nickname}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Canvas;
