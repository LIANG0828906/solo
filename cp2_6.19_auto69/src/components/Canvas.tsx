import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useCanvasStore } from '../store/canvasStore';
import type { LineElement } from '../store/canvasStore';
import StickyNote from './StickyNote';
import type { Point } from '../utils/geometry';
import {
  catmullRomSpline,
  isPointNearLine,
  getBoundingBox,
  getCenter,
  distance,
  getAngle,
} from '../utils/geometry';
import type { BroadcastMessage, IBroadcastService } from '../services/broadcastService';

type HandleType = 'tl' | 'tr' | 'bl' | 'br' | 'rotate' | 'move';

interface DragState {
  isDragging: boolean;
  elementId: string | null;
  handleType: HandleType | null;
  startX: number;
  startY: number;
  startElementX: number;
  startElementY: number;
  startRotation: number;
  startPoints: Point[];
}

const CURSOR_LABEL_WIDTH = 120;
const CURSOR_LABEL_HEIGHT = 40;
const CURSOR_LABEL_OFFSET = 16;

const drawAntiAliasedLine = (
  ctx: CanvasRenderingContext2D,
  points: Point[],
  color: string,
  strokeWidth: number,
) => {
  if (points.length < 2) return;

  ctx.save();

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.15;
  ctx.lineWidth = strokeWidth + 2;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();

  ctx.globalAlpha = 0.35;
  ctx.lineWidth = strokeWidth + 1;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();

  ctx.globalAlpha = 1.0;
  ctx.lineWidth = strokeWidth;
  ctx.beginPath();
  ctx.moveTo(points[0].x + 0.5, points[0].y + 0.5);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x + 0.5, points[i].y + 0.5);
  }
  ctx.stroke();

  ctx.restore();
};

