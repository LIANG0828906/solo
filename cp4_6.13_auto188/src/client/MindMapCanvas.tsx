import { useRef, useEffect, useState, useCallback } from 'react';
import type { MindMapNode, NodeMap } from './types';

interface MindMapCanvasProps {
  nodes: NodeMap;
  rootId: string;
  onNodeUpdate: (node: MindMapNode) => void;
}

interface NodePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

const NODE_PADDING_X = 20;
const NODE_PADDING_Y = 12;
const NODE_HEIGHT = 44;
const ANIMATION_DURATION = 300;
const ICONS = ['💡', '⭐', '🚩', '❓', '✅'];

function getNodeColor(level: number): { start: string; end: string } {
  const colors = [
    { start: '#667eea', end: '#764ba2' },
    { start: '#7c8cf0', end: '#8b5bb0' },
    { start: '#929af2', end: '#a06bbe' },
    { start: '#a8a9f4', end: '#b57bcd' },
    { start: '#beb7f6', end: '#ca8cdc' },
    { start: '#d4c5f8', end: '#df9cea' },
  ];
  return colors[Math.min(level, colors.length - 1)];
}

function measureText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): number {
  let width = ctx.measureText(text).width;
  if (width > maxWidth) {
    width = maxWidth;
  }
  return width;
}

function truncateText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let result = text;
  while (result.length > 1 && ctx.measureText(result + '...').width > maxWidth) {
    result = result.slice(0, -1);
  }
  return result + '...';
}

