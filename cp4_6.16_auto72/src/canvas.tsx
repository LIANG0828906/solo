import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useCanvasStore, getTopmostElementAtPoint, getElementBounds } from './store';
import { SELECTION_COLOR, CANVAS_BG } from './types';
import type { CanvasElement, Point } from './types';
import { StickyNote } from './stickynote';

interface CanvasProps {
  width: number;
  height: number;
}

export const Canvas: React.FC<CanvasProps> = ({ width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<Point | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<Point | null>(null);
  const lastMousePos = useRef<Point | null>(null);
  const moveStartElements = useRef<Map<string, { x: number; y: number; points?: Point[] }>>(new Map());

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
  const moveSelected = useCanvasStore((state) => state.moveSelected);
  const deleteSelectedElements = useCanvasStore((state) => state.deleteSelectedElements);

  const getCanvasPoint = useCallback((e: React.MouseEvent | MouseEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = CANVAS_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    elements.forEach((element) => {
      if (element.isDeleted) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.translate(0, 0);
      }

      drawElement(ctx, element);

      if (element.isDeleted) {
        ctx.restore();
      }
    });

    if (selectedIds.length > 0 && currentTool === 'select') {
      selectedIds.forEach((id) => {
        const element = elements.find((e) => e.id === id);
        if (element && !element.isDeleted) {
          drawSelectionHandles(ctx, element);
        }
      });
    }

    if (isSelecting && selectionStart && selectionEnd) {
      ctx.save();
      ctx.strokeStyle = SELECTION_COLOR;
      ctx.fillStyle = 'rgba(74, 144, 217, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      const x = Math.min(selectionStart.x, selectionEnd.x);
      const y = Math.min(selectionStart.y, selectionEnd.y);
      const w = Math.abs(selectionEnd.x - selectionStart.x);
      const h = Math.abs(selectionEnd.y - selectionStart.y);
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
      ctx.restore();
    }
  }, [elements, selectedIds, currentTool, isSelecting, selectionStart, selectionEnd]);

  const drawElement = (ctx: CanvasRenderingContext2D, element: CanvasElement) => {
    switch (element.type) {
      case 'pencil':
        drawPencil(ctx, element);
        break;
      case 'rectangle':
        drawRectangle(ctx, element);
        break;
      case 'stickyNote':
        break;
    }
  };

  const drawPencil = (ctx: CanvasRenderingContext2D, element: any) => {
    if (element.points.length < 2) return;

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

    if (element.points.length >= 2) {
      const last = element.points[element.points.length - 1];
      ctx.lineTo(last.x, last.y);
    }

    ctx.stroke();
    ctx.restore();
  };

  const drawRectangle = (ctx: CanvasRenderingContext2D, element: any) => {
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

  const drawSelectionHandles = (ctx: CanvasRenderingContext2D, element: CanvasElement) => {
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
    const handlePositions = [
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

    handlePositions.forEach((pos) => {
      ctx.fillRect(pos.x, pos.y, handleSize, handleSize);
      ctx.strokeRect(pos.x, pos.y, handleSize, handleSize);
    });

    ctx.restore();
  };

  useEffect(() => {
    let animationId: number;

    const animate = () => {
      render();
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [render]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const point = getCanvasPoint(e);
    lastMousePos.current = point;

    if (currentTool === 'select') {
      const clickedElement = getTopmostElementAtPoint(point.x, point.y, elements);

      if (e.shiftKey) {
        setIsSelecting(true);
        setSelectionStart(point);
        setSelectionEnd(point);
      } else if (clickedElement) {
        selectElement(clickedElement.id, e.shiftKey);
        setIsMoving(true);

        selectedIds.forEach((id) => {
          const el = elements.find((e) => e.id === id);
          if (el) {
            if (el.type === 'pencil') {
              moveStartElements.current.set(id, {
                x: el.x,
                y: el.y,
                points: [...el.points],
              });
            } else {
              moveStartElements.current.set(id, { x: el.x, y: el.y });
            }
          }
        });
      } else {
        clearSelection();
      }
    } else if (currentTool === 'pencil' || currentTool === 'rectangle') {
      startDrawing(point);
      setIsDragging(true);
    } else if (currentTool === 'stickyNote') {
      startDrawing(point);
    } else if (currentTool === 'eraser') {
      const clickedElement = getTopmostElementAtPoint(point.x, point.y, elements);
      if (clickedElement) {
        const store = useCanvasStore.getState();
        store.animateDelete(clickedElement.id);
        setTimeout(() => {
          store.finishDeleteAnimation(clickedElement.id);
        }, 300);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const point = getCanvasPoint(e);

    if (isDrawing && (currentTool === 'pencil' || currentTool === 'rectangle')) {
      updateDrawing(point);
    }

    if (isMoving && lastMousePos.current) {
      const dx = point.x - lastMousePos.current.x;
      const dy = point.y - lastMousePos.current.y;
      moveSelected(dx, dy);
      lastMousePos.current = point;
    }

    if (isSelecting) {
      setSelectionEnd(point);
      selectElementsInRect(selectionStart!.x, selectionStart!.y, point.x, point.y);
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && (currentTool === 'pencil' || currentTool === 'rectangle')) {
      endDrawing();
    }

    setIsDragging(false);
    setIsMoving(false);
    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
    lastMousePos.current = null;
    moveStartElements.current.clear();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0 && currentTool === 'select') {
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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, currentTool, deleteSelectedElements]);

  const stickyNoteElements = elements.filter((e) => e.type === 'stickyNote' && !e.isDeleted);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          display: 'block',
          cursor:
            currentTool === 'select'
              ? 'default'
              : currentTool === 'eraser'
              ? 'crosshair'
              : 'crosshair',
        }}
      />

      {stickyNoteElements.map((element) => (
        <StickyNote
          key={element.id}
          element={element as any}
          isSelected={selectedIds.includes(element.id)}
          canvasWidth={width}
          canvasHeight={height}
        />
      ))}
    </div>
  );
};
