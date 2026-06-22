import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import type {
  CanvasComponent,
  Connection,
  HandlePosition,
  DragState,
  ComponentType
} from '../types';

type Selection =
  | { kind: 'component'; id: string }
  | { kind: 'connection'; id: string }
  | null;

interface Props {
  components: CanvasComponent[];
  connections: Connection[];
  selection: Selection;
  onSelect: (sel: Selection) => void;
  onUpdateComponents: (comps: CanvasComponent[]) => void;
  onAddConnection: (fromId: string, toId: string) => void;
  onAddComponent: (type: ComponentType, pos: { x: number; y: number }) => void;
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

const HANDLES: HandlePosition[] = [
  'top-left',
  'top-center',
  'top-right',
  'middle-left',
  'middle-right',
  'bottom-left',
  'bottom-center',
  'bottom-right'
];

function getHandlePos(
  handle: HandlePosition,
  bb: BoundingBox
): { x: number; y: number } {
  const { x, y, width, height } = bb;
  switch (handle) {
    case 'top-left': return { x, y };
    case 'top-center': return { x: x + width / 2, y };
    case 'top-right': return { x: x + width, y };
    case 'middle-left': return { x, y: y + height / 2 };
    case 'middle-right': return { x: x + width, y: y + height / 2 };
    case 'bottom-left': return { x, y: y + height };
    case 'bottom-center': return { x: x + width / 2, y: y + height };
    case 'bottom-right': return { x: x + width, y: y + height };
    default: return { x: 0, y: 0 };
  }
}

function getCursor(handle: HandlePosition): string {
  switch (handle) {
    case 'top-left':
    case 'bottom-right':
      return 'nwse-resize';
    case 'top-right':
    case 'bottom-left':
      return 'nesw-resize';
    case 'top-center':
    case 'bottom-center':
      return 'ns-resize';
    case 'middle-left':
    case 'middle-right':
      return 'ew-resize';
    default:
      return 'default';
  }
}

function getComponentCenter(comp: CanvasComponent): { x: number; y: number } {
  return {
    x: comp.x + comp.width / 2,
    y: comp.y + comp.height / 2
  };
}

function getEdgePoint(comp: CanvasComponent, target: { x: number; y: number }): { x: number; y: number } {
  const cx = comp.x + comp.width / 2;
  const cy = comp.y + comp.height / 2;
  const dx = target.x - cx;
  const dy = target.y - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };

  const hw = comp.width / 2;
  const hh = comp.height / 2;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  const scaleX = absDx > 0 ? hw / absDx : Infinity;
  const scaleY = absDy > 0 ? hh / absDy : Infinity;
  const scale = Math.min(scaleX, scaleY);
  return {
    x: cx + dx * scale,
    y: cy + dy * scale
  };
}

function CanvasComponentView({
  comp,
  isSelected,
  isHovered
}: {
  comp: CanvasComponent;
  isSelected: boolean;
  isHovered: boolean;
}) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: comp.width,
    height: comp.height,
    transform: `rotate(${comp.rotation}deg)`,
    transformOrigin: 'center center',
    boxSizing: 'border-box',
    userSelect: 'none'
  };

  if (comp.type !== 'text') {
    if (comp.style.backgroundColor) style.background = comp.style.backgroundColor;
    if (comp.style.borderColor && comp.style.borderWidth) {
      style.border = `${comp.style.borderWidth}px solid ${comp.style.borderColor}`;
    }
    if (comp.style.borderRadius != null) {
      style.borderRadius = comp.type === 'circle' ? '50%' : `${comp.style.borderRadius}px`;
    } else if (comp.type === 'circle') {
      style.borderRadius = '50%';
    }
    if (isSelected) {
      style.boxShadow = '0 0 0 2px rgba(59,130,246,0.45)';
    } else if (isHovered) {
      style.boxShadow = '0 0 0 1.5px rgba(59,130,246,0.25), 0 2px 6px rgba(0,0,0,0.08)';
    } else {
      style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
    }
  }

  const innerContent = () => {
    if (comp.type === 'text') {
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            padding: '2px 4px',
            color: comp.style.color || '#1f2937',
            fontSize: (comp.style.fontSize || 14) + 'px',
            fontWeight: comp.style.fontWeight || 400,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            lineHeight: 1.4,
            overflow: 'hidden',
            outline: isSelected ? '2px dashed rgba(59,130,246,0.5)' : isHovered ? '1.5px dashed rgba(59,130,246,0.25)' : 'none',
            borderRadius: 3
          }}
        >
          {comp.content || '文本'}
        </div>
      );
    }
    if (comp.type === 'image') {
      return (
        <div style={{ width: '100%', height: '100%', borderRadius: comp.type !== 'circle' ? (style.borderRadius as any) || 0 : '50%', overflow: 'hidden' }}>
          {comp.style.src ? (
            <img
              src={comp.style.src}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none', userSelect: 'none' }}
              draggable={false}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9ca3af',
                fontSize: 11,
                gap: 4
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              图片占位
            </div>
          )}
        </div>
      );
    }
    if (comp.content) {
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            padding: 6,
            color: comp.style.color || '#1f2937',
            fontSize: (comp.style.fontSize || 14) + 'px',
            fontWeight: comp.style.fontWeight || 400,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflow: 'hidden'
          }}
        >
          {comp.content}
        </div>
      );
    }
    return null;
  };

  return <div style={style}>{innerContent()}</div>;
}

