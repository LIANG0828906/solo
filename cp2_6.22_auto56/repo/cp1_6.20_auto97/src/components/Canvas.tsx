import React, { useRef, useEffect, useState, useCallback } from 'react';
import rough from 'roughjs';
import { getStroke } from 'perfect-freehand';
import type { Point, Shape, ToolType, ArrowShape, PenShape } from '../types';
import { hitTest, getResizeHandles, getShapeBounds } from '../utils/shapeSmoothing';

interface CanvasProps {
  shapes: Shape[];
  selectedIds: string[];
  currentTool: ToolType;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  fontSize: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
  isPanning: boolean;
  isSpacePressed: boolean;
  onShapeAdd: (shape: Shape) => void;
  onShapeUpdate: (id: string, updates: Partial<Shape>) => void;
  onShapeDelete: (ids: string[]) => void;
  onSelectionChange: (ids: string[]) => void;
  onZoomChange: (zoom: number) => void;
  onOffsetChange: (x: number, y: number) => void;
  onPanningChange: (panning: boolean) => void;
  onTextCreate: (x: number, y: number) => void;
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
}

const Canvas: React.FC<CanvasProps> = ({
  shapes,
  selectedIds,
  currentTool,
  strokeColor,
  fillColor,
  strokeWidth,
  fontSize,
  zoom,
  offsetX,
  offsetY,
  isPanning,
  isSpacePressed,
  onShapeAdd,
  onShapeUpdate,
  onShapeDelete,
  onSelectionChange,
  onZoomChange,
  onOffsetChange,
  onPanningChange,
  onTextCreate,
  canvasRef
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const dragStartRef = useRef<Point | null>(null);
  const currentShapeRef = useRef<Shape | null>(null);
  const resizeHandleRef = useRef<string | null>(null);
  const dragOffsetsRef = useRef<Map<string, Point>>(new Map());
  const selectionStartRef = useRef<Point | null>(null);
  const selectionEndRef = useRef<Point | null>(null);
  const isSelectingRef = useRef(false);
  const animFrameRef = useRef<number>(0);
  const penPointsRef = useRef<Point[]>([]);
  const fadingShapesRef = useRef<Map<string, number>>(new Map());

  const [, forceUpdate] = useState(0);

  const screenToCanvas = useCallback((screenX: number, screenY: number): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (screenX - rect.left - offsetX) / zoom,
      y: (screenY - rect.top - offsetY) / zoom
    };
  }, [offsetX, offsetY, zoom, canvasRef]);

  const getSvgPathFromStroke = (points: number[][]): string => {
    if (points.length === 0) return '';
    
    const d: string[] = [];
    d.push(`M ${points[0][0]} ${points[0][1]}`);
    
    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i][0] + points[i + 1][0]) / 2;
      const yc = (points[i][1] + points[i + 1][1]) / 2;
      d.push(`Q ${points[i][0]} ${points[i][1]} ${xc} ${yc}`);
    }
    
    if (points.length > 1) {
      const last = points[points.length - 1];
      d.push(`L ${last[0]} ${last[1]}`);
    }
    
    return d.join(' ');
  };

  const drawFreehandStroke = (ctx: CanvasRenderingContext2D, points: Point[], color: string, baseSize: number, isPreview: boolean = false) => {
    if (points.length < 2) return;

    const strokePoints = points.map(p => [p.x, p.y, p.pressure || 0.5] as [number, number, number]);
    
    const stroke = getStroke(strokePoints, {
      size: baseSize * (isPreview ? 1.1 : 1),
      thinning: 0.5,
      smoothing: isPreview ? 0.3 : 0.6,
      streamline: isPreview ? 0.3 : 0.5,
      easing: (t: number) => t * t
    });

    if (stroke.length < 2) return;

    const pathData = getSvgPathFromStroke(stroke);
    if (!pathData) return;

    ctx.save();
    
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = color;
    ctx.filter = 'blur(2px)';
    const path = new Path2D(pathData);
    ctx.fill(path);
    
    ctx.globalAlpha = 1;
    ctx.filter = 'none';
    ctx.fillStyle = color;
    const mainPath = new Path2D(pathData);
    ctx.fill(mainPath);

    ctx.restore();
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);
    
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(zoom, zoom);

    const rc = rough.canvas(canvas);

    for (const shape of shapes) {
      const fadingOpacity = fadingShapesRef.current.get(shape.id);
      if (fadingOpacity !== undefined) {
        ctx.globalAlpha = fadingOpacity;
      }
      drawShape(ctx, rc, shape);
      ctx.globalAlpha = 1;
    }

    for (const id of selectedIds) {
      const shape = shapes.find(s => s.id === id);
      if (shape) {
        drawSelection(ctx, shape);
      }
    }

    if (currentShapeRef.current && isDrawingRef.current) {
      drawShape(ctx, rc, currentShapeRef.current, true);
    }

    if (isSelectingRef.current && selectionStartRef.current && selectionEndRef.current) {
      const start = selectionStartRef.current;
      const end = selectionEndRef.current;
      ctx.save();
      ctx.strokeStyle = '#E67E22';
      ctx.lineWidth = 1 / zoom;
      ctx.setLineDash([5 / zoom, 5 / zoom]);
      ctx.strokeRect(
        Math.min(start.x, end.x),
        Math.min(start.y, end.y),
        Math.abs(end.x - start.x),
        Math.abs(end.y - start.y)
      );
      ctx.fillStyle = 'rgba(230, 126, 34, 0.1)';
      ctx.fillRect(
        Math.min(start.x, end.x),
        Math.min(start.y, end.y),
        Math.abs(end.x - start.x),
        Math.abs(end.y - start.y)
      );
      ctx.restore();
    }

    ctx.restore();
  }, [shapes, selectedIds, offsetX, offsetY, zoom, canvasRef]);

  const drawShape = (ctx: CanvasRenderingContext2D, rc: any, shape: Shape, isPreview: boolean = false) => {
    ctx.save();
    if (shape.opacity !== undefined) {
      ctx.globalAlpha = shape.opacity;
    }

    const options = {
      stroke: shape.strokeColor,
      fill: shape.fillColor,
      strokeWidth: shape.strokeWidth,
      roughness: isPreview ? 2.5 : 1.2,
      bowing: isPreview ? 2 : 1,
      seed: shape.roughSeed
    };

    switch (shape.type) {
      case 'pen': {
        if (shape.points && shape.points.length > 1) {
          drawFreehandStroke(ctx, shape.points, shape.strokeColor, shape.strokeWidth, isPreview);
        }
        break;
      }
      case 'rectangle':
        ctx.save();
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = shape.strokeColor;
        ctx.filter = 'blur(1px)';
        ctx.fillRect(shape.x - 1, shape.y - 1, shape.width + 2, shape.height + 2);
        ctx.restore();
        rc.rectangle(shape.x, shape.y, shape.width, shape.height, options);
        break;
      case 'diamond': {
        const cx = shape.x + shape.width / 2;
        const cy = shape.y + shape.height / 2;
        const points = [
          [cx, shape.y],
          [shape.x + shape.width, cy],
          [cx, shape.y + shape.height],
          [shape.x, cy]
        ] as [number, number][];
        
        ctx.save();
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = shape.strokeColor;
        ctx.filter = 'blur(1px)';
        ctx.beginPath();
        ctx.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i][0], points[i][1]);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        
        rc.polygon(points, options);
        break;
      }
      case 'arrow': {
        const arrow = shape as ArrowShape;
        
        ctx.save();
        ctx.globalAlpha = 0.1;
        ctx.strokeStyle = shape.strokeColor;
        ctx.lineWidth = shape.strokeWidth + 2;
        ctx.filter = 'blur(1px)';
        ctx.beginPath();
        ctx.moveTo(arrow.startX, arrow.startY);
        ctx.lineTo(arrow.endX, arrow.endY);
        ctx.stroke();
        ctx.restore();
        
        rc.line(arrow.startX, arrow.startY, arrow.endX, arrow.endY, options);
        
        const angle = Math.atan2(arrow.endY - arrow.startY, arrow.endX - arrow.startX);
        const arrowSize = 10 + shape.strokeWidth * 2;
        
        const x1 = arrow.endX - arrowSize * Math.cos(angle - Math.PI / 6);
        const y1 = arrow.endY - arrowSize * Math.sin(angle - Math.PI / 6);
        const x2 = arrow.endX - arrowSize * Math.cos(angle + Math.PI / 6);
        const y2 = arrow.endY - arrowSize * Math.sin(angle + Math.PI / 6);
        
        rc.line(arrow.endX, arrow.endY, x1, y1, options);
        rc.line(arrow.endX, arrow.endY, x2, y2, options);
        break;
      }
      case 'text': {
        ctx.font = `${shape.fontSize}px 'Kalam', cursive`;
        ctx.fillStyle = shape.strokeColor;
        ctx.textBaseline = 'top';
        
        ctx.save();
        ctx.globalAlpha = 0.1;
        ctx.filter = 'blur(0.5px)';
        ctx.fillText(shape.text || '', shape.x + 0.5, shape.y + 0.5);
        ctx.restore();
        
        ctx.fillText(shape.text || '', shape.x, shape.y);
        break;
      }
    }

    ctx.restore();
  };

  const drawSelection = (ctx: CanvasRenderingContext2D, shape: Shape) => {
    ctx.save();
    
    const time = Date.now() / 500;
    const dashOffset = (time % 1) * 20;
    
    ctx.strokeStyle = '#E67E22';
    ctx.lineWidth = 2 / zoom;
    ctx.setLineDash([6 / zoom, 4 / zoom]);
    ctx.lineDashOffset = -dashOffset;
    ctx.strokeRect(shape.x - 5 / zoom, shape.y - 5 / zoom, shape.width + 10 / zoom, shape.height + 10 / zoom);
    
    ctx.setLineDash([]);
    ctx.fillStyle = '#D35400';
    
    const handles = getResizeHandles(shape);
    for (const handle of handles) {
      ctx.fillRect(handle.x - 1 / zoom, handle.y - 1 / zoom, 10 / zoom, 10 / zoom);
    }
    
    ctx.fillStyle = '#E67E22';
    for (const handle of handles) {
      ctx.fillRect(handle.x + 1 / zoom, handle.y + 1 / zoom, 6 / zoom, 6 / zoom);
    }
    
    ctx.restore();
  };

  useEffect(() => {
    let lastTime = 0;
    const render = (time: number) => {
      if (time - lastTime >= 16) {
        draw();
        lastTime = time;
      }
      animFrameRef.current = requestAnimationFrame(render);
    };
    animFrameRef.current = requestAnimationFrame(render);
    
    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [draw]);

  useEffect(() => {
    const handleResize = () => {
      forceUpdate(n => n + 1);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getShapeAtPoint = (x: number, y: number): Shape | null => {
    for (let i = shapes.length - 1; i >= 0; i--) {
      if (hitTest(shapes[i], x, y)) {
        return shapes[i];
      }
    }
    return null;
  };

  const getResizeHandleAtPoint = (x: number, y: number): string | null => {
    for (const id of selectedIds) {
      const shape = shapes.find(s => s.id === id);
      if (!shape) continue;
      const handles = getResizeHandles(shape);
      for (const handle of handles) {
        const hx = handle.x + 4 / zoom;
        const hy = handle.y + 4 / zoom;
        if (Math.abs(x - hx) < 10 / zoom && Math.abs(y - hy) < 10 / zoom) {
          resizeHandleRef.current = handle.id;
          return handle.id;
        }
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    
    const point = screenToCanvas(e.clientX, e.clientY);
    point.pressure = 0.5;
    
    if (isSpacePressed) {
      onPanningChange(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (currentTool === 'select') {
      const handle = getResizeHandleAtPoint(point.x, point.y);
      if (handle && selectedIds.length === 1) {
        isResizingRef.current = true;
        dragStartRef.current = point;
        const shape = shapes.find(s => s.id === selectedIds[0]);
        if (shape) {
          currentShapeRef.current = { ...shape };
        }
        return;
      }
      
      const shape = getShapeAtPoint(point.x, point.y);
      if (shape) {
        if (e.shiftKey) {
          if (selectedIds.includes(shape.id)) {
            onSelectionChange(selectedIds.filter(id => id !== shape.id));
          } else {
            onSelectionChange([...selectedIds, shape.id]);
          }
        } else if (!selectedIds.includes(shape.id)) {
          onSelectionChange([shape.id]);
        }
        
        isDraggingRef.current = true;
        dragStartRef.current = point;
        dragOffsetsRef.current.clear();
        for (const id of selectedIds) {
          const s = shapes.find(shape => shape.id === id);
          if (s) {
            dragOffsetsRef.current.set(id, { x: point.x - s.x, y: point.y - s.y });
          }
        }
      } else {
        isSelectingRef.current = true;
        selectionStartRef.current = point;
        selectionEndRef.current = point;
        if (!e.shiftKey) {
          onSelectionChange([]);
        }
      }
      return;
    }

    if (currentTool === 'text') {
      onTextCreate(point.x, point.y);
      return;
    }

    if (currentTool === 'eraser') {
      isDrawingRef.current = true;
      dragStartRef.current = point;
      eraseAtPoint(point.x, point.y);
      return;
    }

    isDrawingRef.current = true;
    dragStartRef.current = point;

    if (currentTool === 'pen') {
      penPointsRef.current = [{ ...point, pressure: 0.5 }];
      currentShapeRef.current = {
        id: 'temp-' + Date.now(),
        type: 'pen',
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
        strokeColor,
        fillColor,
        strokeWidth,
        rotation: 0,
        opacity: 1,
        roughSeed: Math.floor(Math.random() * 100000),
        points: [{ ...point, pressure: 0.5 }]
      } as PenShape;
    } else if (currentTool === 'rectangle' || currentTool === 'diamond') {
      currentShapeRef.current = {
        id: 'temp-' + Date.now(),
        type: currentTool,
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
        strokeColor,
        fillColor,
        strokeWidth,
        rotation: 0,
        opacity: 1,
        roughSeed: Math.floor(Math.random() * 100000)
      } as Shape;
    } else if (currentTool === 'arrow') {
      currentShapeRef.current = {
        id: 'temp-' + Date.now(),
        type: 'arrow',
        x: point.x,
        y: point.y,
        width: 0,
        height: 0,
        startX: point.x,
        startY: point.y,
        endX: point.x,
        endY: point.y,
        strokeColor,
        fillColor,
        strokeWidth,
        rotation: 0,
        opacity: 1,
        roughSeed: Math.floor(Math.random() * 100000)
      } as Shape;
    }
  };

  const eraseAtPoint = (x: number, y: number) => {
    const eraserSize = 20 / zoom;
    const toDelete: string[] = [];
    
    for (const shape of shapes) {
      if (fadingShapesRef.current.has(shape.id)) continue;
      
      if (shape.type === 'pen' && shape.points) {
        for (const p of shape.points) {
          if (Math.abs(p.x - x) < eraserSize && Math.abs(p.y - y) < eraserSize) {
            toDelete.push(shape.id);
            break;
          }
        }
      } else {
        if (x >= shape.x - eraserSize && x <= shape.x + shape.width + eraserSize &&
            y >= shape.y - eraserSize && y <= shape.y + shape.height + eraserSize) {
          toDelete.push(shape.id);
        }
      }
    }
    
    if (toDelete.length > 0) {
      for (const id of toDelete) {
        fadingShapesRef.current.set(id, 1);
      }
      
      const fadeOut = () => {
        let allDone = true;
        for (const [id, opacity] of fadingShapesRef.current) {
          const newOpacity = opacity - 0.05;
          if (newOpacity > 0) {
            fadingShapesRef.current.set(id, newOpacity);
            allDone = false;
          }
        }
        
        if (!allDone) {
          requestAnimationFrame(fadeOut);
        } else {
          const ids = Array.from(fadingShapesRef.current.keys());
          fadingShapesRef.current.clear();
          onShapeDelete(ids);
        }
      };
      
      requestAnimationFrame(fadeOut);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && dragStartRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      onOffsetChange(offsetX + dx, offsetY + dy);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const point = screenToCanvas(e.clientX, e.clientY);
    point.pressure = 0.5 + Math.random() * 0.1;

    if (isResizingRef.current && currentShapeRef.current && dragStartRef.current) {
      const shape = currentShapeRef.current;
      const dx = point.x - dragStartRef.current.x;
      const dy = point.y - dragStartRef.current.y;
      const handle = resizeHandleRef.current;
      
      let newX = shape.x;
      let newY = shape.y;
      let newWidth = shape.width;
      let newHeight = shape.height;

      switch (handle) {
        case 'nw':
          newX = shape.x + dx;
          newY = shape.y + dy;
          newWidth = shape.width - dx;
          newHeight = shape.height - dy;
          break;
        case 'n':
          newY = shape.y + dy;
          newHeight = shape.height - dy;
          break;
        case 'ne':
          newY = shape.y + dy;
          newWidth = shape.width + dx;
          newHeight = shape.height - dy;
          break;
        case 'e':
          newWidth = shape.width + dx;
          break;
        case 'se':
          newWidth = shape.width + dx;
          newHeight = shape.height + dy;
          break;
        case 's':
          newHeight = shape.height + dy;
          break;
        case 'sw':
          newX = shape.x + dx;
          newWidth = shape.width - dx;
          newHeight = shape.height + dy;
          break;
        case 'w':
          newX = shape.x + dx;
          newWidth = shape.width - dx;
          break;
      }

      if (newWidth < 10) {
        newWidth = 10;
        if (handle?.includes('w') || handle === 'nw' || handle === 'sw') {
          newX = shape.x + shape.width - 10;
        }
      }
      if (newHeight < 10) {
        newHeight = 10;
        if (handle?.includes('n') || handle === 'nw' || handle === 'ne') {
          newY = shape.y + shape.height - 10;
        }
      }

      currentShapeRef.current = { ...shape, x: newX, y: newY, width: newWidth, height: newHeight };
      dragStartRef.current = point;
      
      if (selectedIds.length > 0) {
        onShapeUpdate(selectedIds[0], { x: newX, y: newY, width: newWidth, height: newHeight });
      }
      return;
    }

    if (isDraggingRef.current && dragStartRef.current) {
      for (const id of selectedIds) {
        const offset = dragOffsetsRef.current.get(id);
        if (offset) {
          const newX = point.x - offset.x;
          const newY = point.y - offset.y;
          onShapeUpdate(id, { x: newX, y: newY });
        }
      }
      return;
    }

    if (isSelectingRef.current) {
      selectionEndRef.current = point;
      
      const start = selectionStartRef.current;
      if (start) {
        const minX = Math.min(start.x, point.x);
        const maxX = Math.max(start.x, point.x);
        const minY = Math.min(start.y, point.y);
        const maxY = Math.max(start.y, point.y);
        
        const newSelection: string[] = [];
        for (const shape of shapes) {
          if (fadingShapesRef.current.has(shape.id)) continue;
          if (shape.x >= minX && shape.x + shape.width <= maxX &&
              shape.y >= minY && shape.y + shape.height <= maxY) {
            newSelection.push(shape.id);
          }
        }
        
        if (e.shiftKey) {
          const combined = [...new Set([...selectedIds, ...newSelection])];
          onSelectionChange(combined);
        } else {
          onSelectionChange(newSelection);
        }
      }
      return;
    }

    if (isDrawingRef.current && dragStartRef.current) {
      const start = dragStartRef.current;

      if (currentTool === 'pen' && currentShapeRef.current) {
        penPointsRef.current.push({ ...point, pressure: 0.5 + Math.random() * 0.2 });
        const bounds = getShapeBounds(penPointsRef.current);
        currentShapeRef.current = {
          ...currentShapeRef.current,
          points: [...penPointsRef.current],
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height
        } as PenShape;
      } else if (currentTool === 'rectangle' && currentShapeRef.current) {
        currentShapeRef.current = {
          ...currentShapeRef.current,
          x: Math.min(start.x, point.x),
          y: Math.min(start.y, point.y),
          width: Math.abs(point.x - start.x),
          height: Math.abs(point.y - start.y)
        };
      } else if (currentTool === 'diamond' && currentShapeRef.current) {
        currentShapeRef.current = {
          ...currentShapeRef.current,
          x: Math.min(start.x, point.x),
          y: Math.min(start.y, point.y),
          width: Math.abs(point.x - start.x),
          height: Math.abs(point.y - start.y)
        };
      } else if (currentTool === 'arrow' && currentShapeRef.current) {
        currentShapeRef.current = {
          ...currentShapeRef.current,
          endX: point.x,
          endY: point.y,
          x: Math.min(start.x, point.x),
          y: Math.min(start.y, point.y),
          width: Math.abs(point.x - start.x),
          height: Math.abs(point.y - start.y)
        } as Shape;
      } else if (currentTool === 'eraser') {
        eraseAtPoint(point.x, point.y);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isPanning) {
      onPanningChange(false);
      dragStartRef.current = null;
      return;
    }

    if (isResizingRef.current) {
      isResizingRef.current = false;
      resizeHandleRef.current = null;
      currentShapeRef.current = null;
      dragStartRef.current = null;
      return;
    }

    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      dragStartRef.current = null;
      dragOffsetsRef.current.clear();
      return;
    }

    if (isSelectingRef.current) {
      isSelectingRef.current = false;
      selectionStartRef.current = null;
      selectionEndRef.current = null;
      return;
    }

    if (isDrawingRef.current && currentShapeRef.current) {
      if (currentTool !== 'eraser') {
        const shape = { ...currentShapeRef.current, id: 'shape-' + Date.now() };
        if (shape.type !== 'pen' || (shape.points && shape.points.length > 1)) {
          onShapeAdd(shape);
        }
      }
    }

    isDrawingRef.current = false;
    currentShapeRef.current = null;
    dragStartRef.current = null;
    penPointsRef.current = [];
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    const delta = -e.deltaY * 0.001;
    const targetZoom = zoom * (1 + delta);
    const newZoom = Math.max(0.2, Math.min(5, targetZoom));
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const scaleRatio = newZoom / zoom;
    const newOffsetX = mouseX - (mouseX - offsetX) * scaleRatio;
    const newOffsetY = mouseY - (mouseY - offsetY) * scaleRatio;
    
    onZoomChange(newZoom);
    onOffsetChange(newOffsetX, newOffsetY);
  };

  const getCursor = (): string => {
    if (isPanning) return 'grabbing';
    if (isSpacePressed) return 'grab';
    if (currentTool === 'eraser') return 'crosshair';
    if (currentTool === 'text') return 'text';
    return 'default';
  };

  return (
    <div ref={containerRef} className="canvas-area" style={{ cursor: getCursor() }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
      
      <div className="zoom-info">
        缩放: {Math.round(zoom * 100)}%
      </div>
    </div>
  );
};

export default Canvas;
