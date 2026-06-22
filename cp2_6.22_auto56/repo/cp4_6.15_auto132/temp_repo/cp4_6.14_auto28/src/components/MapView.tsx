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
const SPRING_STIFFNESS = 0.18;
const DAMPING = 0.85;
const VELOCITY_THRESHOLD = 0.3;

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
  const velocitiesRef = useRef<Record<string, { vx: number; vy: number }>>({});
  const restOffsetsRef = useRef<Record<string, { dx: number; dy: number }>>({});
  const localPositionsRef = useRef<Record<string, { x: number; y: number }>>({});
  const lastFrameTimeRef = useRef<number>(0);

  useEffect(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    const offsets: Record<string, { dx: number; dy: number }> = {};
    Object.values(mindMap.nodes).forEach((node) => {
      positions[node.id] = { x: node.x, y: node.y };
      if (node.parentId && mindMap.nodes[node.parentId]) {
        const parent = mindMap.nodes[node.parentId];
        offsets[node.id] = { dx: node.x - parent.x, dy: node.y - parent.y };
      }
    });
    localPositionsRef.current = positions;
    restOffsetsRef.current = offsets;
  }, [mindMap.rootId]);

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
    const centerX = canvas.width / (window.devicePixelRatio || 1) / 2;
    const centerY = canvas.height / (window.devicePixelRatio || 1) / 2;
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
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    s: number,
    isHovered: boolean
  ) => {
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;
    const dx = toX - fromX;
    const dy = toY - fromY;

    const cp1x = midX - dx * 0.1;
    const cp1y = midY - dy * 0.1 + (Math.abs(dx) > Math.abs(dy) ? 0 : 30 * s);
    const cp2x = midX + dx * 0.1;
    const cp2y = midY + dy * 0.1 - (Math.abs(dx) > Math.abs(dy) ? 0 : 30 * s);

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
    posX: number,
    posY: number,
    s: number,
    isSelected: boolean,
    isHovered: boolean
  ) => {
    const effectiveFontSize = Math.max(8, node.fontSize * s);
    const lineHeight = effectiveFontSize * 1.3;

    ctx.font = `600 ${effectiveFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;

    const iconWidth = node.icon ? effectiveFontSize * 1.5 : 0;
    const titleMetrics = ctx.measureText(node.title);
    const subtitleMetrics = node.subtitle ? ctx.measureText(node.subtitle) : { width: 0 };
    const maxTextWidth = Math.max(titleMetrics.width, subtitleMetrics.width);
    const contentWidth = iconWidth + maxTextWidth + (node.icon ? HORIZONTAL_PADDING * 0.5 : 0);
    const width = contentWidth + HORIZONTAL_PADDING * 2;
    const lines = node.subtitle ? 2 : 1;
    const height = lines * lineHeight + VERTICAL_PADDING * 2;

    const drawX = posX - width / 2;
    const drawY = posY - height / 2;

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

    drawRoundedRect(ctx, drawX, drawY, width, height, NODE_RADIUS * s);
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
      drawRoundedRect(ctx, drawX + 3 * s, drawY + 3 * s, width - 6 * s, height - 6 * s, (NODE_RADIUS - 3) * s);
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
      ctx.fillText(node.icon, textX, drawY + height / 2);
      textX += iconSize + HORIZONTAL_PADDING * 0.5 * s;
    }

    ctx.font = `600 ${effectiveFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    ctx.textAlign = 'left';

    const titleY = node.subtitle
      ? drawY + VERTICAL_PADDING * s + lineHeight * 0.5
      : drawY + height / 2;

    const maxTextWidth2 = width - HORIZONTAL_PADDING * 2 * s - (node.icon ? effectiveFontSize * 1.5 : 0);
    let displayTitle = node.title;
    if (ctx.measureText(displayTitle).width > maxTextWidth2) {
      while (displayTitle.length > 1 && ctx.measureText(displayTitle + '…').width > maxTextWidth2) {
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
      if (ctx.measureText(displaySubtitle).width > maxTextWidth2) {
        while (displaySubtitle.length > 1 && ctx.measureText(displaySubtitle + '…').width > maxTextWidth2) {
          displaySubtitle = displaySubtitle.slice(0, -1);
        }
        displaySubtitle += '…';
      }
      ctx.fillText(displaySubtitle, textX, subtitleY);
    }
  }, []);

  const physicsStep = useCallback(() => {
    const positions = localPositionsRef.current;
    const velocities = velocitiesRef.current;
    const offsets = restOffsetsRef.current;
    const moves: Array<{ nodeId: string; x: number; y: number }> = [];
    let hasActiveVelocity = false;

    const updateChildren = (parentId: string) => {
      const node = mindMap.nodes[parentId];
      if (!node) return;

      node.children.forEach((childId) => {
        const child = mindMap.nodes[childId];
        if (!child) return;

        const restOffset = offsets[childId] || { dx: child.x - node.x, dy: child.y - node.y };
        const targetX = positions[parentId].x + restOffset.dx;
        const targetY = positions[parentId].y + restOffset.dy;

        const currentPos = positions[childId] || { x: child.x, y: child.y };
        const vel = velocities[childId] || { vx: 0, vy: 0 };

        const ax = (targetX - currentPos.x) * SPRING_STIFFNESS;
        const ay = (targetY - currentPos.y) * SPRING_STIFFNESS;

        const newVx = (vel.vx + ax) * DAMPING;
        const newVy = (vel.vy + ay) * DAMPING;

        const newX = currentPos.x + newVx;
        const newY = currentPos.y + newVy;

        positions[childId] = { x: newX, y: newY };
        velocities[childId] = { vx: newVx, vy: newVy };

        if (Math.abs(newVx) > VELOCITY_THRESHOLD || Math.abs(newVy) > VELOCITY_THRESHOLD) {
          hasActiveVelocity = true;
        } else {
          velocities[childId] = { vx: 0, vy: 0 };
        }

        moves.push({ nodeId: childId, x: newX, y: newY });

        updateChildren(childId);
      });
    };

    if (draggingNodeId && mindMap.nodes[draggingNodeId]) {
      const node = mindMap.nodes[draggingNodeId];
      positions[draggingNodeId] = { x: node.x, y: node.y };
      updateChildren(draggingNodeId);
    }

    if (moves.length > 0) {
      onMoveNodes(moves);
    }

    return hasActiveVelocity || isDragging;
  }, [mindMap, draggingNodeId, isDragging, onMoveNodes]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mindMap) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.width / dpr;
    const cssHeight = canvas.height / dpr;

    ctx.save();

    ctx.fillStyle = '#1e1e2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gridSize = 40 * scale * dpr;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const offsetModX = ((offset.x * dpr) % gridSize + gridSize) % gridSize;
    const offsetModY = ((offset.y * dpr) % gridSize + gridSize) % gridSize;
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

    const centerX = cssWidth / 2 + offset.x;
    const centerY = cssHeight / 2 + offset.y;
    ctx.translate(centerX * dpr, centerY * dpr);

    const positions = localPositionsRef.current;

    const nodes = Object.values(mindMap.nodes);
    const newBounds: Record<string, NodeBounds> = {};

    const connections: Array<{ from: MindMapNode; to: MindMapNode; fromX: number; fromY: number; toX: number; toY: number }> = [];
    nodes.forEach((node) => {
      if (node.parentId && mindMap.nodes[node.parentId]) {
        const fromNode = mindMap.nodes[node.parentId];
        const fromPos = positions[node.parentId] || { x: fromNode.x, y: fromNode.y };
        const toPos = positions[node.id] || { x: node.x, y: node.y };
        connections.push({
          from: fromNode,
          to: node,
          fromX: fromPos.x * scale * dpr,
          fromY: fromPos.y * scale * dpr,
          toX: toPos.x * scale * dpr,
          toY: toPos.y * scale * dpr
        });
      }
    });

    connections.forEach(({ fromX, fromY, toX, toY, from, to }) => {
      const isHovered =
        (hoveredConnection?.from === from.id && hoveredConnection?.to === to.id) ||
        (hoveredConnection?.from === to.id && hoveredConnection?.to === from.id);
      drawConnection(ctx, fromX, fromY, toX, toY, scale * dpr, isHovered);
    });

    const sortedNodes = [...nodes].sort((a, b) => {
      if (a.id === selectedNodeId) return 1;
      if (b.id === selectedNodeId) return -1;
      return 0;
    });

    sortedNodes.forEach((node) => {
      const pos = positions[node.id] || { x: node.x, y: node.y };
      const px = pos.x * scale * dpr;
      const py = pos.y * scale * dpr;

      const bounds = measureNode(ctx, node, scale * dpr);
      newBounds[node.id] = {
        x: px - bounds.width / 2,
        y: py - bounds.height / 2,
        width: bounds.width,
        height: bounds.height
      };

      drawNode(
        ctx,
        node,
        px,
        py,
        scale * dpr,
        node.id === selectedNodeId,
        node.id === hoveredNodeId
      );
    });

    setNodeBounds(newBounds);

    users.forEach((user) => {
      if (user.id !== currentUserId && cursors[user.id]) {
        const cursor = cursors[user.id];
        const cx = cursor.x * scale * dpr;
        const cy = cursor.y * scale * dpr;
        const s = scale * dpr;

        ctx.fillStyle = user.color;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + 12 * s, cy + 18 * s);
        ctx.lineTo(cx + 6 * s, cy + 22 * s);
        ctx.lineTo(cx - 2 * s, cy + 12 * s);
        ctx.closePath();
        ctx.fill();

        ctx.font = `${Math.max(10, 12 * s)}px sans-serif`;
        const textWidth = ctx.measureText(user.nickname).width;
        const tagWidth = textWidth + 12 * s;
        const tagHeight = 20 * s;
        const tagX = cx + 8 * s;
        const tagY = cy + 22 * s;

        ctx.fillStyle = user.color;
        drawRoundedRect(ctx, tagX, tagY, tagWidth, tagHeight, 4 * s);
        ctx.fill();

        ctx.fillStyle = getContrastTextColor(user.color);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(user.nickname, tagX + 6 * s, tagY + tagHeight / 2);
      }
    });

    ctx.restore();

    const shouldContinue = physicsStep();
    if (shouldContinue) {
      animationFrameRef.current = requestAnimationFrame(render);
    } else {
      animationFrameRef.current = undefined;
    }
  }, [mindMap, selectedNodeId, hoveredNodeId, hoveredConnection, scale, offset, users, currentUserId, cursors, measureNode, drawConnection, drawNode, physicsStep]);

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
      render();
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(render);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    };
  }, [render]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const world = screenToWorld(x, y);

    const dpr = window.devicePixelRatio || 1;
    const canvasCtx = canvasRef.current.getContext('2d');
    let clickedNodeId: string | null = null;

    if (canvasCtx) {
      const canvasCenterX = canvasRef.width / dpr / 2;
      const canvasCenterY = canvasRef.height / dpr / 2;
      const positions = localPositionsRef.current;

      const sortedNodes = Object.values(mindMap.nodes).sort((a, b) => {
        const levelA = a.parentId ? 1 : 0;
        const levelB = b.parentId ? 1 : 0;
        return levelB - levelA;
      });

      for (const node of sortedNodes) {
        const pos = positions[node.id] || { x: node.x, y: node.y };
        const bounds = measureNode(canvasCtx, node, scale);
        const screenBounds = {
          left: canvasCenterX + offset.x + pos.x * scale - bounds.width / 2,
          right: canvasCenterX + offset.x + pos.x * scale + bounds.width / 2,
          top: canvasCenterY + offset.y + pos.y * scale - bounds.height / 2,
          bottom: canvasCenterY + offset.y + pos.y * scale + bounds.height / 2
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

        const velocities = velocitiesRef.current;
        const offsets = restOffsetsRef.current;
        const positions = localPositionsRef.current;

        const collectChildren = (parentId: string) => {
          const parent = mindMap.nodes[parentId];
          if (!parent) return;
          parent.children.forEach((childId) => {
            const child = mindMap.nodes[childId];
            if (child) {
              velocities[childId] = { vx: 0, vy: 0 };
              if (node) {
                offsets[childId] = { dx: child.x - node.x, dy: child.y - node.y };
              }
              positions[childId] = { x: child.x, y: child.y };
              collectChildren(childId);
            }
          });
        };
        collectChildren(clickedNodeId);
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

      localPositionsRef.current[draggingNodeId] = { x: targetX, y: targetY };
      onMoveNodes([{ nodeId: draggingNodeId, x: targetX, y: targetY }]);

      if (!animationFrameRef.current) {
        animationFrameRef.current = requestAnimationFrame(render);
      }
    } else if (isPanning) {
      setOffset({
        x: offsetStart.x + (x - panStart.x),
        y: offsetStart.y + (y - panStart.y)
      });
    } else {
      const canvasCtx = canvasRef.current.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      if (canvasCtx) {
        const canvasCenterX = canvasRef.current.width / dpr / 2;
        const canvasCenterY = canvasRef.current.height / dpr / 2;
        const positions = localPositionsRef.current;

        let hoveredNode: string | null = null;
        const sortedNodes = Object.values(mindMap.nodes);
        for (const node of sortedNodes) {
          const pos = positions[node.id] || { x: node.x, y: node.y };
          const bounds = measureNode(canvasCtx, node, scale);
          const screenBounds = {
            left: canvasCenterX + offset.x + pos.x * scale - bounds.width / 2,
            right: canvasCenterX + offset.x + pos.x * scale + bounds.width / 2,
            top: canvasCenterY + offset.y + pos.y * scale - bounds.height / 2,
            bottom: canvasCenterY + offset.y + pos.y * scale + bounds.height / 2
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
            const fromPos = positions[node.parentId] || { x: fromNode.x, y: fromNode.y };
            const toPos = positions[node.id] || { x: node.x, y: node.y };
            const fromX = canvasCenterX + offset.x + fromPos.x * scale;
            const fromY = canvasCenterY + offset.y + fromPos.y * scale;
            const toX = canvasCenterX + offset.x + toPos.x * scale;
            const toY = canvasCenterY + offset.y + toPos.y * scale;
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

  const handleCanvasMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
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
    const dpr = window.devicePixelRatio || 1;
    if (!canvasCtx) return;

    const canvasCenterX = canvasRef.current.width / dpr / 2;
    const canvasCenterY = canvasRef.current.height / dpr / 2;
    const positions = localPositionsRef.current;
    const sortedNodes = Object.values(mindMap.nodes);

    for (const node of sortedNodes) {
      const pos = positions[node.id] || { x: node.x, y: node.y };
      const bounds = measureNode(canvasCtx, node, scale);
      const screenBounds = {
        left: canvasCenterX + offset.x + pos.x * scale - bounds.width / 2,
        right: canvasCenterX + offset.x + pos.x * scale + bounds.width / 2,
        top: canvasCenterY + offset.y + pos.y * scale - bounds.height / 2,
        bottom: canvasCenterY + offset.y + pos.y * scale + bounds.height / 2
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
