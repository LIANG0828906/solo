import React, { useRef, useEffect, useCallback } from 'react';
import { WorldState, Vec2, ToolMode, SpawnAnimation } from '../physics/types';
import { getStretchRatio } from '../physics/PhysicsEngine';

interface CanvasRendererProps {
  world: WorldState;
  width: number;
  height: number;
  selectedNodeId: string | null;
  constraintStartNodeId: string | null;
  toolMode: ToolMode;
  isDragging: boolean;
  dragNodeId: string | null;
  dragMousePos: Vec2 | null;
  spawnAnimations: SpawnAnimation[];
  mousePos: Vec2 | null;
  onCanvasClick: (pos: Vec2) => void;
  onCanvasMouseMove: (pos: Vec2) => void;
  onCanvasMouseDown: (pos: Vec2) => void;
  onCanvasMouseUp: (pos: Vec2) => void;
  onContextMenu: (pos: Vec2) => void;
}

const easeOutBack = (t: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

const CanvasRenderer: React.FC<CanvasRendererProps> = ({
  world,
  width,
  height,
  selectedNodeId,
  constraintStartNodeId,
  toolMode,
  isDragging,
  dragNodeId,
  dragMousePos,
  spawnAnimations,
  mousePos,
  onCanvasClick,
  onCanvasMouseMove,
  onCanvasMouseDown,
  onCanvasMouseUp,
  onContextMenu,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  const getCanvasPos = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): Vec2 => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * width,
        y: ((e.clientY - rect.top) / rect.height) * height,
      };
    },
    [width, height]
  );

  const getNodeSpawnProgress = useCallback(
    (nodeId: string): number => {
      const anim = spawnAnimations.find((a) => a.nodeId === nodeId);
      if (!anim) return 1;
      const t = Math.max(0, Math.min(1, (anim.elapsed - anim.delay) / 0.2));
      if (t <= 0) return 0;
      return easeOutBack(t);
    },
    [spawnAnimations]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    world.constraints.forEach((constraint) => {
      const nodeA = world.nodes.get(constraint.nodeAId);
      const nodeB = world.nodes.get(constraint.nodeBId);
      if (!nodeA || !nodeB) return;

      const stretch = getStretchRatio(world, constraint);
      const stretchClamped = Math.min(Math.max(stretch, 0.5), 2);
      const t = (stretchClamped - 1) / 1;
      const lineWidth = 1 + t * 2;
      const r = Math.round(255 * Math.min(1, t));
      const g = Math.round(255 * (1 - Math.min(1, t)));
      const b = Math.round(255 * (1 - Math.min(1, t)));
      const alpha = 0.7;

      ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(nodeA.pos.x, nodeA.pos.y);
      ctx.lineTo(nodeB.pos.x, nodeB.pos.y);
      ctx.stroke();
    });

    if (constraintStartNodeId && mousePos && toolMode === 'constraint') {
      const startNode = world.nodes.get(constraintStartNodeId);
      if (startNode) {
        ctx.strokeStyle = 'rgba(255,140,0,0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.moveTo(startNode.pos.x, startNode.pos.y);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    if (isDragging && dragNodeId && dragMousePos) {
      const dragNode = world.nodes.get(dragNodeId);
      if (dragNode) {
        ctx.strokeStyle = 'rgba(255,165,0,0.8)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(dragMousePos.x, dragMousePos.y);
        ctx.lineTo(dragNode.pos.x, dragNode.pos.y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = 'rgba(255,165,0,0.3)';
        ctx.beginPath();
        ctx.arc(dragMousePos.x, dragMousePos.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,165,0,0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    world.particles.forEach((p) => {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    const nodeArray = Array.from(world.nodes.values());
    for (const node of nodeArray) {
      const progress = getNodeSpawnProgress(node.id);
      if (progress <= 0) continue;

      const displayRadius = node.radius * (0.5 + 1.5 * progress);
      const isSelected = node.id === selectedNodeId;
      const isConstraintStart = node.id === constraintStartNodeId;
      const isDragTarget = node.id === dragNodeId && isDragging;

      if (isSelected || isConstraintStart) {
        ctx.strokeStyle = 'rgba(255,140,0,0.5)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.arc(node.pos.x, node.pos.y, displayRadius + 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (node.pinned) {
        ctx.fillStyle = 'rgba(100,200,100,0.2)';
        ctx.beginPath();
        ctx.arc(node.pos.x, node.pos.y, displayRadius + 4, 0, Math.PI * 2);
        ctx.fill();
      }

      const fillColor = isSelected || isConstraintStart
        ? '#ff8c00'
        : isDragTarget
        ? '#ffa500'
        : node.pinned
        ? '#7ccc7c'
        : '#d0d0d0';

      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.arc(node.pos.x, node.pos.y, displayRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.globalAlpha = progress < 1 ? progress * 0.5 : 0;
      if (progress < 1) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(node.pos.x, node.pos.y, displayRadius * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }, [
    world,
    width,
    height,
    selectedNodeId,
    constraintStartNodeId,
    toolMode,
    isDragging,
    dragNodeId,
    dragMousePos,
    spawnAnimations,
    mousePos,
    getNodeSpawnProgress,
    dpr,
  ]);

  const cursorStyle = React.useMemo(() => {
    if (toolMode === 'node') return 'crosshair';
    if (toolMode === 'constraint') return 'cell';
    if (isDragging) return 'grabbing';
    return 'default';
  }, [toolMode, isDragging]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        cursor: cursorStyle,
      }}
      onClick={(e) => onCanvasClick(getCanvasPos(e))}
      onMouseMove={(e) => onCanvasMouseMove(getCanvasPos(e))}
      onMouseDown={(e) => {
        if (e.button === 0) onCanvasMouseDown(getCanvasPos(e));
      }}
      onMouseUp={(e) => {
        if (e.button === 0) onCanvasMouseUp(getCanvasPos(e));
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(getCanvasPos(e));
      }}
    />
  );
};

export default CanvasRenderer;
