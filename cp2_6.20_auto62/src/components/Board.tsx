import { useEffect, useRef, useState, useCallback } from 'react';
import type {
  Point,
  BoardElement,
  HandleType,
  Tool,
  InteractionState,
  AssetItem,
  Theme,
} from '../types/board';
import { useBoardStore } from '../store/boardStore';
import { useUIStore } from '../store/uiStore';
import { useCanvas } from '../hooks/useCanvas';
import { useDragDrop } from '../hooks/useDragDrop';
import {
  drawGrid,
  drawElement,
  drawSelection,
  drawRipple,
  preloadImage,
} from '../utils/canvasUtils';
import {
  getMousePos,
  snapPointToGrid,
  pointInRect,
  getHandleAtPoint,
  getElementCenter,
  createShapeElement,
  createPathElement,
  createTextElement,
  createImageElement,
  distance,
} from '../utils/geometryUtils';

interface DropData {
  type: 'asset' | 'image';
  asset?: AssetItem;
  src?: string;
}

export default function Board() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const interactionRef = useRef<InteractionState>({
    isDragging: false,
    isDrawing: false,
    isResizing: false,
    isRotating: false,
    isPanning: false,
    activeHandle: null,
    startPoint: null,
    lastPoint: null,
    startElement: null,
  });
  const drawingPathRef = useRef<Point[]>([]);
  const previewShapeRef = useRef<BoardElement | null>(null);
  const [canvasRevealed, setCanvasRevealed] = useState(false);
  const [hoverPos, setHoverPos] = useState<Point | null>(null);

  const board = useBoardStore((s) => s.getActiveBoard());
  const selectedElementId = useBoardStore((s) => s.selectedElementId);
  const addElement = useBoardStore((s) => s.addElement);
  const updateElement = useBoardStore((s) => s.updateElement);
  const selectElement = useBoardStore((s) => s.selectElement);
  const removeElement = useBoardStore((s) => s.removeElement);
  const setOffset = useBoardStore((s) => s.setOffset);
  const setZoom = useBoardStore((s) => s.setZoom);
  const pageTransition = useBoardStore((s) => s.pageTransition);

  const currentTool = useUIStore((s) => s.currentTool);
  const currentColor = useUIStore((s) => s.currentColor);
  const currentStrokeWidth = useUIStore((s) => s.currentStrokeWidth);
  const theme = useUIStore((s) => s.theme);
  const gridColor = useUIStore((s) => s.gridColor);
  const gridOpacity = useUIStore((s) => s.gridOpacity);
  const ripple = useUIStore((s) => s.ripple);
  const triggerRipple = useUIStore((s) => s.triggerRipple);
  const triggerSnapFlash = useUIStore((s) => s.triggerSnapFlash);
  const togglePropertyPanel = useUIStore((s) => s.togglePropertyPanel);

  const boardData = board();
  const elements = boardData?.elements ?? [];
  const zoom = boardData?.zoom ?? 1;
  const offset = boardData?.offset ?? { x: 0, y: 0 };
  const maxZIndex = boardData?.maxZIndex ?? 0;

  const selectedElement = elements.find((e) => e.id === selectedElementId) || null;

  const canvasTheme: Theme = {
    ...theme,
    gridColor,
    gridOpacity,
  };

  useEffect(() => {
    const timer = setTimeout(() => setCanvasRevealed(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    elements.forEach((el) => {
      if (el.type === 'image' && !imageCacheRef.current.has(el.src)) {
        preloadImage(el.src, imageCacheRef.current).catch(() => {});
      }
    });
  }, [elements]);

  const render = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.fillStyle = theme.backgroundColor;
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.scale(zoom, zoom);
      ctx.translate(offset.x, offset.y);

      drawGrid(ctx, width / zoom, height / zoom, 1, { x: 0, y: 0 }, canvasTheme);

      const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);
      sortedElements.forEach((el) => {
        if (el.id === selectedElementId) return;
        drawElement(ctx, el, imageCacheRef.current);
      });

      if (previewShapeRef.current) {
        ctx.globalAlpha = 0.6;
        drawElement(ctx, previewShapeRef.current, imageCacheRef.current);
        ctx.globalAlpha = 1;
      }

      if (selectedElement) {
        drawElement(ctx, selectedElement, imageCacheRef.current);
        drawSelection(ctx, selectedElement, 1);
      }

      if (drawingPathRef.current.length > 1 && currentTool === 'pen') {
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = currentStrokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        const pts = drawingPathRef.current;
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length - 1; i++) {
          const xc = (pts[i].x + pts[i + 1].x) / 2;
          const yc = (pts[i].y + pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
        }
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.stroke();
      }

      ctx.restore();

      if (ripple && ripple.active) {
        const rect = ctx.canvas.getBoundingClientRect();
        const rx = (ripple.x - rect.left) * (ctx.canvas.width / rect.width) / (window.devicePixelRatio || 1);
        const ry = (ripple.y - rect.top) * (ctx.canvas.height / rect.height) / (window.devicePixelRatio || 1);
        drawRipple(ctx, rx, ry, ripple.progress);
      }
    },
    [elements, selectedElementId, selectedElement, zoom, offset, theme, canvasTheme, currentTool, currentColor, currentStrokeWidth, ripple]
  );

  const canvasRef = useCanvas(render, [render]);

  const handleDrop = useCallback(
    (data: DropData, clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const pos = getMousePos(canvas, clientX, clientY, zoom, offset);
      const snapped = snapPointToGrid(pos);
      triggerSnapFlash(clientX, clientY);
      triggerRipple(clientX, clientY);

      if (data.type === 'asset' && data.asset) {
        const el = createImageElement(
          snapped.x - 80,
          snapped.y - 80,
          160,
          160,
          data.asset.thumbnail,
          maxZIndex + 1,
          data.asset.name
        );
        addElement(el);
      } else if (data.type === 'image' && data.src) {
        const img = new Image();
        img.onload = () => {
          const aspectRatio = img.naturalWidth / img.naturalHeight;
          const targetWidth = 200;
          const targetHeight = targetWidth / aspectRatio;
          const el = createImageElement(
            snapped.x - targetWidth / 2,
            snapped.y - targetHeight / 2,
            targetWidth,
            targetHeight,
            data.src!,
            maxZIndex + 1
          );
          preloadImage(data.src!, imageCacheRef.current).catch(() => {});
          addElement(el);
        };
        img.src = data.src;
      }
    },
    [zoom, offset, maxZIndex, addElement, triggerSnapFlash, triggerRipple, canvasRef]
  );

  const { handleDragOver, handleDrop: handleCanvasDrop } = useDragDrop<DropData>(handleDrop);

  const getCursor = useCallback(
    (handle: HandleType): string => {
      const cursorMap: Record<string, string> = {
        nw: 'nwse-resize',
        n: 'ns-resize',
        ne: 'nesw-resize',
        e: 'ew-resize',
        se: 'nwse-resize',
        s: 'ns-resize',
        sw: 'nesw-resize',
        w: 'ew-resize',
        rotate: 'grab',
      };
      return cursorMap[handle || ''] || 'default';
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const state = interactionRef.current;
      const pos = getMousePos(canvas, e.clientX, e.clientY, zoom, offset);

      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        state.isPanning = true;
        state.startPoint = { x: e.clientX, y: e.clientY };
        state.lastPoint = { x: e.clientX, y: e.clientY };
        return;
      }

      if (currentTool === 'select') {
        if (selectedElement) {
          const handle = getHandleAtPoint(pos, selectedElement, 1);
          if (handle) {
            if (handle === 'rotate') {
              state.isRotating = true;
            } else {
              state.isResizing = true;
            }
            state.activeHandle = handle as HandleType;
            state.startPoint = pos;
            state.lastPoint = pos;
            state.startElement = JSON.parse(JSON.stringify(selectedElement));
            return;
          }
        }

        const sorted = [...elements].sort((a, b) => b.zIndex - a.zIndex);
        const clicked = sorted.find((el) => pointInRect(pos, el, 4));

        if (clicked) {
          selectElement(clicked.id);
          togglePropertyPanel(true);
          state.isDragging = true;
          state.startPoint = pos;
          state.lastPoint = pos;
          state.startElement = JSON.parse(JSON.stringify(clicked));
        } else {
          selectElement(null);
          togglePropertyPanel(false);
        }
        return;
      }

      if (currentTool === 'pen') {
        state.isDrawing = true;
        drawingPathRef.current = [pos];
        return;
      }

      if (currentTool === 'rectangle' || currentTool === 'ellipse') {
        const snapped = snapPointToGrid(pos);
        state.isDrawing = true;
        state.startPoint = snapped;
        state.lastPoint = snapped;
        return;
      }

      if (currentTool === 'text') {
        const snapped = snapPointToGrid(pos);
        const text = prompt('请输入文本内容:', '文本');
        if (text && text.trim()) {
          const el = createTextElement(snapped.x, snapped.y, text, currentColor, maxZIndex + 1);
          addElement(el);
        }
        return;
      }

      if (currentTool === 'eraser') {
        const sorted = [...elements].sort((a, b) => b.zIndex - a.zIndex);
        const hit = sorted.find((el) => pointInRect(pos, el, 4));
        if (hit) {
          removeElement(hit.id);
          selectElement(null);
          togglePropertyPanel(false);
        }
      }
    },
    [
      canvasRef,
      zoom,
      offset,
      currentTool,
      elements,
      selectedElement,
      currentColor,
      maxZIndex,
      selectElement,
      addElement,
      removeElement,
      togglePropertyPanel,
    ]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const state = interactionRef.current;
      const pos = getMousePos(canvas, e.clientX, e.clientY, zoom, offset);
      setHoverPos({ x: e.clientX, y: e.clientY });

      if (state.isPanning && state.lastPoint) {
        const dx = (e.clientX - state.lastPoint.x) / zoom;
        const dy = (e.clientY - state.lastPoint.y) / zoom;
        setOffset({ x: offset.x + dx, y: offset.y + dy });
        state.lastPoint = { x: e.clientX, y: e.clientY };
        return;
      }

      if (currentTool === 'select' && !state.isDragging && !state.isResizing && !state.isRotating) {
        if (selectedElement) {
          const handle = getHandleAtPoint(pos, selectedElement, zoom);
          canvas.style.cursor = getCursor(handle as HandleType);
        } else {
          const sorted = [...elements].sort((a, b) => b.zIndex - a.zIndex);
          const hovered = sorted.find((el) => pointInRect(pos, el, 4));
          canvas.style.cursor = hovered ? 'move' : 'default';
        }
        return;
      }

      if (state.isDragging && state.startPoint && state.startElement && selectedElement) {
        const dx = pos.x - state.startPoint.x;
        const dy = pos.y - state.startPoint.y;
        const targetX = state.startElement.x + dx;
        const targetY = state.startElement.y + dy;

        if (e.shiftKey) {
          const snapped = snapPointToGrid({ x: targetX, y: targetY });
          updateElement(selectedElement.id, { x: snapped.x, y: snapped.y });
        } else {
          updateElement(selectedElement.id, { x: targetX, y: targetY });
        }
        return;
      }

      if (state.isResizing && state.startPoint && state.startElement && selectedElement && state.activeHandle) {
        const handle = state.activeHandle;
        const orig = state.startElement;
        const center = getElementCenter(orig);
        const cos = Math.cos((-orig.rotation * Math.PI) / 180);
        const sin = Math.sin((-orig.rotation * Math.PI) / 180);
        const localDx = (pos.x - center.x) * cos - (pos.y - center.y) * sin;
        const localDy = (pos.x - center.x) * sin + (pos.y - center.y) * cos;
        const origDx = (state.startPoint.x - center.x) * cos - (state.startPoint.y - center.y) * sin;
        const origDy = (state.startPoint.x - center.x) * sin + (state.startPoint.y - center.y) * cos;

        let newX = orig.x;
        let newY = orig.y;
        let newW = orig.width;
        let newH = orig.height;

        const deltaX = localDx - origDx;
        const deltaY = localDy - origDy;

        if (handle.includes('e')) newW = Math.max(10, orig.width + deltaX);
        if (handle.includes('w')) {
          newW = Math.max(10, orig.width - deltaX);
          newX = orig.x + (orig.width - newW);
        }
        if (handle.includes('s')) newH = Math.max(10, orig.height + deltaY);
        if (handle.includes('n')) {
          newH = Math.max(10, orig.height - deltaY);
          newY = orig.y + (orig.height - newH);
        }

        updateElement(selectedElement.id, {
          x: newX,
          y: newY,
          width: newW,
          height: newH,
        });
        return;
      }

      if (state.isRotating && state.startPoint && state.startElement && selectedElement) {
        const center = getElementCenter(state.startElement);
        const startAngle = Math.atan2(state.startPoint.y - center.y, state.startPoint.x - center.x);
        const currAngle = Math.atan2(pos.y - center.y, pos.x - center.x);
        let rotation = ((currAngle - startAngle) * 180) / Math.PI + state.startElement.rotation;
        if (e.shiftKey) {
          rotation = Math.round(rotation / 15) * 15;
        }
        updateElement(selectedElement.id, { rotation });
        return;
      }

      if (state.isDrawing && currentTool === 'pen') {
        drawingPathRef.current.push(pos);
        return;
      }

      if (state.isDrawing && (currentTool === 'rectangle' || currentTool === 'ellipse') && state.startPoint) {
        const start = state.startPoint;
        const snappedPos = snapPointToGrid(pos);
        const x = Math.min(start.x, snappedPos.x);
        const y = Math.min(start.y, snappedPos.y);
        const w = Math.max(1, Math.abs(snappedPos.x - start.x));
        const h = Math.max(1, Math.abs(snappedPos.y - start.y));

        previewShapeRef.current = createShapeElement(
          currentTool === 'rectangle' ? 'rectangle' : 'ellipse',
          x,
          y,
          w,
          h,
          currentColor + '55',
          currentColor,
          currentStrokeWidth,
          0
        );
      }
    },
    [
      canvasRef,
      zoom,
      offset,
      currentTool,
      currentColor,
      currentStrokeWidth,
      elements,
      selectedElement,
      setOffset,
      updateElement,
      getCursor,
    ]
  );

  const handleMouseUp = useCallback(() => {
    const state = interactionRef.current;

    if (state.isDrawing && currentTool === 'pen' && drawingPathRef.current.length > 0) {
      const el = createPathElement(
        drawingPathRef.current,
        currentColor,
        currentStrokeWidth,
        maxZIndex + 1
      );
      addElement(el);
      drawingPathRef.current = [];
    }

    if (state.isDrawing && previewShapeRef.current && (currentTool === 'rectangle' || currentTool === 'ellipse')) {
      const preview = previewShapeRef.current;
      if (preview.width > 5 && preview.height > 5) {
        const el = createShapeElement(
          preview.type === 'shape' && 'shapeType' in preview ? preview.shapeType : 'rectangle',
          preview.x,
          preview.y,
          preview.width,
          preview.height,
          currentColor + '55',
          currentColor,
          currentStrokeWidth,
          maxZIndex + 1
        );
        addElement(el);
      }
      previewShapeRef.current = null;
    }

    if (state.isDragging || state.isResizing || state.isRotating) {
      state.startElement = null;
    }

    interactionRef.current = {
      isDragging: false,
      isDrawing: false,
      isResizing: false,
      isRotating: false,
      isPanning: false,
      activeHandle: null,
      startPoint: null,
      lastPoint: null,
      startElement: null,
    };
  }, [currentTool, currentColor, currentStrokeWidth, maxZIndex, addElement]);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / zoom - offset.x;
      const mouseY = (e.clientY - rect.top) / zoom - offset.y;

      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.min(4, Math.max(0.2, zoom * factor));
      const scaleRatio = newZoom / zoom;

      const newOffsetX = (e.clientX - rect.left) / newZoom - mouseX;
      const newOffsetY = (e.clientY - rect.top) / newZoom - mouseY;

      setZoom(newZoom);
      setOffset({ x: newOffsetX * scaleRatio, y: newOffsetY * scaleRatio });
    },
    [canvasRef, zoom, offset, setZoom, setOffset]
  );

  const handleDragOverInternal = useCallback(
    (e: React.DragEvent<HTMLCanvasElement>) => {
      handleDragOver(e);
      setHoverPos({ x: e.clientX, y: e.clientY });
    },
    [handleDragOver]
  );

  const handleDropInternal = useCallback(
    (e: React.DragEvent<HTMLCanvasElement>) => {
      handleCanvasDrop(e);
      setHoverPos(null);
    },
    [handleCanvasDrop]
  );

  void distance;

  return (
    <div
      ref={containerRef}
      className={`board-container ${canvasRevealed ? 'canvas-reveal' : ''}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        className="board-canvas"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          touchAction: 'none',
          cursor: (() => {
            const cursors: Record<Tool, string> = {
              select: 'default',
              pen: 'crosshair',
              rectangle: 'crosshair',
              ellipse: 'crosshair',
              text: 'text',
              eraser: 'cell',
            };
            return cursors[currentTool];
          })(),
          transition: pageTransition.active
            ? `transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)`
            : 'none',
          transform: pageTransition.active
            ? `translateX(${pageTransition.direction === 'right' ? '-30px' : '30px'})`
            : 'translateX(0)',
          opacity: pageTransition.active ? 0.6 : 1,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          handleMouseUp();
          setHoverPos(null);
        }}
        onWheel={handleWheel}
        onDragOver={handleDragOverInternal}
        onDrop={handleDropInternal}
      />

      {hoverPos && (currentTool === 'select' || true) && (
        <div
          style={{
            position: 'fixed',
            pointerEvents: 'none',
            left: hoverPos.x,
            top: hoverPos.y,
            transform: 'translate(-50%, -50%)',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: currentTool === 'select' ? 'var(--color-primary)' : currentColor,
            opacity: 0.4,
            zIndex: 5,
          }}
        />
      )}

      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          borderRadius: 20,
          background: theme.name === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          backdropFilter: 'blur(8px)',
          fontSize: 12,
          opacity: 0.7,
        }}
      >
        <span>{Math.round(zoom * 100)}%</span>
        <span style={{ opacity: 0.4 }}>|</span>
        <span>
          {elements.length} 个元素
        </span>
      </div>
    </div>
  );
}