const Canvas: React.FC<{ broadcastService: IBroadcastService }> = ({ broadcastService }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorLabelRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const lastFrameTimeRef = useRef<number>(0);

  const {
    elements,
    selectedElementId,
    currentTool,
    currentColor,
    addElement,
    updateElement,
    removeElement,
    setSelectedElement,
    users,
    addUser,
    removeUser,
    currentUserId,
    currentUserName,
    animations,
    updateAnimations,
  } = useCanvasStore();

  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<Point[]>([]);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const [showCursorLabel, setShowCursorLabel] = useState(false);
  const [labelPosition, setLabelPosition] = useState({ left: 0, top: 0 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });

  const dragStateRef = useRef<DragState>({
    isDragging: false,
    elementId: null,
    handleType: null,
    startX: 0,
    startY: 0,
    startElementX: 0,
    startElementY: 0,
    startRotation: 0,
    startPoints: [],
  });

  const pinchStateRef = useRef({
    active: false,
    initialDistance: 0,
    initialScale: 1,
  });

  const getCanvasCoords = useCallback((clientX: number, clientY: number): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left - offset.x) / scale,
      y: (clientY - rect.top - offset.y) / scale,
    };
  }, [offset, scale]);

  const updateLabelPosition = useCallback((canvasX: number, canvasY: number) => {
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const screenX = canvasX * scale + offset.x;
    const screenY = canvasY * scale + offset.y;

    let left = screenX + CURSOR_LABEL_OFFSET;
    let top = screenY + CURSOR_LABEL_OFFSET;

    if (screenX + CURSOR_LABEL_OFFSET + CURSOR_LABEL_WIDTH > containerRect.width) {
      left = screenX - CURSOR_LABEL_WIDTH - CURSOR_LABEL_OFFSET;
    }

    if (screenY + CURSOR_LABEL_OFFSET + CURSOR_LABEL_HEIGHT > containerRect.height) {
      top = screenY - CURSOR_LABEL_HEIGHT - CURSOR_LABEL_OFFSET;
    }

    left = Math.max(0, Math.min(left, containerRect.width - CURSOR_LABEL_WIDTH));
    top = Math.max(0, Math.min(top, containerRect.height - CURSOR_LABEL_HEIGHT));

    setLabelPosition({ left, top });
  }, [scale, offset]);

  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStateRef.current.isDragging) return;

    const pos = getCanvasCoords(e.clientX, e.clientY);
    setMousePos(pos);
    updateLabelPosition(e.clientX - (containerRef.current?.getBoundingClientRect().left ?? 0),
                        e.clientY - (containerRef.current?.getBoundingClientRect().top ?? 0));

    const { elementId, handleType, startX, startY, startElementX, startElementY, startRotation, startPoints } = dragStateRef.current;
    if (!elementId) return;

    const element = elements.find(el => el.id === elementId) as LineElement | null;
    if (!element) return;

    if (handleType === 'move') {
      const dx = pos.x - startX;
      const dy = pos.y - startY;
      updateElement(elementId, {
        x: startElementX + dx,
        y: startElementY + dy,
      });
    } else if (handleType === 'rotate') {
      const bbox = getBoundingBox(element.smoothedPoints);
      const center = getCenter(bbox);
      const centerPos = { x: center.x + element.x, y: center.y + element.y };
      const startAngle = getAngle(centerPos, { x: startX, y: startY });
      const currentAngle = getAngle(centerPos, pos);
      const deltaAngle = currentAngle - startAngle;
      updateElement(elementId, {
        rotation: startRotation + deltaAngle,
      });
    } else if (handleType && ['tl', 'tr', 'bl', 'br'].includes(handleType)) {
      const center = getCenter(getBoundingBox(startPoints));
      const dx = pos.x - startX;
      const dy = pos.y - startY;
      let scaleFactor = 1;

      if (handleType === 'br') scaleFactor = 1 + (dx + dy) / 200;
      if (handleType === 'tl') scaleFactor = 1 - (dx + dy) / 200;
      if (handleType === 'tr') scaleFactor = 1 + (dx - dy) / 200;
      if (handleType === 'bl') scaleFactor = 1 + (-dx + dy) / 200;

      scaleFactor = Math.max(0.2, Math.min(3, scaleFactor));

      const scaledPoints = startPoints.map(p => ({
        x: center.x + (p.x - center.x) * scaleFactor,
        y: center.y + (p.y - center.y) * scaleFactor,
      }));

      updateElement(elementId, {
        smoothedPoints: scaledPoints,
        points: startPoints.map(p => ({
          x: center.x + (p.x - center.x) * scaleFactor,
          y: center.y + (p.y - center.y) * scaleFactor,
        })),
      });
    }
  }, [elements, getCanvasCoords, updateElement, updateLabelPosition]);

  const handleGlobalMouseUp = useCallback(() => {
    if (isDrawing && drawingPoints.length > 1) {
      const smoothedPoints = catmullRomSpline(drawingPoints, 0.5);
      addElement({
        type: 'line',
        points: drawingPoints,
        smoothedPoints,
        color: currentColor,
        strokeWidth: 3,
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
      });
    }

    setIsDrawing(false);
    setDrawingPoints([]);
    setShowCursorLabel(false);
    dragStateRef.current.isDragging = false;
    dragStateRef.current.elementId = null;
    dragStateRef.current.handleType = null;

    window.removeEventListener('mousemove', handleGlobalMouseMove);
    window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDrawing, drawingPoints, addElement, currentColor, handleGlobalMouseMove]);

  useEffect(() => {
    const handleMessage = (message: BroadcastMessage) => {
      switch (message.type) {
        case 'elementAdded':
          addElement(message.payload as LineElement, false);
          break;
        case 'elementUpdated': {
          const payload = message.payload as { id: string; updates: Partial<LineElement> };
          if (payload.updates.x !== undefined && payload.updates.y !== undefined) {
            const element = elements.find(e => e.id === payload.id);
            if (element && element.type !== 'arrow') {
              useCanvasStore.getState().startAnimation(payload.id, payload.updates.x, payload.updates.y);
            }
          } else {
            updateElement(payload.id, payload.updates, false);
          }
          break;
        }
        case 'elementRemoved':
          removeElement((message.payload as { id: string }).id, false);
          break;
        case 'userJoined':
          addUser(message.payload as { id: string; name: string; color: string; avatar: string });
          break;
        case 'userLeft':
          removeUser((message.payload as { userId: string }).userId);
          break;
        case 'hello':
          broadcastService.send({
            type: 'userJoined',
            payload: users.find(u => u.id === currentUserId),
            senderId: currentUserId,
            timestamp: Date.now(),
          });
          break;
      }
    };

    const unsubscribe = broadcastService.subscribe(handleMessage);
    broadcastService.setUserId(currentUserId);

    broadcastService.send({
      type: 'hello',
      payload: { userId: currentUserId, name: currentUserName },
      senderId: currentUserId,
      timestamp: Date.now(),
    });

    return () => {
      unsubscribe();
      broadcastService.send({
        type: 'userLeft',
        payload: { userId: currentUserId },
        senderId: currentUserId,
        timestamp: Date.now(),
      });
    };
  }, [broadcastService, currentUserId, currentUserName, addElement, updateElement, removeElement, addUser, removeUser, elements, users]);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    ctx.fillStyle = '#fafaf5';
    ctx.fillRect(0, 0, rect.width, rect.height);

    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    ctx.strokeStyle = '#f0f0e8';
    ctx.lineWidth = 1;
    const gridSize = 20;
    const startX = -offset.x / scale;
    const startY = -offset.y / scale;
    const endX = (rect.width - offset.x) / scale;
    const endY = (rect.height - offset.y) / scale;

    for (let x = Math.floor(startX / gridSize) * gridSize; x < endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, startY);
      ctx.lineTo(x + 0.5, endY);
      ctx.stroke();
    }
    for (let y = Math.floor(startY / gridSize) * gridSize; y < endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y + 0.5);
      ctx.lineTo(endX, y + 0.5);
      ctx.stroke();
    }

    elements.forEach((element) => {
      if (element.type === 'line') {
        ctx.save();
        const center = getCenter(getBoundingBox(element.smoothedPoints));
        ctx.translate(element.x + center.x, element.y + center.y);
        ctx.rotate((element.rotation * Math.PI) / 180);
        ctx.translate(-center.x, -center.y);

        drawAntiAliasedLine(ctx, element.smoothedPoints, element.color, element.strokeWidth);
        ctx.restore();
      }
    });

    if (isDrawing && drawingPoints.length > 1) {
      const smoothedPoints = catmullRomSpline(drawingPoints, 0.5, 4);
      drawAntiAliasedLine(ctx, smoothedPoints, currentColor, 3);
    }

    ctx.restore();
  }, [elements, isDrawing, drawingPoints, currentColor, offset, scale]);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (timestamp - lastFrameTimeRef.current >= 16) {
        if (animations.size > 0) {
          updateAnimations(timestamp);
        }
        renderCanvas();
        lastFrameTimeRef.current = timestamp;
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [renderCanvas, animations.size, updateAnimations]);

  useEffect(() => {
    const handleResize = () => renderCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderCanvas]);

  const findLineAtPoint = (point: Point): LineElement | null => {
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i];
      if (element.type === 'line') {
        const bbox = getBoundingBox(element.smoothedPoints);
        const center = getCenter(bbox);
        const transformedPoints = element.smoothedPoints.map(p => {
          const rad = (element.rotation * Math.PI) / 180;
          const cos = Math.cos(rad);
          const sin = Math.sin(rad);
          const dx = p.x - center.x;
          const dy = p.y - center.y;
          return {
            x: center.x + dx * cos - dy * sin + element.x,
            y: center.y + dx * sin + dy * cos + element.y,
          };
        });
        if (isPointNearLine(point, transformedPoints, 10)) {
          return element;
        }
      }
    }
    return null;
  };

  const getHandles = (element: LineElement) => {
    const bbox = getBoundingBox(element.smoothedPoints);
    const center = getCenter(bbox);

    const rad = (element.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const rotateAroundCenter = (p: Point): Point => {
      const dx = p.x - center.x;
      const dy = p.y - center.y;
      return {
        x: center.x + dx * cos - dy * sin + element.x,
        y: center.y + dx * sin + dy * cos + element.y,
      };
    };

    const handles = [
      { type: 'tl' as HandleType, local: { x: bbox.minX - 6, y: bbox.minY - 6 } },
      { type: 'tr' as HandleType, local: { x: bbox.maxX - 6, y: bbox.minY - 6 } },
      { type: 'bl' as HandleType, local: { x: bbox.minX - 6, y: bbox.maxY - 6 } },
      { type: 'br' as HandleType, local: { x: bbox.maxX - 6, y: bbox.maxY - 6 } },
      { type: 'rotate' as HandleType, local: { x: center.x - 8, y: bbox.minY - 40 } },
    ];

    return handles.map(h => {
      const rotated = rotateAroundCenter({ x: h.local.x + 6, y: h.local.y + 6 });
      return {
        type: h.type,
        x: rotated.x - (h.type === 'rotate' ? 9 : 6),
        y: rotated.y - (h.type === 'rotate' ? 9 : 6),
      };
    });
  };

  const getHandleAtPoint = (point: Point): { elementId: string; handleType: HandleType } | null => {
    if (!selectedElementId) return null;
    const element = elements.find(e => e.id === selectedElementId);
    if (!element || element.type !== 'line') return null;

    const handles = getHandles(element);
    for (const handle of handles) {
      const handleCenter = {
        x: handle.x + (handle.type === 'rotate' ? 9 : 6),
        y: handle.y + (handle.type === 'rotate' ? 9 : 6),
      };
      if (distance(point, handleCenter) < 18) {
        return { elementId: element.id, handleType: handle.type };
      }
    }
    return null;
  };

  const startDrag = (elementId: string, handleType: HandleType, pos: Point, startElementX: number, startElementY: number, startRotation: number, startPoints: Point[] = []) => {
    dragStateRef.current = {
      isDragging: true,
      elementId,
      handleType,
      startX: pos.x,
      startY: pos.y,
      startElementX,
      startElementY,
      startRotation,
      startPoints: [...startPoints],
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasCoords(e.clientX, e.clientY);

    if (currentTool === 'pen') {
      setIsDrawing(true);
      setDrawingPoints([pos]);
      setShowCursorLabel(true);
      setMousePos(pos);
      updateLabelPosition(e.clientX - e.currentTarget.getBoundingClientRect().left,
                          e.clientY - e.currentTarget.getBoundingClientRect().top);
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return;
    }

    if (currentTool === 'eraser') {
      const line = findLineAtPoint(pos);
      if (line) {
        removeElement(line.id);
      }
      return;
    }

    if (currentTool === 'delete') {
      const line = findLineAtPoint(pos);
      if (line) {
        removeElement(line.id);
      }
      return;
    }

    if (currentTool === 'select' || currentTool === 'text') {
      const handleInfo = getHandleAtPoint(pos);
      if (handleInfo) {
        const element = elements.find(e => e.id === handleInfo.elementId) as LineElement;
        if (element) {
          startDrag(
            handleInfo.elementId,
            handleInfo.handleType,
            pos,
            element.x,
            element.y,
            element.rotation,
            element.smoothedPoints,
          );
          return;
        }
      }

      const line = findLineAtPoint(pos);
      if (line) {
        setSelectedElement(line.id);
        startDrag(line.id, 'move', pos, line.x, line.y, line.rotation);
        return;
      }

      setSelectedElement(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragStateRef.current.isDragging) return;

    const containerRect = e.currentTarget.getBoundingClientRect();
    const pos = getCanvasCoords(e.clientX, e.clientY);
    setMousePos(pos);
    updateLabelPosition(e.clientX - containerRect.left, e.clientY - containerRect.top);

    if (isDrawing && currentTool === 'pen') {
      setDrawingPoints(prev => {
        const lastPoint = prev[prev.length - 1];
        if (!lastPoint || distance(lastPoint, pos) > 2) {
          return [...prev, pos];
        }
        return prev;
      });
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentTool !== 'text') return;
    const pos = getCanvasCoords(e.clientX, e.clientY);

    addElement({
      type: 'stickyNote',
      content: '',
      x: pos.x - 90,
      y: pos.y - 60,
      width: 200,
      height: 140,
      rotation: 0,
      isNew: true,
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      pinchStateRef.current = {
        active: true,
        initialDistance: dist,
        initialScale: scale,
      };
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      const pos = getCanvasCoords(touch.clientX, touch.clientY);
      if (currentTool === 'pen') {
        setIsDrawing(true);
        setDrawingPoints([pos]);
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 2 && pinchStateRef.current.active) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      const newScale = pinchStateRef.current.initialScale * (dist / pinchStateRef.current.initialDistance);
      setScale(Math.max(0.5, Math.min(3, newScale)));
    } else if (e.touches.length === 1 && isDrawing) {
      const touch = e.touches[0];
      const pos = getCanvasCoords(touch.clientX, touch.clientY);
      setDrawingPoints(prev => [...prev, pos]);
    } else if (e.touches.length === 1 && currentTool === 'select') {
      const touch = e.touches[0];
      setOffset(prev => ({
        x: prev.x + touch.clientX - (touch as Touch & { prevX?: number }).prevX!,
        y: prev.y + touch.clientY - (touch as Touch & { prevY?: number }).prevY!,
      }));
      (touch as Touch & { prevX?: number }).prevX = touch.clientX;
      (touch as Touch & { prevY?: number }).prevY = touch.clientY;
    }
  };

  const handleTouchEnd = () => {
    pinchStateRef.current.active = false;
    if (isDrawing) {
      handleGlobalMouseUp();
    }
  };

  const selectedElement = selectedElementId
    ? elements.find(e => e.id === selectedElementId) as LineElement | null
    : null;

  return (
    <>
      <style>{`
        .canvas-container {
          position: fixed;
          top: 48px;
          left: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
          background: #f5f5f5;
          touch-action: none;
        }

        .canvas-element {
          display: block;
          cursor: crosshair;
        }

        .cursor-label {
          position: absolute;
          pointer-events: none;
          background: rgba(30, 41, 59, 0.92);
          color: white;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-family: 'SF Mono', Monaco, monospace;
          z-index: 1000;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
          transition: opacity 0.15s ease;
          backdrop-filter: blur(4px);
        }

        .cursor-label.hidden {
          opacity: 0;
        }

        .cursor-color-preview {
          width: 14px;
          height: 14px;
          border-radius: 3px;
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
        }

        .cursor-label-text {
          display: flex;
          flex-direction: column;
          line-height: 1.3;
        }

        .cursor-coords {
          color: #94a3b8;
          font-size: 10px;
        }

        .handle {
          position: absolute;
          width: 12px;
          height: 12px;
          background: white;
          border: 2px solid #3b82f6;
          border-radius: 2px;
          cursor: pointer;
          z-index: 50;
          box-sizing: border-box;
          transition: transform 0.1s ease;
        }

        .handle:hover {
          background: #3b82f6;
          transform: scale(1.15);
        }

        .handle.rotate {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          cursor: grab;
          background: #3b82f6;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
        }

        .handle.rotate:hover {
          transform: scale(1.2);
          background: #2563eb;
          cursor: grabbing;
        }

        .handle.rotate::after {
          content: '↻';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-size: 10px;
          font-weight: bold;
        }

        .rotate-line {
          position: absolute;
          width: 2px;
          background: #3b82f6;
          z-index: 49;
          transform-origin: top center;
        }

        .selection-outline {
          position: absolute;
          border: 1.5px dashed #3b82f6;
          pointer-events: none;
          z-index: 40;
          border-radius: 2px;
        }

        .sticky-notes-layer {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }

        .sticky-notes-layer > * {
          pointer-events: auto;
        }
      `}</style>

      <div className="canvas-container" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="canvas-element"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onDoubleClick={handleDoubleClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />

        <div
          ref={cursorLabelRef}
          className={`cursor-label ${!showCursorLabel && !isDrawing ? 'hidden' : ''}`}
          style={{
            left: labelPosition.left,
            top: labelPosition.top,
          }}
        >
          <div
            className="cursor-color-preview"
            style={{ backgroundColor: currentColor }}
          />
          <div className="cursor-label-text">
            <span>{currentColor}</span>
            <span className="cursor-coords">
              ({Math.round(mousePos.x)}, {Math.round(mousePos.y)})
            </span>
          </div>
        </div>

        <div className="sticky-notes-layer" style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: '0 0' }}>
          {elements
            .filter(e => e.type === 'stickyNote')
            .map(element => (
              <StickyNote
                key={element.id}
                element={element}
                onDragStart={(e) => {
                  const pos = getCanvasCoords(e.clientX, e.clientY);
                  startDrag(element.id, 'move', pos, element.x, element.y, element.rotation);
                }}
              />
            ))}
        </div>

        {selectedElement && selectedElement.type === 'line' && (() => {
          const bbox = getBoundingBox(selectedElement.smoothedPoints);
          const handles = getHandles(selectedElement);
          const center = getCenter(bbox);

          const rad = (selectedElement.rotation * Math.PI) / 180;
          const cos = Math.cos(rad);
          const sin = Math.sin(rad);

          const rotateScreenPoint = (p: Point): Point => {
            const dx = p.x - center.x;
            const dy = p.y - center.y;
            return {
              x: center.x + dx * cos - dy * sin + selectedElement.x,
              y: center.y + dx * sin + dy * cos + selectedElement.y,
            };
          };

          const topCenter = rotateScreenPoint({ x: center.x, y: bbox.minY });
          const rotateHandleCenter = rotateScreenPoint({ x: center.x, y: bbox.minY - 30 });

          const outlineTopLeft = rotateScreenPoint({ x: bbox.minX, y: bbox.minY });
          const outlineTopRight = rotateScreenPoint({ x: bbox.maxX, y: bbox.minY });
          const outlineBottomLeft = rotateScreenPoint({ x: bbox.minX, y: bbox.maxY });
          const outlineBottomRight = rotateScreenPoint({ x: bbox.maxX, y: bbox.maxY });

          const allOutlineX = [outlineTopLeft.x, outlineTopRight.x, outlineBottomLeft.x, outlineBottomRight.x];
          const allOutlineY = [outlineTopLeft.y, outlineTopRight.y, outlineBottomLeft.y, outlineBottomRight.y];
          const outlineMinX = Math.min(...allOutlineX);
          const outlineMaxX = Math.max(...allOutlineX);
          const outlineMinY = Math.min(...allOutlineY);
          const outlineMaxY = Math.max(...allOutlineY);

          const lineAngle = getAngle(topCenter, rotateHandleCenter);

          return (
            <>
              <svg
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  zIndex: 40,
                }}
              >
                <g transform={`translate(${offset.x}, ${offset.y}) scale(${scale})`}>
                  <polygon
                    points={`
                      ${outlineTopLeft.x},${outlineTopLeft.y}
                      ${outlineTopRight.x},${outlineTopRight.y}
                      ${outlineBottomRight.x},${outlineBottomRight.y}
                      ${outlineBottomLeft.x},${outlineBottomLeft.y}
                    `}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="1.5"
                    strokeDasharray="6 4"
                  />
                  <line
                    x1={topCenter.x}
                    y1={topCenter.y}
                    x2={rotateHandleCenter.x}
                    y2={rotateHandleCenter.y}
                    stroke="#3b82f6"
                    strokeWidth="2"
                  />
                </g>
              </svg>

              {handles.map((handle, index) => (
                <div
                  key={index}
                  className={`handle ${handle.type}`}
                  style={{
                    left: handle.x * scale + offset.x,
                    top: handle.y * scale + offset.y,
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const pos = getCanvasCoords(e.clientX, e.clientY);
                    startDrag(
                      selectedElement.id,
                      handle.type,
                      pos,
                      selectedElement.x,
                      selectedElement.y,
                      selectedElement.rotation,
                      selectedElement.smoothedPoints,
                    );
                  }}
                />
              ))}
            </>
          );
        })()}
      </div>
    </>
  );
};

export default Canvas;
