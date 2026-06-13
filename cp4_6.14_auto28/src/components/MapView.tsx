import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MindMap, MindMapNode, User } from '../types';

interface MapViewProps {
  mindMap: MindMap;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onMoveNodes: (moves: Array<{ nodeId: string; x: number; y: number }>) => void;
  onNodeDoubleClick: (nodeId: string) => void;
  users: User[];
  currentUserId: string | null;
  cursors: Record<string, { x: number; y: number }>;
}

interface NodeBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

const HORIZONTAL_PADDING = 20;
const VERTICAL_PADDING = 14;
const NODE_RADIUS = 12;
const MIN_SCALE = 0.5;
const MAX_SCALE = 3;

export const MapView: React.FC<MapViewProps> = ({
  mindMap,
  selectedNodeId,
  onSelectNode,
  onMoveNodes,
  onNodeDoubleClick,
  users,
  currentUserId,
  cursors
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const [isDragging, setIsDragging] = useState(false);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [nodeStartPos, setNodeStartPos] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [offsetStart, setOffsetStart] = useState({ x: 0, y: 0 });

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredConnection, setHoveredConnection] = useState<{ from: string; to: string } | null>(null);
  const [nodeBounds, setNodeBounds] = useState<Record<string, NodeBounds>>({});

  const animationFrameRef = useRef<number>();
  const nodeVelocitiesRef = useRef<Record<string, { vx: number; vy: number }>>({});
  const mouseMoveThrottleRef = useRef<number>();

  const getLuminance = (hex: string): number => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  };

  const getContrastTextColor = (bgColor: string): string => {
    return getLuminance(bgColor) > 0.5 ? '#1a1a2e' : '#ffffff';
  };

  const measureNode = useCallback((ctx: CanvasRenderingContext2D, node: MindMapNode, s: number): NodeBounds => {
    const effectiveFontSize = Math.max(8, node.fontSize * s);
    ctx.font = `600 ${effectiveFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;

    const iconWidth = node.icon ? effectiveFontSize * 1.5 : 0;
    const titleMetrics = ctx.measureText(node.title);
    const subtitleMetrics = node.subtitle ? ctx.measureText(node.subtitle) : { width: 0 };

    const maxTextWidth = Math.max(titleMetrics.width, subtitleMetrics.width);
    const contentWidth = iconWidth + maxTextWidth + (node.icon ? HORIZONTAL_PADDING * 0.5 : 0);
    const width = contentWidth + HORIZONTAL_PADDING * 2;

    const lines = node.subtitle ? 2 : 1;
    const lineHeight = effectiveFontSize * 1.3;
    const height = lines * lineHeight + VERTICAL_PADDING * 2;

    return {
      x: node.x * s - width / 2,
      y: node.y * s - height / 2,
      width,
      height
    };
  }, []);

  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    return {
      x: (screenX - centerX - offset.x) / scale,
      y: (screenY - centerY - offset.y) / scale
    };
  }, [offset, scale]);

  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  const drawConnection = useCallback((
    ctx: CanvasRenderingContext2D,
    fromNode: MindMapNode,
    toNode: MindMapNode,
    s: number,
    isHovered: boolean
  ) => {
    const fromX = fromNode.x * s;
    const fromY = fromNode.y * s;
    const toX = toNode.x * s;
    const toY = toNode.y * s;

    const dx = toX - fromX;
    const dy = toY - fromY;
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;

    const cp1x = midX - dx * 0.1 + (dy !== 0 ? 0 : Math.sign(dx || 1) * 50);
    const cp1y = midY - dy * 0.1 + (dx !== 0 ? 0 : 0);
    const cp2x = midX + dx * 0.1;
    const cp2y = midY + dy * 0.1;

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, toX, toY);

    if (isHovered) {
      const gradient = ctx.createLinearGradient(fromX, fromY, toX, toY);
      gradient.addColorStop(0, '#ff9f43');
      gradient.addColorStop(0.5, '#ff6b6b');
      gradient.addColorStop(1, '#ffa502');
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 4 * s;
      ctx.shadowColor = 'rgba(255, 159, 67, 0.6)';
      ctx.shadowBlur = 15 * s;
    } else {
      ctx.strokeStyle = 'rgba(136, 136, 170, 0.6)';
      ctx.lineWidth = 2 * s;
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }

    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.shadowBlur = 0;
  }, []);

  const drawNode = useCallback((
    ctx: CanvasRenderingContext2D,
    node: MindMapNode,
    s: number,
    isSelected: boolean,
    isHovered: boolean
  ) => {
    const effectiveFontSize = Math.max(8, node.fontSize * s);
    const lineHeight = effectiveFontSize * 1.3;

    ctx.font = `600 ${effectiveFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    const bounds = measureNode(ctx, node, s);

    const drawX = bounds.x;
    const drawY = bounds.y;

    if (isSelected) {
      ctx.shadowColor = '#4fc3f7';
      ctx.shadowBlur = 20 * s;
    } else if (isHovered) {
      ctx.shadowColor = 'rgba(79, 195, 247, 0.4)';
      ctx.shadowBlur = 10 * s;
    } else {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 8 * s;
    }

    drawRoundedRect(ctx, drawX, drawY, bounds.width, bounds.height, NODE_RADIUS * s);
    ctx.fillStyle = node.color;
    ctx.fill();

    ctx.shadowBlur = 0;

    if (isSelected) {
      ctx.strokeStyle = '#4fc3f7';
      ctx.lineWidth = 3 * s;
    } else {
      ctx.strokeStyle = isHovered ? 'rgba(79, 195, 247, 0.6)' : 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2 * s;
    }

    if (node.borderStyle === 'dashed') {
      ctx.setLineDash([6 * s, 4 * s]);
    } else if (node.borderStyle === 'double') {
      ctx.stroke();
      ctx.lineWidth = 1 * s;
      ctx.strokeStyle = isSelected ? '#81d4fa' : 'rgba(255, 255, 255, 0.1)';
      drawRoundedRect(ctx, drawX + 3 * s, drawY + 3 * s, bounds.width - 6 * s, bounds.height - 6 * s, (NODE_RADIUS - 3) * s);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    const textColor = getContrastTextColor(node.color);
    ctx.fillStyle = textColor;
    ctx.textBaseline = 'middle';

    let textX = drawX + HORIZONTAL_PADDING * s;

    if (node.icon) {
      const iconSize = effectiveFontSize * 1.4;
      ctx.font = `${iconSize}px serif`;
      ctx.textAlign = 'left';
      ctx.fillText(node.icon, textX, drawY + bounds.height / 2);
      textX += iconSize + HORIZONTAL_PADDING * 0.5 * s;
    }

    ctx.font = `600 ${effectiveFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    ctx.textAlign = 'left';

    const titleY = node.subtitle
      ? drawY + VERTICAL_PADDING * s + lineHeight * 0.5
      : drawY + bounds.height / 2;

    const maxTextWidth = bounds.width - HORIZONTAL_PADDING * 2 * s - (node.icon ? effectiveFontSize * 1.5 : 0);
    let displayTitle = node.title;
    if (ctx.measureText(displayTitle).width > maxTextWidth) {
      while (displayTitle.length > 1 && ctx.measureText(displayTitle + '…').width > maxTextWidth) {
        displayTitle = displayTitle.slice(0, -1);
      }
      displayTitle += '…';
    }
    ctx.fillText(displayTitle, textX, titleY);

    if (node.subtitle) {
      ctx.font = `${Math.max(8, effectiveFontSize * 0.8)}px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.fillStyle = textColor === '#ffffff' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(26, 26, 46, 0.6)';
      const subtitleY = drawY + VERTICAL_PADDING * s + lineHeight + lineHeight * 0.5;
      let displaySubtitle = node.subtitle;
      if (ctx.measureText(displaySubtitle).width > maxTextWidth) {
        while (displaySubtitle.length > 1 && ctx.measureText(displaySubtitle + '…').width > maxTextWidth) {
          displaySubtitle = displaySubtitle.slice(0, -1);
        }
        displaySubtitle += '…';
      }
      ctx.fillText(displaySubtitle, textX, subtitleY);
    }
  }, [measureNode]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mindMap) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();

    ctx.fillStyle = '#1e1e2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gridSize = 40 * scale;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const offsetModX = ((offset.x % gridSize) + gridSize) % gridSize;
    const offsetModY = ((offset.y % gridSize) + gridSize) % gridSize;
    for (let x = offsetModX; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = offsetModY; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    const centerX = canvas.width / 2 + offset.x;
    const centerY = canvas.height / 2 + offset.y;
    ctx.translate(centerX, centerY);

    const nodes = Object.values(mindMap.nodes);
    const newBounds: Record<string, NodeBounds> = {};
    nodes.forEach((node) => {
      newBounds[node.id] = measureNode(ctx, node, scale);
    });
    setNodeBounds(newBounds);

    const connections: Array<{ from: MindMapNode; to: MindMapNode }> = [];
    nodes.forEach((node) => {
      if (node.parentId && mindMap.nodes[node.parentId]) {
        connections.push({
          from: mindMap.nodes[node.parentId],
          to: node
        });
      }
    });

    connections.forEach(({ from, to }) => {
      const isHovered =
        (hoveredConnection?.from === from.id && hoveredConnection?.to === to.id) ||
        (hoveredConnection?.from === to.id && hoveredConnection?.to === from.id);
      drawConnection(ctx, from, to, scale, isHovered);
    });

    const sortedNodes = [...nodes].sort((a, b) => {
      if (a.id === selectedNodeId) return 1;
      if (b.id === selectedNodeId) return -1;
      return 0;
    });

    sortedNodes.forEach((node) => {
      drawNode(ctx, node, scale, node.id === selectedNodeId, node.id === hoveredNodeId);
    });

    users.forEach((user) => {
      if (user.id !== currentUserId && cursors[user.id]) {
        const cursor = cursors[user.id];
        const cx = cursor.x * scale;
        const cy = cursor.y * scale;

        ctx.fillStyle = user.color;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + 12 * scale, cy + 18 * scale);
        ctx.lineTo(cx + 6 * scale, cy + 22 * scale);
        ctx.lineTo(cx - 2 * scale, cy + 12 * scale);
        ctx.closePath();
        ctx.fill();

        ctx.font = `${Math.max(10, 12 * scale)}px sans-serif`;
        const textWidth = ctx.measureText(user.nickname).width;
        const tagWidth = textWidth + 12 * scale;
        const tagHeight = 20 * scale;
        const tagX = cx + 8 * scale;
        const tagY = cy + 22 * scale;

        ctx.fillStyle = user.color;
        drawRoundedRect(ctx, tagX, tagY, tagWidth, tagHeight, 4 * scale);
        ctx.fill();

        ctx.fillStyle = getContrastTextColor(user.color);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(user.nickname, tagX + 6 * scale, tagY + tagHeight / 2);
      }
    });

    ctx.restore();

    if (Object.keys(nodeVelocitiesRef.current).length > 0) {
      animationFrameRef.current = requestAnimationFrame(() => {
        const velocities = nodeVelocitiesRef.current;
        const moves: Array<{ nodeId: string; x: number; y: number }> = [];
        const damping = 0.85;
        const threshold = 0.5;

        Object.keys(velocities).forEach((nodeId) => {
          const v = velocities[nodeId];
          if (Math.abs(v.vx) > threshold || Math.abs(v.vy) > threshold) {
            const node = mindMap.nodes[nodeId];
            if (node) {
              const newX = node.x + v.vx;
              const newY = node.y + v.vy;
              velocities[nodeId] = {
                vx: v.vx * damping,
                vy: v.vy * damping
              };
              if (Math.abs(velocities[nodeId].vx) < threshold) velocities[nodeId].vx = 0;
              if (Math.abs(velocities[nodeId].vy) < threshold) velocities[nodeId].vy = 0;
              moves.push({ nodeId, x: newX, y: newY });
            }
          }
        });

        if (moves.length > 0) {
          onMoveNodes(moves);
        } else {
          nodeVelocitiesRef.current = {};
        }
      });
    }
  }, [mindMap, selectedNodeId, hoveredNodeId, hoveredConnection, scale, offset, users, currentUserId, cursors, measureNode, drawConnection, drawNode, onMoveNodes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeObserver = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
      render();
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    render();
  }, [render]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (mouseMoveThrottleRef.current) clearTimeout(mouseMoveThrottleRef.current);
    };
  }, []);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const world = screenToWorld(x, y);

    let clickedNodeId: string | null = null;
    const canvasCtx = canvasRef.current.getContext('2d');
    if (canvasCtx) {
      const sortedNodes = Object.values(mindMap.nodes).sort((a, b) => {
        const la = Object.keys(mindMap.nodes[a.parentId || ''] ? 1 : 0);
        const lb = Object.keys(mindMap.nodes[b.parentId || ''] ? 1 : 0);
        return (lb as any) - (la as any);
      });

      for (const node of sortedNodes) {
        const bounds = measureNode(canvasCtx, node, scale);
        const canvasCenterX = canvasRef.current.width / (window.devicePixelRatio || 1) / 2;
        const canvasCenterY = canvasRef.current.height / (window.devicePixelRatio || 1) / 2;
        const screenBounds = {
          left: canvasCenterX + offset.x + bounds.x,
          right: canvasCenterX + offset.x + bounds.x + bounds.width,
          top: canvasCenterY + offset.y + bounds.y,
          bottom: canvasCenterY + offset.y + bounds.y + bounds.height
        };

        if (x >= screenBounds.left && x <= screenBounds.right && y >= screenBounds.top && y <= screenBounds.bottom) {
          clickedNodeId = node.id;
          break;
        }
      }
    }

    if (e.button === 2) {
      setIsPanning(true);
      setPanStart({ x, y });
      setOffsetStart({ ...offset });
      e.preventDefault();
      return;
    }

    if (clickedNodeId) {
      onSelectNode(clickedNodeId);
      const node = mindMap.nodes[clickedNodeId];
      if (node) {
        setIsDragging(true);
        setDraggingNodeId(clickedNodeId);
        setDragStart({ x, y });
        setNodeStartPos({ x: node.x, y: node.y });
      }
    } else {
      onSelectNode(null);
      setIsPanning(true);
      setPanStart({ x, y });
      setOffsetStart({ ...offset });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDragging && draggingNodeId) {
      const dx = (x - dragStart.x) / scale;
      const dy = (y - dragStart.y) / scale;
      const targetX = nodeStartPos.x + dx;
      const targetY = nodeStartPos.y + dy;

      const moves: Array<{ nodeId: string; x: number; y: number }> = [];
      const applyToChildren = (parentId: string, px: number, py: number) => {
        const node = mindMap.nodes[parentId];
        if (!node) return;
        node.children.forEach((childId) => {
          const child = mindMap.nodes[childId];
          if (child) {
            const cdx = child.x - node.x;
            const cdy = child.y - node.y;
            const childTargetX = px + cdx;
            const childTargetY = py + cdy;
            moves.push({ nodeId: childId, x: childTargetX, y: childTargetY });
            applyToChildren(childId, childTargetX, childTargetY);
          }
        });
      };

      moves.push({ nodeId: draggingNodeId, x: targetX, y: targetY });
      applyToChildren(draggingNodeId, targetX, targetY);
      onMoveNodes(moves);
    } else if (isPanning) {
      setOffset({
        x: offsetStart.x + (x - panStart.x),
        y: offsetStart.y + (y - panStart.y)
      });
    } else {
      const canvasCtx = canvasRef.current.getContext('2d');
      if (canvasCtx) {
        const canvasCenterX = canvasRef.current.width / (window.devicePixelRatio || 1) / 2;
        const canvasCenterY = canvasRef.current.height / (window.devicePixelRatio || 1) / 2;

        let hoveredNode: string | null = null;
        const sortedNodes = Object.values(mindMap.nodes);
        for (const node of sortedNodes) {
          const bounds = measureNode(canvasCtx, node, scale);
          const screenBounds = {
            left: canvasCenterX + offset.x + bounds.x,
            right: canvasCenterX + offset.x + bounds.x + bounds.width,
            top: canvasCenterY + offset.y + bounds.y,
            bottom: canvasCenterY + offset.y + bounds.y + bounds.height
          };
          if (x >= screenBounds.left && x <= screenBounds.right && y >= screenBounds.top && y <= screenBounds.bottom) {
            hoveredNode = node.id;
            break;
          }
        }
        setHoveredNodeId(hoveredNode);

        let foundConnection: { from: string; to: string } | null = null;
        const nodes = Object.values(mindMap.nodes);
        for (const node of nodes) {
          if (node.parentId && mindMap.nodes[node.parentId]) {
            const fromNode = mindMap.nodes[node.parentId];
            const toNode = node;
            const fromX = canvasCenterX + offset.x + fromNode.x * scale;
            const fromY = canvasCenterY + offset.y + fromNode.y * scale;
            const toX = canvasCenterX + offset.x + toNode.x * scale;
            const toY = canvasCenterY + offset.y + toNode.y * scale;
            const midX = (fromX + toX) / 2;
            const midY = (fromY + toY) / 2;
            const dist = Math.sqrt((x - midX) ** 2 + (y - midY) ** 2);
            if (dist < 20 * scale) {
              foundConnection = { from: node.parentId, to: node.id };
              break;
            }
          }
        }
        setHoveredConnection(foundConnection);
      }
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent) => {
    if (isDragging && draggingNodeId) {
      setIsDragging(false);
      setDraggingNodeId(null);
    }
    if (isPanning) {
      setIsPanning(false);
    }
  };

  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const canvasCtx = canvasRef.current.getContext('2d');
    if (!canvasCtx) return;

    const canvasCenterX = canvasRef.current.width / (window.devicePixelRatio || 1) / 2;
    const canvasCenterY = canvasRef.current.height / (window.devicePixelRatio || 1) / 2;
    const sortedNodes = Object.values(mindMap.nodes);

    for (const node of sortedNodes) {
      const bounds = measureNode(canvasCtx, node, scale);
      const screenBounds = {
        left: canvasCenterX + offset.x + bounds.x,
        right: canvasCenterX + offset.x + bounds.x + bounds.width,
        top: canvasCenterY + offset.y + bounds.y,
        bottom: canvasCenterY + offset.y + bounds.y + bounds.height
      };
      if (x >= screenBounds.left && x <= screenBounds.right && y >= screenBounds.top && y <= screenBounds.bottom) {
        onNodeDoubleClick(node.id);
        break;
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * delta));

    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left - rect.width / 2;
    const my = e.clientY - rect.top - rect.height / 2;

    const worldX = (mx - offset.x) / scale;
    const worldY = (my - offset.y) / scale;

    const newOffsetX = mx - worldX * newScale;
    const newOffsetY = my - worldY * newScale;

    setScale(newScale);
    setOffset({ x: newOffsetX, y: newOffsetY });
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#1e1e2e',
        cursor: isPanning ? 'grabbing' : isDragging ? 'grabbing' : 'default'
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onDoubleClick={handleCanvasDoubleClick}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        style={{
          display: 'block',
          touchAction: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          padding: '8px 14px',
          backgroundColor: 'rgba(30, 30, 46, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 8,
          color: '#8888aa',
          fontSize: 12,
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}
      >
        <span>{Math.round(scale * 100)}%</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setScale(Math.max(MIN_SCALE, scale * 0.8))}
            style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'transparent',
              color: '#8888aa',
              cursor: 'pointer',
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              (e.target as HTMLButtonElement).style.borderColor = '#4fc3f7';
              (e.target as HTMLButtonElement).style.color = '#4fc3f7';
            }}
            onMouseOut={(e) => {
              (e.target as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.15)';
              (e.target as HTMLButtonElement).style.color = '#8888aa';
            }}
          >
            −
          </button>
          <button
            onClick={() => { setScale(1); setOffset({ x: 0, y: 0 }); }}
            style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'transparent',
              color: '#8888aa',
              cursor: 'pointer',
              fontSize: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              (e.target as HTMLButtonElement).style.borderColor = '#4fc3f7';
              (e.target as HTMLButtonElement).style.color = '#4fc3f7';
            }}
            onMouseOut={(e) => {
              (e.target as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.15)';
              (e.target as HTMLButtonElement).style.color = '#8888aa';
            }}
          >
            1:1
          </button>
          <button
            onClick={() => setScale(Math.min(MAX_SCALE, scale * 1.25))}
            style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'transparent',
              color: '#8888aa',
              cursor: 'pointer',
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              (e.target as HTMLButtonElement).style.borderColor = '#4fc3f7';
              (e.target as HTMLButtonElement).style.color = '#4fc3f7';
            }}
            onMouseOut={(e) => {
              (e.target as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.15)';
              (e.target as HTMLButtonElement).style.color = '#8888aa';
            }}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};
