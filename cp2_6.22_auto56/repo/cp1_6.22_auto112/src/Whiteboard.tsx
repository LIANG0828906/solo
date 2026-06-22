import React, { useEffect, useRef, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useApp, A4_WIDTH, A4_HEIGHT, hexToRgba } from './App';
import { Shape, Connection, CanvasTransform, ToolType } from './types';

interface WhiteboardProps {
  isMobile: boolean;
}

type HandleType = 'nw' | 'ne' | 'sw' | 'se' | null;
type DragType = 'none' | 'pan' | 'draw' | 'move' | 'resize' | 'connect';

interface DragState {
  type: DragType;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  shapeId?: string;
  handle?: HandleType;
  originalShape?: Shape;
  originalTransform?: CanvasTransform;
  tempShape?: Shape;
  connectionStartX?: number;
  connectionStartY?: number;
}

const CANVAS_BG = '#FDF8F0';
const DEFAULT_STROKE = '#888888';
const SELECTED_STROKE = '#4A90D9';
const DEFAULT_FILL = '#FFFFFF';

function screenToWorld(sx: number, sy: number, transform: CanvasTransform) {
  return {
    x: (sx - transform.offsetX) / transform.scale,
    y: (sy - transform.offsetY) / transform.scale
  };
}

function pointInShape(px: number, py: number, shape: Shape): boolean {
  if (shape.type === 'rectangle') {
    return px >= shape.x && px <= shape.x + shape.width && py >= shape.y && py <= shape.y + shape.height;
  } else {
    const cx = shape.x + shape.width / 2;
    const cy = shape.y + shape.height / 2;
    const rx = shape.width / 2;
    const ry = shape.height / 2;
    return ((px - cx) ** 2) / (rx ** 2) + ((py - cy) ** 2) / (ry ** 2) <= 1;
  }
}

function getHandleHit(px: number, py: number, shape: Shape, scale: number): HandleType {
  const handles = [
    { type: 'nw' as const, hx: shape.x, hy: shape.y },
    { type: 'ne' as const, hx: shape.x + shape.width, hy: shape.y },
    { type: 'sw' as const, hx: shape.x, hy: shape.y + shape.height },
    { type: 'se' as const, hx: shape.x + shape.width, hy: shape.y + shape.height }
  ];
  const hitSize = 8 / scale;
  for (const h of handles) {
    if (Math.abs(px - h.hx) <= hitSize && Math.abs(py - h.hy) <= hitSize) {
      return h.type;
    }
  }
  return null;
}

function getShapeHandlePositions(shape: Shape) {
  return [
    { type: 'nw' as const, x: shape.x, y: shape.y },
    { type: 'ne' as const, x: shape.x + shape.width, y: shape.y },
    { type: 'sw' as const, x: shape.x, y: shape.y + shape.height },
    { type: 'se' as const, x: shape.x + shape.width, y: shape.y + shape.height }
  ];
}

function getShapeCenter(shape: Shape) {
  return { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 };
}

function getConnectionEndpoints(source: Shape, target: Shape, curvature: number) {
  const sc = getShapeCenter(source);
  const tc = getShapeCenter(target);
  const dx = tc.x - sc.x;
  const dy = tc.y - sc.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return { sx: sc.x, sy: sc.y, tx: tc.x, ty: tc.y, cx: sc.x, cy: sc.y };

  const ux = dx / len;
  const uy = dy / len;

  let sx = sc.x, sy = sc.y;
  if (source.type === 'rectangle') {
    const halfW = source.width / 2;
    const halfH = source.height / 2;
    const t = Math.min(halfW / Math.abs(ux || 0.0001), halfH / Math.abs(uy || 0.0001));
    sx = sc.x + ux * t;
    sy = sc.y + uy * t;
  } else {
    sx = sc.x + ux * (source.width / 2);
    sy = sc.y + uy * (source.height / 2);
  }

  let tx = tc.x, ty = tc.y;
  if (target.type === 'rectangle') {
    const halfW = target.width / 2;
    const halfH = target.height / 2;
    const t = Math.min(halfW / Math.abs(ux || 0.0001), halfH / Math.abs(uy || 0.0001));
    tx = tc.x - ux * t;
    ty = tc.y - uy * t;
  } else {
    tx = tc.x - ux * (target.width / 2);
    ty = tc.y - uy * (target.height / 2);
  }

  const midX = (sx + tx) / 2;
  const midY = (sy + ty) / 2;
  const perpX = -uy;
  const perpY = ux;
  const curveOffset = len * curvature;
  const cx = midX + perpX * curveOffset;
  const cy = midY + perpY * curveOffset;

  return { sx, sy, tx, ty, cx, cy };
}

