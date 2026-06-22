import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useAppStore } from '@/store';
import type {
  Annotation,
  ArrowAnnotation,
  RectangleAnnotation,
  TextAnnotation,
} from '@/utils/types';

type DragMode =
  | { type: 'none' }
  | { type: 'move'; id: string; offsetX: number; offsetY: number }
  | { type: 'create-rect'; startX: number; startY: number }
  | { type: 'create-arrow'; startX: number; startY: number }
  | { type: 'resize'; id: string; handle: string; startX: number; startY: number; orig: Annotation };

const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const;

function getHandlePosition(handle: string, ann: Annotation) {
  let w = 0, h = 0, x = 0, y = 0;
  if (ann.type === 'rectangle') {
    w = ann.width;
    h = ann.height;
    x = ann.x;
    y = ann.y;
  } else if (ann.type === 'arrow') {
    x = Math.min(ann.x, ann.endX);
    y = Math.min(ann.y, ann.endY);
    w = Math.abs(ann.endX - ann.x) || 1;
    h = Math.abs(ann.endY - ann.y) || 1;
  } else {
    w = 120;
    h = 30;
    x = ann.x;
    y = ann.y;
  }

  switch (handle) {
    case 'nw': return { x, y };
    case 'n': return { x: x + w / 2, y };
    case 'ne': return { x: x + w, y };
    case 'e': return { x: x + w, y: y + h / 2 };
    case 'se': return { x: x + w, y: y + h };
    case 's': return { x: x + w / 2, y: y + h };
    case 'sw': return { x, y: y + h };
    case 'w': return { x, y: y + h / 2 };
    default: return { x, y };
  }
}

