import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Toolbar from './Toolbar';
import {
  canRedo as historyCanRedo,
  canUndo as historyCanUndo,
  createInitialHistory,
  record,
  redo,
  undo,
} from './history';
import type {
  BrushElement,
  CanvasElement,
  CircleElement,
  HistoryState,
  RectangleElement,
  TextElement,
  ToolType,
} from './types';

interface WhiteboardProps {
  roomId: string;
}

const CANVAS_W = 1920;
const CANVAS_H = 1080;
const GRID_SIZE = 20;
const FADE_MS = 400;

export default function Whiteboard({ roomId }: WhiteboardProps) {
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  const [tool, setTool] = useState<ToolType>('brush');
  const [color, setColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(3);

  const [historyState, setHistoryState] = useState<HistoryState>(createInitialHistory());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const drawingRef = useRef(false);
  const startPtRef = useRef<{ x: number; y: number } | null>(null);
  const previewRef = useRef<CanvasElement | null>(null);
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [, forceTick] = useState(0);
  const rerender = useCallback(() => forceTick((t) => t + 1), []);

  const [textCtx, setTextCtx] = useState<
    { x: number; y: number; existingId?: string; initial: string } | null
  >(null);

  const [recentIds, setRecentIds] = useState<Set<string>>(new Set());

  const elements = historyState.present;

  const getCanvasPoint = useCallback((e: React.MouseEvent | MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_W;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_H;
    return { x, y };
  }, []);

  const addRecent = useCallback((id: string) => {
    setRecentIds((prev) => new Set(prev).add(id));
    window.setTimeout(() => {
      setRecentIds((prev) => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });
    }, FADE_MS);
  }, []);

  const commitElement = useCallback((el: CanvasElement) => {
    setHistoryState((prev) => record(prev, [...prev.present, el]));
    addRecent(el.id);
  }, [addRecent]);

  const commitReplace = useCallback(
    (id: string, next: CanvasElement) => {
      setHistoryState((prev) =>
        record(
          prev,
          prev.present.map((e) => (e.id === id ? next : e)),
        ),
      );
    },
    [],
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (textCtx) return;
      const pt = getCanvasPoint(e);
      const targetElId = (e.target as SVGElement).getAttribute('data-el-id');
      const targetEl = targetElId ? elements.find((x) => x.id === targetElId) : null;

      if (tool === 'text') {
        if (targetEl && targetEl.type === 'text') {
          setTextCtx({
            x: targetEl.x,
            y: targetEl.y,
            existingId: targetEl.id,
            initial: targetEl.text,
          });
          setSelectedId(targetEl.id);
        } else {
          setTextCtx({ x: pt.x, y: pt.y, initial: '' });
        }
        return;
      }

      if (targetEl && (targetEl.type === 'rectangle' || targetEl.type === 'circle')) {
        const elBBox = getElementBBox(targetEl);
        if (elBBox) {
          dragRef.current = {
            id: targetEl.id,
            offsetX: pt.x - elBBox.x,
            offsetY: pt.y - elBBox.y,
          };
          setSelectedId(targetEl.id);
          return;
        }
      }

      setSelectedId(null);
      drawingRef.current = true;
      startPtRef.current = pt;

      if (tool === 'brush') {
        previewRef.current = {
          id: uuidv4(),
          type: 'brush',
          color,
          strokeWidth,
          points: [{ x: pt.x, y: pt.y }],
          createdAt: Date.now(),
        };
      } else if (tool === 'rectangle') {
        previewRef.current = {
          id: uuidv4(),
          type: 'rectangle',
          color,
          strokeWidth,
          x: pt.x,
          y: pt.y,
          width: 0,
          height: 0,
          createdAt: Date.now(),
        };
      } else if (tool === 'circle') {
        previewRef.current = {
          id: uuidv4(),
          type: 'circle',
          color,
          strokeWidth,
          x: pt.x,
          y: pt.y,
          radiusX: 0,
          radiusY: 0,
          createdAt: Date.now(),
        };
      }
      rerender();
    },
    [color, elements, getCanvasPoint, strokeWidth, textCtx, tool, rerender],
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const pt = getCanvasPoint(e);

      if (dragRef.current) {
        const id = dragRef.current.id;
        const el = elements.find((x) => x.id === id);
        if (!el) return;
        if (el.type === 'rectangle') {
          const next: RectangleElement = {
            ...el,
            x: pt.x - dragRef.current.offsetX,
            y: pt.y - dragRef.current.offsetY,
          };
          const idx = elements.findIndex((x) => x.id === id);
          const newArr = [...elements];
          newArr[idx] = next;
          setHistoryState((prev) => ({ ...prev, present: newArr }));
        } else if (el.type === 'circle') {
          const next: CircleElement = {
            ...el,
            x: pt.x - dragRef.current.offsetX + el.radiusX,
            y: pt.y - dragRef.current.offsetY + el.radiusY,
          };
          const idx = elements.findIndex((x) => x.id === id);
          const newArr = [...elements];
          newArr[idx] = next;
          setHistoryState((prev) => ({ ...prev, present: newArr }));
        }
        return;
      }

      if (!drawingRef.current || !previewRef.current) return;
      const start = startPtRef.current;
      if (!start) return;

      if (previewRef.current.type === 'brush') {
        const prev = previewRef.current as BrushElement;
        prev.points.push({ x: pt.x, y: pt.y });
      } else if (previewRef.current.type === 'rectangle') {
        const prev = previewRef.current as RectangleElement;
        const x = Math.min(start.x, pt.x);
        const y = Math.min(start.y, pt.y);
        prev.x = x;
        prev.y = y;
        prev.width = Math.abs(pt.x - start.x);
        prev.height = Math.abs(pt.y - start.y);
      } else if (previewRef.current.type === 'circle') {
        const prev = previewRef.current as CircleElement;
        const cx = (start.x + pt.x) / 2;
        const cy = (start.y + pt.y) / 2;
        prev.x = cx;
        prev.y = cy;
        prev.radiusX = Math.abs(pt.x - start.x) / 2;
        prev.radiusY = Math.abs(pt.y - start.y) / 2;
      }
      rerender();
    },
    [elements, getCanvasPoint, rerender],
  );

  const endDragOrDraw = useCallback(() => {
    if (dragRef.current) {
      const id = dragRef.current.id;
      const el = elements.find((x) => x.id === id);
      dragRef.current = null;
      if (el) {
        setHistoryState((prev) => {
          if (prev.past.length > 0 && prev.past[prev.past.length - 1] === prev.present) {
            return prev;
          }
          return record(prev, prev.present);
        });
      }
      return;
    }

    if (!drawingRef.current || !previewRef.current) return;
    drawingRef.current = false;
    const fin = previewRef.current;
    previewRef.current = null;
    startPtRef.current = null;

    if (fin.type === 'brush') {
      if (fin.points.length > 1) commitElement(fin);
    } else if (fin.type === 'rectangle') {
      if (fin.width > 2 && fin.height > 2) commitElement(fin);
    } else if (fin.type === 'circle') {
      if (fin.radiusX > 2 && fin.radiusY > 2) commitElement(fin);
    }
    rerender();
  }, [commitElement, elements, rerender]);

  const onMouseUp = useCallback(() => {
    endDragOrDraw();
  }, [endDragOrDraw]);

  const onMouseLeave = useCallback(() => {
    endDragOrDraw();
  }, [endDragOrDraw]);

  const handleTextSubmit = useCallback(() => {
    if (!textCtx) return;
    const input = textInputRef.current;
    const value = input?.value.trim() ?? textCtx.initial.trim();
    setTextCtx(null);
    if (!value) return;

    if (textCtx.existingId) {
      const el = elements.find((x) => x.id === textCtx.existingId);
      if (el && el.type === 'text') {
        const next: TextElement = { ...el, text: value };
        commitReplace(el.id, next);
      }
    } else {
      const newEl: TextElement = {
        id: uuidv4(),
        type: 'text',
        color,
        strokeWidth,
        x: textCtx.x,
        y: textCtx.y,
        text: value,
        fontSize: 24,
        createdAt: Date.now(),
      };
      commitElement(newEl);
    }
  }, [color, commitElement, commitReplace, elements, strokeWidth, textCtx]);

  const handleTextCancel = useCallback(() => {
    setTextCtx(null);
  }, []);

  useEffect(() => {
    if (textCtx && textInputRef.current) {
      textInputRef.current.focus();
      textInputRef.current.select();
    }
  }, [textCtx]);

  const handleUndo = useCallback(() => {
    setHistoryState((prev) => undo(prev));
    setSelectedId(null);
  }, []);
  const handleRedo = useCallback(() => {
    setHistoryState((prev) => redo(prev));
    setSelectedId(null);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      if (!isCtrl) return;
      if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (e.key.toLowerCase() === 'z' && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      } else if (e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleUndo, handleRedo]);

  const dragId = dragRef.current?.id ?? null;

  const gridPatternId = useMemo(() => `grid-${roomId.replace(/\W/g, '')}`, [roomId]);

  const textInputScreenPos = useMemo(() => {
    if (!textCtx) return null;
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const left = rect.left + (textCtx.x / CANVAS_W) * rect.width;
    const top = rect.top + (textCtx.y / CANVAS_H) * rect.height;
    return { left, top };
  }, [textCtx]);

  return (
    <div className="wb-root">
      <div className="wb-header">
        <span className="wb-room-label">房间 ID:</span>
        <span className="wb-room-id">{roomId}</span>
      </div>

      <Toolbar
        tool={tool}
        color={color}
        strokeWidth={strokeWidth}
        onToolChange={setTool}
        onColorChange={setColor}
        onStrokeWidthChange={setStrokeWidth}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyCanUndo(historyState)}
        canRedo={historyCanRedo(historyState)}
      />

      <div className="wb-canvas-wrap" ref={canvasWrapRef}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
          preserveAspectRatio="xMidYMid meet"
          className="wb-canvas"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
        >
          <defs>
            <pattern
              id={gridPatternId}
              width={GRID_SIZE}
              height={GRID_SIZE}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`}
                fill="none"
                stroke="#e0e0e0"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect x={0} y={0} width={CANVAS_W} height={CANVAS_H} fill="#ffffff" />
          <rect x={0} y={0} width={CANVAS_W} height={CANVAS_H} fill={`url(#${gridPatternId})`} />

          {elements.map((el) => (
            <ElementRenderer
              key={el.id}
              element={el}
              selected={selectedId === el.id}
              dragging={dragId === el.id}
              fadeIn={recentIds.has(el.id)}
            />
          ))}

          {previewRef.current && (
            <ElementRenderer
              element={previewRef.current}
              selected={false}
              dragging={false}
              fadeIn={false}
              preview
            />
          )}
        </svg>

        {textCtx && textInputScreenPos && (
          <input
            ref={textInputRef}
            type="text"
            defaultValue={textCtx.initial}
            className="wb-text-input"
            style={{
              left: textInputScreenPos.left,
              top: textInputScreenPos.top,
              color,
              fontSize: 24,
            }}
            placeholder="输入文本，回车确认"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleTextSubmit();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                handleTextCancel();
              }
            }}
            onBlur={handleTextSubmit}
          />
        )}
      </div>
    </div>
  );
}

