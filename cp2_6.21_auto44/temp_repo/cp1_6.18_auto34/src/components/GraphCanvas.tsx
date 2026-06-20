import React, { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { useGraphStore } from '../store/useGraphStore';
import type {
  InspirationNode,
  Link,
  DragState,
} from '../types';
import { TAG_COLORS, easeOut } from '../types';

const NODE_WIDTH = 120;
const NODE_HEIGHT = 50;
const MINIMAP_WIDTH = 180;
const MINIMAP_HEIGHT = 120;
const MINIMAP_PADDING = 8;

interface CanvasPosition {
  x: number;
  y: number;
}

export interface GraphCanvasHandle {
  getCanvas: () => HTMLCanvasElement | null;
}

export const GraphCanvas = forwardRef<HTMLCanvasElement>((_, ref) => {
  const innerCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  useImperativeHandle(ref, () => innerCanvasRef.current!);

  const {
    nodes,
    links,
    selectedNodeId,
    searchKeyword,
    viewport,
    animatedNodes,
    fragments,
    actions: {
      moveNode,
      selectNode,
      setEditingNode,
      addLink,
      deleteNode,
      setViewport,
      getMatchingNodeIds,
    },
  } = useGraphStore();

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    nodeId: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
  });

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [linkMode, setLinkMode] = useState(false);
  const [linkStartId, setLinkStartId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<CanvasPosition>({ x: 0, y: 0 });
  const [pulseTime, setPulseTime] = useState(0);

  const screenToWorld = useCallback(
    (screenX: number, screenY: number): CanvasPosition => {
      const canvas = innerCanvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: (screenX - rect.left - viewport.x) / viewport.scale,
        y: (screenY - rect.top - viewport.y) / viewport.scale,
      };
    },
    [viewport],
  );

  const worldToScreen = useCallback(
    (worldX: number, worldY: number): CanvasPosition => {
      return {
        x: worldX * viewport.scale + viewport.x,
        y: worldY * viewport.scale + viewport.y,
      };
    },
    [viewport],
  );

  const getNodeAtPosition = useCallback(
    (worldX: number, worldY: number): InspirationNode | null => {
      for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        const halfWidth = NODE_WIDTH / 2;
        const halfHeight = NODE_HEIGHT / 2;
        if (
          worldX >= node.x - halfWidth &&
          worldX <= node.x + halfWidth &&
          worldY >= node.y - halfHeight &&
          worldY <= node.y + halfHeight
        ) {
          return node;
        }
      }
      return null;
    },
    [nodes],
  );

  const getLinkAtPosition = useCallback(
    (worldX: number, worldY: number): Link | null => {
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));
      const threshold = 10 / viewport.scale;

      for (const link of links) {
        const source = nodeMap.get(link.sourceId);
        const target = nodeMap.get(link.targetId);
        if (!source || !target) continue;

        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2 - 50;

        const dist = pointToBezierDistance(
          worldX,
          worldY,
          source.x,
          source.y,
          midX,
          midY,
          target.x,
          target.y,
        );

        if (dist < threshold) {
          return link;
        }
      }
      return null;
    },
    [nodes, links, viewport.scale],
  );

  const pointToBezierDistance = (
    px: number,
    py: number,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ): number => {
    let minDist = Infinity;
    for (let t = 0; t <= 1; t += 0.05) {
      const mt = 1 - t;
      const x = mt * mt * x0 + 2 * mt * t * x1 + t * t * x2;
      const y = mt * mt * y0 + 2 * mt * t * y1 + t * t * y2;
      const dist = Math.sqrt((px - x) ** 2 + (py - y) ** 2);
      minDist = Math.min(minDist, dist);
    }
    return minDist;
  };

  const drawBackground = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#0D0D1A');
      gradient.addColorStop(1, '#1A1A3A');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = 'rgba(108, 99, 255, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 50 * viewport.scale;
      const offsetX = viewport.x % gridSize;
      const offsetY = viewport.y % gridSize;

      for (let x = offsetX; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let y = offsetY; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    },
    [viewport],
  );

  const drawLink = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      link: Link,
      source: InspirationNode,
      target: InspirationNode,
    ) => {
      const start = worldToScreen(source.x, source.y);
      const end = worldToScreen(target.x, target.y);

      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2 - 50 * viewport.scale;

      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.quadraticCurveTo(midX, midY, end.x, end.y);

      ctx.strokeStyle =
        link.type === 'strong'
          ? 'rgba(108, 99, 255, 0.6)'
          : 'rgba(74, 74, 106, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();

      const angle = Math.atan2(end.y - midY, end.x - midX);
      const dotX = end.x - Math.cos(angle) * 8;
      const dotY = end.y - Math.sin(angle) * 8;

      ctx.beginPath();
      ctx.arc(dotX, dotY, 4, 0, Math.PI * 2);
      ctx.fillStyle =
        link.type === 'strong'
          ? 'rgba(108, 99, 255, 0.8)'
          : 'rgba(74, 74, 106, 0.8)';
      ctx.fill();
    },
    [worldToScreen, viewport.scale],
  );

  const drawNode = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      node: InspirationNode,
      isSelected: boolean,
      isMatching: boolean,
      scale: number = 1,
    ) => {
      const pos = worldToScreen(node.x, node.y);
      const width = NODE_WIDTH * viewport.scale * scale;
      const height = NODE_HEIGHT * viewport.scale * scale;
      const halfWidth = width / 2;
      const halfHeight = height / 2;
      const radius = 10 * viewport.scale;

      const dotColor = TAG_COLORS[node.tag];

      if (isMatching) {
        const pulseScale = 1 + Math.sin(pulseTime * 3) * 0.1;
        const pulseSize = 20 * viewport.scale * pulseScale;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(108, 99, 255, ${0.1 + Math.sin(pulseTime * 3) * 0.05})`;
        ctx.fill();

        ctx.shadowColor = 'rgba(108, 99, 255, 0.8)';
        ctx.shadowBlur = 20 * viewport.scale;
      }

      if (isSelected || dragState.nodeId === node.id) {
        ctx.shadowColor = 'rgba(108, 99, 255, 0.5)';
        ctx.shadowBlur = 15 * viewport.scale;
      }

      ctx.beginPath();
      ctx.roundRect(pos.x - halfWidth, pos.y - halfHeight, width, height, radius);
      ctx.fillStyle = '#1E1E2E';
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#6C63FF' : '#3A3A5C';
      ctx.lineWidth = 2 * viewport.scale;
      ctx.stroke();

      ctx.shadowBlur = 0;

      const dotSize = 10 * viewport.scale * scale;
      const dotX = pos.x - halfWidth + 15 * viewport.scale;
      const dotY = pos.y;

      ctx.beginPath();
      ctx.arc(dotX, dotY, dotSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = dotColor;
      ctx.fill();

      ctx.font = `bold ${14 * viewport.scale * scale}px Inter, sans-serif`;
      ctx.fillStyle = isMatching ? '#6C63FF' : '#E0E0E0';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      const textX = dotX + dotSize + 10 * viewport.scale;
      const maxWidth = width - 40 * viewport.scale;
      ctx.fillText(node.title, textX, dotY, maxWidth);
    },
    [worldToScreen, viewport.scale, pulseTime, dragState.nodeId],
  );

  const drawFragments = useCallback(
    (ctx: CanvasRenderingContext2D, currentTime: number) => {
      fragments.forEach((frag) => {
        const elapsed = (currentTime - frag.startTime) / 1000;
        const t = Math.min(elapsed / 0.3, 1);

        const x = frag.x + frag.vx * elapsed * 60;
        const y = frag.y + frag.vy * elapsed * 60 + 0.5 * 200 * elapsed * elapsed;
        const opacity = frag.opacity * (1 - t);

        const screenPos = worldToScreen(x, y);
        const size = frag.size * viewport.scale * (1 - t * 0.5);

        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, size / 2, 0, Math.PI * 2);
        ctx.fillStyle = frag.color.replace(')', `, ${opacity})`).replace('rgb', 'rgba');
        ctx.fill();
      });
    },
    [fragments, worldToScreen, viewport.scale],
  );

  const drawMinimap = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      if (nodes.length === 0) return;

      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      nodes.forEach((n) => {
        minX = Math.min(minX, n.x);
        minY = Math.min(minY, n.y);
        maxX = Math.max(maxX, n.x);
        maxY = Math.max(maxY, n.y);
      });

      const padding = 100;
      minX -= padding;
      minY -= padding;
      maxX += padding;
      maxY += padding;

      const graphWidth = maxX - minX;
      const graphHeight = maxY - minY;
      const scaleX = (MINIMAP_WIDTH - MINIMAP_PADDING * 2) / graphWidth;
      const scaleY = (MINIMAP_HEIGHT - MINIMAP_PADDING * 2) / graphHeight;
      const scale = Math.min(scaleX, scaleY);

      const offsetX = width - MINIMAP_WIDTH - 16;
      const offsetY = height - MINIMAP_HEIGHT - 16;

      ctx.fillStyle = 'rgba(10, 10, 20, 0.6)';
      ctx.beginPath();
      ctx.roundRect(offsetX, offsetY, MINIMAP_WIDTH, MINIMAP_HEIGHT, 8);
      ctx.fill();
      ctx.strokeStyle = '#2A2A44';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(offsetX, offsetY, MINIMAP_WIDTH, MINIMAP_HEIGHT, 8);
      ctx.clip();

      const nodeMap = new Map(nodes.map((n) => [n.id, n]));
      links.forEach((link) => {
        const source = nodeMap.get(link.sourceId);
        const target = nodeMap.get(link.targetId);
        if (!source || !target) return;

        const sx = offsetX + MINIMAP_PADDING + (source.x - minX) * scale;
        const sy = offsetY + MINIMAP_PADDING + (source.y - minY) * scale;
        const tx = offsetX + MINIMAP_PADDING + (target.x - minX) * scale;
        const ty = offsetY + MINIMAP_PADDING + (target.y - minY) * scale;

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(tx, ty);
        ctx.strokeStyle = 'rgba(74, 74, 106, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      nodes.forEach((node) => {
        const nx = offsetX + MINIMAP_PADDING + (node.x - minX) * scale;
        const ny = offsetY + MINIMAP_PADDING + (node.y - minY) * scale;
        const isSelected = node.id === selectedNodeId;

        ctx.beginPath();
        ctx.arc(nx, ny, isSelected ? 4 : 2.5, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#6C63FF' : TAG_COLORS[node.tag];
        ctx.fill();
      });

      const viewTopLeft = screenToWorld(0, 0);
      const viewBottomRight = screenToWorld(width, height);

      const vx = offsetX + MINIMAP_PADDING + (viewTopLeft.x - minX) * scale;
      const vy = offsetY + MINIMAP_PADDING + (viewTopLeft.y - minY) * scale;
      const vw = (viewBottomRight.x - viewTopLeft.x) * scale;
      const vh = (viewBottomRight.y - viewTopLeft.y) * scale;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(vx, vy, vw, vh);
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(vx, vy, vw, vh);

      ctx.restore();
    },
    [nodes, links, selectedNodeId, screenToWorld],
  );

  const drawLinkPreview = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (!linkMode || !linkStartId) return;

      const startNode = nodes.find((n) => n.id === linkStartId);
      if (!startNode) return;

      const start = worldToScreen(startNode.x, startNode.y);
      const end = { x: mousePos.x, y: mousePos.y };

      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2 - 50 * viewport.scale;

      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.quadraticCurveTo(midX, midY, end.x, end.y);
      ctx.strokeStyle = 'rgba(108, 99, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(start.x, start.y, 8 * viewport.scale, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(108, 99, 255, 0.3)';
      ctx.fill();
      ctx.strokeStyle = '#6C63FF';
      ctx.lineWidth = 2;
      ctx.stroke();
    },
    [linkMode, linkStartId, nodes, worldToScreen, mousePos, viewport.scale],
  );

  const draw = useCallback(
    (currentTime: number) => {
      const canvas = innerCanvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      setPulseTime(currentTime / 1000);

      ctx.clearRect(0, 0, width, height);
      drawBackground(ctx, width, height);

      const nodeMap = new Map(nodes.map((n) => [n.id, n]));
      const matchingIds = getMatchingNodeIds();

      links.forEach((link) => {
        const source = nodeMap.get(link.sourceId);
        const target = nodeMap.get(link.targetId);
        if (!source || !target) return;
        drawLink(ctx, link, source, target);
      });

      drawLinkPreview(ctx);

      nodes.forEach((node) => {
        const isSelected = node.id === selectedNodeId;
        const isMatching = matchingIds.has(node.id);
        const animated = animatedNodes.get(node.id);

        if (animated) {
          const elapsed = (currentTime - animated.startTime) / 1000;
          const t = Math.min(elapsed / (animated.duration / 1000), 1);
          const easedT = easeOut(t);
          const scale = animated.type === 'add' ? easedT : 1;

          ctx.globalAlpha = 1;
          drawNode(ctx, node, isSelected, isMatching, scale);
          ctx.globalAlpha = 1;
        } else {
          const scale =
            dragState.nodeId === node.id ? 1.1 : isMatching ? 1.2 : 1;
          drawNode(ctx, node, isSelected, isMatching, scale);
        }
      });

      drawFragments(ctx, currentTime);
      drawMinimap(ctx, width, height);

      if (searchKeyword && matchingIds.size === 0) {
        ctx.font = '16px Inter, sans-serif';
        ctx.fillStyle = '#6C6C8A';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('未找到匹配灵感', width / 2, height / 2);
      }
    },
    [
      nodes,
      links,
      selectedNodeId,
      searchKeyword,
      animatedNodes,
      dragState.nodeId,
      drawBackground,
      drawLink,
      drawNode,
      drawLinkPreview,
      drawFragments,
      drawMinimap,
      getMatchingNodeIds,
    ],
  );

  const animate = useCallback(
    (currentTime: number) => {
      if (currentTime - lastTimeRef.current >= 16) {
        draw(currentTime);
        lastTimeRef.current = currentTime;
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    },
    [draw],
  );

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animate]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = innerCanvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;

    const worldPos = screenToWorld(e.clientX, e.clientY);
    const node = getNodeAtPosition(worldPos.x, worldPos.y);
    const link = node ? null : getLinkAtPosition(worldPos.x, worldPos.y);

    if (e.ctrlKey && node && selectedNodeId && selectedNodeId !== node.id) {
      addLink(selectedNodeId, node.id, 'strong');
      return;
    }

    if (linkMode && linkStartId && node && node.id !== linkStartId) {
      addLink(linkStartId, node.id, 'strong');
      setLinkMode(false);
      setLinkStartId(null);
      return;
    }

    if (node) {
      setDragState({
        isDragging: true,
        nodeId: node.id,
        startX: e.clientX,
        startY: e.clientY,
        offsetX: worldPos.x - node.x,
        offsetY: worldPos.y - node.y,
      });
      selectNode(node.id);
    } else if (link) {
      selectNode(null);
    } else {
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
      selectNode(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const worldPos = screenToWorld(e.clientX, e.clientY);
    setMousePos({ x: e.clientX, y: e.clientY });

    if (dragState.isDragging && dragState.nodeId) {
      const newX = worldPos.x - dragState.offsetX;
      const newY = worldPos.y - dragState.offsetY;
      moveNode(dragState.nodeId, newX, newY);
    } else if (isPanning) {
      setViewport({
        ...viewport,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setDragState({
      isDragging: false,
      nodeId: null,
      startX: 0,
      startY: 0,
      offsetX: 0,
      offsetY: 0,
    });
    setIsPanning(false);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    const worldPos = screenToWorld(e.clientX, e.clientY);
    const node = getNodeAtPosition(worldPos.x, worldPos.y);
    if (node) {
      setEditingNode(node.id);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.3, Math.min(3, viewport.scale * delta));

    const rect = innerCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newX = mouseX - (mouseX - viewport.x) * (newScale / viewport.scale);
    const newY = mouseY - (mouseY - viewport.y) * (newScale / viewport.scale);

    setViewport({
      x: newX,
      y: newY,
      scale: newScale,
    });
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId && (!e.target || (e.target as HTMLElement).tagName !== 'INPUT')) {
          e.preventDefault();
          deleteNode(selectedNodeId);
        }
      }
      if (e.key === 'l' || e.key === 'L') {
        if (selectedNodeId) {
          setLinkMode(!linkMode);
          setLinkStartId(linkMode ? null : selectedNodeId);
        }
      }
      if (e.key === 'Escape') {
        setLinkMode(false);
        setLinkStartId(null);
      }
    },
    [selectedNodeId, linkMode, deleteNode],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleMinimapClick = (e: React.MouseEvent) => {
    const canvas = innerCanvasRef.current;
    if (!canvas) return;

    const width = canvas.width;
    const height = canvas.height;

    const offsetX = width - MINIMAP_WIDTH - 16;
    const offsetY = height - MINIMAP_HEIGHT - 16;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left - offsetX - MINIMAP_PADDING;
    const my = e.clientY - rect.top - offsetY - MINIMAP_PADDING;

    if (mx < 0 || mx > MINIMAP_WIDTH - MINIMAP_PADDING * 2 || my < 0 || my > MINIMAP_HEIGHT - MINIMAP_PADDING * 2) {
      return;
    }

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    nodes.forEach((n) => {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x);
      maxY = Math.max(maxY, n.y);
    });

    const padding = 100;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const graphWidth = maxX - minX;
    const graphHeight = maxY - minY;
    const scaleX = (MINIMAP_WIDTH - MINIMAP_PADDING * 2) / graphWidth;
    const scaleY = (MINIMAP_HEIGHT - MINIMAP_PADDING * 2) / graphHeight;
    const scale = Math.min(scaleX, scaleY);

    const worldX = minX + mx / scale;
    const worldY = minY + my / scale;

    const screenCenterX = canvas.width / 2;
    const screenCenterY = canvas.height / 2;

    setViewport({
      ...viewport,
      x: screenCenterX - worldX * viewport.scale,
      y: screenCenterY - worldY * viewport.scale,
    });
  };

  return (
    <div ref={containerRef} className="flex-1 h-full relative">
      <canvas
        ref={innerCanvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
        onClick={handleMinimapClick}
        style={{ fontFamily: 'Inter, sans-serif' }}
      />

      {linkMode && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-[#1E1E2E] border border-[#6C63FF] rounded-lg text-[#E0E0E0] text-sm shadow-lg">
          连线模式：点击另一个节点建立连接，按 ESC 取消
        </div>
      )}
    </div>
  );
});

GraphCanvas.displayName = 'GraphCanvas';
