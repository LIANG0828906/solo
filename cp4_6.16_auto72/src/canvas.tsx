import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useCanvasStore, getElementBounds, getTopmostElementAtPoint } from './store';
import {
  SELECTION_COLOR,
  SELECTION_FILL,
  CANVAS_BG,
  STICKY_NOTE_BG,
  STICKY_NOTE_HEADER,
} from './types';
import type { CanvasElement, Point, Rect, PencilElement, RectangleElement, StickyNoteElement } from './types';

interface CanvasProps {
  width: number;
  height: number;
}

const ANIMATION_DURATION = 300;
const TARGET_FPS = 60;
const FRAME_INTERVAL = 1000 / TARGET_FPS;

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
const easeInCubic = (t: number): number => t * t * t;

export const Canvas: React.FC<CanvasProps> = ({ width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dirtyRectRef = useRef<Rect | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const animatingElementsRef = useRef<Set<string>>(new Set());

  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<Point | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<Point | null>(null);
  const [hoveredNoteId, setHoveredNoteId] = useState<string | null>(null);
  const editingNoteId = useCanvasStore((state) => state.editingNoteId);
  const setEditingNote = useCanvasStore((state) => state.setEditingNote);

  const elements = useCanvasStore((state) => state.elements);
  const selectedIds = useCanvasStore((state) => state.selectedIds);
  const currentTool = useCanvasStore((state) => state.currentTool);
  const isDrawing = useCanvasStore((state) => state.isDrawing);
  const startDrawing = useCanvasStore((state) => state.startDrawing);
  const updateDrawing = useCanvasStore((state) => state.updateDrawing);
  const endDrawing = useCanvasStore((state) => state.endDrawing);
  const selectElement = useCanvasStore((state) => state.selectElement);
  const clearSelection = useCanvasStore((state) => state.clearSelection);
  const selectElementsInRect = useCanvasStore((state) => state.selectElementsInRect);
  const deleteSelectedElements = useCanvasStore((state) => state.deleteSelectedElements);
  const startDraggingSelection = useCanvasStore((state) => state.startDraggingSelection);
  const updateDraggingSelection = useCanvasStore((state) => state.updateDraggingSelection);
  const endDraggingSelection = useCanvasStore((state) => state.endDraggingSelection);
  const updateElement = useCanvasStore((state) => state.updateElement);
  const isDraggingSelection = useCanvasStore((state) => state.isDraggingSelection);
  const finishDeleteAnimation = useCanvasStore((state) => state.finishDeleteAnimation);

  const viewport = useMemo<Rect>(
    () => ({ x: 0, y: 0, width, height }),
    [width, height]
  );

  const markDirty = useCallback((rect: Rect) => {
    if (!dirtyRectRef.current) {
      dirtyRectRef.current = { ...rect };
    } else {
      const d = dirtyRectRef.current;
      const right = Math.max(d.x + d.width, rect.x + rect.width);
      const bottom = Math.max(d.y + d.height, rect.y + rect.height);
      d.x = Math.min(d.x, rect.x);
      d.y = Math.min(d.y, rect.y);
      d.width = right - d.x;
      d.height = bottom - d.y;
    }
  }, []);

  const markElementDirty = useCallback(
    (element: CanvasElement, padding = 20) => {
      const bounds = getElementBounds(element);
      markDirty({
        x: bounds.minX - padding,
        y: bounds.minY - padding,
        width: bounds.maxX - bounds.minX + padding * 2,
        height: bounds.maxY - bounds.minY + padding * 2,
      });
    },
    [markDirty]
  );

  const getCanvasPoint = useCallback((e: React.MouseEvent | MouseEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const drawElement = useCallback(
    (ctx: CanvasRenderingContext2D, element: CanvasElement) => {
      const isDeleted = element.isDeleted;
      let scale = 1;
      let alpha = 1;
      let offsetX = 0;
      let offsetY = 0;

      if (isDeleted && element.deleteAnimationProgress !== undefined) {
        const t = element.deleteAnimationProgress;
        scale = 1 - easeInCubic(t) * 0.5;
        alpha = 1 - easeInCubic(t);
      } else if (element.enterAnimationProgress !== undefined && element.enterAnimationProgress < 1) {
        const t = element.enterAnimationProgress;
        scale = 0.5 + easeOutCubic(t) * 0.5;
        alpha = easeOutCubic(t);
      }

      if (alpha <= 0) return;

      ctx.save();
      ctx.globalAlpha = alpha;

      const bounds = getElementBounds(element);
      const centerX = (bounds.minX + bounds.maxX) / 2;
      const centerY = (bounds.minY + bounds.maxY) / 2;

      if (scale !== 1) {
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);
        ctx.translate(-centerX, -centerY);
      }

      switch (element.type) {
        case 'pencil':
          drawPencil(ctx, element);
          break;
        case 'rectangle':
          drawRectangle(ctx, element);
          break;
        case 'stickyNote':
          drawStickyNote(ctx, element);
          break;
      }

      ctx.restore();
    },
    []
  );

  const drawPencil = (ctx: CanvasRenderingContext2D, element: PencilElement) => {
    if (element.points.length < 2) {
      if (element.points.length === 1) {
        ctx.save();
        ctx.fillStyle = element.color;
        ctx.beginPath();
        ctx.arc(element.points[0].x, element.points[0].y, element.lineWidth / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      return;
    }

    ctx.save();
    ctx.strokeStyle = element.color;
    ctx.lineWidth = element.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(element.points[0].x, element.points[0].y);

    for (let i = 1; i < element.points.length - 1; i++) {
      const xc = (element.points[i].x + element.points[i + 1].x) / 2;
      const yc = (element.points[i].y + element.points[i + 1].y) / 2;
      ctx.quadraticCurveTo(element.points[i].x, element.points[i].y, xc, yc);
    }

    const last = element.points[element.points.length - 1];
    ctx.lineTo(last.x, last.y);

    ctx.stroke();
    ctx.restore();
  };

  const drawRectangle = (ctx: CanvasRenderingContext2D, element: RectangleElement) => {
    if (element.width === 0 && element.height === 0) return;

    ctx.save();

    if (element.filled) {
      ctx.fillStyle = element.color;
      ctx.fillRect(element.x, element.y, element.width, element.height);
    } else {
      ctx.strokeStyle = element.color;
      ctx.lineWidth = element.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeRect(element.x, element.y, element.width, element.height);
    }

    ctx.restore();
  };

  const drawStickyNote = (ctx: CanvasRenderingContext2D, element: StickyNoteElement) => {
    const { x, y, width, height } = element;

    ctx.save();

    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    ctx.fillStyle = STICKY_NOTE_BG;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 4);
    ctx.fill();

    ctx.shadowColor = 'transparent';

    ctx.fillStyle = STICKY_NOTE_HEADER;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.lineTo(x + width, y + 8);
    ctx.quadraticCurveTo(x + width / 2, y + 4, x, y + 8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#333';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textBaseline = 'top';

    if (element.text) {
      const maxWidth = width - 24;
      const lineHeight = 21;
      const maxLines = Math.floor((height - 20) / lineHeight);
      const chars = element.text.split('');
      let line = '';
      let lines: string[] = [];

      for (let i = 0; i < chars.length; i++) {
        const testLine = line + chars[i];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line.length > 0) {
          lines.push(line);
          line = chars[i];
          if (lines.length >= maxLines) break;
        } else {
          line = testLine;
        }
      }
      if (lines.length < maxLines) {
        lines.push(line);
      }

      lines.forEach((l, i) => {
        ctx.fillText(l, x + 12, y + 16 + i * lineHeight);
      });
    } else if (editingNoteId !== element.id) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillText('双击编辑便签...', x + 12, y + 16);
      ctx.fillStyle = '#333';
    }

    if (!editingNoteId || editingNoteId !== element.id) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${element.text.length}/200`, x + width - 8, y + height - 18);
    }

    ctx.restore();
  };

  const drawSelectionHandles = useCallback(
    (ctx: CanvasRenderingContext2D, element: CanvasElement) => {
      const bounds = getElementBounds(element);
      const padding = 4;
      const x = bounds.minX - padding;
      const y = bounds.minY - padding;
      const w = bounds.maxX - bounds.minX + padding * 2;
      const h = bounds.maxY - bounds.minY + padding * 2;

      ctx.save();
      ctx.strokeStyle = SELECTION_COLOR;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);

      const handleSize = 8;
      const handles = [
        { x: x - handleSize / 2, y: y - handleSize / 2 },
        { x: x + w - handleSize / 2, y: y - handleSize / 2 },
        { x: x - handleSize / 2, y: y + h - handleSize / 2 },
        { x: x + w - handleSize / 2, y: y + h - handleSize / 2 },
        { x: x + w / 2 - handleSize / 2, y: y - handleSize / 2 },
        { x: x + w / 2 - handleSize / 2, y: y + h - handleSize / 2 },
        { x: x - handleSize / 2, y: y + h / 2 - handleSize / 2 },
        { x: x + w - handleSize / 2, y: y + h / 2 - handleSize / 2 },
      ];

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = SELECTION_COLOR;
      ctx.lineWidth = 1.5;

      handles.forEach((pos) => {
        ctx.fillRect(pos.x, pos.y, handleSize, handleSize);
        ctx.strokeRect(pos.x, pos.y, handleSize, handleSize);
      });

      ctx.restore();
    },
    []
  );

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dirty = dirtyRectRef.current;
    if (!dirty) return;

    ctx.save();

    if (dirty.x <= 0 && dirty.y <= 0 && dirty.width >= width && dirty.height >= height) {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = CANVAS_BG;
      ctx.fillRect(0, 0, width, height);

      elements.forEach((element) => {
        drawElement(ctx, element);
      });

      if (selectedIds.length > 0 && currentTool === 'select') {
        selectedIds.forEach((id) => {
          const element = elements.find((e) => e.id === id);
          if (element && !element.isDeleted) {
            drawSelectionHandles(ctx, element);
          }
        });
      }
    } else {
      ctx.beginPath();
      ctx.rect(dirty.x, dirty.y, dirty.width, dirty.height);
      ctx.clip();

      ctx.fillStyle = CANVAS_BG;
      ctx.fillRect(dirty.x, dirty.y, dirty.width, dirty.height);

      elements.forEach((element) => {
        if (element.isDeleted && element.deleteAnimationProgress === undefined) return;
        const bounds = getElementBounds(element);
        const pad = 20;
        if (
          bounds.maxX + pad < dirty.x ||
          bounds.minX - pad > dirty.x + dirty.width ||
          bounds.maxY + pad < dirty.y ||
          bounds.minY - pad > dirty.y + dirty.height
        ) {
          return;
        }
        drawElement(ctx, element);
      });

      if (selectedIds.length > 0 && currentTool === 'select') {
        selectedIds.forEach((id) => {
          const element = elements.find((e) => e.id === id);
          if (element && !element.isDeleted) {
            const bounds = getElementBounds(element);
            const pad = 20;
            if (
              bounds.maxX + pad < dirty.x ||
              bounds.minX - pad > dirty.x + dirty.width ||
              bounds.maxY + pad < dirty.y ||
              bounds.minY - pad > dirty.y + dirty.height
            ) {
              return;
            }
            drawSelectionHandles(ctx, element);
          }
        });
      }
    }

    if (isSelecting && selectionStart && selectionEnd) {
      const x = Math.min(selectionStart.x, selectionEnd.x);
      const y = Math.min(selectionStart.y, selectionEnd.y);
      const w = Math.abs(selectionEnd.x - selectionStart.x);
      const h = Math.abs(selectionEnd.y - selectionStart.y);

      ctx.fillStyle = SELECTION_FILL;
      ctx.strokeStyle = SELECTION_COLOR;
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
    }

    ctx.restore();

    dirtyRectRef.current = null;
  }, [elements, selectedIds, currentTool, isSelecting, selectionStart, selectionEnd, width, height, drawElement, drawSelectionHandles]);

  const updateAnimations = useCallback(
    (timestamp: number) => {
      let needsRender = false;

      elements.forEach((element) => {
        if (element.enterAnimationProgress !== undefined && element.enterAnimationProgress < 1) {
          const newProgress = Math.min(1, element.enterAnimationProgress + FRAME_INTERVAL / ANIMATION_DURATION);
          if (newProgress !== element.enterAnimationProgress) {
            updateElement(element.id, { enterAnimationProgress: newProgress } as Partial<CanvasElement>, false);
            markElementDirty(element);
            needsRender = true;
          }
        }

        if (element.isDeleted && element.deleteAnimationProgress !== undefined && element.deleteAnimationProgress < 1) {
          const newProgress = Math.min(1, element.deleteAnimationProgress + FRAME_INTERVAL / ANIMATION_DURATION);
          if (newProgress !== element.deleteAnimationProgress) {
            updateElement(element.id, { deleteAnimationProgress: newProgress } as Partial<CanvasElement>, false);
            markElementDirty(element);
            needsRender = true;

            if (newProgress >= 1) {
              setTimeout(() => finishDeleteAnimation(element.id), 0);
            }
          }
        }
      });

      return needsRender;
    },
    [elements, updateElement, markElementDirty, finishDeleteAnimation]
  );

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (timestamp - lastFrameTimeRef.current >= FRAME_INTERVAL - 1) {
        const animDirty = updateAnimations(timestamp);
        if (dirtyRectRef.current || animDirty) {
          render();
        }
        lastFrameTimeRef.current = timestamp;
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [render, updateAnimations]);

  useEffect(() => {
    markDirty({ x: 0, y: 0, width, height });
  }, [width, height, markDirty]);

  useEffect(() => {
    markDirty({ x: 0, y: 0, width, height });
  }, [isSelecting, selectionStart, selectionEnd, width, height, markDirty]);

  useEffect(() => {
    if (elements.length === 0) {
      markDirty({ x: 0, y: 0, width, height });
      return;
    }
    elements.forEach((el) => markElementDirty(el));
  }, [elements, width, height, markDirty, markElementDirty]);

  useEffect(() => {
    selectedIds.forEach((id) => {
      const el = elements.find((e) => e.id === id);
      if (el) markElementDirty(el, 30);
    });
  }, [selectedIds, elements, currentTool, markElementDirty]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const point = getCanvasPoint(e);

    if (currentTool === 'select') {
      const clickedElement = getTopmostElementAtPoint(point.x, point.y, elements);

      if (e.shiftKey && !clickedElement) {
        setIsSelecting(true);
        setSelectionStart(point);
        setSelectionEnd(point);
        return;
      }

      if (clickedElement) {
        if (!e.shiftKey && !selectedIds.includes(clickedElement.id)) {
          selectElement(clickedElement.id, false);
        } else if (e.shiftKey) {
          selectElement(clickedElement.id, true);
        }

        if (clickedElement.type === 'stickyNote') {
          setHoveredNoteId(clickedElement.id);
        }

        if (selectedIds.length > 0 || clickedElement) {
          startDraggingSelection(point);
        }
      } else {
        clearSelection();
      }
    } else if (currentTool === 'pencil' || currentTool === 'rectangle') {
      startDrawing(point);
    } else if (currentTool === 'stickyNote') {
      startDrawing(point);
    } else if (currentTool === 'eraser') {
      const clickedElement = getTopmostElementAtPoint(point.x, point.y, elements);
      if (clickedElement) {
        const store = useCanvasStore.getState();
        store.deleteElement(clickedElement.id);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const point = getCanvasPoint(e);

    if (isDrawing && (currentTool === 'pencil' || currentTool === 'rectangle')) {
      updateDrawing(point);
    }

    if (isDraggingSelection) {
      updateDraggingSelection(point);
    }

    if (isSelecting) {
      setSelectionEnd(point);
      selectElementsInRect(selectionStart!.x, selectionStart!.y, point.x, point.y);
    }

    if (currentTool === 'select' && !isDraggingSelection && !isSelecting) {
      const hovered = getTopmostElementAtPoint(point.x, point.y, elements);
      if (hovered?.type === 'stickyNote') {
        setHoveredNoteId(hovered.id);
      } else {
        setHoveredNoteId(null);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const point = getCanvasPoint(e);

    if (isDrawing && (currentTool === 'pencil' || currentTool === 'rectangle')) {
      endDrawing();
    }

    if (isDraggingSelection) {
      endDraggingSelection();
    }

    if (isSelecting) {
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (currentTool !== 'select') return;

    const point = getCanvasPoint(e);
    const clickedElement = getTopmostElementAtPoint(point.x, point.y, elements);

    if (clickedElement?.type === 'stickyNote') {
      setEditingNote(clickedElement.id);
      selectElement(clickedElement.id, false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0 && currentTool === 'select' && !editingNoteId) {
          e.preventDefault();
          deleteSelectedElements();
        }
      }
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        useCanvasStore.getState().undo();
      }
      if ((e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) ||
          (e.key === 'y' && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        useCanvasStore.getState().redo();
      }
      if (e.key === 'Escape') {
        clearSelection();
        setEditingNote(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, currentTool, deleteSelectedElements, clearSelection, editingNoteId, setEditingNote]);

  const handleNoteTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!editingNoteId) return;
    const value = e.target.value.slice(0, 200);
    updateElement(editingNoteId, { text: value } as Partial<StickyNoteElement>, false);
  };

  const handleNoteBlur = () => {
    setEditingNote(null);
  };

  const editingNote = editingNoteId
    ? (elements.find((e) => e.id === editingNoteId) as StickyNoteElement | undefined)
    : null;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        style={{
          display: 'block',
          cursor:
            currentTool === 'select'
              ? hoveredNoteId
                ? 'text'
                : selectedIds.length > 0
                ? 'move'
                : 'default'
              : currentTool === 'eraser'
              ? 'crosshair'
              : 'crosshair',
        }}
      />

      {editingNote && (
        <textarea
          value={editingNote.text}
          onChange={handleNoteTextChange}
          onBlur={handleNoteBlur}
          maxLength={200}
          autoFocus
          style={{
            position: 'absolute',
            left: editingNote.x + 12,
            top: editingNote.y + 16,
            width: editingNote.width - 24,
            height: editingNote.height - 28,
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            fontSize: '14px',
            lineHeight: '1.5',
            color: '#333',
            padding: 0,
            margin: 0,
          }}
        />
      )}
    </div>
  );
};
