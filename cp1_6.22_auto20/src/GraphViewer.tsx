import { useRef, useEffect, useCallback } from 'react';
import { GraphEngine, GraphNode } from './GraphEngine';

interface Props {
  engine: GraphEngine;
  selectedNodeId: string | null;
  searchQuery: string;
  focusNodeId: string | null;
  onCreateEdge: (source: string, target: string) => void;
  onNodeClick: (id: string) => void;
  onFocusComplete: () => void;
}

interface Transform {
  x: number;
  y: number;
  scale: number;
}

interface CameraTransition {
  from: Transform;
  to: Transform;
  startTime: number;
  duration: number;
}

interface DragState {
  type: 'none' | 'node' | 'pan' | 'edge';
  nodeId?: string;
  startX?: number;
  startY?: number;
  offsetX?: number;
  offsetY?: number;
  mouseX?: number;
  mouseY?: number;
  moved?: boolean;
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export default function GraphViewer({
  engine,
  selectedNodeId,
  searchQuery,
  focusNodeId,
  onCreateEdge,
  onNodeClick,
  onFocusComplete,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<Transform>({ x: 0, y: 0, scale: 1 });
  const hoveredNodeRef = useRef<GraphNode | null>(null);
  const dragStateRef = useRef<DragState>({ type: 'none' });
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const cameraTransitionRef = useRef<CameraTransition | null>(null);
  const searchQueryRef = useRef(searchQuery);
  const focusNodeIdRef = useRef(focusNodeId);
  const selectedNodeIdRef = useRef(selectedNodeId);
  const dprRef = useRef(1);
  const canvasSizeRef = useRef({ w: 0, h: 0 });

  useEffect(() => { searchQueryRef.current = searchQuery; }, [searchQuery]);
  useEffect(() => { focusNodeIdRef.current = focusNodeId; }, [focusNodeId]);
  useEffect(() => { selectedNodeIdRef.current = selectedNodeId; }, [selectedNodeId]);

  const screenToWorld = useCallback((sx: number, sy: number): [number, number] => {
    const t = transformRef.current;
    return [(sx - t.x) / t.scale, (sy - t.y) / t.scale];
  }, []);

  const worldToScreen = useCallback((wx: number, wy: number): [number, number] => {
    const t = transformRef.current;
    return [wx * t.scale + t.x, wy * t.y + t.y];
  }, []);

  useEffect(() => {
    if (!focusNodeId) return;
    const node = engine.nodes.get(focusNodeId);
    if (!node) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const current = { ...transformRef.current };
    const targetScale = 1.5;
    const cw = canvasSizeRef.current.w;
    const ch = canvasSizeRef.current.h;
    const targetX = cw / 2 - node.x * targetScale;
    const targetY = ch / 2 - node.y * targetScale;

    cameraTransitionRef.current = {
      from: current,
      to: { x: targetX, y: targetY, scale: targetScale },
      startTime: performance.now(),
      duration: 500,
    };
    onFocusComplete();
  }, [focusNodeId, engine, onFocusComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: false })!;
    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      canvasSizeRef.current = { w, h };
      engine.setDimensions(w, h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const draw = (timestamp: number) => {
      const dt = lastTimeRef.current === 0 ? 0.016 : Math.min(0.05, (timestamp - lastTimeRef.current) / 1000);
      lastTimeRef.current = timestamp;

      const ct = cameraTransitionRef.current;
      if (ct) {
        const elapsed = timestamp - ct.startTime;
        const progress = Math.min(1, elapsed / ct.duration);
        const t = transformRef.current;
        t.x = ct.from.x + (ct.to.x - ct.from.x) * progress;
        t.y = ct.from.y + (ct.to.y - ct.from.y) * progress;
        t.scale = ct.from.scale + (ct.to.scale - ct.from.scale) * progress;
        if (progress >= 1) cameraTransitionRef.current = null;
      }

      engine.tick();
      engine.animateOpacities(dt);

      const nodes = engine.getNodes();
      const edges = engine.getEdges();
      const query = searchQueryRef.current.toLowerCase();
      const hoveredNode = hoveredNodeRef.current;
      const selId = selectedNodeIdRef.current;

      const matchedIds = new Set<string>();
      if (query) {
        for (const node of nodes) {
          if (
            node.title.toLowerCase().includes(query) ||
            node.keywords.some(k => k.toLowerCase().includes(query))
          ) {
            matchedIds.add(node.id);
          }
        }
      }

      const w = canvasSizeRef.current.w;
      const h = canvasSizeRef.current.h;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);

      const tf = transformRef.current;
      ctx.save();
      ctx.translate(tf.x, tf.y);
      ctx.scale(tf.scale, tf.scale);

      for (const edge of edges) {
        const src = engine.nodes.get(edge.source);
        const tgt = engine.nodes.get(edge.target);
        if (!src || !tgt) continue;

        let opacity = edge.opacity;
        let lineWidth = Math.max(1, edge.strength);

        if (hoveredNode) {
          if (edge.source === hoveredNode.id || edge.target === hoveredNode.id) {
            opacity = 0.9;
            lineWidth = edge.strength + 2;
          } else {
            opacity = Math.min(opacity, 0.05);
          }
        }

        if (query && matchedIds.size > 0) {
          if (!matchedIds.has(edge.source) || !matchedIds.has(edge.target)) {
            opacity *= 0.08;
          } else {
            opacity = Math.max(opacity, 0.5);
          }
        }

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.strokeStyle = `rgba(160,160,160,${opacity})`;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }

      const ds = dragStateRef.current;
      if (ds.type === 'edge' && ds.nodeId && ds.mouseX !== undefined && ds.mouseY !== undefined) {
        const srcNode = engine.nodes.get(ds.nodeId);
        if (srcNode) {
          const [mx, my] = screenToWorld(ds.mouseX, ds.mouseY);
          ctx.beginPath();
          ctx.moveTo(srcNode.x, srcNode.y);
          ctx.lineTo(mx, my);
          ctx.strokeStyle = 'rgba(74,144,217,0.7)';
          ctx.lineWidth = 2;
          ctx.setLineDash([8, 5]);
          ctx.stroke();
          ctx.setLineDash([]);

          const angle = Math.atan2(my - srcNode.y, mx - srcNode.x);
          const headLen = 14;
          ctx.beginPath();
          ctx.moveTo(mx, my);
          ctx.lineTo(mx - headLen * Math.cos(angle - 0.35), my - headLen * Math.sin(angle - 0.35));
          ctx.moveTo(mx, my);
          ctx.lineTo(mx - headLen * Math.cos(angle + 0.35), my - headLen * Math.sin(angle + 0.35));
          ctx.strokeStyle = 'rgba(74,144,217,0.8)';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
      }

      for (const node of nodes) {
        const isHovered = hoveredNode?.id === node.id;
        const isSelected = selId === node.id;

        let nodeScale = node.scale;
        let nodeOpacity = node.opacity;
        let drawSize = node.size;
        let isSearchMatch = false;

        if (query && matchedIds.size > 0) {
          if (matchedIds.has(node.id)) {
            isSearchMatch = true;
            nodeScale = 1.15;
            nodeOpacity = 1;
          } else {
            drawSize = 10;
            nodeOpacity = 0.25;
            nodeScale = 1;
          }
        }

        if (isHovered && !isSearchMatch) {
          nodeScale = 1.2;
        }

        const r = Math.max(4, (drawSize / 2) * nodeScale);
        const [cr, cg, cb] = hexToRgb(node.color);

        ctx.save();

        if (isHovered) {
          ctx.shadowColor = node.color;
          ctx.shadowBlur = 24;
        } else if (isSelected) {
          ctx.shadowColor = 'rgba(74,144,217,0.4)';
          ctx.shadowBlur = 14;
        } else {
          ctx.shadowColor = 'rgba(0,0,0,0.08)';
          ctx.shadowBlur = 6;
          ctx.shadowOffsetY = 2;
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);

        const dimFactor = hoveredNode && !isHovered && !isSearchMatch ? 0.15 : 1;
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${nodeOpacity * dimFactor})`;
        ctx.fill();

        if (isSelected) {
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.strokeStyle = '#4A90D9';
          ctx.lineWidth = 2.5 / tf.scale;
          ctx.stroke();
        }

        ctx.restore();

        if (r > 7) {
          const label = node.title.slice(0, 2);
          const labelOpacity = hoveredNode && !isHovered && !isSearchMatch ? 0.15 : nodeOpacity;
          ctx.fillStyle = `rgba(255,255,255,${labelOpacity * (dimFactor)})`;
          ctx.font = `bold ${Math.max(9, r * 0.55)}px -apple-system, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, node.x, node.y);
        }
      }

      ctx.restore();

      if (hoveredNode && ds.type === 'none') {
        const [sx, sy] = worldToScreen(hoveredNode.x, hoveredNode.y);
        const tipW = Math.min(240, w - 20);
        const titleLine = hoveredNode.title;
        ctx.font = 'bold 13px -apple-system, sans-serif';
        const titleW = ctx.measureText(titleLine).width + 24;
        const actualW = Math.min(tipW, Math.max(160, titleW));

        const summaryLines: string[] = [];
        let line = '';
        ctx.font = '12px -apple-system, sans-serif';
        for (const ch of hoveredNode.summary.slice(0, 80)) {
          line += ch;
          if (ctx.measureText(line).width > actualW - 24) {
            summaryLines.push(line);
            line = '';
          }
        }
        if (line) summaryLines.push(line);
        if (hoveredNode.summary.length > 80) {
          summaryLines[summaryLines.length - 1] += '...';
        }

        const tipH = 18 + 22 + summaryLines.length * 17 + 10;

        let tx = sx + 18;
        let ty = sy - tipH - 12;
        if (tx + actualW > w - 10) tx = sx - actualW - 18;
        if (ty < 10) ty = sy + 24;
        if (tx < 10) tx = 10;

        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.15)';
        ctx.shadowBlur = 12;
        ctx.shadowOffsetY = 3;
        drawRoundRect(ctx, tx, ty, actualW, tipH, 8);
        ctx.fillStyle = 'rgba(40,40,40,0.93)';
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px -apple-system, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(titleLine.slice(0, 22) + (titleLine.length > 22 ? '...' : ''), tx + 12, ty + 10);

        ctx.fillStyle = '#ccc';
        ctx.font = '12px -apple-system, sans-serif';
        summaryLines.forEach((ln, i) => {
          ctx.fillText(ln, tx + 12, ty + 30 + i * 17);
        });
      }

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(draw);
    };

    lastTimeRef.current = 0;
    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      ro.disconnect();
    };
  }, [engine, screenToWorld, worldToScreen]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getPos = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { sx: e.clientX - rect.left, sy: e.clientY - rect.top };
    };

    const handleMouseDown = (e: MouseEvent) => {
      const { sx, sy } = getPos(e);
      const [wx, wy] = screenToWorld(sx, sy);
      const node = engine.findNodeAt(wx, wy);

      if (e.shiftKey && node) {
        dragStateRef.current = { type: 'edge', nodeId: node.id, mouseX: sx, mouseY: sy, moved: false };
        return;
      }

      if (node) {
        dragStateRef.current = {
          type: 'node',
          nodeId: node.id,
          offsetX: wx - node.x,
          offsetY: wy - node.y,
          startX: sx,
          startY: sy,
          moved: false,
        };
        canvas.style.cursor = 'grabbing';
      } else {
        dragStateRef.current = {
          type: 'pan',
          startX: sx,
          startY: sy,
          offsetX: transformRef.current.x,
          offsetY: transformRef.current.y,
          moved: false,
        };
        canvas.style.cursor = 'move';
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const { sx, sy } = getPos(e);
      const ds = dragStateRef.current;

      if (ds.type === 'node' && ds.nodeId) {
        const dist = Math.abs(sx - (ds.startX || 0)) + Math.abs(sy - (ds.startY || 0));
        if (dist > 3) ds.moved = true;
        const [wx, wy] = screenToWorld(sx, sy);
        const node = engine.nodes.get(ds.nodeId);
        if (node) {
          node.x = wx - (ds.offsetX || 0);
          node.y = wy - (ds.offsetY || 0);
          node.vx = 0;
          node.vy = 0;
        }
      } else if (ds.type === 'pan') {
        const dist = Math.abs(sx - (ds.startX || 0)) + Math.abs(sy - (ds.startY || 0));
        if (dist > 3) ds.moved = true;
        transformRef.current.x = (ds.offsetX || 0) + (sx - (ds.startX || 0));
        transformRef.current.y = (ds.offsetY || 0) + (sy - (ds.startY || 0));
      } else if (ds.type === 'edge') {
        ds.mouseX = sx;
        ds.mouseY = sy;
        ds.moved = true;
      } else {
        const [wx, wy] = screenToWorld(sx, sy);
        const node = engine.findNodeAt(wx, wy);
        hoveredNodeRef.current = node;
        canvas.style.cursor = node ? 'grab' : 'default';
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      const ds = dragStateRef.current;
      const { sx, sy } = getPos(e);

      if (ds.type === 'edge' && ds.nodeId) {
        const [wx, wy] = screenToWorld(sx, sy);
        const target = engine.findNodeAt(wx, wy);
        if (target && target.id !== ds.nodeId) {
          onCreateEdge(ds.nodeId, target.id);
        }
      } else if (ds.type === 'node' && ds.nodeId && !ds.moved) {
        const query = searchQueryRef.current.toLowerCase();
        const node = engine.nodes.get(ds.nodeId);
        if (node) {
          const isMatch = query
            ? node.title.toLowerCase().includes(query) || node.keywords.some(k => k.toLowerCase().includes(query))
            : true;
          onNodeClick(ds.nodeId);
          if (query && isMatch) {
            const canvas2 = canvasRef.current;
            if (canvas2) {
              const t = transformRef.current;
              const targetScale = 1.5;
              const cw = canvasSizeRef.current.w;
              const ch = canvasSizeRef.current.h;
              cameraTransitionRef.current = {
                from: { ...t },
                to: {
                  x: cw / 2 - node.x * targetScale,
                  y: ch / 2 - node.y * targetScale,
                  scale: targetScale,
                },
                startTime: performance.now(),
                duration: 500,
              };
            }
          }
        }
      } else if (ds.type === 'node') {
        engine.reheat();
      }

      dragStateRef.current = { type: 'none' };
      canvas.style.cursor = 'default';
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { sx, sy } = getPos(e);
      const t = transformRef.current;
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.15, Math.min(5, t.scale * delta));
      const ratio = newScale / t.scale;
      t.x = sx - (sx - t.x) * ratio;
      t.y = sy - (sy - t.y) * ratio;
      t.scale = newScale;
    };

    const handleMouseLeave = () => {
      hoveredNodeRef.current = null;
      if (dragStateRef.current.type !== 'none') {
        dragStateRef.current = { type: 'none' };
        canvas.style.cursor = 'default';
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [engine, screenToWorld, onCreateEdge, onNodeClick]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
      <div style={{
        position: 'absolute',
        bottom: 10,
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: 11,
        color: '#bbb',
        pointerEvents: 'none',
        background: 'rgba(255,255,255,0.8)',
        padding: '3px 12px',
        borderRadius: 10,
      }}>
        Shift+拖拽创建关联 · 滚轮缩放 · 拖拽平移
      </div>
    </div>
  );
}
