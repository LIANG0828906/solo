import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { StickyNote, Drawing, Point, Tool } from '../types';
import {
  renderStickyNote,
  isPointInNote,
  isPointInVoteButton,
  NOTE_WIDTH,
  NOTE_HEIGHT,
} from './StickyNote';

export interface CanvasBoardProps {
  notes: StickyNote[];
  drawings: Drawing[];
  tool: Tool;
  noteColor: string;
  sidebarColor: string;
  drawColor: string;
  lineWidth: number;
  isVotingMode: boolean;
  clientId: string | null;
  onAddNote: (x: number, y: number) => void;
  onUpdateNote: (note: Partial<StickyNote> & { id: string }) => void;
  onDeleteNote: (id: string) => void;
  onVoteNote: (noteId: string, voterId: string) => void;
  onAddDrawing: (points: Point[], color: string, lineWidth: number) => void;
  getCanvasState: () => { offsetX: number; offsetY: number; scale: number };
  setCanvasState: (state: { offsetX: number; offsetY: number; scale: number }) => void;
  minimapRef: React.RefObject<HTMLCanvasElement>;
}

export interface CanvasBoardHandle {
  handleNoteAdd: (noteId: string) => void;
  exportToPNG: () => void;
  handleMinimapClick: (e: React.MouseEvent<HTMLCanvasElement>) => void;
}

interface NoteAnimation {
  id: string;
  type: 'appear' | 'delete' | 'move';
  progress: number;
  startX?: number;
  startY?: number;
  targetX?: number;
  targetY?: number;
}

