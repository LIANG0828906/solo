import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useDebts, useStore } from '@/store/useStore';
import type { Participant } from '@/types';

interface DebtGraphProps {
  activityId: string;
  className?: string;
}

interface Node {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  participant: Participant;
  radius: number;
}

interface Edge {
  from: string;
  to: string;
  amount: number;
  hasRedPacket: boolean;
}

const COLOR_DEBT = '#FF6B6B';
const COLOR_RED_PACKET = '#FFD93D';
const LINE_WIDTH = 2;
const NODE_RADIUS = 24;
const MIN_FPS = 30;

export default function DebtGraph({ activityId, className }: DebtGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const nodesRef = useRef<Map<string, Node>>(new Map());
  const edgesRef = useRef<Edge[]>([]);
  const draggingRef = useRef<{ nodeId: string; offsetX: number; offsetY: number } | null>(null);
  const lastTimeRef = useRef<number>(0);
  const fpsRef = useRef<number>(60);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const { debts, loading } = useDebts(activityId);
  const activity = useStore(state => state.activities.find(a => a.id === activityId));
  const participants = useMemo(() => activity?.participants || [], [activity]);

  const initializeNodes = useCallback(() => {
    const width = dimensions.width;
    const height = dimensions.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;

    participants.forEach((participant, index) => {
      const angle = (index / participants.length) * Math.PI * 2 - Math.PI / 2;
      const existingNode = nodesRef.current.get(participant.id);

      nodesRef.current.set(participant.id, {
        id: participant.id,
        x: existingNode?.x ?? centerX + Math.cos(angle) * radius,
        y: existingNode?.y ?? centerY + Math.sin(angle) * radius,
        vx: existingNode?.vx ?? 0,
        vy: existingNode?.vy ?? 0,
        participant,
        radius: NODE_RADIUS,
      });
    });

    nodesRef.current.forEach((node, id) => {
      if (!participants.find(p => p.id === id)) {
        nodesRef.current.delete(id);
      }
    });
  }, [participants, dimensions]);

  const updateEdges = useCallback(() => {
    edgesRef.current = debts.map(debt => ({
      from: debt.from,
      to: debt.to,
      amount: debt.amount,
      hasRedPacket: debt.hasRedPacket,
    }));
  }, [debts]);

  useEffect(() => {
    initializeNodes();
  }, [initializeNodes]);

  useEffect(() => {
    updateEdges();
  }, [updateEdges]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      const rect = entry.contentRect;
      setDimensions({
        width: Math.max(rect.width, 300),
        height: Math.max(rect.height, 200),
      });
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  const applyForces = useCallback((dt: number) => {
    const nodes = Array.from(nodesRef.current.values());
    const width = dimensions.width;
    const height = dimensions.height;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const n1 = nodes[i];
        const n2 = nodes[j];
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = n1.radius + n2.radius + 20;

        if (dist > 0 && dist < minDist * 3) {
          const force = (minDist * minDist) / (dist * dist) * 0.5;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          n1.vx -= fx * dt * 60;
          n1.vy -= fy * dt * 60;
          n2.vx += fx * dt * 60;
          n2.vy += fy * dt * 60;
        }
      }
    }

    for (const edge of edgesRef.current) {
      const fromNode = nodesRef.current.get(edge.from);
      const toNode = nodesRef.current.get(edge.to);
      if (!fromNode || !toNode) continue;

      const dx = toNode.x - fromNode.x;
      const dy = toNode.y - fromNode.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const targetDist = 120 + Math.min(edge.amount * 0.5, 80);

      if (dist > 0) {
        const force = (dist - targetDist) * 0.002;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        fromNode.vx += fx * dt * 60;
        fromNode.vy += fy * dt * 60;
        toNode.vx -= fx * dt * 60;
        toNode.vy -= fy * dt * 60;
      }
    }

    const centerX = width / 2;
    const centerY = height / 2;
    for (const node of nodes) {
      const dx = centerX - node.x;
      const dy = centerY - node.y;
      node.vx += dx * 0.001 * dt * 60;
      node.vy += dy * 0.001 * dt * 60;
    }

    for (const node of nodes) {
      const damping = 0.85;
      node.vx *= Math.pow(damping, dt * 60);
      node.vy *= Math.pow(damping, dt * 60);

      node.x += node.vx * dt * 60;
      node.y += node.vy * dt * 60;

      node.x = Math.max(node.radius + 10, Math.min(width - node.radius - 10, node.x));
      node.y = Math.max(node.radius + 10, Math.min(height - node.radius - 10, node.y));
    }
  }, [dimensions]);

  const drawArrowHead = useCallback((
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    color: string
  ) => {
    const arrowLength = 10;
    const arrowWidth = 6;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - arrowLength * Math.cos(angle) + arrowWidth * Math.sin(angle) * 0.5,
      toY - arrowLength * Math.sin(angle) - arrowWidth * Math.cos(angle) * 0.5
    );
    ctx.lineTo(
      toX - arrowLength * Math.cos(angle) - arrowWidth * Math.sin(angle) * 0.5,
      toY - arrowLength * Math.sin(angle) + arrowWidth * Math.cos(angle) * 0.5
    );
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }, []);

  const render = useCallback((ctx: CanvasRenderingContext2D) => {
    const { width, height } = dimensions;

    ctx.clearRect(0, 0, width, height);

    for (const edge of edgesRef.current) {
      const fromNode = nodesRef.current.get(edge.from);
      const toNode = nodesRef.current.get(edge.to);
      if (!fromNode || !toNode) continue;

      const color = edge.hasRedPacket ? COLOR_RED_PACKET : COLOR_DEBT;

      const dx = toNode.x - fromNode.x;
      const dy = toNode.y - fromNode.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const startX = fromNode.x + (dx / dist) * (fromNode.radius + 5);
      const startY = fromNode.y + (dy / dist) * (fromNode.radius + 5);
      const endX = toNode.x - (dx / dist) * (toNode.radius + 12);
      const endY = toNode.y - (dy / dist) * (toNode.radius + 12);

      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;

      const perpX = -dy / dist;
      const perpY = dx / dist;
      const curveOffset = dist * 0.15;

      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = LINE_WIDTH;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(
        midX + perpX * curveOffset,
        midY + perpY * curveOffset,
        endX,
        endY
      );
      ctx.stroke();

      drawArrowHead(ctx, startX, startY, endX, endY, color);

      const labelX = midX + perpX * curveOffset;
      const labelY = midY + perpY * curveOffset;

      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const text = `¥${edge.amount.toFixed(2)}`;
      const textWidth = ctx.measureText(text).width;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(labelX - textWidth / 2 - 4, labelY - 8, textWidth + 8, 16);

      ctx.fillStyle = color;
      ctx.fillText(text, labelX, labelY);

      ctx.restore();
    }

    for (const node of nodesRef.current.values()) {
      const { x, y, participant, radius } = node;
      const isHovered = hoveredNode === node.id;

      ctx.save();

      if (isHovered) {
        ctx.shadowColor = '#FFD93D';
        ctx.shadowBlur = 15;
      }

      ctx.beginPath();
      ctx.arc(x, y, radius + (isHovered ? 3 : 0), 0, Math.PI * 2);
      ctx.fillStyle = participant.color;
      ctx.fill();

      ctx.shadowBlur = 0;

      ctx.beginPath();
      ctx.arc(x, y, radius + (isHovered ? 3 : 0), 0, Math.PI * 2);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(participant.name.charAt(0), x, y);

      ctx.fillStyle = '#4A3B32';
      ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(participant.name, x, y + radius + 14);

      ctx.restore();
    }
  }, [dimensions, hoveredNode, drawArrowHead]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = (time: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = time;
      }

      const dt = Math.min((time - lastTimeRef.current) / 1000, 1 / MIN_FPS);
      lastTimeRef.current = time;

      fpsRef.current = 1 / dt;

      if (!draggingRef.current) {
        applyForces(dt);
      }

      render(ctx);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [applyForces, render]);

  const getMousePos = useCallback((e: React.MouseEvent<HTMLCanvasElement> | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const findNodeAtPos = useCallback((x: number, y: number): Node | null => {
    for (const node of nodesRef.current.values()) {
      const dx = x - node.x;
      const dy = y - node.y;
      if (dx * dx + dy * dy <= (node.radius + 5) * (node.radius + 5)) {
        return node;
      }
    }
    return null;
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    const node = findNodeAtPos(pos.x, pos.y);

    if (node) {
      draggingRef.current = {
        nodeId: node.id,
        offsetX: pos.x - node.x,
        offsetY: pos.y - node.y,
      };
      node.vx = 0;
      node.vy = 0;
    }
  }, [getMousePos, findNodeAtPos]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);

    if (draggingRef.current) {
      const node = nodesRef.current.get(draggingRef.current.nodeId);
      if (node) {
        node.x = pos.x - draggingRef.current.offsetX;
        node.y = pos.y - draggingRef.current.offsetY;
        node.vx = 0;
        node.vy = 0;
      }
    } else {
      const node = findNodeAtPos(pos.x, pos.y);
      setHoveredNode(node?.id || null);
    }
  }, [getMousePos, findNodeAtPos]);

  const handleMouseUp = useCallback(() => {
    draggingRef.current = null;
  }, []);

  const handleMouseLeave = useCallback(() => {
    draggingRef.current = null;
    setHoveredNode(null);
  }, []);

  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    const node = findNodeAtPos(pos.x, pos.y);

    if (node) {
      const participantDebts = debts.filter(d => d.from === node.id);
      const totalOwed = participantDebts.reduce((sum, d) => sum + d.amount, 0);

      if (totalOwed > 0) {
        if (Notification.permission === 'granted') {
          new Notification('催款提醒', {
            body: `${node.participant.name} 共欠款 ¥${totalOwed.toFixed(2)}，记得提醒还款哦！`,
            icon: '/favicon.svg',
          });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification('催款提醒', {
                body: `${node.participant.name} 共欠款 ¥${totalOwed.toFixed(2)}，记得提醒还款哦！`,
                icon: '/favicon.svg',
              });
            }
          });
        }

        alert(`已发送催款提醒给 ${node.participant.name}！\n共欠款 ¥${totalOwed.toFixed(2)}`);
      } else {
        alert(`${node.participant.name} 没有欠款！`);
      }
    }
  }, [getMousePos, findNodeAtPos, debts]);

  if (loading) {
    return (
      <div ref={containerRef} className={cn('flex items-center justify-center', className)}>
        <div className="text-center" style={{ color: '#4A3B32' }}>
          <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto mb-2"
               style={{ borderColor: '#D4A574', borderTopColor: 'transparent' }} />
          <p className="text-sm">加载债务关系中...</p>
        </div>
      </div>
    );
  }

  if (debts.length === 0) {
    return (
      <div ref={containerRef} className={cn('flex items-center justify-center', className)}>
        <div className="text-center" style={{ color: '#4A3B32' }}>
          <div className="text-4xl mb-2">✨</div>
          <p className="text-lg font-medium">暂无债务关系</p>
          <p className="text-sm opacity-70">添加支出后将在这里显示债务关系图</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn('relative w-full h-full', className)}>
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onDoubleClick={handleDoubleClick}
      />

      <div className="absolute bottom-3 left-3 flex gap-4 text-xs" style={{ color: '#4A3B32' }}>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded" style={{ backgroundColor: COLOR_DEBT }} />
          <span>普通债务</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded" style={{ backgroundColor: COLOR_RED_PACKET }} />
          <span>含红包</span>
        </div>
      </div>

      <div className="absolute bottom-3 right-3 text-xs opacity-50" style={{ color: '#4A3B32' }}>
        双击节点发送催款提醒
      </div>
    </div>
  );
}
