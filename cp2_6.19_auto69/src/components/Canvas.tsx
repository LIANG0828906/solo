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
  rotatePoint,
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

const Canvas: React.FC<{ broadcastService: IBroadcastService }> = ({ broadcastService }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    for (let y = Math.floor(startY / gridSize) * gridSize; y < endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }

    elements.forEach((element) => {
      if (element.type === 'line') {
        ctx.save();
        const center = getCenter(getBoundingBox(element.smoothedPoints));
        ctx.translate(element.x + center.x, element.y + center.y);
        ctx.rotate((element.rotation * Math.PI) / 180);
        ctx.translate(-center.x, -center.y);

        ctx.strokeStyle = element.color;
        ctx.lineWidth = element.strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        const points = element.smoothedPoints;
        if (points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
          }
          ctx.stroke();
        }
        ctx.restore();
      }
    });

    if (isDrawing && drawingPoints.length > 1) {
      const smoothedPoints = catmullRomSpline(drawingPoints, 0.5, 3);
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.beginPath();
      ctx.moveTo(smoothedPoints[0].x, smoothedPoints[0].y);
      for (let i = 1; i < smoothedPoints.length; i++) {
        ctx.lineTo(smoothedPoints[i].x, smoothedPoints[i].y);
      }
      ctx.stroke();
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
        const transformedPoints = element.smoothedPoints.map(p => ({
          x: p.x + element.x,
          y: p.y + element.y,
        }));
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

    const handles = [
      { type: 'tl' as HandleType, x: bbox.minX - 6, y: bbox.minY - 6 },
      { type: 'tr' as HandleType, x: bbox.maxX - 6, y: bbox.minY - 6 },
      { type: 'bl' as HandleType, x: bbox.minX - 6, y: bbox.maxY - 6 },
      { type: 'br' as HandleType, x: bbox.maxX - 6, y: bbox.maxY - 6 },
      { type: 'rotate' as HandleType, x: center.x - 8, y: bbox.minY - 40 },
    ];

    return handles.map(h => ({
      ...h,
      x: h.x + element.x,
      y: h.y + element.y,
    }));
  };

  const getHandleAtPoint = (point: Point): { elementId: string; handleType: HandleType } | null => {
    if (!selectedElementId) return null;
    const element = elements.find(e => e.id === selectedElementId);
    if (!element || element.type !== 'line') return null;

    const handles = getHandles(element);
    for (const handle of handles) {
      if (distance(point, { x: handle.x + 8, y: handle.y + 8 }) < 15) {
        return { elementId: element.id, handleType: handle.type };
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasCoords(e.clientX, e.clientY);

    if (currentTool === 'pen') {
      setIsDrawing(true);
      setDrawingPoints([pos]);
      setShowCursorLabel(true);
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
          dragStateRef.current = {
            isDragging: true,
            elementId: handleInfo.elementId,
            handleType: handleInfo.handleType,
            startX: pos.x,
            startY: pos.y,
            startElementX: element.x,
            startElementY: element.y,
            startRotation: element.rotation,
            startPoints: [...element.smoothedPoints],
          };
          return;
        }
      }

      const line = findLineAtPoint(pos);
      if (line) {
        setSelectedElement(line.id);
        dragStateRef.current = {
          isDragging: true,
          elementId: line.id,
          handleType: 'move',
          startX: pos.x,
          startY: pos.y,
          startElementX: line.x,
          startElementY: line.y,
          startRotation: line.rotation,
          startPoints: [],
        };
        return;
      }

      setSelectedElement(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasCoords(e.clientX, e.clientY);
    setMousePos(pos);

    if (isDrawing && currentTool === 'pen') {
      setDrawingPoints(prev => {
        const lastPoint = prev[prev.length - 1];
        if (!lastPoint || distance(lastPoint, pos) > 2) {
          return [...prev, pos];
        }
        return prev;
      });
      return;
    }

    if (dragStateRef.current.isDragging && dragStateRef.current.elementId) {
      const { elementId, handleType, startX, startY, startElementX, startElementY, startRotation, startPoints } = dragStateRef.current;
      const element = elements.find(e => e.id === elementId) as LineElement;
      if (!element) return;

      if (handleType === 'move') {
        const dx = pos.x - startX;
        const dy = pos.y - startY;
        updateElement(elementId, {
          x: startElementX + dx,
          y: startElementY + dy,
        });
      } else if (handleType === 'rotate') {
        const center = getCenter(getBoundingBox(element.smoothedPoints));
        const centerPos = { x: center.x + element.x, y: center.y + element.y };
        const angle = getAngle(centerPos, pos) - getAngle(centerPos, { x: startX, y: startY });
        updateElement(elementId, {
          rotation: startRotation + angle,
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
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && drawingPoints.length > 1) {
      const smoothedPoints = catmullRomSpline(drawingPoints, 0.5, 5);
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
      handleMouseUp();
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
          position: fixed;
          pointer-events: none;
          background: rgba(30, 41, 59, 0.9);
          color: white;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-family: 'SF Mono', Monaco, monospace;
          z-index: 1000;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          transition: opacity 0.15s ease;
        }

        .cursor-label.hidden {
          opacity: 0;
        }

        .cursor-color-preview {
          width: 14px;
          height: 14px;
          border-radius: 3px;
          border: 1px solid rgba(255, 255, 255, 0.5);
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
        }

        .handle:hover {
          background: #3b82f6;
        }

        .handle.rotate {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          cursor: grab;
          background: #3b82f6;
          border-color: white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }

        .handle.rotate:hover {
          transform: scale(1.1);
          background: #2563eb;
        }

        .handle.rotate::after {
          content: '↻';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-size: 10px;
        }

        .rotate-line {
          position: absolute;
          width: 2px;
          background: #3b82f6;
          z-index: 49;
        }

        .selection-outline {
          position: absolute;
          border: 1px dashed #3b82f6;
          pointer-events: none;
          z-index: 40;
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
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />

        <div
          className={`cursor-label ${!showCursorLabel && !isDrawing ? 'hidden' : ''}`}
          style={{
            left: mousePos.x * scale + offset.x + 20,
            top: mousePos.y * scale + offset.y + 68,
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
                  dragStateRef.current = {
                    isDragging: true,
                    elementId: element.id,
                    handleType: 'move',
                    startX: pos.x,
                    startY: pos.y,
                    startElementX: element.x,
                    startElementY: element.y,
                    startRotation: element.rotation,
                    startPoints: [],
                  };
                }}
              />
            ))}
        </div>

        {selectedElement && selectedElement.type === 'line' && (() => {
          const bbox = getBoundingBox(selectedElement.smoothedPoints);
          const handles = getHandles(selectedElement);
          const center = getCenter(bbox);
          const centerX = center.x + selectedElement.x;
          const centerY = center.y + selectedElement.y;

          return (
            <>
              <div
                className="selection-outline"
                style={{
                  left: (bbox.minX + selectedElement.x) * scale + offset.x - 4,
                  top: (bbox.minY + selectedElement.y) * scale + offset.y - 4,
                  width: (bbox.maxX - bbox.minX) * scale + 8,
                  height: (bbox.maxY - bbox.minY) * scale + 8,
                }}
              />
              <div
                className="rotate-line"
                style={{
                  left: centerX * scale + offset.x - 1,
                  top: (bbox.minY + selectedElement.y - 30) * scale + offset.y,
                  height: (centerY - (bbox.minY + selectedElement.y - 30)) * scale,
                }}
              />
              {handles.map((handle, index) => (
                <div
                  key={index}
                  className={`handle ${handle.type}`}
                  style={{
                    left: handle.x * scale + offset.x - (handle.type === 'rotate' ? 9 : 6),
                    top: handle.y * scale + offset.y - (handle.type === 'rotate' ? 9 : 6),
                    transform: handle.type === 'rotate' ? 'none' : undefined,
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const pos = getCanvasCoords(e.clientX, e.clientY);
                    dragStateRef.current = {
                      isDragging: true,
                      elementId: selectedElement.id,
                      handleType: handle.type,
                      startX: pos.x,
                      startY: pos.y,
                      startElementX: selectedElement.x,
                      startElementY: selectedElement.y,
                      startRotation: selectedElement.rotation,
                      startPoints: [...selectedElement.smoothedPoints],
                    };
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
