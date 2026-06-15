import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import type { TrackNode, TrackFlow } from './DataQuery';

interface FlowChartProps {
  nodes: TrackNode[];
  links: TrackFlow[];
  animKey: number;
}

interface LayoutNode {
  id: string;
  name: string;
  plays: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  origX: number;
  origY: number;
  radius: number;
  color: [number, number, number];
}

export function FlowChart({ nodes, links, animKey }: FlowChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const animStartRef = useRef<number>(0);

  const layoutNodesRef = useRef<LayoutNode[]>([]);
  const linksRef = useRef<TrackFlow[]>(links);
  const draggingRef = useRef<number | null>(null);
  const hoveredLinkRef = useRef<number | null>(null);
  const hoveredNodeRef = useRef<number | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const [dims, setDims] = useState({ w: 400, h: 300 });
  const [, forceRender] = useState(0);

  useEffect(() => {
    const updateDims = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDims({ w: Math.max(rect.width, 280), h: Math.max(rect.height, 240) });
      }
    };
    const t = setTimeout(updateDims, 50);
    window.addEventListener('resize', updateDims);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', updateDims);
    };
  }, [animKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dims.w < 100 || nodes.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const maxPlays = Math.max(...nodes.map(n => n.plays), 1);
    const cols = Math.ceil(Math.sqrt(nodes.length));
    const rows = Math.ceil(nodes.length / cols);
    const padding = 50;

    layoutNodesRef.current = nodes.map((n, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = padding + ((col + 0.5) / cols) * (dims.w - padding * 2);
      const y = padding + ((row + 0.5) / rows) * (dims.h - padding * 2);
      const hue = (i * 47) % 360;
      const r = 12 + (n.plays / maxPlays) * 22;
      return {
        ...n,
        x: dims.w / 2,
        y: dims.h / 2,
        vx: 0,
        vy: 0,
        origX: x,
        origY: y,
        radius: r,
        color: [
          Math.round(120 + Math.sin(hue * Math.PI / 180) * 80),
          Math.round(200 + Math.cos(hue * Math.PI / 180) * 55),
          Math.round(240 + Math.sin((hue + 120) * Math.PI / 180) * 15)
        ]
      } as LayoutNode;
    });
    linksRef.current = links;
    animStartRef.current = performance.now();
    hoveredLinkRef.current = null;
    hoveredNodeRef.current = null;

    let hoverAnim = 0;

    function lerpColorOrange(pct: number): string {
      const clamped = Math.min(Math.max(pct, 0), 1);
      const r = 255;
      const g = Math.round(180 - clamped * 110);
      const b = Math.round(80 - clamped * 80);
      return `rgb(${r},${g},${b})`;
    }

    function getNodeById(id: string): LayoutNode | undefined {
      return layoutNodesRef.current.find(n => n.id === id);
    }

    function drawArrow(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, nodeR: number) {
      const dx = toX - fromX;
      const dy = toY - fromY;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = dx / len;
      const ny = dy / len;

      const endX = toX - nx * (nodeR + 4);
      const endY = toY - ny * (nodeR + 4);

      const arrowSize = 6;
      const angle = Math.atan2(ny, nx);

      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - arrowSize * Math.cos(angle - Math.PI / 6),
        endY - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        endX - arrowSize * Math.cos(angle + Math.PI / 6),
        endY - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
    }

    function animate(now: number) {
      ctx.clearRect(0, 0, dims.w, dims.h);

      const animElapsed = now - animStartRef.current;
      const animT = Math.min(animElapsed / 1000, 1);
      const animEased = 1 - Math.pow(1 - animT, 3);

      if (hoveredLinkRef.current !== null || hoveredNodeRef.current !== null) {
        hoverAnim = Math.min(hoverAnim + 0.08, 1);
      } else {
        hoverAnim = Math.max(hoverAnim - 0.08, 0);
      }

      for (let i = 0; i < layoutNodesRef.current.length; i++) {
        if (draggingRef.current === i) continue;
        const node = layoutNodesRef.current[i];

        const springK = 0.05;
        const damping = 0.82;
        node.vx += (node.origX - node.x) * springK;
        node.vy += (node.origY - node.y) * springK;
        node.vx *= damping;
        node.vy *= damping;

        for (let j = 0; j < layoutNodesRef.current.length; j++) {
          if (i === j) continue;
          const other = layoutNodesRef.current[j];
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const distSq = dx * dx + dy * dy;
          const minDist = (node.radius + other.radius + 8) ** 2;
          if (distSq < minDist && distSq > 0.1) {
            const dist = Math.sqrt(distSq);
            const force = (minDist - distSq) * 0.0003;
            node.vx += (dx / dist) * force;
            node.vy += (dy / dist) * force;
          }
        }

        node.x += node.vx;
        node.y += node.vy;

        node.x = Math.max(node.radius + 4, Math.min(dims.w - node.radius - 4, node.x));
        node.y = Math.max(node.radius + 4, Math.min(dims.h - node.radius - 4, node.y));
      }

      const maxPct = Math.max(...linksRef.current.map(l => l.percentage), 0.01);

      linksRef.current.forEach((link, idx) => {
        const src = getNodeById(link.source);
        const tgt = getNodeById(link.target);
        if (!src || !tgt) return;

        const pct = link.percentage / maxPct;
        const isHoveredLink = hoveredLinkRef.current === idx;
        const hoveredSrc = hoveredNodeRef.current !== null &&
          layoutNodesRef.current[hoveredNodeRef.current]?.id === link.source;
        const hoveredTgt = hoveredNodeRef.current !== null &&
          layoutNodesRef.current[hoveredNodeRef.current]?.id === link.target;
        const isHighlighted = isHoveredLink || hoveredSrc || hoveredTgt;
        const dimAlpha = (hoveredLinkRef.current !== null || hoveredNodeRef.current !== null) && !isHighlighted
          ? Math.max(0.08, 1 - hoverAnim * 0.85)
          : 0.55 + animEased * 0.25;

        const baseWidth = 1 + pct * 5;
        const lineWidth = isHighlighted ? baseWidth * 2.2 : baseWidth;

        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const curvature = 0.12 * (idx % 2 === 0 ? 1 : -1);
        const mx = (src.x + tgt.x) / 2 + -dy * curvature;
        const my = (src.y + tgt.y) / 2 + dx * curvature;

        const startT = src.radius / len;
        const endT = 1 - tgt.radius / len;
        const q1t = 0.5;

        const t1 = startT;
        const sx = (1 - t1) * (1 - t1) * src.x + 2 * (1 - t1) * t1 * mx + t1 * t1 * tgt.x;
        const sy = (1 - t1) * (1 - t1) * src.y + 2 * (1 - t1) * t1 * my + t1 * t1 * tgt.y;
        const t2 = endT;
        const ex = (1 - t2) * (1 - t2) * src.x + 2 * (1 - t2) * t2 * mx + t2 * t2 * tgt.x;
        const ey = (1 - t2) * (1 - t2) * src.y + 2 * (1 - t2) * t2 * my + t2 * t2 * tgt.y;
        const qx = (1 - q1t) * (1 - q1t) * src.x + 2 * (1 - q1t) * q1t * mx + q1t * q1t * tgt.x;
        const qy = (1 - q1t) * (1 - q1t) * src.y + 2 * (1 - q1t) * q1t * my + q1t * q1t * tgt.y;

        if (isHighlighted) {
          ctx.save();
          ctx.shadowColor = lerpColorOrange(pct);
          ctx.shadowBlur = 14;
          ctx.strokeStyle = lerpColorOrange(pct);
          ctx.globalAlpha = dimAlpha * (1 + hoverAnim * 0.4);
          ctx.lineWidth = lineWidth;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.quadraticCurveTo(qx, qy, ex, ey);
          ctx.stroke();
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.quadraticCurveTo(qx, qy, ex, ey);
          ctx.strokeStyle = lerpColorOrange(pct);
          ctx.lineWidth = lineWidth;
          ctx.globalAlpha = dimAlpha;
          ctx.lineCap = 'round';
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        if (isHighlighted && hoverAnim > 0.4) {
          const arrowT = endT - 0.02;
          const arrowX = (1 - arrowT) * (1 - arrowT) * src.x + 2 * (1 - arrowT) * arrowT * mx + arrowT * arrowT * tgt.x;
          const arrowY = (1 - arrowT) * (1 - arrowT) * src.y + 2 * (1 - arrowT) * arrowT * my + arrowT * arrowT * tgt.y;
          const prevT = arrowT - 0.01;
          const prevX = (1 - prevT) * (1 - prevT) * src.x + 2 * (1 - prevT) * prevT * mx + prevT * prevT * tgt.x;
          const prevY = (1 - prevT) * (1 - prevT) * src.y + 2 * (1 - prevT) * prevT * my + prevT * prevT * tgt.y;
          const adx = arrowX - prevX;
          const ady = arrowY - prevY;
          const alen = Math.sqrt(adx * adx + ady * ady) || 1;
          const ang = Math.atan2(ady, adx);

          ctx.save();
          ctx.fillStyle = lerpColorOrange(pct);
          ctx.globalAlpha = Math.min(1, dimAlpha + hoverAnim * 0.4);
          const as = 5 + hoverAnim * 3;
          ctx.translate(arrowX, arrowY);
          ctx.rotate(ang);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(-as, -as * 0.6);
          ctx.lineTo(-as, as * 0.6);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
          ctx.globalAlpha = 1;
        }

        if (isHoveredLink && hoverAnim > 0.3) {
          const midx = qx;
          const midy = qy - 14;
          const label = `${link.percentage.toFixed(1)}%`;
          ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
          const lw = ctx.measureText(label).width;

          ctx.save();
          ctx.fillStyle = 'rgba(15,15,35,0.92)';
          ctx.strokeStyle = lerpColorOrange(pct);
          ctx.lineWidth = 1.5;
          ctx.shadowColor = lerpColorOrange(pct);
          ctx.shadowBlur = 10;
          const padX = 8, padY = 5;
          ctx.beginPath();
          const lx = midx - lw / 2 - padX;
          const ly = midy - 16;
          const r = 6;
          ctx.moveTo(lx + r, ly);
          ctx.lineTo(lx + lw + padX * 2 - r, ly);
          ctx.quadraticCurveTo(lx + lw + padX * 2, ly, lx + lw + padX * 2, ly + r);
          ctx.lineTo(lx + lw + padX * 2, ly + 14 + padY * 2 - r);
          ctx.quadraticCurveTo(lx + lw + padX * 2, ly + 14 + padY * 2, lx + lw + padX * 2 - r, ly + 14 + padY * 2);
          ctx.lineTo(lx + r, ly + 14 + padY * 2);
          ctx.quadraticCurveTo(lx, ly + 14 + padY * 2, lx, ly + 14 + padY * 2 - r);
          ctx.lineTo(lx, ly + r);
          ctx.quadraticCurveTo(lx, ly, lx + r, ly);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();

          ctx.save();
          ctx.fillStyle = lerpColorOrange(pct);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, midx, midy - 9);
          ctx.restore();
        }
      });

      layoutNodesRef.current.forEach((node, i) => {
        const isDragging = draggingRef.current === i;
        const isHovered = hoveredNodeRef.current === i;
        const pulse = 1 + Math.sin((now + i * 300) / 400) * 0.05;
        const scaleAnim = 0.5 + animEased * 0.5;
        const displayScale = scaleAnim * (isDragging || isHovered ? pulse * 1.15 : 1);
        const r = node.radius * displayScale;

        const dimmed = (hoveredLinkRef.current !== null || hoveredNodeRef.current !== null) && !isHovered;
        const nodeAlpha = dimmed ? Math.max(0.25, 1 - hoverAnim * 0.7) : 1;

        const grad = ctx.createRadialGradient(
          node.x - r * 0.3, node.y - r * 0.3, 0,
          node.x, node.y, r
        );
        grad.addColorStop(0, `rgba(255,255,255,${0.9 * nodeAlpha})`);
        grad.addColorStop(0.35, `rgba(${node.color[0]},${node.color[1]},${node.color[2]},${0.95 * nodeAlpha})`);
        grad.addColorStop(1, `rgba(0,${Math.max(0, node.color[1] - 100)},${Math.max(180, node.color[2] - 30)},${0.85 * nodeAlpha})`);

        ctx.save();
        if (isHovered || isDragging) {
          ctx.shadowColor = `rgb(${node.color[0]},${node.color[1]},${node.color[2]})`;
          ctx.shadowBlur = 24 + hoverAnim * 16;
        } else if (animEased < 1) {
          ctx.shadowColor = `rgba(0,212,255,${0.4 * animEased})`;
          ctx.shadowBlur = 12 * animEased;
        }
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 1, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${0.15 * nodeAlpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();

        const innerRingR = r * 0.6;
        ctx.save();
        ctx.beginPath();
        ctx.arc(node.x, node.y, innerRingR, 0, Math.PI * 2 * animEased);
        ctx.strokeStyle = `rgba(0,255,195,${0.35 * nodeAlpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        if (isHovered && hoverAnim > 0.2) {
          const ringPulse = 1 + Math.sin(now / 180) * 0.3;
          ctx.save();
          ctx.beginPath();
          ctx.arc(node.x, node.y, r * (1.4 + hoverAnim * 0.6) * ringPulse, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0,255,195,${0.25 * hoverAnim})`;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        }

        const labelAlpha = animEased > 0.3 ? 1 : (animEased / 0.3);
        const displayName = node.name.length > 9 ? node.name.slice(0, 8) + '…' : node.name;
        ctx.save();
        ctx.font = `${isHovered ? 'bold ' : ''}11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = `rgba(${dimmed ? '100,100,140' : '220,220,255'},${labelAlpha * (isHovered ? 1 : 0.88)})`;
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = isHovered ? 4 : 2;
        ctx.fillText(displayName, node.x, node.y + r + 4);

        if (isHovered && hoverAnim > 0.5) {
          ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
          ctx.fillStyle = `rgba(0,255,195,${hoverAnim})`;
          ctx.shadowColor = 'rgba(0,255,195,0.6)';
          ctx.shadowBlur = 6;
          ctx.fillText(node.plays.toLocaleString(), node.x, node.y + r + 18);
        }
        ctx.restore();
      });

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);

    function handleMouseMove(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = dims.w / rect.width;
      const scaleY = dims.h / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      if (draggingRef.current !== null) {
        const node = layoutNodesRef.current[draggingRef.current];
        if (node) {
          node.x = mx + dragOffsetRef.current.x;
          node.y = my + dragOffsetRef.current.y;
          node.vx = 0;
          node.vy = 0;
        }
        forceRender(v => v + 1);
        return;
      }

      let foundNode: number | null = null;
      for (let i = layoutNodesRef.current.length - 1; i >= 0; i--) {
        const node = layoutNodesRef.current[i];
        const dist = Math.sqrt((mx - node.x) ** 2 + (my - node.y) ** 2);
        if (dist < node.radius + 6) {
          foundNode = i;
          break;
        }
      }
      hoveredNodeRef.current = foundNode;

      if (foundNode === null) {
        let foundLink: number | null = null;
        for (let i = 0; i < linksRef.current.length; i++) {
          const link = linksRef.current[i];
          const src = getNodeById(link.source);
          const tgt = getNodeById(link.target);
          if (!src || !tgt) continue;
          const dx = tgt.x - src.x;
          const dy = tgt.y - src.y;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const t = Math.max(0.1, Math.min(0.9, ((mx - src.x) * dx + (my - src.y) * dy) / (len * len)));
          const px = src.x + t * dx;
          const py = src.y + t * dy;
          const dist = Math.sqrt((mx - px) ** 2 + (my - py) ** 2);
          if (dist < 8 + (link.percentage / Math.max(...linksRef.current.map(l => l.percentage), 1)) * 4) {
            foundLink = i;
            break;
          }
        }
        hoveredLinkRef.current = foundLink;
      } else {
        hoveredLinkRef.current = null;
      }

      if (foundNode !== null) {
        canvas.style.cursor = 'grab';
      } else if (hoveredLinkRef.current !== null) {
        canvas.style.cursor = 'pointer';
      } else {
        canvas.style.cursor = 'default';
      }
    }

    function handleMouseDown(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = dims.w / rect.width;
      const scaleY = dims.h / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;

      for (let i = layoutNodesRef.current.length - 1; i >= 0; i--) {
        const node = layoutNodesRef.current[i];
        const dist = Math.sqrt((mx - node.x) ** 2 + (my - node.y) ** 2);
        if (dist < node.radius + 6) {
          draggingRef.current = i;
          dragOffsetRef.current = { x: node.x - mx, y: node.y - my };
          canvas.style.cursor = 'grabbing';
          break;
        }
      }
    }

    function handleMouseUp() {
      draggingRef.current = null;
      canvas.style.cursor = hoveredNodeRef.current !== null ? 'grab' : 'default';
    }

    function handleMouseLeave() {
      draggingRef.current = null;
      hoveredNodeRef.current = null;
      hoveredLinkRef.current = null;
      canvas.style.cursor = 'default';
    }

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [dims, animKey, nodes, links]);

  const stats = useMemo(() => {
    if (links.length === 0) return null;
    const totalPct = links.reduce((s, l) => s + l.percentage, 0);
    return {
      nodeCount: nodes.length,
      linkCount: links.length,
      avgPct: (totalPct / links.length).toFixed(2)
    };
  }, [nodes, links]);

  return (
    <div
      ref={containerRef}
      key={animKey}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        animation: 'fadeSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}
    >
      <canvas
        ref={canvasRef}
        width={dims.w}
        height={dims.h}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      {stats && (
        <div style={{
          position: 'absolute',
          bottom: 6,
          left: 10,
          right: 10,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 9,
          color: '#555577',
          pointerEvents: 'none',
          flexWrap: 'wrap',
          gap: 6
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'linear-gradient(135deg,#00ffc3,#00d4ff)' }} />
            {stats.nodeCount} 作品
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 12, height: 2, borderRadius: 1, background: 'linear-gradient(90deg,#ffb450,#ff4a2c)' }} />
            {stats.linkCount} 流向
          </span>
          <span>
            平均 <span style={{ color: '#ff8c3c' }}>{stats.avgPct}%</span>
          </span>
        </div>
      )}
    </div>
  );
}