export function MindMapCanvas({ nodes, rootId, onNodeUpdate }: MindMapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [bubblePosition, setBubblePosition] = useState({ x: 0, y: 0 });
  const [editText, setEditText] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editIcon, setEditIcon] = useState<string | undefined>(undefined);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const targetPositionsRef = useRef<Map<string, NodePosition>>(new Map());
  const currentPositionsRef = useRef<Map<string, NodePosition>>(new Map());
  const animationFrameRef = useRef<number>(0);
  const animatingRef = useRef<boolean>(false);
  const animationStartTimeRef = useRef<number>(0);

  const getNodeAt = useCallback(
    (x: number, y: number): string | null => {
      const positions = currentPositionsRef.current;
      for (const [nodeId, pos] of Array.from(positions.entries()).reverse()) {
        if (
          x >= pos.x - pos.width / 2 &&
          x <= pos.x + pos.width / 2 &&
          y >= pos.y - pos.height / 2 &&
          y <= pos.y + pos.height / 2
        ) {
          return nodeId;
        }
      }
      return null;
    },
    []
  );

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    }

    ctx.clearRect(0, 0, rect.width, rect.height);

    const positions = currentPositionsRef.current;

    const allNodes = Array.from(nodes.values());
    for (const node of allNodes) {
      if (node.parentId) {
        const parentPos = positions.get(node.parentId);
        const childPos = positions.get(node.id);
        if (parentPos && childPos) {
          ctx.beginPath();
          ctx.strokeStyle = '#aaa';
          ctx.lineWidth = 2;

          const startX = parentPos.x + parentPos.width / 2;
          const startY = parentPos.y;
          const endX = childPos.x - childPos.width / 2;
          const endY = childPos.y;

          const controlX1 = startX + (endX - startX) * 0.5;
          const controlY1 = startY;
          const controlX2 = startX + (endX - startX) * 0.5;
          const controlY2 = endY;

          ctx.moveTo(startX, startY);
          ctx.bezierCurveTo(controlX1, controlY1, controlX2, controlY2, endX, endY);
          ctx.stroke();
        }
      }
    }

    for (const node of allNodes) {
      const pos = positions.get(node.id);
      if (!pos) continue;

      const isDragging = draggingNodeId === node.id;
      const scale = isDragging ? 1.1 : 1;
      const w = pos.width * scale;
      const h = pos.height * scale;
      const x = pos.x;
      const y = pos.y;

      const color = getNodeColor(node.level);
      const gradient = ctx.createLinearGradient(x - w / 2, y - h / 2, x + w / 2, y + h / 2);
      gradient.addColorStop(0, color.start);
      gradient.addColorStop(1, color.end);

      if (isDragging) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 16;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;
      } else {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
      }

      const radius = 8;
      ctx.beginPath();
      ctx.roundRect(x - w / 2, y - h / 2, w, h, radius);
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#fff';
      ctx.font = '500 14px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const displayText = truncateText(ctx, node.text, w - NODE_PADDING_X * 2 - (node.icon ? 28 : 0));
      const textX = node.icon ? x + 10 : x;
      ctx.fillText(displayText, textX, y);

      if (node.icon) {
        ctx.font = '16px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.icon, x - w / 2 + NODE_PADDING_X + 4, y);
      }
    }
  }, [nodes, draggingNodeId]);

  const updateNodePositions = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.font = '500 14px -apple-system, BlinkMacSystemFont, sans-serif';

    const newTargets = new Map<string, NodePosition>();
    const allNodes = Array.from(nodes.values());

    for (const node of allNodes) {
      const textWidth = measureText(ctx, node.text, 180);
      const iconWidth = node.icon ? 28 : 0;
      const width = textWidth + NODE_PADDING_X * 2 + iconWidth;

      newTargets.set(node.id, {
        x: node.x,
        y: node.y,
        width,
        height: NODE_HEIGHT,
      });
    }

    targetPositionsRef.current = newTargets;

    if (currentPositionsRef.current.size === 0) {
      currentPositionsRef.current = new Map(newTargets);
    }

    animatingRef.current = true;
    animationStartTimeRef.current = performance.now();
  }, [nodes]);

  const animate = useCallback(
    (timestamp: number) => {
      if (!animatingRef.current) {
        drawCanvas();
        return;
      }

      const elapsed = timestamp - animationStartTimeRef.current;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      const targets = targetPositionsRef.current;
      const currents = currentPositionsRef.current;

      for (const [nodeId, target] of targets) {
        const current = currents.get(nodeId);
        if (current) {
          current.x = current.x + (target.x - current.x) * easeProgress;
          current.y = current.y + (target.y - current.y) * easeProgress;
          current.width = current.width + (target.width - current.width) * easeProgress;
          current.height = current.height + (target.height - current.height) * easeProgress;
        } else {
          currents.set(nodeId, { ...target });
        }
      }

      drawCanvas();

      if (progress < 1 || draggingNodeId) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        animatingRef.current = false;
      }
    },
    [drawCanvas, draggingNodeId]
  );

  useEffect(() => {
    updateNodePositions();
  }, [updateNodePositions]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [animate]);

  useEffect(() => {
    const handleResize = () => {
      drawCanvas();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawCanvas]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const nodeId = getNodeAt(x, y);
      if (nodeId) {
        const node = nodes.get(nodeId);
        if (node) {
          setDraggingNodeId(nodeId);
          const pos = currentPositionsRef.current.get(nodeId);
          if (pos) {
            setDragOffset({ x: x - pos.x, y: y - pos.y });
          }
        }
      } else {
        setSelectedNodeId(null);
      }
    },
    [getNodeAt, nodes]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!draggingNodeId) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - dragOffset.x;
      const y = e.clientY - rect.top - dragOffset.y;

      const pos = currentPositionsRef.current.get(draggingNodeId);
      if (pos) {
        pos.x = x;
        pos.y = y;
      }

      const targetPos = targetPositionsRef.current.get(draggingNodeId);
      if (targetPos) {
        targetPos.x = x;
        targetPos.y = y;
      }

      drawCanvas();
    },
    [draggingNodeId, dragOffset, drawCanvas]
  );

  const handleMouseUp = useCallback(() => {
    if (draggingNodeId) {
      const node = nodes.get(draggingNodeId);
      const pos = currentPositionsRef.current.get(draggingNodeId);
      if (node && pos) {
        const updatedNode = { ...node, x: pos.x, y: pos.y };
        onNodeUpdate(updatedNode);
      }
      setDraggingNodeId(null);
    }
  }, [draggingNodeId, nodes, onNodeUpdate]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (draggingNodeId) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const nodeId = getNodeAt(x, y);
      if (nodeId) {
        const node = nodes.get(nodeId);
        if (node) {
          setSelectedNodeId(nodeId);
          setEditText(node.text);
          setEditNote(node.note || '');
          setEditIcon(node.icon);

          const pos = currentPositionsRef.current.get(nodeId);
          if (pos) {
            setBubblePosition({
              x: pos.x + pos.width / 2 + 16,
              y: pos.y - pos.height / 2,
            });
          }
        }
      }
    },
    [getNodeAt, nodes, draggingNodeId]
  );

  const handleBubbleClose = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleBubbleSave = useCallback(() => {
    if (selectedNodeId) {
      const node = nodes.get(selectedNodeId);
      if (node) {
        const updatedNode = {
          ...node,
          text: editText,
          note: editNote || undefined,
          icon: editIcon,
        };
        onNodeUpdate(updatedNode);
      }
    }
    setSelectedNodeId(null);
  }, [selectedNodeId, nodes, editText, editNote, editIcon, onNodeUpdate]);

  const handleNoteChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditNote(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  }, []);

  const selectedNode = selectedNodeId ? nodes.get(selectedNodeId) : null;

  return (
    <div className="canvas-container" ref={containerRef}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
      />
      {selectedNode && (
        <div
          className="node-bubble"
          style={{ left: bubblePosition.x, top: bubblePosition.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bubble-title">编辑节点</div>
          <input
            className="bubble-input"
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="节点文字"
            autoFocus
          />
          <textarea
            className="bubble-textarea"
            value={editNote}
            onChange={handleNoteChange}
            placeholder="添加备注..."
          />
          <div className="bubble-title" style={{ fontSize: '13px', marginBottom: '6px' }}>
            选择图标
          </div>
          <div className="icon-selector">
            {ICONS.map((icon) => (
              <button
                key={icon}
                className={`icon-btn ${editIcon === icon ? 'active' : ''}`}
                onClick={() => setEditIcon(editIcon === icon ? undefined : icon)}
                type="button"
              >
                {icon}
              </button>
            ))}
          </div>
          <div className="bubble-actions">
            <button className="btn btn-secondary" onClick={handleBubbleClose}>
              取消
            </button>
            <button className="btn btn-primary" onClick={handleBubbleSave}>
              保存
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