function pointToLineDistance(px: number, py: number, sx: number, sy: number, tx: number, ty: number, cx: number, cy: number): number {
  let minDist = Infinity;
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const oneMinusT = 1 - t;
    const bx = oneMinusT * oneMinusT * sx + 2 * oneMinusT * t * cx + t * t * tx;
    const by = oneMinusT * oneMinusT * sy + 2 * oneMinusT * t * cy + t * t * ty;
    const d = Math.sqrt((px - bx) ** 2 + (py - by) ** 2);
    if (d < minDist) minDist = d;
  }
  return minDist;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, fontSize: number): string[] {
  if (!text) return [];
  const words = text.split('');
  const lines: string[] = [];
  let current = '';
  for (const ch of words) {
    const test = current + ch;
    const w = ctx.measureText(test).width;
    if (w > maxWidth && current) {
      lines.push(current);
      current = ch;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export default function Whiteboard({ isMobile }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { state, dispatch, wsBroadcast } = useApp();
  const dragRef = useRef<DragState>({ type: 'none', startX: 0, startY: 0, lastX: 0, lastY: 0 });
  const animRef = useRef<number>(0);
  const mouseWorldRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rightMenuPos, setRightMenuPos] = useState<{ x: number; y: number } | null>(null);

  const exportCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    if (canvas.width !== cw * dpr || canvas.height !== ch * dpr) {
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, cw, ch);

    const t = state.transform;
    ctx.save();
    ctx.translate(t.offsetX, t.offsetY);
    ctx.scale(t.scale, t.scale);

    ctx.fillStyle = CANVAS_BG;
    ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);
    ctx.strokeStyle = '#e0d5c4';
    ctx.lineWidth = 1 / t.scale;
    ctx.strokeRect(0, 0, A4_WIDTH, A4_HEIGHT);

    state.connections.forEach(conn => {
      const src = state.shapes.find(s => s.id === conn.sourceId);
      const tgt = state.shapes.find(s => s.id === conn.targetId);
      if (!src || !tgt) return;
      const eps = getConnectionEndpoints(src, tgt, conn.curvature);

      ctx.globalAlpha = conn.opacity;
      ctx.strokeStyle = state.selectedConnectionId === conn.id ? SELECTED_STROKE : conn.color;
      ctx.lineWidth = conn.width / t.scale;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(eps.sx, eps.sy);
      ctx.quadraticCurveTo(eps.cx, eps.cy, eps.tx, eps.ty);
      ctx.stroke();

      const angle = Math.atan2(eps.ty - eps.cy, eps.tx - eps.cx) * 2 - Math.atan2(eps.cy - eps.sy, eps.cx - eps.sx);
      const arrowSize = 10 / t.scale;
      ctx.fillStyle = state.selectedConnectionId === conn.id ? SELECTED_STROKE : conn.color;
      ctx.beginPath();
      ctx.moveTo(eps.tx, eps.ty);
      ctx.lineTo(eps.tx - arrowSize * Math.cos(angle - Math.PI / 6), eps.ty - arrowSize * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(eps.tx - arrowSize * Math.cos(angle + Math.PI / 6), eps.ty - arrowSize * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    const allShapes = [...state.shapes];
    if (dragRef.current.type === 'draw' && dragRef.current.tempShape) {
      allShapes.push(dragRef.current.tempShape);
    }

    allShapes.forEach(shape => {
      const isSelected = state.selectedShapeId === shape.id;
      const strokeColor = isSelected ? SELECTED_STROKE : shape.strokeColor;

      ctx.fillStyle = hexToRgba(shape.fillColor, 0.3);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = (shape.strokeWidth + (isSelected ? 1 : 0)) / t.scale;

      if (shape.type === 'rectangle') {
        ctx.beginPath();
        ctx.rect(shape.x, shape.y, shape.width, shape.height);
        ctx.fill();
        ctx.stroke();
      } else {
        const cx = shape.x + shape.width / 2;
        const cy = shape.y + shape.height / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, shape.width / 2, shape.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      if (shape.text && shape.text.length > 0) {
        const maxTextWidth = Math.max(shape.width - 10, 20);
        const fontSize = Math.max(10, Math.min(shape.height / 5, 18)) / t.scale;
        ctx.fillStyle = '#333';
        ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const lines = wrapText(ctx, shape.text, maxTextWidth, fontSize);
        const lineHeight = fontSize * 1.2;
        const totalHeight = lines.length * lineHeight;
        const startY = shape.y + shape.height / 2 - totalHeight / 2 + lineHeight / 2;
        lines.forEach((line, i) => {
          ctx.fillText(line, shape.x + shape.width / 2, startY + i * lineHeight);
        });
      }

      if (isSelected) {
        const handles = getShapeHandlePositions(shape);
        ctx.fillStyle = 'white';
        ctx.strokeStyle = SELECTED_STROKE;
        ctx.lineWidth = 1.5 / t.scale;
        const handleSize = 6 / t.scale;
        handles.forEach(h => {
          ctx.beginPath();
          ctx.rect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize);
          ctx.fill();
          ctx.stroke();
        });
      }

      if (state.pendingArrowSource === shape.id) {
        ctx.setLineDash([4 / t.scale, 4 / t.scale]);
        ctx.strokeStyle = SELECTED_STROKE;
        ctx.lineWidth = 2 / t.scale;
        ctx.beginPath();
        if (shape.type === 'rectangle') {
          ctx.rect(shape.x - 4 / t.scale, shape.y - 4 / t.scale, shape.width + 8 / t.scale, shape.height + 8 / t.scale);
        } else {
          ctx.ellipse(shape.x + shape.width / 2, shape.y + shape.height / 2, shape.width / 2 + 5 / t.scale, shape.height / 2 + 5 / t.scale, 0, 0, Math.PI * 2);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    if (dragRef.current.type === 'connect' && dragRef.current.connectionStartX !== undefined) {
      const sx = dragRef.current.connectionStartX;
      const sy = dragRef.current.connectionStartY;
      const tx = mouseWorldRef.current.x;
      const ty = mouseWorldRef.current.y;
      const len = Math.sqrt((tx - sx) ** 2 + (ty - sy) ** 2);
      const ux = (tx - sx) / (len || 1);
      const uy = (ty - sy) / (len || 1);
      const midX = (sx + tx) / 2;
      const midY = (sy + ty) / 2;
      const perpX = -uy;
      const perpY = ux;
      const cx = midX + perpX * len * 0.3;
      const cy = midY + perpY * len * 0.3;

      ctx.setLineDash([6 / t.scale, 4 / t.scale]);
      ctx.strokeStyle = SELECTED_STROKE;
      ctx.lineWidth = 2 / t.scale;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(cx, cy, tx, ty);
      ctx.stroke();
      ctx.setLineDash([]);

      const angle = Math.atan2(ty - cy, tx - cx) * 2 - Math.atan2(cy - sy, cx - sx);
      const arrowSize = 10 / t.scale;
      ctx.fillStyle = SELECTED_STROKE;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx - arrowSize * Math.cos(angle - Math.PI / 6), ty - arrowSize * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(tx - arrowSize * Math.cos(angle + Math.PI / 6), ty - arrowSize * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }, [state]);

  useEffect(() => {
    cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(function loop() {
      render();
      animRef.current = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(animRef.current);
  }, [render]);

  const getCanvasCoords = (e: React.MouseEvent | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 && e.button !== 2) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (state.editingShapeId) {
      dispatch({ type: 'STOP_EDITING' });
    }
    if (state.contextMenuConnection) {
      dispatch({ type: 'SHOW_CONTEXT_MENU', payload: null });
    }
    setRightMenuPos(null);

    if (e.button === 2) {
      const { x: sx, y: sy } = getCanvasCoords(e);
      const world = screenToWorld(sx, sy, state.transform);
      for (const conn of state.connections) {
        const src = state.shapes.find(s => s.id === conn.sourceId);
        const tgt = state.shapes.find(s => s.id === conn.targetId);
        if (!src || !tgt) continue;
        const eps = getConnectionEndpoints(src, tgt, conn.curvature);
        const d = pointToLineDistance(world.x, world.y, eps.sx, eps.sy, eps.tx, eps.ty, eps.cx, eps.cy);
        if (d < 8 / state.transform.scale) {
          dispatch({ type: 'SELECT_CONNECTION', payload: conn.id });
          dispatch({ type: 'SHOW_CONTEXT_MENU', payload: conn });
          setRightMenuPos({ x: e.clientX, y: e.clientY });
          return;
        }
      }
      return;
    }

    const { x: sx, y: sy } = getCanvasCoords(e);
    const world = screenToWorld(sx, sy, state.transform);
    mouseWorldRef.current = world;
    const tool = state.selectedTool;

    if (tool === 'select' || tool === 'text') {
      if (state.selectedShapeId) {
        const sel = state.shapes.find(s => s.id === state.selectedShapeId);
        if (sel) {
          const handle = getHandleHit(world.x, world.y, sel, state.transform.scale);
          if (handle) {
            dragRef.current = {
              type: 'resize',
              startX: sx, startY: sy, lastX: sx, lastY: sy,
              shapeId: sel.id,
              handle,
              originalShape: { ...sel }
            };
            return;
          }
        }
      }

      let hitShape: Shape | null = null;
      for (let i = state.shapes.length - 1; i >= 0; i--) {
        const s = state.shapes[i];
        if (pointInShape(world.x, world.y, s)) {
          hitShape = s;
          break;
        }
      }

      if (hitShape) {
        dispatch({ type: 'SELECT_SHAPE', payload: hitShape.id });
        dragRef.current = {
          type: 'move',
          startX: sx, startY: sy, lastX: sx, lastY: sy,
          shapeId: hitShape.id,
          originalShape: { ...hitShape }
        };
      } else {
        dispatch({ type: 'SELECT_SHAPE', payload: null });
        dragRef.current = {
          type: 'pan',
          startX: sx, startY: sy, lastX: sx, lastY: sy,
          originalTransform: { ...state.transform }
        };
      }
    } else if (tool === 'rectangle' || tool === 'circle') {
      const newShape: Shape = {
        id: uuidv4(),
        type: tool === 'rectangle' ? 'rectangle' : 'circle',
        x: world.x,
        y: world.y,
        width: 1,
        height: 1,
        fillColor: DEFAULT_FILL,
        strokeColor: DEFAULT_STROKE,
        strokeWidth: 2,
        text: ''
      };
      dragRef.current = {
        type: 'draw',
        startX: sx, startY: sy, lastX: sx, lastY: sy,
        tempShape: newShape
      };
    } else if (tool === 'arrow') {
      let hitShape: Shape | null = null;
      for (let i = state.shapes.length - 1; i >= 0; i--) {
        const s = state.shapes[i];
        if (pointInShape(world.x, world.y, s)) {
          hitShape = s;
          break;
        }
      }

      if (state.pendingArrowSource && hitShape && hitShape.id !== state.pendingArrowSource) {
        const conn: Connection = {
          id: uuidv4(),
          sourceId: state.pendingArrowSource,
          targetId: hitShape.id,
          color: '#666666',
          width: 2,
          curvature: 0.3,
          opacity: 1
        };
        dispatch({ type: 'ADD_CONNECTION', payload: conn });
        wsBroadcast({ type: 'ADD_CONNECTION', payload: conn });
        dispatch({ type: 'SET_PENDING_ARROW_SOURCE', payload: null });
      } else if (hitShape) {
        dispatch({ type: 'SET_PENDING_ARROW_SOURCE', payload: hitShape.id });
        const srcShape = hitShape;
        const sc = getShapeCenter(srcShape);
        dragRef.current = {
          type: 'connect',
          startX: sx, startY: sy, lastX: sx, lastY: sy,
          connectionStartX: sc.x,
          connectionStartY: sc.y
        };
      } else {
        dispatch({ type: 'SET_PENDING_ARROW_SOURCE', payload: null });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { x: sx, y: sy } = getCanvasCoords(e);
    const world = screenToWorld(sx, sy, state.transform);
    mouseWorldRef.current = world;

    const drag = dragRef.current;
    if (drag.type === 'none') return;

    if (drag.type === 'pan' && drag.originalTransform) {
      const dx = sx - drag.startX;
      const dy = sy - drag.startY;
      dispatch({
        type: 'SET_TRANSFORM',
        payload: {
          ...drag.originalTransform,
          offsetX: drag.originalTransform.offsetX + dx,
          offsetY: drag.originalTransform.offsetY + dy
        }
      });
    } else if (drag.type === 'draw' && drag.tempShape) {
      const startWorld = screenToWorld(drag.startX, drag.startY, state.transform);
      const nw = {
        x: Math.min(startWorld.x, world.x),
        y: Math.min(startWorld.y, world.y)
      };
      const w = Math.abs(world.x - startWorld.x);
      const h = Math.abs(world.y - startWorld.y);
      drag.tempShape.x = nw.x;
      drag.tempShape.y = nw.y;
      drag.tempShape.width = Math.max(5, w);
      drag.tempShape.height = Math.max(5, h);
    } else if (drag.type === 'move' && drag.shapeId && drag.originalShape) {
      const dxWorld = (sx - drag.startX) / state.transform.scale;
      const dyWorld = (sy - drag.startY) / state.transform.scale;
      const updates = {
        x: drag.originalShape.x + dxWorld,
        y: drag.originalShape.y + dyWorld
      };
      dispatch({ type: 'UPDATE_SHAPE', payload: { id: drag.shapeId, updates } });
    } else if (drag.type === 'resize' && drag.shapeId && drag.originalShape && drag.handle) {
      const dxWorld = (sx - drag.startX) / state.transform.scale;
      const dyWorld = (sy - drag.startY) / state.transform.scale;
      const orig = drag.originalShape;
      let nx = orig.x, ny = orig.y, nw = orig.width, nh = orig.height;
      if (drag.handle.includes('e')) nw = Math.max(10, orig.width + dxWorld);
      if (drag.handle.includes('s')) nh = Math.max(10, orig.height + dyWorld);
      if (drag.handle.includes('w')) {
        nx = orig.x + dxWorld;
        nw = Math.max(10, orig.width - dxWorld);
      }
      if (drag.handle.includes('n')) {
        ny = orig.y + dyWorld;
        nh = Math.max(10, orig.height - dyWorld);
      }
      dispatch({
        type: 'UPDATE_SHAPE',
        payload: { id: drag.shapeId, updates: { x: nx, y: ny, width: nw, height: nh } }
      });
    }

    drag.lastX = sx;
    drag.lastY = sy;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const drag = dragRef.current;
    if (drag.type === 'draw' && drag.tempShape) {
      if (drag.tempShape.width > 5 && drag.tempShape.height > 5) {
        dispatch({ type: 'ADD_SHAPE', payload: { ...drag.tempShape } });
        wsBroadcast({ type: 'ADD_SHAPE', payload: { ...drag.tempShape } });
      }
    } else if (drag.type === 'move' && drag.shapeId && drag.originalShape) {
      const cur = state.shapes.find(s => s.id === drag.shapeId);
      if (cur) {
        wsBroadcast({
          type: 'UPDATE_SHAPE',
          payload: { id: drag.shapeId, updates: { x: cur.x, y: cur.y } }
        });
      }
    } else if (drag.type === 'resize' && drag.shapeId) {
      const cur = state.shapes.find(s => s.id === drag.shapeId);
      if (cur) {
        wsBroadcast({
          type: 'UPDATE_SHAPE',
          payload: { id: drag.shapeId, updates: { x: cur.x, y: cur.y, width: cur.width, height: cur.height } }
        });
      }
    } else if (drag.type === 'connect') {
      const { x: sx, y: sy } = getCanvasCoords(e);
      const world = screenToWorld(sx, sy, state.transform);
      let hitShape: Shape | null = null;
      for (let i = state.shapes.length - 1; i >= 0; i--) {
        const s = state.shapes[i];
        if (pointInShape(world.x, world.y, s)) {
          hitShape = s;
          break;
        }
      }
      if (hitShape && state.pendingArrowSource && hitShape.id !== state.pendingArrowSource) {
        const conn: Connection = {
          id: uuidv4(),
          sourceId: state.pendingArrowSource,
          targetId: hitShape.id,
          color: '#666666',
          width: 2,
          curvature: 0.3,
          opacity: 1
        };
        dispatch({ type: 'ADD_CONNECTION', payload: conn });
        wsBroadcast({ type: 'ADD_CONNECTION', payload: conn });
        dispatch({ type: 'SET_PENDING_ARROW_SOURCE', payload: null });
      }
    }
    dragRef.current = { type: 'none', startX: 0, startY: 0, lastX: 0, lastY: 0 };
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const t = state.transform;
    const delta = -e.deltaY * 0.001;
    let newScale = t.scale + delta * t.scale;
    newScale = Math.max(0.3, Math.min(5, newScale));
    const scaleFactor = newScale / t.scale;
    const newOffsetX = mx - (mx - t.offsetX) * scaleFactor;
    const newOffsetY = my - (my - t.offsetY) * scaleFactor;
    dispatch({
      type: 'SET_TRANSFORM',
      payload: { scale: newScale, offsetX: newOffsetX, offsetY: newOffsetY }
    });
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    const { x: sx, y: sy } = getCanvasCoords(e);
    const world = screenToWorld(sx, sy, state.transform);
    for (let i = state.shapes.length - 1; i >= 0; i--) {
      const s = state.shapes[i];
      if (pointInShape(world.x, world.y, s)) {
        dispatch({ type: 'SELECT_SHAPE', payload: s.id });
        dispatch({ type: 'START_EDITING', payload: s.id });
        return;
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (state.editingShapeId) {
          dispatch({ type: 'STOP_EDITING' });
        }
        if (state.contextMenuConnection) {
          dispatch({ type: 'SHOW_CONTEXT_MENU', payload: null });
        }
        if (state.pendingArrowSource) {
          dispatch({ type: 'SET_PENDING_ARROW_SOURCE', payload: null });
        }
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (state.editingShapeId || document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
          return;
        }
        if (state.selectedShapeId) {
          dispatch({ type: 'DELETE_SHAPE', payload: state.selectedShapeId });
          wsBroadcast({ type: 'DELETE_SHAPE', payload: state.selectedShapeId });
        } else if (state.selectedConnectionId) {
          dispatch({ type: 'UPDATE_CONNECTION', payload: { id: state.selectedConnectionId, updates: { opacity: 0 } } });
          wsBroadcast({ type: 'UPDATE_CONNECTION', payload: { id: state.selectedConnectionId, updates: { opacity: 0 } } });
          setTimeout(() => {
            dispatch({ type: 'DELETE_CONNECTION', payload: state.selectedConnectionId });
            wsBroadcast({ type: 'DELETE_CONNECTION', payload: state.selectedConnectionId });
          }, 200);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [state, dispatch, wsBroadcast]);

  useEffect(() => {
    if (rightMenuPos && state.contextMenuConnection) {
      const menu = document.querySelector('[data-context-menu]');
      if (menu) {
        (menu as HTMLElement).style.left = rightMenuPos.x + 'px';
        (menu as HTMLElement).style.top = rightMenuPos.y + 'px';
      }
    }
  }, [rightMenuPos, state.contextMenuConnection]);

  const renderForExport = useCallback(() => {
    const canvas = document.createElement('canvas');
    const margin = 20;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const bounds = [
      { x: 0, y: 0 },
      { x: A4_WIDTH, y: A4_HEIGHT }
    ];
    bounds.forEach(b => {
      if (b.x < minX) minX = b.x;
      if (b.y < minY) minY = b.y;
      if (b.x > maxX) maxX = b.x;
      if (b.y > maxY) maxY = b.y;
    });
    state.shapes.forEach(s => {
      if (s.x < minX) minX = s.x;
      if (s.y < minY) minY = s.y;
      if (s.x + s.width > maxX) maxX = s.x + s.width;
      if (s.y + s.height > maxY) maxY = s.y + s.height;
    });
    minX -= margin;
    minY -= margin;
    maxX += margin;
    maxY += margin;

    const w = Math.ceil(maxX - minX);
    const h = Math.ceil(maxY - minY);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(-minX, -minY);

    ctx.fillStyle = CANVAS_BG;
    ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);
    ctx.strokeStyle = '#e0d5c4';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, A4_WIDTH, A4_HEIGHT);

    state.connections.forEach(conn => {
      if (conn.opacity <= 0) return;
      const src = state.shapes.find(s => s.id === conn.sourceId);
      const tgt = state.shapes.find(s => s.id === conn.targetId);
      if (!src || !tgt) return;
      const eps = getConnectionEndpoints(src, tgt, conn.curvature);
      ctx.globalAlpha = conn.opacity;
      ctx.strokeStyle = conn.color;
      ctx.lineWidth = conn.width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(eps.sx, eps.sy);
      ctx.quadraticCurveTo(eps.cx, eps.cy, eps.tx, eps.ty);
      ctx.stroke();
      const angle = Math.atan2(eps.ty - eps.cy, eps.tx - eps.cx) * 2 - Math.atan2(eps.cy - eps.sy, eps.cx - eps.sx);
      const arrowSize = 10;
      ctx.fillStyle = conn.color;
      ctx.beginPath();
      ctx.moveTo(eps.tx, eps.ty);
      ctx.lineTo(eps.tx - arrowSize * Math.cos(angle - Math.PI / 6), eps.ty - arrowSize * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(eps.tx - arrowSize * Math.cos(angle + Math.PI / 6), eps.ty - arrowSize * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    state.shapes.forEach(shape => {
      ctx.fillStyle = hexToRgba(shape.fillColor, 0.3);
      ctx.strokeStyle = shape.strokeColor;
      ctx.lineWidth = shape.strokeWidth;
      if (shape.type === 'rectangle') {
        ctx.beginPath();
        ctx.rect(shape.x, shape.y, shape.width, shape.height);
        ctx.fill();
        ctx.stroke();
      } else {
        const cx = shape.x + shape.width / 2;
        const cy = shape.y + shape.height / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, shape.width / 2, shape.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      if (shape.text) {
        const maxTextWidth = Math.max(shape.width - 10, 20);
        const fontSize = Math.max(10, Math.min(shape.height / 5, 18));
        ctx.fillStyle = '#333';
        ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const lines = wrapText(ctx, shape.text, maxTextWidth, fontSize);
        const lineHeight = fontSize * 1.2;
        const totalHeight = lines.length * lineHeight;
        const startY = shape.y + shape.height / 2 - totalHeight / 2 + lineHeight / 2;
        lines.forEach((line, i) => {
          ctx.fillText(line, shape.x + shape.width / 2, startY + i * lineHeight);
        });
      }
    });

    ctx.restore();
    return canvas;
  }, [state]);

  useEffect(() => {
    (window as any).__whiteboardExport = renderForExport;
  }, [renderForExport]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const resize = () => {
      canvas.style.width = container.clientWidth + 'px';
      canvas.style.height = container.clientHeight + 'px';
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, [isMobile]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        cursor: state.selectedTool === 'pan' ? 'grab' : state.selectedTool === 'arrow' ? 'crosshair' : 'default'
      }}
    >
      <canvas
        id="whiteboard-canvas"
        ref={canvasRef}
        style={{ display: 'block', touchAction: 'none' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={(e) => { if (dragRef.current.type !== 'none') handleMouseUp(e); }}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      />
      {state.pendingArrowSource && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(74, 144, 217, 0.95)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: 6,
            fontSize: 13,
            zIndex: 500,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            pointerEvents: 'none'
          }}
        >
          请点击目标图形完成连线（按 Esc 取消）
        </div>
      )}
    </div>
  );
}
