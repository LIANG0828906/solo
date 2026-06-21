import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useMindMap } from '../context/MindMapContext';
import { computeLayout } from '../utils/layout';
import { Node } from './Node';
import { UserAvatars } from './UserAvatars';

const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
const MIN_SCALE = 0.5;
const MAX_SCALE = 2.0;
const DEFAULT_SCALE = 0.75;
const BOUNCE_LIMIT = 200;

export const Canvas: React.FC = () => {
  const { data, setSelectedNodeId } = useMindMap();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(DEFAULT_SCALE);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const panStart = useRef<{ mx: number; my: number; ox: number; oy: number } | null>(null);
  const [mountedNodes, setMountedNodes] = useState<Set<string>>(new Set());
  const [justAdded, setJustAdded] = useState<Set<string>>(new Set());

  const layout = useMemo(() => {
    if (!data) return null;
    return computeLayout(data.rootId, data.nodes);
  }, [data]);

  useEffect(() => {
    if (!layout || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cw = rect.width;
    const ch = rect.height;
    const lw = layout.bounds.maxX - layout.bounds.minX;
    const lh = layout.bounds.maxY - layout.bounds.minY;
    const contentCX = (layout.bounds.minX + layout.bounds.maxX) / 2;
    const contentCY = (layout.bounds.minY + layout.bounds.maxY) / 2;
    setScale(DEFAULT_SCALE);
    setOffset({
      x: cw / 2 - contentCX * DEFAULT_SCALE,
      y: ch / 2 - contentCY * DEFAULT_SCALE,
    });
    const ids = new Set(Object.keys(layout.positions));
    setMountedNodes(ids);
  }, [layout?.bounds.minX, layout?.bounds.maxX, layout?.bounds.minY, layout?.bounds.maxY]);

  useEffect(() => {
    if (!data || !mountedNodes.size) return;
    const added = new Set<string>();
    for (const id in data.nodes) {
      if (!mountedNodes.has(id)) added.add(id);
    }
    if (added.size) {
      setJustAdded(added);
      const timer = setTimeout(() => {
        setMountedNodes(new Set(Object.keys(data.nodes)));
        setJustAdded(new Set());
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [data, mountedNodes]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    setScale((s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s + delta)));
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setPanning(true);
    panStart.current = {
      mx: e.clientX,
      my: e.clientY,
      ox: offset.x,
      oy: offset.y,
    };
    setSelectedNodeId(null);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!panning || !panStart.current) return;
    const dx = e.clientX - panStart.current.mx;
    const dy = e.clientY - panStart.current.my;
    let nx = panStart.current.ox + dx;
    let ny = panStart.current.oy + dy;
    if (layout) {
      const lw = (layout.bounds.maxX - layout.bounds.minX) * scale;
      const lh = (layout.bounds.maxY - layout.bounds.minY) * scale;
      const cw = containerRef.current?.clientWidth ?? 800;
      const ch = containerRef.current?.clientHeight ?? 600;
      const maxX = cw * 0.3;
      const minX = -lw + cw * 0.7;
      const maxY = ch * 0.3;
      const minY = -lh + ch * 0.7;
      if (nx > maxX) nx = maxX + Math.pow(nx - maxX, 0.7);
      if (nx < minX) nx = minX - Math.pow(minX - nx, 0.7);
      if (ny > maxY) ny = maxY + Math.pow(ny - maxY, 0.7);
      if (ny < minY) ny = minY - Math.pow(minY - ny, 0.7);
      if (nx > maxX + BOUNCE_LIMIT) nx = maxX + BOUNCE_LIMIT;
      if (nx < minX - BOUNCE_LIMIT) nx = minX - BOUNCE_LIMIT;
      if (ny > maxY + BOUNCE_LIMIT) ny = maxY + BOUNCE_LIMIT;
      if (ny < minY - BOUNCE_LIMIT) ny = minY - BOUNCE_LIMIT;
    }
    setOffset({ x: nx, y: ny });
  };

  const onMouseUp = () => {
    if (!panning) return;
    setPanning(false);
    if (layout && containerRef.current) {
      const lw = (layout.bounds.maxX - layout.bounds.minX) * scale;
      const lh = (layout.bounds.maxY - layout.bounds.minY) * scale;
      const cw = containerRef.current.clientWidth;
      const ch = containerRef.current.clientHeight;
      const maxX = cw * 0.3;
      const minX = -lw + cw * 0.7;
      const maxY = ch * 0.3;
      const minY = -lh + ch * 0.7;
      let nx = offset.x;
      let ny = offset.y;
      if (nx > maxX) nx = maxX;
      if (nx < minX) nx = minX;
      if (ny > maxY) ny = maxY;
      if (ny < minY) ny = minY;
      if (nx !== offset.x || ny !== offset.y) {
        setTimeout(() => setOffset({ x: nx, y: ny }), 10);
      }
    }
    panStart.current = null;
  };

  if (!data || !layout) {
    return (
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f0f0f5 0%, #e8e8f0 100%)',
          color: '#666',
          fontSize: 14,
        }}
      >
        连接服务端中...
      </div>
    );
  }

  const renderConnections = () =>
    layout.connections.map((c, i) => {
      const sx = c.fromX * scale + offset.x;
      const sy = c.fromY * scale + offset.y;
      const ex = c.toX * scale + offset.x;
      const ey = c.toY * scale + offset.y;
      const midX = (sx + ex) / 2;
      const d = `M ${sx} ${sy} C ${midX} ${sy}, ${midX} ${ey}, ${ex} ${ey}`;
      return (
        <path
          key={i}
          d={d}
          stroke="#b0bec5"
          strokeWidth={1.5}
          fill="none"
          style={{
            transition: `d 0.3s ${EASE}`,
            vectorEffect: 'non-scaling-stroke',
          }}
        />
      );
    });

  const renderNodes = () => {
    const result: React.ReactNode[] = [];
    const visit = (nodeId: string) => {
      const node = data.nodes[nodeId];
      const pos = layout.positions[nodeId];
      if (!node || !pos) return;
      result.push(
        <Node
          key={nodeId}
          node={node}
          x={pos.x * scale + offset.x}
          y={pos.y * scale + offset.y}
          width={pos.width * scale}
          height={pos.height * scale}
          isRoot={nodeId === data.rootId}
          mounted={mountedNodes}
          justAdded={justAdded}
        />
      );
      if (!node.collapsed) {
        for (const cid of node.childrenIds) visit(cid);
      }
    };
    visit(data.rootId);
    return result;
  };

  return (
    <div
      ref={containerRef}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #f0f0f5 0%, #e8e8f0 100%)',
        cursor: panning ? 'grabbing' : 'grab',
        userSelect: 'none',
      }}
    >
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        {renderConnections()}
      </svg>
      {renderNodes()}

      <UserAvatars />

      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(6px)',
          borderRadius: 8,
          fontSize: 12,
          color: '#555',
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
          zIndex: 50,
        }}
      >
        🔍 {(scale * 100).toFixed(0)}%
      </div>
    </div>
  );
};