const Canvas: React.FC<Props> = ({
  components,
  connections,
  selection,
  onSelect,
  onUpdateComponents,
  onAddConnection,
  onAddComponent
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [hoveredHandle, setHoveredHandle] = useState<HandlePosition | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [editingConnId, setEditingConnId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [hoveredCompId, setHoveredCompId] = useState<string | null>(null);
  const [hoveredConnId, setHoveredConnId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const editingInputRef = useRef<HTMLInputElement>(null);

  const sortedComponents = useMemo(
    () => [...components].sort((a, b) => a.zIndex - b.zIndex),
    [components]
  );

  const selectedComponent =
    selection?.kind === 'component'
      ? components.find(c => c.id === selection.id) || null
      : null;
  const selectedConnectionId =
    selection?.kind === 'connection' ? selection.id : null;

  const selectedBBox: BoundingBox | null = selectedComponent
    ? {
        x: selectedComponent.x,
        y: selectedComponent.y,
        width: selectedComponent.width,
        height: selectedComponent.height
      }
      : null;

  const screenToWorld = (sx: number, sy: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (sx - rect.left - offset.x) / scale,
      y: (sy - rect.top - offset.y) / scale
    };
  };

  const worldDelta = (dsx: number, dsy: number) => ({
    dx: dsx / scale,
    dy: dsy / scale
  });

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (!containerRef.current) return;
      const isZoom = e.ctrlKey || e.metaKey;
      if (!isZoom) return;
      e.preventDefault();
      const delta = -e.deltaY * 0.0015;
      const rect = containerRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const newScale = Math.max(0.2, Math.min(3, scale + delta));
      const ratio = newScale / scale;
      setOffset({
        x: mx - (mx - offset.x) * ratio,
        y: my - (my - offset.y) * ratio
      });
      setScale(newScale);
    };
    const el = containerRef.current;
    if (el) el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      if (el) el.removeEventListener('wheel', onWheel);
    };
  }, [scale, offset]);

  useEffect(() => {
    if (!dragState) return;

    const onMove = (e: MouseEvent) => {
      const dsx = e.clientX - dragState.startX;
      const dsy = e.clientY - dragState.startY;
      const { dx, dy } = worldDelta(dsx, dsy);

      if (dragState.type === 'move' && dragState.componentId) {
        const newComps = components.map(c =>
          c.id === dragState.componentId
            ? {
                ...c,
                x: Math.round((dragState.originalX ?? 0) + dx),
                y: Math.round((dragState.originalY ?? 0) + dy)
              }
            : c
        );
        onUpdateComponents(newComps);
      } else if (dragState.type === 'resize' && dragState.componentId && dragState.handle) {
        const handle = dragState.handle;
        const origX = dragState.originalX ?? 0;
        const origY = dragState.originalY ?? 0;
        const origW = dragState.originalWidth ?? 100;
        const origH = dragState.originalHeight ?? 100;
        let newX = origX;
        let newY = origY;
        let newW = origW;
        let newH = origH;

        if (handle.includes('left')) { newX = origX + dx; newW = origW - dx; }
        if (handle.includes('right')) { newW = origW + dx; }
        if (handle.includes('top')) { newY = origY + dy; newH = origH - dy; }
        if (handle.includes('bottom')) { newH = origH + dy; }

        newW = Math.max(16, Math.round(newW));
        newH = Math.max(16, Math.round(newH));
        newX = Math.round(newX);
        newY = Math.round(newY);

        const newComps = components.map(c =>
          c.id === dragState.componentId
            ? { ...c, x: newX, y: newY, width: newW, height: newH }
            : c
        );
        onUpdateComponents(newComps);
      } else if (dragState.type === 'rotate' && dragState.componentId) {
        const comp = components.find(c => c.id === dragState.componentId);
        if (!comp) return;
        const origR = dragState.originalRotation ?? 0;
        const origX = dragState.originalX ?? comp.x;
        const origY = dragState.originalY ?? comp.y;
        const origW = dragState.originalWidth ?? comp.width;
        const origH = dragState.originalHeight ?? comp.height;
        const center = { x: origX + origW / 2, y: origY + origH / 2 };
        const world = screenToWorld(e.clientX, e.clientY);
        const angleRad = Math.atan2(world.y - center.y, world.x - center.x);
        let angleDeg = (angleRad * 180) / Math.PI + 90;
        let delta = angleDeg - origR;
        delta = Math.round(delta / 15) * 15;
        const newRotation = (origR + delta + 360) % 360;
        const newComps = components.map(c =>
          c.id === dragState.componentId ? { ...c, rotation: newRotation } : c
        );
        onUpdateComponents(newComps);
      } else if (dragState.type === 'connect') {
        const world = screenToWorld(e.clientX, e.clientY);
        setDragState({ ...dragState, tempEndX: world.x, tempEndY: world.y });
      } else if (dragState.type === 'pan') {
        setOffset({
          x: (dragState as any).origOffsetX + dsx,
          y: (dragState as any).origOffsetY + dsy
        });
      }
    };

    const onUp = (e: MouseEvent) => {
      if (dragState.type === 'connect' && dragState.fromComponentId) {
        const world = screenToWorld(e.clientX, e.clientY);
        const target = findComponentAt(world.x, world.y, dragState.fromComponentId);
        if (target) {
          onAddConnection(dragState.fromComponentId, target.id);
        }
      }
      setDragState(null);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragState, components, scale, offset, onUpdateComponents, onAddConnection]);

  const findComponentAt = (wx: number, wy: number, excludeId?: string): CanvasComponent | null => {
    for (let i = sortedComponents.length - 1; i >= 0; i--) {
      const c = sortedComponents[i];
      if (excludeId && c.id === excludeId) continue;
      if (wx >= c.x && wx <= c.x + c.width && wy >= c.y && wy <= c.y + c.height) {
        return c;
      }
    }
    return null;
  };

  const onCanvasMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!(target.classList.contains('canvas-root') || target.classList.contains('canvas-inner'))) return;
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setDragState({
        type: 'pan',
        startX: e.clientX,
        startY: e.clientY,
        origOffsetX: offset.x,
        origOffsetY: offset.y
      } as any);
      return;
    }
    onSelect(null);
  };

  const startMove = (e: React.MouseEvent, comp: CanvasComponent) => {
    e.stopPropagation();
    onSelect({ kind: 'component', id: comp.id });
    setDragState({
      type: 'move',
      startX: e.clientX,
      startY: e.clientY,
      componentId: comp.id,
      originalX: comp.x,
      originalY: comp.y
    });
  };

  const startResize = (e: React.MouseEvent, comp: CanvasComponent, handle: HandlePosition) => {
    e.stopPropagation();
    setDragState({
      type: 'resize',
      startX: e.clientX,
      startY: e.clientY,
      componentId: comp.id,
      handle,
      originalX: comp.x,
      originalY: comp.y,
      originalWidth: comp.width,
      originalHeight: comp.height
    });
  };

  const startRotate = (e: React.MouseEvent, comp: CanvasComponent) => {
    e.stopPropagation();
    setDragState({
      type: 'rotate',
      startX: e.clientX,
      startY: e.clientY,
      componentId: comp.id,
      originalX: comp.x,
      originalY: comp.y,
      originalWidth: comp.width,
      originalHeight: comp.height,
      originalRotation: comp.rotation
    });
  };

  const startConnect = (e: React.MouseEvent, fromId: string) => {
    e.stopPropagation();
    const fromComp = components.find(c => c.id === fromId);
    if (!fromComp) return;
    const world = screenToWorld(e.clientX, e.clientY);
    const edgePoint = getEdgePoint(fromComp, world);
    setDragState({
      type: 'connect',
      startX: e.clientX,
      startY: e.clientY,
      fromComponentId: fromId,
      tempEndX: edgePoint.x,
      tempEndY: edgePoint.y
    });
  };

  const onDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/x-protoflow-type')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      setIsDragOver(true);
    }
  };

  const onDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const type = e.dataTransfer.getData('application/x-protoflow-type') as ComponentType;
    if (!type) return;
    const world = screenToWorld(e.clientX, e.clientY);
    onAddComponent(type, { x: Math.round(world.x), y: Math.round(world.y) });
  };

  useEffect(() => {
    if (editingConnId && editingInputRef.current) {
      editingInputRef.current.focus();
      editingInputRef.current.select();
    }
  }, [editingConnId]);

  const gridSize = 20;
  const gridSpacing = gridSize * scale;

  const renderGrid = () => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const lines: JSX.Element[] = [];
    const ox = ((offset.x % gridSpacing) + gridSpacing) % gridSpacing;
    const oy = ((offset.y % gridSpacing) + gridSpacing) % gridSpacing;

    for (let x = ox; x < w; x += gridSpacing) {
      lines.push(
        <line
          key={`vx-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={h}
          stroke="#e5e7eb"
          strokeWidth={0.5}
        />
      );
    }
    for (let y = oy; y < h; y += gridSpacing) {
      lines.push(
        <line
          key={`hy-${y}`}
          x1={0}
          y1={y}
          x2={w}
          y2={y}
          stroke="#e5e7eb"
          strokeWidth={0.5}
        />
      );
    }
    return (
      <svg
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1
        }}
      >
        {lines}
      </svg>
    );
  };

  const getConnectionPoints = (conn: Connection): { from: { x: number; y: number }; to: { x: number; y: number }; midX: number; midY: number } => {
    const fromComp = components.find(c => c.id === conn.fromComponentId);
    const toComp = components.find(c => c.id === conn.toComponentId);
    if (!fromComp || !toComp) {
      return { from: { x: 0, y: 0 }, to: { x: 0, y: 0 }, midX: 0, midY: 0 };
    }
    const fromCenter = getComponentCenter(fromComp);
    const toCenter = getComponentCenter(toComp);
    const from = getEdgePoint(fromComp, toCenter);
    const to = getEdgePoint(toComp, fromCenter);
    return {
      from,
      to,
      midX: (from.x + to.x) / 2,
      midY: (from.y + to.y) / 2
    };
  };

  const handleConnectionClick = (e: React.MouseEvent, connId: string) => {
    e.stopPropagation();
    onSelect({ kind: 'connection', id: connId });
  };

  const handleConnectionDoubleClick = (e: React.MouseEvent, conn: Connection) => {
    e.stopPropagation();
    setEditingConnId(conn.id);
    setEditingLabel(conn.label);
    onSelect({ kind: 'connection', id: conn.id });
  };

  const finishEditingLabel = () => {
    if (!editingConnId) return;
    const conns = connections.map(c =>
      c.id === editingConnId ? { ...c, label: editingLabel } : c
    );
    const evt = new CustomEvent('__update_connections__', { detail: { conns } });
    window.dispatchEvent(evt);
    setEditingConnId(null);
  };

  const handleDeleteConnection = (e: React.MouseEvent, connId: string) => {
    e.stopPropagation();
    const evt = new CustomEvent('__delete_connection__', { detail: { id: connId } });
    window.dispatchEvent(evt);
  };

  return (
    <div
      ref={containerRef}
      className="canvas-root"
      onMouseDown={onCanvasMouseDown}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        cursor: dragState?.type === 'pan' ? 'grabbing' : isDragOver ? 'copy' : 'default',
        background: isDragOver ? 'rgba(59,130,246,0.06)' : '#f3f4f6'
      }}
    >
      {renderGrid()}

      {isDragOver && (
        <div
          style={{
            position: 'absolute',
            inset: 12,
            border: '2px dashed #3b82f6',
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#3b82f6',
            fontSize: 14,
            fontWeight: 600,
            pointerEvents: 'none',
            zIndex: 50,
            background: 'rgba(59,130,246,0.04)'
          }}
        >
          释放以添加组件到画布
        </div>
      )}

      <div
        className="canvas-inner"
        style={{
          position: 'absolute',
          left: offset.x,
          top: offset.y,
          transform: `scale(${scale})`,
          transformOrigin: '0 0',
          width: 4000,
          height: 3000,
          zIndex: 2
        }}
      >
        <svg
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 4000,
            height: 3000,
            pointerEvents: 'none',
            zIndex: 10,
            overflow: 'visible'
          }}
        >
          <defs>
            <marker id="arrow-default" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#6b7280" />
            </marker>
            <marker id="arrow-selected" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#f97316" />
            </marker>
            <marker id="arrow-hover" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
            </marker>
          </defs>

          {connections.map(conn => {
            const { from, to, midX, midY } = getConnectionPoints(conn);
            const isSel = selectedConnectionId === conn.id;
            const isHover = hoveredConnId === conn.id;
            const isEdit = editingConnId === conn.id;
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len < 1) return null;
            const offX = (dx / len) * 50;
            const offY = (dy / len) * 50;
            const cp1x = from.x + offX;
            const cp1y = from.y + offY;
            const cp2x = to.x - offX;
            const cp2y = to.y - offY;
            const d = `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`;

            let stroke: string;
            let strokeW: number;
            let marker: string;
            if (isSel) {
              stroke = '#f97316';
              strokeW = 3;
              marker = 'url(#arrow-selected)';
            } else if (isHover) {
              stroke = '#3b82f6';
              strokeW = 2.2;
              marker = 'url(#arrow-hover)';
            } else {
              stroke = '#6b7280';
              strokeW = 1.8;
              marker = 'url(#arrow-default)';
            }

            const circleRadius = isSel ? 6 : isHover ? 5 : 4.5;
            const circleStroke = isSel ? '#f97316' : isHover ? '#3b82f6' : '#6b7280';
            const circleFill = '#ffffff';

            return (
              <g key={conn.id} style={{ pointerEvents: 'auto' }}>
                <path
                  d={d}
                  stroke="transparent"
                  strokeWidth={18}
                  fill="none"
                  style={{ cursor: 'pointer' }}
                  onClick={e => handleConnectionClick(e, conn.id)}
                  onDoubleClick={e => handleConnectionDoubleClick(e, conn)}
                  onMouseEnter={() => setHoveredConnId(conn.id)}
                  onMouseLeave={() => setHoveredConnId(cid => cid === conn.id ? null : cid)}
                />
                <path
                  d={d}
                  stroke={stroke}
                  strokeWidth={strokeW}
                  fill="none"
                  markerEnd={marker}
                  style={{ pointerEvents: 'none', transition: 'all 0.15s' }}
                />
                <circle
                  cx={from.x}
                  cy={from.y}
                  r={circleRadius}
                  fill={circleFill}
                  stroke={circleStroke}
                  strokeWidth={2}
                  style={{ pointerEvents: 'none', transition: 'all 0.15s' }}
                />

                {!isEdit && (
                  <foreignObject
                    x={midX - 80}
                    y={midY - 18}
                    width={160}
                    height={36}
                    style={{ overflow: 'visible', pointerEvents: 'none' }}
                  >
                    <div
                      onDoubleClick={e => handleConnectionDoubleClick(e, conn)}
                      onClick={e => handleConnectionClick(e, conn.id)}
                      onMouseEnter={() => setHoveredConnId(conn.id)}
                      onMouseLeave={() => setHoveredConnId(cid => cid === conn.id ? null : cid)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px 12px',
                        background: isSel ? '#fff7ed' : isHover ? '#eff6ff' : '#f9fafb',
                        color: isSel ? '#c2410c' : isHover ? '#1d4ed8' : '#374151',
                        border: `1.5px solid ${isSel ? '#fdba74' : isHover ? '#93c5fd' : '#e5e7eb'}`,
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 600,
                        maxWidth: 160,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        cursor: 'pointer',
                        pointerEvents: 'auto',
                        boxShadow: isSel
                          ? '0 3px 10px rgba(249,115,22,0.2)'
                          : isHover
                          ? '0 2px 6px rgba(59,130,246,0.15)'
                          : '0 1px 3px rgba(0,0,0,0.05)',
                        transition: 'all 0.15s'
                      }}
                    >
                      {conn.label || '跳转'}
                    </div>
                  </foreignObject>
                )}

                {isSel && !isEdit && (
                  <foreignObject x={midX + 52} y={midY - 20} width={36} height={36} style={{ overflow: 'visible', pointerEvents: 'auto' }}>
                    <div
                      onClick={e => handleDeleteConnection(e, conn.id)}
                      title="删除连线"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: '#ffffff',
                        color: '#ef4444',
                        border: '1.5px solid #fecaca',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 3px 10px rgba(239,68,68,0.25)',
                        transition: 'all 0.15s',
                        lineHeight: 1
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = '#ef4444';
                        e.currentTarget.style.color = '#ffffff';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = '#ffffff';
                        e.currentTarget.style.color = '#ef4444';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </div>
                  </foreignObject>
                )}

                {isEdit && (
                  <foreignObject
                    x={midX - 100}
                    y={midY - 20}
                    width={200}
                    height={40}
                    style={{ overflow: 'visible', pointerEvents: 'auto' }}
                  >
                    <input
                      ref={editingInputRef}
                      value={editingLabel}
                      onChange={e => setEditingLabel(e.target.value)}
                      onBlur={finishEditingLabel}
                      onKeyDown={e => {
                        if (e.key === 'Enter') finishEditingLabel();
                        if (e.key === 'Escape') { setEditingConnId(null); }
                      }}
                      placeholder="输入标签文字..."
                      style={{
                        width: '100%',
                        padding: '7px 12px',
                        border: '2px solid #3b82f6',
                        borderRadius: 8,
                        fontSize: 12,
                        outline: 'none',
                        background: '#fff',
                        boxShadow: '0 4px 12px rgba(59,130,246,0.25)',
                        fontWeight: 500,
                        color: '#1f2937'
                      }}
                    />
                  </foreignObject>
                )}
              </g>
            );
          })}

          {dragState?.type === 'connect' && dragState.fromComponentId && dragState.tempEndX != null && (
            (() => {
              const fromComp = components.find(c => c.id === dragState.fromComponentId);
              if (!fromComp) return null;
              const to = { x: dragState.tempEndX, y: dragState.tempEndY };
              const fromCenter = getComponentCenter(fromComp);
              const from = getEdgePoint(fromComp, to);
              const targetComp = findComponentAt(to.x, to.y, dragState.fromComponentId);
              const effectiveTo = targetComp ? getEdgePoint(targetComp, fromCenter) : to;
              const dx = effectiveTo.x - from.x;
              const dy = effectiveTo.y - from.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              const offX = len > 0 ? (dx / len) * 50 : 0;
              const offY = len > 0 ? (dy / len) * 50 : 0;
              const d = `M ${from.x} ${from.y} C ${from.x + offX} ${from.y + offY}, ${effectiveTo.x - offX} ${effectiveTo.y - offY}, ${effectiveTo.x} ${effectiveTo.y}`;
              const strokeColor = targetComp ? '#10b981' : '#3b82f6';
              return (
                <g style={{ pointerEvents: 'none' }}>
                  <path
                    d={d}
                    stroke={strokeColor}
                    strokeWidth={2.2}
                    strokeDasharray="8 5"
                    fill="none"
                    markerEnd="url(#arrow-hover)"
                    opacity={0.9}
                  />
                  <circle cx={from.x} cy={from.y} r={6} fill="#ffffff" stroke={strokeColor} strokeWidth={2.2} />
                  <circle cx={effectiveTo.x} cy={effectiveTo.y} r={targetComp ? 11 : 7} fill="none" stroke={strokeColor} strokeWidth={2.2} strokeDasharray={targetComp ? '0' : '3 2'} />
                  {targetComp && (
                    <circle cx={effectiveTo.x} cy={effectiveTo.y} r={4} fill={strokeColor} />
                  )}
                </g>
              );
            })()
          )}
        </svg>

        <div style={{ position: 'absolute', left: 0, top: 0, width: 4000, height: 3000, zIndex: 20 }}>
          {sortedComponents.map(comp => {
            const isSel = selectedComponent?.id === comp.id;
            const isHover = hoveredCompId === comp.id;
            return (
              <div
                key={comp.id}
                onMouseDown={e => startMove(e, comp)}
                onMouseEnter={() => setHoveredCompId(comp.id)}
                onMouseLeave={() => setHoveredCompId(cid => cid === comp.id ? null : cid)}
                style={{
                  position: 'absolute',
                  left: comp.x - 8,
                  top: comp.y - 40,
                  width: comp.width + 16,
                  height: comp.height + 80,
                  zIndex: isSel ? 99999 : comp.zIndex
                }}
              >
                <div style={{ position: 'absolute', left: 8, top: 40 }}>
                  <CanvasComponentView comp={comp} isSelected={isSel} isHovered={isHover} />
                </div>

                {(isSel || isHover) && (
                  <>
                    <div
                      onMouseDown={e => startConnect(e, comp.id)}
                      title="拖拽到其他组件创建跳转连线"
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: -2,
                        transform: 'translateX(-50%)',
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: isSel ? '#f97316' : 'rgba(59,130,246,0.9)',
                        border: '2.5px solid #ffffff',
                        boxShadow: isSel ? '0 3px 10px rgba(249,115,22,0.4)' : '0 2px 6px rgba(59,130,246,0.3)',
                        cursor: 'crosshair',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 500,
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateX(-50%) scale(1.15)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </div>

                    <div
                      onMouseDown={e => startConnect(e, comp.id)}
                      title="拖拽创建跳转"
                      style={{ position: 'absolute', left: -2, top: comp.height / 2 + 32, width: 16, height: 16, borderRadius: '50%', background: '#3b82f6', border: '2px solid #fff', cursor: 'crosshair', zIndex: 500, boxShadow: '0 2px 5px rgba(59,130,246,0.3)' }}
                    />
                    <div
                      onMouseDown={e => startConnect(e, comp.id)}
                      title="拖拽创建跳转"
                      style={{ position: 'absolute', right: -2, top: comp.height / 2 + 32, width: 16, height: 16, borderRadius: '50%', background: '#3b82f6', border: '2px solid #fff', cursor: 'crosshair', zIndex: 500, boxShadow: '0 2px 5px rgba(59,130,246,0.3)' }}
                    />
                    <div
                      onMouseDown={e => startConnect(e, comp.id)}
                      title="拖拽创建跳转"
                      style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: comp.height + 46, width: 16, height: 16, borderRadius: '50%', background: '#3b82f6', border: '2px solid #fff', cursor: 'crosshair', zIndex: 500, boxShadow: '0 2px 5px rgba(59,130,246,0.3)' }}
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>

        {selectedComponent && selectedBBox && (
          <div
            style={{
              position: 'absolute',
              left: selectedBBox.x - 1,
              top: selectedBBox.y - 1,
              width: selectedBBox.width + 2,
              height: selectedBBox.height + 2,
              border: `1.5px dashed rgb(59, 130, 246)`,
              pointerEvents: 'none',
              zIndex: 999999,
              transform: `rotate(${selectedComponent.rotation}deg)`,
              transformOrigin: `${selectedBBox.width / 2 + 1}px ${selectedBBox.height / 2 + 1}px`
            }}
          >
            {HANDLES.map(h => {
              const pos = getHandlePos(h, {
                x: -6,
                y: -6,
                width: selectedBBox.width + 12,
                height: selectedBBox.height + 12
              });
              const isHover = hoveredHandle === h;
              return (
                <div
                  key={h}
                  onMouseEnter={() => setHoveredHandle(h)}
                  onMouseLeave={() => setHoveredHandle(null)}
                  onMouseDown={e => startResize(e, selectedComponent, h)}
                  style={{
                    position: 'absolute',
                    left: pos.x - 6,
                    top: pos.y - 6,
                    width: 12,
                    height: 12,
                    borderRadius: 3,
                    background: isHover ? 'rgb(59, 130, 246)' : '#ffffff',
                    border: `2px solid ${isHover ? 'rgb(59, 130, 246)' : 'rgb(59, 130, 246)'}`,
                    cursor: getCursor(h),
                    pointerEvents: 'auto',
                    boxShadow: isHover ? '0 0 0 4px rgba(59,130,246,0.2)' : '0 1px 3px rgba(0,0,0,0.1)',
                    transition: 'all 0.12s'
                  }}
                />
              );
            })}

            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: -38,
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <div style={{ width: 1.5, height: 16, background: 'rgb(59, 130, 246)', marginBottom: 2 }} />
              <div
                onMouseDown={e => startRotate(e, selectedComponent)}
                title={`旋转 ${selectedComponent.rotation}°（按住拖拽，以15°为增量吸附）`}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: 'rgb(59, 130, 246)',
                  border: '2.5px solid #ffffff',
                  boxShadow: '0 4px 12px rgba(59,130,246,0.4)',
                  cursor: 'grab',
                  pointerEvents: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff'
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.1)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 4v6h-6" />
                  <path d="M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
              </div>
              <div
                style={{
                  marginTop: 5,
                  padding: '3px 9px',
                  background: '#1f2937',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  borderRadius: 5,
                  whiteSpace: 'nowrap',
                  letterSpacing: 0.3,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                }}
              >
                {selectedComponent.rotation}°
              </div>
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          position: 'absolute',
          right: 16,
          bottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          padding: 6,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(6px)',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          zIndex: 100,
          userSelect: 'none'
        }}
      >
        <button
          onClick={() => setScale(s => Math.max(0.2, s - 0.1))}
          style={{ width: 32, height: 32, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151', fontWeight: 700, fontSize: 16 }}
          onMouseEnter={e => (e.currentTarget.style.background = '#e5e7eb')}
          onMouseLeave={e => (e.currentTarget.style.background = '#f3f4f6')}
          title="缩小（Ctrl+滚轮）"
        >−</button>
        <div style={{ padding: '0 12px', fontSize: 12, fontWeight: 700, color: '#374151', minWidth: 52, textAlign: 'center' }}>
          {Math.round(scale * 100)}%
        </div>
        <button
          onClick={() => setScale(s => Math.min(3, s + 0.1))}
          style={{ width: 32, height: 32, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151', fontWeight: 700, fontSize: 16 }}
          onMouseEnter={e => (e.currentTarget.style.background = '#e5e7eb')}
          onMouseLeave={e => (e.currentTarget.style.background = '#f3f4f6')}
          title="放大（Ctrl+滚轮）"
        >+</button>
        <div style={{ width: 1, height: 22, background: '#e5e7eb', margin: '0 4px' }} />
        <button
          onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }}
          style={{ padding: '0 14px', height: 32, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#374151', fontSize: 12, fontWeight: 600 }}
          onMouseEnter={e => (e.currentTarget.style.background = '#e5e7eb')}
          onMouseLeave={e => (e.currentTarget.style.background = '#f3f4f6')}
          title="重置缩放和位置"
        >重置</button>
      </div>

      <div
        style={{
          position: 'absolute',
          left: 16,
          bottom: 16,
          padding: '8px 14px',
          background: 'rgba(255,255,255,0.92)',
          borderRadius: 10,
          border: '1px solid #e5e7eb',
          fontSize: 11,
          color: '#6b7280',
          zIndex: 100,
          pointerEvents: 'none',
          backdropFilter: 'blur(6px)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          fontWeight: 500
        }}
      >
        <b style={{ color: '#1f2937', fontSize: 12 }}>{components.length}</b> 个组件 · <b style={{ color: '#1f2937', fontSize: 12 }}>{connections.length}</b> 条连线 · 按住 <b>Ctrl</b> + 滚轮缩放
      </div>
    </div>
  );
};

export default Canvas;