const CanvasBoardInner = (
  props: CanvasBoardProps,
  ref: React.ForwardedRef<CanvasBoardHandle>
) => {
  const {
    notes,
    drawings,
    tool,
    noteColor: _noteColor,
    sidebarColor: _sidebarColor,
    drawColor,
    lineWidth,
    isVotingMode,
    clientId,
    onAddNote,
    onUpdateNote,
    onDeleteNote,
    onVoteNote,
    onAddDrawing,
    getCanvasState,
    setCanvasState,
    minimapRef,
  } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    noteId: string;
  } | null>(null);
  const [animations, setAnimations] = useState<Map<string, NoteAnimation>>(new Map());
  const [exportProgress, setExportProgress] = useState(0);
  const [showExportModal, setShowExportModal] = useState(false);

  const dragStateRef = useRef({
    isDraggingCanvas: false,
    isDraggingNote: false,
    isDrawing: false,
    dragNoteId: null as string | null,
    startX: 0,
    startY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
    noteStartX: 0,
    noteStartY: 0,
    currentPoints: [] as Point[],
    lastMoveTime: 0,
  });

  const canvasStateRef = useRef({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    targetScale: 1,
    targetOffsetX: 0,
    targetOffsetY: 0,
    lastFrameTime: 0,
  });

  useEffect(() => {
    canvasStateRef.current.offsetX = getCanvasState().offsetX;
    canvasStateRef.current.offsetY = getCanvasState().offsetY;
    canvasStateRef.current.scale = getCanvasState().scale;
    canvasStateRef.current.targetScale = getCanvasState().scale;
    canvasStateRef.current.targetOffsetX = getCanvasState().offsetX;
    canvasStateRef.current.targetOffsetY = getCanvasState().offsetY;
  }, [getCanvasState]);

  const getCanvasPoint = useCallback((clientX: number, clientY: number): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const { offsetX, offsetY, scale } = canvasStateRef.current;

    return {
      x: (clientX - rect.left - offsetX) / scale,
      y: (clientY - rect.top - offsetY) / scale,
    };
  }, []);

  const findNoteAtPoint = useCallback(
    (point: Point): StickyNote | null => {
      for (let i = notes.length - 1; i >= 0; i--) {
        if (isPointInNote(point, notes[i])) {
          return notes[i];
        }
      }
      return null;
    },
    [notes]
  );

  const smoothDrawingPoints = (points: Point[]): Point[] => {
    if (points.length < 3) return points;

    const result: Point[] = [points[0]];

    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      result.push({ x: points[i].x, y: points[i].y });
      result.push({ x: xc, y: yc });
    }

    result.push(points[points.length - 1]);
    return result;
  };

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { offsetX, offsetY, scale } = canvasStateRef.current;
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, width, height);

    const gridSize = 20 * scale;
    const adjustedGridSize = gridSize < 10 ? gridSize * 2 : gridSize;
    const startX = offsetX % adjustedGridSize;
    const startY = offsetY % adjustedGridSize;

    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let x = startX; x < width; x += adjustedGridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }

    for (let y = startY; y < height; y += adjustedGridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }

    ctx.stroke();

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    drawings.forEach((drawing) => {
      if (drawing.points.length < 2) return;

      ctx.beginPath();
      ctx.strokeStyle = drawing.color;
      ctx.lineWidth = drawing.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const smoothedPoints = smoothDrawingPoints(drawing.points);
      ctx.moveTo(smoothedPoints[0].x, smoothedPoints[0].y);

      for (let i = 1; i < smoothedPoints.length - 1; i++) {
        const xc = (smoothedPoints[i].x + smoothedPoints[i + 1].x) / 2;
        const yc = (smoothedPoints[i].y + smoothedPoints[i + 1].y) / 2;
        ctx.quadraticCurveTo(smoothedPoints[i].x, smoothedPoints[i].y, xc, yc);
      }

      ctx.lineTo(
        smoothedPoints[smoothedPoints.length - 1].x,
        smoothedPoints[smoothedPoints.length - 1].y
      );
      ctx.stroke();
    });

    const currentDrawing = dragStateRef.current.currentPoints;
    if (currentDrawing.length > 1 && dragStateRef.current.isDrawing) {
      ctx.beginPath();
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.moveTo(currentDrawing[0].x, currentDrawing[0].y);
      for (let i = 1; i < currentDrawing.length; i++) {
        ctx.lineTo(currentDrawing[i].x, currentDrawing[i].y);
      }
      ctx.stroke();
    }

    notes.forEach((note) => {
      const animation = animations.get(note.id);
      let animationProgress = 1;
      let deleteProgress = 0;

      if (animation) {
        if (animation.type === 'appear') {
          animationProgress = animation.progress;
        } else if (animation.type === 'delete') {
          deleteProgress = animation.progress;
        }
      }

      renderStickyNote(
        ctx,
        note,
        scale,
        selectedNoteId === note.id,
        animationProgress,
        deleteProgress
      );
    });

    ctx.restore();

    if (minimapRef.current) {
      renderMinimap();
    }
  }, [drawings, notes, animations, selectedNoteId, drawColor, lineWidth, minimapRef]);

  const renderMinimap = useCallback(() => {
    const minimap = minimapRef.current;
    const canvas = canvasRef.current;
    if (!minimap || !canvas) return;

    const mCtx = minimap.getContext('2d');
    if (!mCtx) return;

    const mWidth = minimap.width;
    const mHeight = minimap.height;

    mCtx.fillStyle = '#f5f5f5';
    mCtx.fillRect(0, 0, mWidth, mHeight);

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    notes.forEach((note) => {
      minX = Math.min(minX, note.x - NOTE_WIDTH / 2);
      minY = Math.min(minY, note.y - NOTE_HEIGHT / 2);
      maxX = Math.max(maxX, note.x + NOTE_WIDTH / 2);
      maxY = Math.max(maxY, note.y + NOTE_HEIGHT / 2);
    });

    if (minX === Infinity) {
      minX = -100;
      minY = -100;
      maxX = 100;
      maxY = 100;
    }

    const padding = 50;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const worldWidth = maxX - minX;
    const worldHeight = maxY - minY;
    const scale = Math.min(mWidth / worldWidth, mHeight / worldHeight);

    const offsetX = (mWidth - worldWidth * scale) / 2;
    const offsetY = (mHeight - worldHeight * scale) / 2;

    mCtx.save();
    mCtx.translate(offsetX, offsetY);
    mCtx.scale(scale, scale);
    mCtx.translate(-minX, -minY);

    drawings.forEach((drawing) => {
      if (drawing.points.length < 2) return;
      mCtx.beginPath();
      mCtx.strokeStyle = drawing.color;
      mCtx.lineWidth = drawing.lineWidth / scale;
      mCtx.lineCap = 'round';
      mCtx.lineJoin = 'round';
      mCtx.moveTo(drawing.points[0].x, drawing.points[0].y);
      for (let i = 1; i < drawing.points.length; i++) {
        mCtx.lineTo(drawing.points[i].x, drawing.points[i].y);
      }
      mCtx.stroke();
    });

    notes.forEach((note) => {
      mCtx.fillStyle = note.color;
      mCtx.fillRect(
        note.x - NOTE_WIDTH / 2,
        note.y - NOTE_HEIGHT / 2,
        NOTE_WIDTH,
        NOTE_HEIGHT
      );
      mCtx.fillStyle = note.sidebarColor;
      mCtx.fillRect(
        note.x - NOTE_WIDTH / 2,
        note.y - NOTE_HEIGHT / 2,
        4,
        NOTE_HEIGHT
      );
    });

    const { offsetX: viewOffsetX, offsetY: viewOffsetY, scale: viewScale } =
      canvasStateRef.current;

    const viewportX = -viewOffsetX / viewScale;
    const viewportY = -viewOffsetY / viewScale;
    const viewportWidth = canvas.width / viewScale;
    const viewportHeight = canvas.height / viewScale;

    mCtx.strokeStyle = '#4a90d9';
    mCtx.lineWidth = 2 / scale;
    mCtx.strokeRect(viewportX, viewportY, viewportWidth, viewportHeight);
    mCtx.fillStyle = 'rgba(74, 144, 217, 0.1)';
    mCtx.fillRect(viewportX, viewportY, viewportWidth, viewportHeight);

    mCtx.restore();
  }, [notes, drawings, minimapRef]);

  const animate = useCallback(() => {
    const now = performance.now();
    const deltaTime = Math.min(
      (now - canvasStateRef.current.lastFrameTime) / 1000,
      0.1
    );
    canvasStateRef.current.lastFrameTime = now;

    const easing = 0.15;
    const state = canvasStateRef.current;

    state.offsetX += (state.targetOffsetX - state.offsetX) * easing;
    state.offsetY += (state.targetOffsetY - state.offsetY) * easing;
    state.scale += (state.targetScale - state.scale) * easing;

    setCanvasState({
      offsetX: state.offsetX,
      offsetY: state.offsetY,
      scale: state.scale,
    });

    setAnimations((prev) => {
      const next = new Map(prev);
      let hasChanges = false;

      next.forEach((anim, id) => {
        const newProgress = anim.progress + deltaTime * 3;
        if (newProgress >= 1) {
          if (anim.type === 'delete') {
            next.delete(id);
          } else {
            next.set(id, { ...anim, progress: 1 });
          }
        } else {
          next.set(id, { ...anim, progress: newProgress });
        }
        hasChanges = true;
      });

      return hasChanges ? next : prev;
    });

    render();

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [render, setCanvasState]);

  useEffect(() => {
    canvasStateRef.current.lastFrameTime = performance.now();
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animate]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      const minimap = minimapRef.current;
      if (minimap) {
        const mDpr = window.devicePixelRatio || 1;
        minimap.width = minimap.offsetWidth * mDpr;
        minimap.height = minimap.offsetHeight * mDpr;
        const mCtx = minimap.getContext('2d');
        if (mCtx) {
          mCtx.scale(mDpr, mDpr);
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [minimapRef]);

  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.button === 2) return;

      const point = getCanvasPoint(e.clientX, e.clientY);
      const dragState = dragStateRef.current;
      const state = canvasStateRef.current;

      if (isVotingMode) {
        const note = findNoteAtPoint(point);
        if (note && isPointInVoteButton(point, note) && clientId) {
          onVoteNote(note.id, clientId);
        }
        return;
      }

      if (tool === 'note') {
        onAddNote(point.x, point.y);
        return;
      }

      const note = findNoteAtPoint(point);

      if (note && tool === 'select') {
        if (isPointInVoteButton(point, note) && clientId) {
          onVoteNote(note.id, clientId);
          return;
        }

        setSelectedNoteId(note.id);
        dragState.isDraggingNote = true;
        dragState.dragNoteId = note.id;
        dragState.noteStartX = note.x;
        dragState.noteStartY = note.y;
        dragState.startX = e.clientX;
        dragState.startY = e.clientY;
        setIsDragging(true);
        return;
      }

      if (tool === 'draw') {
        dragState.isDrawing = true;
        dragState.currentPoints = [point];
        setIsDragging(true);
        return;
      }

      dragState.isDraggingCanvas = true;
      dragState.startX = e.clientX;
      dragState.startY = e.clientY;
      dragState.startOffsetX = state.targetOffsetX;
      dragState.startOffsetY = state.targetOffsetY;
      setIsDragging(true);
      setSelectedNoteId(null);
    },
    [
      tool,
      isVotingMode,
      clientId,
      getCanvasPoint,
      findNoteAtPoint,
      onAddNote,
      onVoteNote,
    ]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const dragState = dragStateRef.current;
      const now = performance.now();

      if (now - dragState.lastMoveTime < 16) return;
      dragState.lastMoveTime = now;

      if (dragState.isDraggingCanvas) {
        const dx = e.clientX - dragState.startX;
        const dy = e.clientY - dragState.startY;

        canvasStateRef.current.targetOffsetX = dragState.startOffsetX + dx;
        canvasStateRef.current.targetOffsetY = dragState.startOffsetY + dy;
      }

      if (dragState.isDraggingNote && dragState.dragNoteId) {
        const point = getCanvasPoint(e.clientX, e.clientY);
        const note = notes.find((n) => n.id === dragState.dragNoteId);
        if (note) {
          const dx = point.x - getCanvasPoint(dragState.startX, dragState.startY).x;
          const dy = point.y - getCanvasPoint(dragState.startX, dragState.startY).y;
          onUpdateNote({
            id: dragState.dragNoteId,
            x: dragState.noteStartX + dx,
            y: dragState.noteStartY + dy,
          });
        }
      }

      if (dragState.isDrawing) {
        const point = getCanvasPoint(e.clientX, e.clientY);
        dragState.currentPoints.push(point);
      }
    },
    [getCanvasPoint, notes, onUpdateNote]
  );

  const handleMouseUp = useCallback(() => {
    const dragState = dragStateRef.current;

    if (dragState.isDrawing && dragState.currentPoints.length > 1) {
      onAddDrawing(
        [...dragState.currentPoints],
        drawColor,
        lineWidth
      );
    }

    dragState.isDraggingCanvas = false;
    dragState.isDraggingNote = false;
    dragState.isDrawing = false;
    dragState.dragNoteId = null;
    dragState.currentPoints = [];
    setIsDragging(false);
  }, [drawColor, lineWidth, onAddDrawing]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const state = canvasStateRef.current;
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.2, Math.min(5, state.targetScale * zoomFactor));

    const worldX = (mouseX - state.targetOffsetX) / state.targetScale;
    const worldY = (mouseY - state.targetOffsetY) / state.targetScale;

    state.targetOffsetX = mouseX - worldX * newScale;
    state.targetOffsetY = mouseY - worldY * newScale;
    state.targetScale = newScale;
  }, []);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isVotingMode) return;

      const point = getCanvasPoint(e.clientX, e.clientY);
      const note = findNoteAtPoint(point);

      if (note) {
        setEditingNoteId(note.id);
        setIsEditing(true);
        setSelectedNoteId(note.id);
      }
    },
    [isVotingMode, getCanvasPoint, findNoteAtPoint]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();

      if (isVotingMode) return;

      const point = getCanvasPoint(e.clientX, e.clientY);
      const note = findNoteAtPoint(point);

      if (note) {
        setContextMenu({
          x: e.clientX,
          y: e.clientY,
          noteId: note.id,
        });
        setSelectedNoteId(note.id);
      }
    },
    [isVotingMode, getCanvasPoint, findNoteAtPoint]
  );

  const handleDeleteNote = useCallback(
    (noteId: string) => {
      setAnimations((prev) => {
        const next = new Map(prev);
        next.set(noteId, {
          id: noteId,
          type: 'delete',
          progress: 0,
        });
        return next;
      });

      setTimeout(() => {
        onDeleteNote(noteId);
      }, 300);

      setContextMenu(null);
      setSelectedNoteId(null);
    },
    [onDeleteNote]
  );

  const handleEditNote = useCallback(() => {
    if (contextMenu) {
      setEditingNoteId(contextMenu.noteId);
      setIsEditing(true);
    }
    setContextMenu(null);
  }, [contextMenu]);

  const handleNoteAdd = useCallback((noteId: string) => {
    setAnimations((prev) => {
      const next = new Map(prev);
      next.set(noteId, {
        id: noteId,
        type: 'appear',
        progress: 0,
      });
      return next;
    });
  }, []);

  const exportToPNG = useCallback(async () => {
    setShowExportModal(true);
    setExportProgress(0);

    const canvas = canvasRef.current;
    if (!canvas) return;

    await new Promise((resolve) => setTimeout(resolve, 100));
    setExportProgress(25);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    await new Promise((resolve) => setTimeout(resolve, 100));
    setExportProgress(50);

    const dataURL = canvas.toDataURL('image/png');

    await new Promise((resolve) => setTimeout(resolve, 100));
    setExportProgress(75);

    const link = document.createElement('a');
    link.download = `canvas-${Date.now()}.png`;
    link.href = dataURL;
    link.click();

    await new Promise((resolve) => setTimeout(resolve, 100));
    setExportProgress(100);

    setTimeout(() => {
      setShowExportModal(false);
      setExportProgress(0);
    }, 500);
  }, []);

  const handleMinimapClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const minimap = minimapRef.current;
      const canvas = canvasRef.current;
      if (!minimap || !canvas) return;

      const rect = minimap.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;

      notes.forEach((note) => {
        minX = Math.min(minX, note.x - NOTE_WIDTH / 2);
        minY = Math.min(minY, note.y - NOTE_HEIGHT / 2);
        maxX = Math.max(maxX, note.x + NOTE_WIDTH / 2);
        maxY = Math.max(maxY, note.y + NOTE_HEIGHT / 2);
      });

      if (minX === Infinity) {
        minX = -100;
        minY = -100;
        maxX = 100;
        maxY = 100;
      }

      const padding = 50;
      minX -= padding;
      minY -= padding;
      maxX += padding;
      maxY += padding;

      const worldWidth = maxX - minX;
      const worldHeight = maxY - minY;
      const scale = Math.min(minimap.width / worldWidth, minimap.height / worldHeight);

      const offsetX = (minimap.width - worldWidth * scale) / 2;
      const offsetY = (minimap.height - worldHeight * scale) / 2;

      const worldX = (clickX - offsetX) / scale + minX;
      const worldY = (clickY - offsetY) / scale + minY;

      const viewportWidth = canvas.width / canvasStateRef.current.scale;
      const viewportHeight = canvas.height / canvasStateRef.current.scale;

      canvasStateRef.current.targetOffsetX =
        -worldX * canvasStateRef.current.scale + viewportWidth / 2;
      canvasStateRef.current.targetOffsetY =
        -worldY * canvasStateRef.current.scale + viewportHeight / 2;
    },
    [notes, minimapRef]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingNoteId) {
        if (e.key === 'Escape') {
          setEditingNoteId(null);
          setIsEditing(false);
        }
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          setEditingNoteId(null);
          setIsEditing(false);
        }
      }

      if (e.key === 'Delete' && selectedNoteId && !isEditing) {
        handleDeleteNote(selectedNoteId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [editingNoteId, selectedNoteId, isEditing, handleDeleteNote]);

  const getEditingNoteInput = () => {
    if (!editingNoteId) return null;

    const note = notes.find((n) => n.id === editingNoteId);
    if (!note) return null;

    const state = canvasStateRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const left = rect.left + state.offsetX + (note.x - NOTE_WIDTH / 2 + 8) * state.scale;
    const top = rect.top + state.offsetY + (note.y - NOTE_HEIGHT / 2 + 12) * state.scale;
    const width = (NOTE_WIDTH - 24) * state.scale;
    const height = (NOTE_HEIGHT - 60) * state.scale;

    return (
      <textarea
        autoFocus
        value={note.content}
        onChange={(e) =>
          onUpdateNote({
            id: editingNoteId,
            content: e.target.value,
          })
        }
        onBlur={() => {
          setEditingNoteId(null);
          setIsEditing(false);
        }}
        style={{
          position: 'fixed',
          left,
          top,
          width,
          height,
          fontSize: 14 * state.scale,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          color: '#333',
          backgroundColor: 'transparent',
          border: 'none',
          outline: 'none',
          resize: 'none',
          zIndex: 2000,
          lineHeight: 1.4,
        }}
      />
    );
  };

  useImperativeHandle(ref, () => ({
    handleNoteAdd,
    exportToPNG,
    handleMinimapClick,
  }), [handleNoteAdd, exportToPNG, handleMinimapClick]);

  return (
    <>
      <div
        ref={containerRef}
        className={`canvas-container ${isDragging ? 'dragging' : ''} ${
          isEditing ? 'editing' : ''
        }`}
      >
        <canvas
          ref={canvasRef}
          className="canvas"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onDoubleClick={handleDoubleClick}
          onContextMenu={handleContextMenu}
        />
        {getEditingNoteInput()}
      </div>

      {contextMenu && (
        <div
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button className="context-menu-item" onClick={handleEditNote}>
            ✏️ 编辑
          </button>
          <button
            className="context-menu-item danger"
            onClick={() => handleDeleteNote(contextMenu.noteId)}
          >
            🗑️ 删除
          </button>
        </div>
      )}

      {showExportModal && (
        <div className="export-modal-overlay">
          <div className="export-modal">
            <h3>导出PNG图片</h3>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
            <p style={{ color: '#666', fontSize: '13px', textAlign: 'center' }}>
              {exportProgress < 100 ? '正在导出...' : '导出完成！'}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export const CanvasBoard = forwardRef(CanvasBoardInner);