function getElementBBox(el: RectangleElement | CircleElement) {
  if (el.type === 'rectangle') return { x: el.x, y: el.y, w: el.width, h: el.height };
  return {
    x: el.x - el.radiusX,
    y: el.y - el.radiusY,
    w: el.radiusX * 2,
    h: el.radiusY * 2,
  };
}

interface RendererProps {
  element: CanvasElement;
  selected: boolean;
  dragging: boolean;
  fadeIn: boolean;
  preview?: boolean;
}

function ElementRenderer({ element, selected, dragging, fadeIn, preview }: RendererProps) {
  const cls = [
    'wb-el',
    fadeIn ? 'wb-el-fadein' : '',
    dragging ? 'wb-el-dragging' : '',
    preview ? 'wb-el-preview' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const common = {
    'data-el-id': element.id,
    className: cls,
  } as const;

  const stroke = element.color;
  const sw = element.strokeWidth;
  const outline =
    element.userColor ??
    (element.userId ? '#888' : 'transparent');

  if (element.type === 'brush') {
    if (element.points.length < 2) return null;
    const d = brushToPath(element.points);
    return (
      <path
        {...common}
        d={d}
        stroke={stroke}
        strokeWidth={sw}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  }

  if (element.type === 'rectangle') {
    const bbox = getElementBBox(element);
    return (
      <g {...common}>
        {element.userId && outline !== 'transparent' && (
          <rect
            x={bbox.x - 3}
            y={bbox.y - 3}
            width={bbox.w + 6}
            height={bbox.h + 6}
            fill="none"
            stroke={outline}
            strokeWidth={2}
            strokeDasharray="6 3"
            rx={2}
          />
        )}
        <rect
          x={element.x}
          y={element.y}
          width={element.width}
          height={element.height}
          fill="none"
          stroke={stroke}
          strokeWidth={sw}
          rx={2}
        />
        {(selected || preview) && element.width > 20 && element.height > 20 && (
          <g>
            <rect
              x={element.x}
              y={element.y - 22}
              width={72}
              height={20}
              fill="rgba(0,0,0,0.7)"
              rx={3}
            />
            <text
              x={element.x + 8}
              y={element.y - 8}
              fill="#fff"
              fontSize={12}
              fontFamily="monospace"
            >
              {Math.round(element.width)}x{Math.round(element.height)}
            </text>
          </g>
        )}
      </g>
    );
  }

  if (element.type === 'circle') {
    const bbox = getElementBBox(element);
    return (
      <g {...common}>
        {element.userId && outline !== 'transparent' && (
          <rect
            x={bbox.x - 3}
            y={bbox.y - 3}
            width={bbox.w + 6}
            height={bbox.h + 6}
            fill="none"
            stroke={outline}
            strokeWidth={2}
            strokeDasharray="6 3"
            rx={2}
          />
        )}
        <ellipse
          cx={element.x}
          cy={element.y}
          rx={element.radiusX}
          ry={element.radiusY}
          fill="none"
          stroke={stroke}
          strokeWidth={sw}
        />
        {(selected || preview) && element.radiusX * 2 > 20 && element.radiusY * 2 > 20 && (
          <g>
            <rect
              x={element.x - element.radiusX}
              y={element.y - element.radiusY - 22}
              width={72}
              height={20}
              fill="rgba(0,0,0,0.7)"
              rx={3}
            />
            <text
              x={element.x - element.radiusX + 8}
              y={element.y - element.radiusY - 8}
              fill="#fff"
              fontSize={12}
              fontFamily="monospace"
            >
              {Math.round(element.radiusX * 2)}x{Math.round(element.radiusY * 2)}
            </text>
          </g>
        )}
      </g>
    );
  }

  if (element.type === 'text') {
    return (
      <g {...common}>
        {element.userId && outline !== 'transparent' && (
          <text
            x={element.x}
            y={element.y - 6}
            fill={outline}
            fontSize={11}
            fontWeight={600}
          >
            {element.userId}
          </text>
        )}
        <text
          x={element.x}
          y={element.y}
          fill={element.color}
          fontSize={element.fontSize}
          style={{ userSelect: 'none' }}
        >
          {element.text}
        </text>
      </g>
    );
  }

  return null;
}

function brushToPath(pts: { x: number; y: number }[]) {
  if (pts.length === 0) return '';
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i].x.toFixed(2)} ${pts[i].y.toFixed(2)}`;
  }
  return d;
}
