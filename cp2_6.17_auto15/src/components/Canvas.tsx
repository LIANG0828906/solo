import React, { useRef, useEffect, useState, useCallback, createContext } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useCanvasStore } from '../store/useCanvasStore';
import { drawShape, drawGrid, screenToCanvas, isPointInNote, isPointOnNoteDeleteButton } from '../utils/canvasRenderer';
import { NoteInputModal } from './Notepad';
import type { Shape, Point } from '../types';

const OFFSCREEN_THRESHOLD = 500;

export const OffscreenCanvasContext = createContext<HTMLCanvasElement | null>(null);

const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRectRef = useRef<DOMRect | null>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isDraggingNote, setIsDraggingNote] = useState(false);
  const [dragNoteId, setDragNoteId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [previewShape, setPreviewShape] = useState<Shape | null>(null);
  
  const {
    shapes,
    currentTool,
    currentColor,
    lineWidth,
    fillColor,
    userId,
    viewTransform,
    isPlayback,
    playbackShapes,
    showNoteInput,
    isNotepadInputActive,
    commitNotepadInput,
    cancelNotepadInput,
    setShowNoteInput,
    setIsNotepadInputActive,
    setNotepadInputPosition,
    setNotepadInputContent,
    setViewTransform,
    addShape,
    updateShape,
    deleteShape,
    pushHistory,
    addNote,
  } = useCanvasStore();

  const displayShapes = isPlayback ? playbackShapes : shapes;
  const useOffscreen = displayShapes.length > OFFSCREEN_THRESHOLD;

  const getCanvasSize = useCallback(() => {
    if (!containerRef.current) return { width: 800, height: 600 };
    return {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    };
  }, []);

  const updateCanvasRect = useCallback(() => {
    if (canvasRef.current) {
      canvasRectRef.current = canvasRef.current.getBoundingClientRect();
    }
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { width, height } = getCanvasSize();
    
    if (useOffscreen) {
      if (!offscreenCanvasRef.current) {
        offscreenCanvasRef.current = document.createElement('canvas');
      }
      const offCanvas = offscreenCanvasRef.current;
      offCanvas.width = width;
      offCanvas.height = height;
      const offCtx = offCanvas.getContext('2d');
      if (!offCtx) return;
      
      offCtx.fillStyle = '#FFFFFF';
      offCtx.fillRect(0, 0, width, height);
      drawGrid(offCtx, width, height, viewTransform.offsetX, viewTransform.offsetY, viewTransform.scale);
      
      offCtx.save();
      offCtx.translate(viewTransform.offsetX, viewTransform.offsetY);
      offCtx.scale(viewTransform.scale, viewTransform.scale);
      
      for (const shape of displayShapes) {
        drawShape(offCtx, shape);
      }
      if (previewShape && !isPlayback) {
        drawShape(offCtx, previewShape);
      }
      
      offCtx.restore();
      ctx.drawImage(offCanvas, 0, 0);
    } else {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      drawGrid(ctx, width, height, viewTransform.offsetX, viewTransform.offsetY, viewTransform.scale);
      
      ctx.save();
      ctx.translate(viewTransform.offsetX, viewTransform.offsetY);
      ctx.scale(viewTransform.scale, viewTransform.scale);
      
      for (const shape of displayShapes) {
        drawShape(ctx, shape);
      }
      if (previewShape && !isPlayback) {
        drawShape(ctx, previewShape);
      }
      
      ctx.restore();
    }
  }, [displayShapes, viewTransform, previewShape, useOffscreen, isPlayback, getCanvasSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
      updateCanvasRect();
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('scroll', updateCanvasRect);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('scroll', updateCanvasRect);
    };
  }, [updateCanvasRect]);

  useEffect(() => {
    let animationId: number;
    const animate = () => {
      render();
      animationId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationId);
  }, [render]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPlayback) return;
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useCanvasStore.getState().undo();
      } else if (e.ctrlKey && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        useCanvasStore.getState().redo();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlayback]);

  const getCanvasPos = (e: React.MouseEvent | MouseEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvasRectRef.current || canvas.getBoundingClientRect();
    return screenToCanvas(
      e.clientX - rect.left,
      e.clientY - rect.top,
      viewTransform.offsetX,
      viewTransform.offsetY,
      viewTransform.scale
    );
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPlayback) return;
    
    updateCanvasRect();
    const pos = getCanvasPos(e);
    
    if (e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
      return;
    }
    
    if (isNotepadInputActive) {
      commitNotepadInput();
      return;
    }
    
    if (currentTool === 'note') {
      for (let i = shapes.length - 1; i >= 0; i--) {
        const shape = shapes[i];
        if (shape.type === 'note' && isPointOnNoteDeleteButton(pos.x, pos.y, shape)) {
          pushHistory();
          deleteShape(shape.id);
          return;
        }
      }
      
      for (let i = shapes.length - 1; i >= 0; i--) {
        const shape = shapes[i];
        if (shape.type === 'note' && isPointInNote(pos.x, pos.y, shape)) {
          setIsDraggingNote(true);
          setDragNoteId(shape.id);
          setDragOffset({ x: pos.x - shape.x, y: pos.y - shape.y });
          return;
        }
      }
      
      setShowNoteInput({ x: pos.x, y: pos.y });
      setNotepadInputPosition({ x: pos.x, y: pos.y });
      setIsNotepadInputActive(true);
      setNotepadInputContent('');
      return;
    }
    
    if (currentTool === 'brush' || currentTool === 'eraser') {
      pushHistory();
      const newShape: Shape = {
        id: uuidv4(),
        type: currentTool,
        color: currentColor,
        lineWidth,
        points: [pos],
        createdAt: Date.now(),
        userId,
      };
      setPreviewShape(newShape);
      setIsDrawing(true);
    } else if (currentTool === 'rectangle') {
      pushHistory();
      setPreviewShape({
        id: uuidv4(),
        type: 'rectangle',
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        color: currentColor,
        lineWidth,
        fillColor,
        createdAt: Date.now(),
        userId,
      });
      setIsDrawing(true);
    } else if (currentTool === 'circle') {
      pushHistory();
      setPreviewShape({
        id: uuidv4(),
        type: 'circle',
        x: pos.x,
        y: pos.y,
        radius: 0,
        color: currentColor,
        lineWidth,
        fillColor,
        createdAt: Date.now(),
        userId,
      });
      setIsDrawing(true);
    } else if (currentTool === 'line') {
      pushHistory();
      setPreviewShape({
        id: uuidv4(),
        type: 'line',
        x1: pos.x,
        y1: pos.y,
        x2: pos.x,
        y2: pos.y,
        color: currentColor,
        lineWidth,
        createdAt: Date.now(),
        userId,
      });
      setIsDrawing(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      setViewTransform({
        offsetX: viewTransform.offsetX + dx,
        offsetY: viewTransform.offsetY + dy,
      });
      setLastMousePos({ x: e.clientX, y: e.clientY });
      return;
    }
    
    if (isDraggingNote && dragNoteId) {
      const pos = getCanvasPos(e);
      updateShape(dragNoteId, {
        x: pos.x - dragOffset.x,
        y: pos.y - dragOffset.y,
      } as any);
      return;
    }
    
    if (!isDrawing || !previewShape || isPlayback) return;
    
    const pos = getCanvasPos(e);
    
    if (previewShape.type === 'brush' || previewShape.type === 'eraser') {
      setPreviewShape({
        ...previewShape,
        points: [...(previewShape as any).points, pos],
      });
    } else if (previewShape.type === 'rectangle') {
      const startX = (previewShape as any).x;
      const startY = (previewShape as any).y;
      setPreviewShape({
        ...previewShape,
        width: pos.x - startX,
        height: pos.y - startY,
      });
    } else if (previewShape.type === 'circle') {
      const dx = pos.x - (previewShape as any).x;
      const dy = pos.y - (previewShape as any).y;
      const radius = Math.sqrt(dx * dx + dy * dy);
      setPreviewShape({
        ...previewShape,
        radius,
      });
    } else if (previewShape.type === 'line') {
      setPreviewShape({
        ...previewShape,
        x2: pos.x,
        y2: pos.y,
      });
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }
    
    if (isDraggingNote) {
      setIsDraggingNote(false);
      setDragNoteId(null);
      return;
    }
    
    if (isDrawing && previewShape && !isPlayback) {
      const finalShape = { ...previewShape };
      
      if (finalShape.type === 'rectangle') {
        const rect = finalShape as any;
        if (rect.width < 0) {
          rect.x = rect.x + rect.width;
          rect.width = Math.abs(rect.width);
        }
        if (rect.height < 0) {
          rect.y = rect.y + rect.height;
          rect.height = Math.abs(rect.height);
        }
      }
      
      addShape(finalShape);
      setPreviewShape(null);
    }
    
    setIsDrawing(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    updateCanvasRect();
    const rect = canvasRectRef.current || canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    let newScale = viewTransform.scale * delta;
    newScale = Math.max(0.5, Math.min(4, newScale));
    
    const scaleRatio = newScale / viewTransform.scale;
    
    const newOffsetX = mouseX - (mouseX - viewTransform.offsetX) * scaleRatio;
    const newOffsetY = mouseY - (mouseY - viewTransform.offsetY) * scaleRatio;
    
    setViewTransform({
      scale: newScale,
      offsetX: newOffsetX,
      offsetY: newOffsetY,
    });
  };

  const handleNoteInputSubmit = (text: string) => {
    if (showNoteInput && text.trim()) {
      addNote(showNoteInput.x, showNoteInput.y, text.trim());
    }
    cancelNotepadInput();
  };

  const getNoteInputStyle = () => {
    if (!showNoteInput) return {};
    const canvas = canvasRef.current;
    if (!canvas) return {};
    const rect = canvasRectRef.current || canvas.getBoundingClientRect();
    return {
      position: 'fixed' as const,
      left: showNoteInput.x * viewTransform.scale + viewTransform.offsetX + rect.left,
      top: showNoteInput.y * viewTransform.scale + viewTransform.offsetY + rect.top,
      transform: `scale(${viewTransform.scale})`,
      transformOrigin: 'top left' as const,
      zIndex: 100,
    };
  };

  return (
    <OffscreenCanvasContext.Provider value={offscreenCanvasRef.current}>
      <div
        ref={containerRef}
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
          cursor: isPanning ? 'grabbing' : currentTool === 'note' ? (isDraggingNote ? 'move' : 'pointer') : 'crosshair',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
          }}
        />
        
        {showNoteInput && isNotepadInputActive && !isPlayback && (
          <div style={getNoteInputStyle()}>
            <NoteInputModal
              onSubmit={handleNoteInputSubmit}
              onCancel={cancelNotepadInput}
            />
          </div>
        )}
      </div>
    </OffscreenCanvasContext.Provider>
  );
};

export default Canvas;