export function AnnotationCanvas() {
  const {
    frames,
    currentFrameIndex,
    annotations,
    activeTool,
    toolColor,
    lineWidth,
    selectedAnnotationId,
    focusedAnnotationId,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    selectAnnotation,
  } = useAppStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);
  const [fadeKey, setFadeKey] = useState(0);
  const [drag, setDrag] = useState<DragMode>({ type: 'none' });
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const frame = frames[currentFrameIndex];
  const frameAnnotations = annotations[currentFrameIndex] || [];

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !frame) return;

    const maxW = 800;
    const maxH = 400;
    const ratio = Math.min(maxW / frame.imageData.width, maxH / frame.imageData.height, 1);
    setScale(ratio);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = frame.imageData.width;
    canvas.height = frame.imageData.height;
    ctx.putImageData(frame.imageData, 0, 0);

    setFadeKey((k) => k + 1);
  }, [frame, currentFrameIndex]);

  const getSvgCoords = (e: React.MouseEvent) => {
    const svg = (e.currentTarget as HTMLElement).closest('svg');
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (frame) {
      const coords = getSvgCoords(e);
      if (activeTool === 'rectangle') {
        setDrag({ type: 'create-rect', startX: coords.x, startY: coords.y });
      } else if (activeTool === 'arrow') {
        setDrag({ type: 'create-arrow', startX: coords.x, startY: coords.y });
      } else if (activeTool === 'text') {
        addAnnotation({
          type: 'text',
          x: coords.x,
          y: coords.y,
          rotation: 0,
          content: '双击编辑文字',
          fontSize: 20,
          italic: false,
          color: '#FFFFFF',
        } as Omit<TextAnnotation, 'id' | 'createdAt'>);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (drag.type === 'none' || !frame) return;
    const coords = getSvgCoords(e);

    if (drag.type === 'create-rect') {
      // nothing until mouseup
    } else if (drag.type === 'create-arrow') {
      // nothing until mouseup
    } else if (drag.type === 'move') {
      const ann = frameAnnotations.find((a) => a.id === drag.id);
      if (!ann) return;
      if (ann.type === 'rectangle' || ann.type === 'text') {
        updateAnnotation(ann.id, {
          x: coords.x - drag.offsetX,
          y: coords.y - drag.offsetY,
        } as Partial<Annotation>);
      } else if (ann.type === 'arrow') {
        const dx = coords.x - drag.offsetX - ann.x;
        const dy = coords.y - drag.offsetY - ann.y;
        updateAnnotation(ann.id, {
          x: ann.x + dx,
          y: ann.y + dy,
          endX: ann.endX + dx,
          endY: ann.endY + dy,
        } as Partial<Annotation>);
      }
    } else if (drag.type === 'resize') {
      const ann = drag.orig;
      if (ann.type === 'rectangle') {
        let nx = ann.x, ny = ann.y, nw = ann.width, nh = ann.height;
        const dx = coords.x - drag.startX;
        const dy = coords.y - drag.startY;

        if (drag.handle.includes('w')) { nx = ann.x + dx; nw = ann.width - dx; }
        if (drag.handle.includes('e')) { nw = ann.width + dx; }
        if (drag.handle.includes('n')) { ny = ann.y + dy; nh = ann.height - dy; }
        if (drag.handle.includes('s')) { nh = ann.height + dy; }

        if (nw > 10 && nh > 10) {
          updateAnnotation(ann.id, { x: nx, y: ny, width: nw, height: nh } as Partial<Annotation>);
        }
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!frame) { setDrag({ type: 'none' }); return; }
    const coords = getSvgCoords(e);

    if (drag.type === 'create-rect') {
      const x = Math.min(drag.startX, coords.x);
      const y = Math.min(drag.startY, coords.y);
      const w = Math.abs(coords.x - drag.startX);
      const h = Math.abs(coords.y - drag.startY);
      if (w > 5 && h > 5) {
        addAnnotation({
          type: 'rectangle',
          x, y,
          width: w,
          height: h,
          rotation: 0,
          borderColor: toolColor,
          borderWidth: lineWidth,
        } as Omit<RectangleAnnotation, 'id' | 'createdAt'>);
      }
    } else if (drag.type === 'create-arrow') {
      const dist = Math.hypot(coords.x - drag.startX, coords.y - drag.startY);
      if (dist > 10) {
        addAnnotation({
          type: 'arrow',
          x: drag.startX,
          y: drag.startY,
          endX: coords.x,
          endY: coords.y,
          rotation: 0,
          color: toolColor,
          lineWidth,
        } as Omit<ArrowAnnotation, 'id' | 'createdAt'>);
      }
    }
    setDrag({ type: 'none' });
  };

  const handleAnnotationMouseDown = (e: React.MouseEvent, ann: Annotation) => {
    e.stopPropagation();
    if (activeTool !== 'select') return;
    selectAnnotation(ann.id);
    const coords = getSvgCoords(e);
    if (ann.type === 'arrow') {
      setDrag({
        type: 'move',
        id: ann.id,
        offsetX: coords.x - ann.x,
        offsetY: coords.y - ann.y,
      });
    } else {
      setDrag({
        type: 'move',
        id: ann.id,
        offsetX: coords.x - ann.x,
        offsetY: coords.y - ann.y,
      });
    }
  };

  const startResize = (e: React.MouseEvent, ann: Annotation, handle: string) => {
    e.stopPropagation();
    const coords = getSvgCoords(e);
    setDrag({
      type: 'resize',
      id: ann.id,
      handle,
      startX: coords.x,
      startY: coords.y,
      orig: JSON.parse(JSON.stringify(ann)),
    });
  };

  const handleDoubleClick = (e: React.MouseEvent, ann: Annotation) => {
    e.stopPropagation();
    if (ann.type === 'text') {
      setEditingTextId(ann.id);
      setEditingText(ann.content);
    }
  };

  const commitTextEdit = (ann: TextAnnotation) => {
    updateAnnotation(ann.id, { content: editingText } as Partial<Annotation>);
    setEditingTextId(null);
  };

  const renderAnnotation = (ann: Annotation) => {
    const isSelected = selectedAnnotationId === ann.id;
    const isFocused = focusedAnnotationId === ann.id;
    const isEditing = editingTextId === ann.id;
    const focusClass = isFocused ? 'focus-blink' : '';

    if (ann.type === 'rectangle') {
      return (
        <g
          key={ann.id}
          transform={`rotate(${ann.rotation} ${ann.x + ann.width / 2} ${ann.y + ann.height / 2})`}
          onMouseDown={(e) => handleAnnotationMouseDown(e, ann)}
          onDoubleClick={(e) => handleDoubleClick(e, ann)}
          className={focusClass}
          style={{ cursor: activeTool === 'select' ? 'move' : 'default' }}
        >
          <rect
            x={ann.x}
            y={ann.y}
            width={ann.width}
            height={ann.height}
            fill="none"
            stroke={ann.borderColor}
            strokeWidth={ann.borderWidth}
            strokeDasharray={isSelected ? '6 4' : undefined}
          />
          {isSelected && (
            <>
              {HANDLES.map((h) => {
                const pos = getHandlePosition(h, ann);
                return (
                  <rect
                    key={h}
                    x={pos.x - 5}
                    y={pos.y - 5}
                    width={10}
                    height={10}
                    fill="#00BCD4"
                    stroke="#fff"
                    strokeWidth={1}
                    style={{ cursor: `${h}-resize` }}
                    onMouseDown={(e) => startResize(e, ann, h)}
                  />
                );
              })}
              <g
                transform={`translate(${ann.x + ann.width - 12} ${ann.y - 24})`}
                onMouseDown={(e) => { e.stopPropagation(); }}
                onClick={(e) => { e.stopPropagation(); deleteAnnotation(ann.id); }}
                style={{ cursor: 'pointer' }}
              >
                <circle cx={12} cy={12} r={12} fill="#FF5252" />
                <path
                  d="M7 7 L17 17 M17 7 L7 17"
                  stroke="#fff"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </g>
            </>
          )}
        </g>
      );
    }

    if (ann.type === 'arrow') {
      return (
        <g
          key={ann.id}
          onMouseDown={(e) => handleAnnotationMouseDown(e, ann)}
          className={focusClass}
          style={{ cursor: activeTool === 'select' ? 'move' : 'default' }}
        >
          <line
            x1={ann.x}
            y1={ann.y}
            x2={ann.endX}
            y2={ann.endY}
            stroke={ann.color}
            strokeWidth={ann.lineWidth}
            strokeLinecap="round"
          />
          {(() => {
            const angle = Math.atan2(ann.endY - ann.y, ann.endX - ann.x);
            const headLen = 12 + ann.lineWidth * 2;
            const p1 = {
              x: ann.endX - headLen * Math.cos(angle - Math.PI / 6),
              y: ann.endY - headLen * Math.sin(angle - Math.PI / 6),
            };
            const p2 = {
              x: ann.endX - headLen * Math.cos(angle + Math.PI / 6),
              y: ann.endY - headLen * Math.sin(angle + Math.PI / 6),
            };
            return (
              <polygon
                points={`${ann.endX},${ann.endY} ${p1.x},${p1.y} ${p2.x},${p2.y}`}
                fill={ann.color}
              />
            );
          })()}
          {isSelected && (
            <>
              <circle cx={ann.x} cy={ann.y} r={6} fill="#00BCD4" stroke="#fff" strokeWidth={1} />
              <circle cx={ann.endX} cy={ann.endY} r={6} fill="#00BCD4" stroke="#fff" strokeWidth={1} />
              <g
                transform={`translate(${Math.max(ann.x, ann.endX) - 12} ${Math.min(ann.y, ann.endY) - 28})`}
                onMouseDown={(e) => { e.stopPropagation(); }}
                onClick={(e) => { e.stopPropagation(); deleteAnnotation(ann.id); }}
                style={{ cursor: 'pointer' }}
              >
                <circle cx={12} cy={12} r={12} fill="#FF5252" />
                <path
                  d="M7 7 L17 17 M17 7 L7 17"
                  stroke="#fff"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </g>
            </>
          )}
        </g>
      );
    }

    if (ann.type === 'text') {
      return (
        <g
          key={ann.id}
          transform={`rotate(${ann.rotation} ${ann.x} ${ann.y})`}
          onMouseDown={(e) => handleAnnotationMouseDown(e, ann)}
          onDoubleClick={(e) => handleDoubleClick(e, ann)}
          className={focusClass}
          style={{ cursor: activeTool === 'select' ? 'move' : 'default' }}
        >
          {isEditing ? (
            <foreignObject x={ann.x - 4} y={ann.y - 4} width={400} height={60}>
              <input
                autoFocus
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                onBlur={() => commitTextEdit(ann)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitTextEdit(ann);
                  if (e.key === 'Escape') setEditingTextId(null);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                style={{
                  background: 'rgba(30,30,30,0.9)',
                  border: '1px solid #00BCD4',
                  color: ann.color,
                  fontSize: ann.fontSize,
                  fontStyle: ann.italic ? 'italic' : 'normal',
                  fontFamily: 'Inter, sans-serif',
                  padding: '2px 4px',
                  borderRadius: 4,
                  outline: 'none',
                  width: 'auto',
                  minWidth: 100,
                }}
              />
            </foreignObject>
          ) : (
            <text
              x={ann.x}
              y={ann.y}
              fill={ann.color}
              fontSize={ann.fontSize}
              fontStyle={ann.italic ? 'italic' : 'normal'}
              fontFamily="Inter, sans-serif"
              style={{ userSelect: 'none' }}
              dominantBaseline="text-before-edge"
            >
              {ann.content}
            </text>
          )}
          {isSelected && !isEditing && (
            <>
              {HANDLES.map((h) => {
                const pos = getHandlePosition(h, ann);
                return (
                  <rect
                    key={h}
                    x={pos.x - 5}
                    y={pos.y - 5}
                    width={10}
                    height={10}
                    fill="#00BCD4"
                    stroke="#fff"
                    strokeWidth={1}
                    style={{ cursor: `${h}-resize` }}
                    onMouseDown={(e) => startResize(e, ann, h)}
                  />
                );
              })}
              <g
                transform={`translate(${ann.x + 108} ${ann.y - 24})`}
                onMouseDown={(e) => { e.stopPropagation(); }}
                onClick={(e) => { e.stopPropagation(); deleteAnnotation(ann.id); }}
                style={{ cursor: 'pointer' }}
              >
                <circle cx={12} cy={12} r={12} fill="#FF5252" />
                <path
                  d="M7 7 L17 17 M17 7 L7 17"
                  stroke="#fff"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </g>
            </>
          )}
        </g>
      );
    }

    return null;
  };

  if (!frame) return null;

  const svgCursor =
    activeTool === 'rectangle' || activeTool === 'arrow' || activeTool === 'text'
      ? 'crosshair'
      : 'default';

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: '#0A0A0A',
        border: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400,
      }}
      onMouseDown={() => selectAnnotation(null)}
    >
      <div
        key={fadeKey}
        className="frame-fade relative"
        style={{
          width: frame.imageData.width * scale,
          height: frame.imageData.height * scale,
        }}
      >
        <canvas
          ref={previewCanvasRef}
          style={{
            width: frame.imageData.width * scale,
            height: frame.imageData.height * scale,
            display: 'block',
          }}
        />
        <svg
          width={frame.imageData.width}
          height={frame.imageData.height}
          viewBox={`0 0 ${frame.imageData.width} ${frame.imageData.height}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: frame.imageData.width * scale,
            height: frame.imageData.height * scale,
            cursor: svgCursor,
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {frameAnnotations.map(renderAnnotation)}
        </svg>
      </div>
    </div>
  );
}
