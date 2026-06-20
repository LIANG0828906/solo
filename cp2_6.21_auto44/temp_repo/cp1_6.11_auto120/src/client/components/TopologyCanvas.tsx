import { useRef, useEffect, useState, useCallback } from 'react';
import type { TopologyNode, TopologyEdge, CookingMethod } from '@shared/types';

interface TopologyCanvasProps {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  width?: number;
  height?: number;
  thumbnail?: boolean;
  onFullscreen?: () => void;
}

const METHOD_COLORS: Record<CookingMethod, string> = {
  '炒': '#FF6B35',
  '煎': '#F7931E',
  '炖': '#8B5A2B',
  '蒸': '#4CAF50',
  '炸': '#E53935',
  '烤': '#795548',
  '焗': '#9C27B0',
  '焖': '#FF8C00',
};

export default function TopologyCanvas({
  nodes,
  edges,
  width = 800,
  height = 600,
  thumbnail = false,
  onFullscreen,
}: TopologyCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<TopologyNode | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<TopologyEdge | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [, setTick] = useState(0);

  const viewRef = useRef({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    damping: 0.85,
    zoomFactor: 0.1,
    velX: 0,
    velY: 0,
  });

  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const dirtyRef = useRef(true);
  const rafRef = useRef<number>();

  const nodeMapRef = useRef<Map<string, TopologyNode>>(new Map());
  useEffect(() => {
    nodeMapRef.current = new Map(nodes.map(n => [n.id, n]));
    dirtyRef.current = true;
  }, [nodes]);

  const worldToScreen = useCallback((wx: number, wy: number) => {
    const v = viewRef.current;
    return {
      x: (wx + v.offsetX) * v.scale + width / 2,
      y: (wy + v.offsetY) * v.scale + height / 2,
    };
  }, [width, height]);

  const screenToWorld = useCallback((sx: number, sy: number) => {
    const v = viewRef.current;
    return {
      x: (sx - width / 2) / v.scale - v.offsetX,
      y: (sy - height / 2) / v.scale - v.offsetY,
    };
  }, [width, height]);

  const hitTestNode = useCallback((sx: number, sy: number): TopologyNode | null => {
    const world = screenToWorld(sx, sy);
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const dx = world.x - n.x;
      const dy = world.y - n.y;
      if (dx * dx + dy * dy <= n.radius * n.radius) {
        return n;
      }
    }
    return null;
  }, [nodes, screenToWorld]);

  const hitTestEdge = useCallback((sx: number, sy: number): TopologyEdge | null => {
    const world = screenToWorld(sx, sy);
    for (let i = edges.length - 1; i >= 0; i--) {
      const e = edges[i];
      const src = nodeMapRef.current.get(e.source);
      const tgt = nodeMapRef.current.get(e.target);
      if (!src || !tgt) continue;

      const cx = (src.x + tgt.x) / 2;
      const cy = (src.y + tgt.y) / 2 - 30;

      const px = world.x;
      const py = world.y;
      const bezierDist = pointToQuadraticDist(px, py, src.x, src.y, cx, cy, tgt.x, tgt.y);
      if (bezierDist <= 8) return e;
    }
    return null;
  }, [edges, screenToWorld]);

  const pointToQuadraticDist = (px: number, py: number, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number) => {
    let minDist = Infinity;
    for (let t = 0; t <= 1; t += 0.05) {
      const bx = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1;
      const by = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1;
      const dist = Math.sqrt((px - bx) ** 2 + (py - by) ** 2);
      minDist = Math.min(minDist, dist);
    }
    return minDist;
  };

  const getRelatedIds = useCallback((nodeId: string) => {
    const nodeIds = new Set<string>([nodeId]);
    const edgeIds = new Set<string>();
    edges.forEach(e => {
      if (e.source === nodeId || e.target === nodeId) {
        edgeIds.add(e.id);
        nodeIds.add(e.source);
        nodeIds.add(e.target);
      }
    });
    return { nodeIds, edgeIds };
  }, [edges]);

  const drawBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    if (thumbnail) {
      ctx.clearRect(0, 0, width, height);
      return;
    }
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#FFF5E6');
    grad.addColorStop(1, '#FFEBCD');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }, [thumbnail, width, height]);

  const drawEdge = useCallback((ctx: CanvasRenderingContext2D, e: TopologyEdge, opacity: number, isHovered: boolean) => {
    const src = nodeMapRef.current.get(e.source);
    const tgt = nodeMapRef.current.get(e.target);
    if (!src || !tgt) return;

    const s1 = worldToScreen(src.x, src.y);
    const s2 = worldToScreen(tgt.x, tgt.y);

    const cpx = (s1.x + s2.x) / 2;
    const cpy = (s1.y + s2.y) / 2 - 30 * viewRef.current.scale;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = e.color;
    ctx.lineWidth = (isHovered ? 8 : 4) * (thumbnail ? 0.6 : 1);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(s1.x, s1.y);
    ctx.quadraticCurveTo(cpx, cpy, s2.x, s2.y);
    ctx.stroke();

    if (isHovered && !thumbnail) {
      const mx = 0.5 * 0.5 * s1.x + 2 * 0.5 * 0.5 * cpx + 0.5 * 0.5 * s2.x;
      const my = 0.5 * 0.5 * s1.y + 2 * 0.5 * 0.5 * cpy + 0.5 * 0.5 * s2.y;
      const label = e.method;
      ctx.font = '12px sans-serif';
      const tw = ctx.measureText(label).width;
      const padX = 8, padY = 4;
      const bx = mx - tw / 2 - padX;
      const by = my - 12 - padY;
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0,0,0,0.2)';
      ctx.shadowBlur = 4;
      roundRect(ctx, bx, by, tw + padX * 2, 20, 6);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#333';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, mx, by + 10);
    }
    ctx.restore();
  }, [worldToScreen, thumbnail]);

  const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  const drawNode = useCallback((ctx: CanvasRenderingContext2D, n: TopologyNode, opacity: number, isHovered: boolean) => {
    const p = worldToScreen(n.x, n.y);
    const r = n.radius * viewRef.current.scale * (thumbnail ? 0.8 : 1);

    ctx.save();
    ctx.globalAlpha = opacity;

    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = isHovered ? 16 : 8;
    ctx.shadowOffsetY = isHovered ? 4 : 2;

    ctx.fillStyle = n.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    if (!thumbnail) {
      const fontSize = Math.max(14, r * 0.9);
      ctx.font = `${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(n.emoji, p.x, p.y);

      ctx.font = `bold ${Math.max(10, r * 0.5)}px sans-serif`;
      ctx.fillStyle = '#5C4033';
      ctx.fillText(n.label, p.x, p.y + r + 14);
    }

    ctx.restore();
  }, [worldToScreen, thumbnail]);

  const drawTooltip = useCallback((ctx: CanvasRenderingContext2D, n: TopologyNode) => {
    const p = worldToScreen(n.x, n.y);
    const r = n.radius * viewRef.current.scale;
    const x = p.x + r + 16;
    const y = p.y - 60;
    const w = 200;
    const h = 130;

    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = 12;
    roundRect(ctx, x, y, w, h, 12);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#FFE0B2';
    ctx.lineWidth = 1;
    roundRect(ctx, x, y, w, h, 12);
    ctx.stroke();

    ctx.fillStyle = '#5C4033';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`📍 ${n.origin}`, x + 12, y + 12);

    const seasonText = n.seasonMonths.length > 0
      ? n.seasonMonths.map(m => `${m}月`).join('、')
      : '全年';
    ctx.fillStyle = '#666';
    ctx.font = '12px sans-serif';
    ctx.fillText(`🌿 ${seasonText}推荐`, x + 12, y + 36);

    ctx.fillStyle = '#333';
    ctx.font = '12px sans-serif';
    ctx.fillText('评分:', x + 12, y + 60);
    const rating = n.rating;
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;
    for (let i = 0; i < 5; i++) {
      const sx = x + 52 + i * 18;
      ctx.font = '16px sans-serif';
      if (i < fullStars) {
        ctx.fillText('★', sx, y + 56);
      } else if (i === fullStars && hasHalf) {
        ctx.fillText('☆', sx, y + 56);
      } else {
        ctx.globalAlpha = 0.3;
        ctx.fillText('★', sx, y + 56);
        ctx.globalAlpha = 1;
      }
    }

    ctx.fillStyle = '#888';
    ctx.font = '11px sans-serif';
    ctx.fillText(`重要度: ${'●'.repeat(n.importance)}${'○'.repeat(3 - n.importance)}`, x + 12, y + 88);
    ctx.fillText(`${n.emoji} ${n.label} · ${n.rating.toFixed(1)}分`, x + 12, y + 108);

    ctx.restore();
  }, [worldToScreen]);

  const drawLegend = useCallback((ctx: CanvasRenderingContext2D) => {
    if (thumbnail) return;
    const methods = Object.keys(METHOD_COLORS) as CookingMethod[];
    const itemW = 80;
    const itemH = 24;
    const cols = 2;
    const pad = 12;
    const w = cols * itemW + pad * 2;
    const rows = Math.ceil(methods.length / cols);
    const h = rows * itemH + pad * 2 + 20;
    const x = width - w - 16;
    const y = height - h - 16;

    ctx.save();
    ctx.fillStyle = '#00000080';
    roundRect(ctx, x, y, w, h, 12);
    ctx.fill();

    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('烹饪手法图例', x + pad, y + 8);

    methods.forEach((m, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const ix = x + pad + col * itemW;
      const iy = y + pad + 16 + row * itemH;

      ctx.fillStyle = METHOD_COLORS[m];
      roundRect(ctx, ix, iy + 4, 16, 16, 3);
      ctx.fill();

      ctx.fillStyle = '#FFF';
      ctx.font = '11px sans-serif';
      ctx.fillText(m, ix + 22, iy + 4);
    });

    ctx.restore();
  }, [thumbnail, width, height]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawBackground(ctx);

    const related = selectedNode ? getRelatedIds(selectedNode) : null;

    edges.forEach(e => {
      let opacity = 1;
      if (related && !related.edgeIds.has(e.id)) opacity = 0.3;
      drawEdge(ctx, e, opacity, hoveredEdge?.id === e.id);
    });

    nodes.forEach(n => {
      let opacity = 1;
      if (related && !related.nodeIds.has(n.id)) opacity = 0.3;
      drawNode(ctx, n, opacity, hoveredNode?.id === n.id);
    });

    if (hoveredNode && !thumbnail) {
      drawTooltip(ctx, hoveredNode);
    }

    drawLegend(ctx);

    if (onFullscreen && !thumbnail) {
      ctx.save();
      ctx.fillStyle = '#FFFFFFCC';
      ctx.strokeStyle = '#FF8C00';
      ctx.lineWidth = 1.5;
      roundRect(ctx, width - 52, 12, 40, 32, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#8B4513';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⛶', width - 32, 28);
      ctx.restore();
    }
  }, [nodes, edges, drawBackground, drawEdge, drawNode, drawTooltip, drawLegend,
      hoveredNode, hoveredEdge, selectedNode, getRelatedIds, thumbnail, width, height, onFullscreen]);

  useEffect(() => {
    const loop = () => {
      const v = viewRef.current;
      let needsRender = false;

      if (Math.abs(v.velX) > 0.05 || Math.abs(v.velY) > 0.05) {
        v.offsetX += v.velX;
        v.offsetY += v.velY;
        v.velX *= v.damping;
        v.velY *= v.damping;
        needsRender = true;
      }

      if (dirtyRef.current || needsRender) {
        dirtyRef.current = false;
        render();
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [render]);

  useEffect(() => {
    dirtyRef.current = true;
    setTick(t => t + 1);
  }, [nodes, edges, width, height, hoveredNode, hoveredEdge, selectedNode]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (thumbnail) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (isDraggingRef.current) {
      const v = viewRef.current;
      const dx = (sx - lastMouseRef.current.x) / v.scale;
      const dy = (sy - lastMouseRef.current.y) / v.scale;
      v.offsetX += dx;
      v.offsetY += dy;
      v.velX = dx * 0.3;
      v.velY = dy * 0.3;
      lastMouseRef.current = { x: sx, y: sy };
      dirtyRef.current = true;
      return;
    }

    const node = hitTestNode(sx, sy);
    const edge = node ? null : hitTestEdge(sx, sy);
    setHoveredNode(node);
    setHoveredEdge(edge);

    const fullscreenBtn = onFullscreen && !thumbnail;
    if (fullscreenBtn && sx >= width - 52 && sx <= width - 12 && sy >= 12 && sy <= 44) {
      canvasRef.current!.style.cursor = 'pointer';
    } else {
      canvasRef.current!.style.cursor = isDraggingRef.current ? 'grabbing'
        : node ? 'pointer' : 'grab';
    }
  }, [thumbnail, hitTestNode, hitTestEdge, onFullscreen, width]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (thumbnail) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (onFullscreen && sx >= width - 52 && sx <= width - 12 && sy >= 12 && sy <= 44) {
      onFullscreen();
      return;
    }

    const node = hitTestNode(sx, sy);
    if (node) {
      setSelectedNode(prev => prev === node.id ? null : node.id);
      return;
    }

    isDraggingRef.current = true;
    lastMouseRef.current = { x: sx, y: sy };
    canvasRef.current!.style.cursor = 'grabbing';
  }, [thumbnail, hitTestNode, onFullscreen, width]);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'grab';
    }
  }, [thumbnail]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    if (thumbnail) return;
    e.preventDefault();
    const v = viewRef.current;
    const oldScale = v.scale;
    const factor = v.zoomFactor;
    if (e.deltaY > 0) {
      v.scale = Math.max(0.3, v.scale * (1 - factor));
    } else {
      v.scale = Math.min(3, v.scale * (1 + factor));
    }
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const wx = (sx - width / 2) / oldScale - v.offsetX;
      const wy = (sy - height / 2) / oldScale - v.offsetY;
      v.offsetX = (sx - width / 2) / v.scale - wx;
      v.offsetY = (sy - height / 2) / v.scale - wy;
    }
    dirtyRef.current = true;
  }, [thumbnail, width, height]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (thumbnail) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const node = hitTestNode(sx, sy);
    if (!node && selectedNode) {
      setSelectedNode(null);
    }
  }, [thumbnail, hitTestNode, selectedNode]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        display: 'block',
        borderRadius: thumbnail ? 8 : 16,
        cursor: thumbnail ? 'default' : 'grab',
        background: thumbnail ? 'transparent' : undefined,
      }}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onClick={handleClick}
    />
  );
}
