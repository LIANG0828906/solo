import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { GraphNode, GraphEdge, EdgeType, ToolMode, HistorySnapshot, Collaborator } from './data';
import { v4 as uuidv4 } from 'uuid';

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  toolMode: ToolMode;
  selectedNodeId: string | null;
  collaborators: Collaborator[];
  onNodesChange: (nodes: GraphNode[]) => void;
  onEdgesChange: (edges: GraphEdge[]) => void;
  onSelectNode: (id: string | null) => void;
  onHistoryPush: (snapshot: HistorySnapshot) => void;
  undoRef: React.MutableRefObject<() => void>;
  redoRef: React.MutableRefObject<() => void>;
  jumpToNodeIdRef: React.MutableRefObject<string | null>;
  onExportPNGRef: React.MutableRefObject<() => void>;
}

const NODE_WIDTH = 180;
const NODE_HEIGHT = 90;
const GRID_SIZE = 20;
const EDGE_COLORS: Record<EdgeType, string> = {
  derived: '#4fc3f7',
  dependency: '#ffb74d',
  related: '#81c784'
};
const EDGE_DASHES: Record<EdgeType, number[]> = {
  derived: [],
  dependency: [10, 6],
  related: [2, 4]
};
const EDGE_LABELS: Record<EdgeType, string> = {
  derived: '衍生',
  dependency: '依赖',
  related: '相关'
};

const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes, edges, toolMode, selectedNodeId, collaborators,
  onNodesChange, onEdgesChange, onSelectNode, onHistoryPush,
  undoRef, redoRef, jumpToNodeIdRef, onExportPNGRef
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const flowT = useRef<number>(0);
  const glowPulse = useRef<number>(0);
  const offsetRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const [, forceRender] = useState(0);

  const historyRef = useRef<HistorySnapshot[]>([]);
  const historyIndexRef = useRef(-1);
  const nodesRef = useRef<GraphNode[]>(nodes);
  const edgesRef = useRef<GraphEdge[]>(edges);
  const selectedRef = useRef<string | null>(selectedNodeId);
  const toolRef = useRef<ToolMode>(toolMode);
  const draggingRef = useRef<{
    type: 'node' | 'canvas' | 'edge' | null;
    nodeId?: string;
    startX?: number;
    startY?: number;
    origX?: number;
    origY?: number;
    origOffsetX?: number;
    origOffsetY?: number;
    fromNodeId?: string;
    mouseX?: number;
    mouseY?: number;
  }>({ type: null });
  const newlyCreatedRef = useRef<Set<string>>(new Set());
  const hoveredNodeRef = useRef<string | null>(null);

  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);
  useEffect(() => { selectedRef.current = selectedNodeId; }, [selectedNodeId]);
  useEffect(() => { toolRef.current = toolMode; }, [toolMode]);

  const saveHistory = useCallback(() => {
    const snapshot: HistorySnapshot = {
      nodes: JSON.parse(JSON.stringify(nodesRef.current)),
      edges: JSON.parse(JSON.stringify(edgesRef.current))
    };
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    }
    historyRef.current.push(snapshot);
    if (historyRef.current.length > 50) historyRef.current.shift();
    historyIndexRef.current = historyRef.current.length - 1;
    onHistoryPush(snapshot);
  }, [onHistoryPush]);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const snap = historyRef.current[historyIndexRef.current];
      onNodesChange(JSON.parse(JSON.stringify(snap.nodes)));
      onEdgesChange(JSON.parse(JSON.stringify(snap.edges)));
    }
  }, [onNodesChange, onEdgesChange]);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      const snap = historyRef.current[historyIndexRef.current];
      onNodesChange(JSON.parse(JSON.stringify(snap.nodes)));
      onEdgesChange(JSON.parse(JSON.stringify(snap.edges)));
    }
  }, [onNodesChange, onEdgesChange]);

  useEffect(() => {
    undoRef.current = undo;
    redoRef.current = redo;
  }, [undo, redo, undoRef, redoRef]);

  useEffect(() => {
    if (historyRef.current.length === 0) {
      saveHistory();
    }
  }, []);

  const screenToWorld = (sx: number, sy: number) => ({
    x: (sx - offsetRef.current.x) / scaleRef.current,
    y: (sy - offsetRef.current.y) / scaleRef.current
  });

  const snapToGrid = (v: number) => Math.round(v / GRID_SIZE) * GRID_SIZE;

  const getNodeAt = (wx: number, wy: number): GraphNode | null => {
    for (let i = nodesRef.current.length - 1; i >= 0; i--) {
      const n = nodesRef.current[i];
      if (wx >= n.x && wx <= n.x + NODE_WIDTH && wy >= n.y && wy <= n.y + NODE_HEIGHT) {
        return n;
      }
    }
    return null;
  };

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const grad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) / 1.2);
    grad.addColorStop(0, '#1e1e3a');
    grad.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(offsetRef.current.x, offsetRef.current.y);
    ctx.scale(scaleRef.current, scaleRef.current);

    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1 / scaleRef.current;
    const gs = GRID_SIZE;
    const startX = -offsetRef.current.x / scaleRef.current;
    const startY = -offsetRef.current.y / scaleRef.current;
    const endX = startX + W / scaleRef.current;
    const endY = startY + H / scaleRef.current;
    const gx0 = Math.floor(startX / gs) * gs;
    const gy0 = Math.floor(startY / gs) * gs;
    ctx.beginPath();
    for (let x = gx0; x <= endX; x += gs) {
      ctx.moveTo(x, startY - 10);
      ctx.lineTo(x, endY + 10);
    }
    for (let y = gy0; y <= endY; y += gs) {
      ctx.moveTo(startX - 10, y);
      ctx.lineTo(endX + 10, y);
    }
    ctx.stroke();

    const now = Date.now();
    flowT.current += 0.015;
    glowPulse.current = (Math.sin(now / 1500) + 1) / 2;

    edgesRef.current.forEach(edge => {
      const sNode = nodesRef.current.find(n => n.id === edge.source);
      const tNode = nodesRef.current.find(n => n.id === edge.target);
      if (!sNode || !tNode) return;

      const sx = sNode.x + NODE_WIDTH / 2;
      const sy = sNode.y + NODE_HEIGHT / 2;
      const tx = tNode.x + NODE_WIDTH / 2;
      const ty = tNode.y + NODE_HEIGHT / 2;

      ctx.save();
      ctx.strokeStyle = EDGE_COLORS[edge.type];
      ctx.lineWidth = 2;
      ctx.shadowColor = EDGE_COLORS[edge.type];
      ctx.shadowBlur = 6;
      const dash = EDGE_DASHES[edge.type];
      if (dash.length) ctx.setLineDash(dash);
      ctx.lineDashOffset = -flowT.current * 20;

      ctx.beginPath();
      const mx = (sx + tx) / 2;
      const my = (sy + ty) / 2 - 15;
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(mx, my, tx, ty);
      ctx.stroke();

      if (dash.length) {
        const len = 400;
        const tPos = ((flowT.current * 60) % len) / len;
        const pt = 1 - tPos;
        const dotX = pt * pt * sx + 2 * pt * tPos * mx + tPos * tPos * tx;
        const dotY = pt * pt * sy + 2 * pt * tPos * my + tPos * tPos * ty;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 12;
        ctx.fill();
      }

      const labelX = mx;
      const labelY = my - 6;
      ctx.setLineDash([]);
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      const labelTxt = EDGE_LABELS[edge.type];
      const metrics = ctx.measureText(labelTxt);
      ctx.fillStyle = 'rgba(22, 33, 62, 0.9)';
      ctx.fillRect(labelX - metrics.width / 2 - 5, labelY - 9, metrics.width + 10, 15);
      ctx.fillStyle = EDGE_COLORS[edge.type];
      ctx.shadowBlur = 0;
      ctx.fillText(labelTxt, labelX, labelY);
      ctx.restore();
    });

    if (draggingRef.current.type === 'edge' && draggingRef.current.fromNodeId && draggingRef.current.mouseX !== undefined) {
      const fromNode = nodesRef.current.find(n => n.id === draggingRef.current.fromNodeId);
      if (fromNode) {
        const wp = screenToWorld(draggingRef.current.mouseX, draggingRef.current.mouseY);
        ctx.save();
        ctx.strokeStyle = '#4fc3f7';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.shadowColor = '#4fc3f7';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(fromNode.x + NODE_WIDTH / 2, fromNode.y + NODE_HEIGHT / 2);
        ctx.lineTo(wp.x, wp.y);
        ctx.stroke();
        ctx.restore();
      }
    }

    nodesRef.current.forEach(node => {
      const isSelected = selectedRef.current === node.id;
      const isHovered = hoveredNodeRef.current === node.id;
      const isNew = newlyCreatedRef.current.has(node.id);
      const col = collaborators.find(c => c.activeNodeId === node.id);

      ctx.save();
      const cx = node.x + NODE_WIDTH / 2;
      const cy = node.y + NODE_HEIGHT / 2;
      let animScale = 1;
      if (isNew) {
        const elapsed = now - node.createdAt;
        if (elapsed < 300) {
          animScale = 0.5 + (elapsed / 300) * 0.5;
        } else {
          newlyCreatedRef.current.delete(node.id);
        }
      }
      ctx.translate(cx, cy);
      ctx.scale(animScale, animScale);
      ctx.translate(-cx, -cy);

      const glowStrength = (isSelected ? 0.9 : isHovered ? 0.7 : 0.35 + glowPulse.current * 0.15);
      ctx.shadowColor = node.color;
      ctx.shadowBlur = 12 + glowStrength * 14;

      const r = 12;
      ctx.fillStyle = '#16213e';
      ctx.strokeStyle = node.color;
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.moveTo(node.x + r, node.y);
      ctx.lineTo(node.x + NODE_WIDTH - r, node.y);
      ctx.quadraticCurveTo(node.x + NODE_WIDTH, node.y, node.x + NODE_WIDTH, node.y + r);
      ctx.lineTo(node.x + NODE_WIDTH, node.y + NODE_HEIGHT - r);
      ctx.quadraticCurveTo(node.x + NODE_WIDTH, node.y + NODE_HEIGHT, node.x + NODE_WIDTH - r, node.y + NODE_HEIGHT);
      ctx.lineTo(node.x + r, node.y + NODE_HEIGHT);
      ctx.quadraticCurveTo(node.x, node.y + NODE_HEIGHT, node.x, node.y + NODE_HEIGHT - r);
      ctx.lineTo(node.x, node.y + r);
      ctx.quadraticCurveTo(node.x, node.y, node.x + r, node.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (col) {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = col.color;
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(node.x - 4, node.y - 4, NODE_WIDTH + 8, NODE_HEIGHT + 8);
        ctx.setLineDash([]);
        ctx.fillStyle = col.color;
        ctx.beginPath();
        ctx.arc(node.x + NODE_WIDTH - 8, node.y + 8, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#e0e0e0';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const titleX = node.x + 14;
      const titleY = node.y + 12;
      const maxW = NODE_WIDTH - 28;
      let t = node.title;
      if (ctx.measureText(t).width > maxW) {
        while (ctx.measureText(t + '…').width > maxW && t.length > 1) t = t.slice(0, -1);
        t += '…';
      }
      ctx.fillText(t, titleX, titleY);

      if (node.tags.length > 0) {
        ctx.font = '10px sans-serif';
        ctx.textBaseline = 'bottom';
        let tagX = titleX;
        const tagY = node.y + NODE_HEIGHT - 10;
        node.tags.slice(0, 3).forEach(tag => {
          const tw = ctx.measureText(tag).width;
          if (tagX + tw + 12 > node.x + NODE_WIDTH - 10) return;
          ctx.fillStyle = node.color + '30';
          ctx.fillRect(tagX, tagY - 12, tw + 10, 14);
          ctx.fillStyle = node.color;
          ctx.fillText(tag, tagX + 5, tagY);
          tagX += tw + 16;
        });
      }
      ctx.restore();
    });

    if (draggingRef.current.type === 'node' && draggingRef.current.nodeId) {
      const node = nodesRef.current.find(n => n.id === draggingRef.current.nodeId);
      if (node) {
        ctx.save();
        ctx.strokeStyle = 'rgba(79, 195, 247, 0.4)';
        ctx.lineWidth = 1 / scaleRef.current;
        ctx.setLineDash([4, 4]);
        const wcx = node.x + NODE_WIDTH / 2;
        nodesRef.current.forEach(n => {
          if (n.id === node.id) return;
          const ncx = n.x + NODE_WIDTH / 2;
          if (Math.abs(wcx - ncx) < 8) {
            ctx.beginPath();
            ctx.moveTo(ncx, Math.min(n.y, node.y) - 30);
            ctx.lineTo(ncx, Math.max(n.y, node.y) + NODE_HEIGHT + 30);
            ctx.stroke();
          }
        });
        const wcy = node.y + NODE_HEIGHT / 2;
        nodesRef.current.forEach(n => {
          if (n.id === node.id) return;
          const ncy = n.y + NODE_HEIGHT / 2;
          if (Math.abs(wcy - ncy) < 8) {
            ctx.beginPath();
            ctx.moveTo(Math.min(n.x, node.x) - 30, ncy);
            ctx.lineTo(Math.max(n.x, node.x) + NODE_WIDTH + 30, ncy);
            ctx.stroke();
          }
        });
        ctx.restore();
      }
    }

    ctx.restore();
    animRef.current = requestAnimationFrame(render);
  }, [collaborators]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [render]);

  useEffect(() => {
    if (jumpToNodeIdRef.current) {
      const node = nodes.find(n => n.id === jumpToNodeIdRef.current);
      if (node && canvasRef.current) {
        const W = canvasRef.current.width;
        const H = canvasRef.current.height;
        offsetRef.current.x = W / 2 - (node.x + NODE_WIDTH / 2) * scaleRef.current;
        offsetRef.current.y = H / 2 - (node.y + NODE_HEIGHT / 2) * scaleRef.current;
        forceRender(v => v + 1);
      }
      jumpToNodeIdRef.current = null;
    }
  });

  useEffect(() => {
    onExportPNGRef.current = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `knowledge-graph-${Date.now()}.png`;
      a.click();
    };
  }, [onExportPNGRef]);

  useEffect(() => {
    const onResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = container.clientWidth * dpr;
      canvas.height = container.clientHeight * dpr;
      canvas.style.width = container.clientWidth + 'px';
      canvas.style.height = container.clientHeight + 'px';
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const getMousePos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    const world = screenToWorld(pos.x, pos.y);
    const node = getNodeAt(world.x, world.y);

    if (toolRef.current === 'delete' && node) {
      saveHistory();
      onNodesChange(nodesRef.current.filter(n => n.id !== node.id));
      onEdgesChange(edgesRef.current.filter(ed => ed.source !== node.id && ed.target !== node.id));
      onSelectNode(null);
      return;
    }
    if (toolRef.current === 'delete') {
      if (node) return;
      for (const edge of edgesRef.current) {
        const s = nodesRef.current.find(n => n.id === edge.source);
        const t = nodesRef.current.find(n => n.id === edge.target);
        if (!s || !t) continue;
        const sx = s.x + NODE_WIDTH / 2, sy = s.y + NODE_HEIGHT / 2;
        const tx = t.x + NODE_WIDTH / 2, ty = t.y + NODE_HEIGHT / 2;
        const mx = (sx + tx) / 2, my = (sy + ty) / 2 - 15;
        let minD = Infinity;
        for (let i = 0; i <= 1; i += 0.05) {
          const pt = 1 - i;
          const px = pt * pt * sx + 2 * pt * i * mx + i * i * tx;
          const py = pt * pt * sy + 2 * pt * i * my + i * i * ty;
          const d = Math.hypot(px - world.x, py - world.y);
          if (d < minD) minD = d;
        }
        if (minD < 8 / scaleRef.current) {
          saveHistory();
          onEdgesChange(edgesRef.current.filter(ed => ed.id !== edge.id));
          return;
        }
      }
    }

    if (toolRef.current === 'addNode' && !node) {
      saveHistory();
      const colors = ['#4fc3f7', '#ffb74d', '#81c784', '#ce93d8', '#ef9a9a', '#80cbc4'];
      const newNode: GraphNode = {
        id: uuidv4(),
        title: '新节点',
        description: '',
        tags: [],
        color: colors[Math.floor(Math.random() * colors.length)],
        x: snapToGrid(world.x - NODE_WIDTH / 2),
        y: snapToGrid(world.y - NODE_HEIGHT / 2),
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      newlyCreatedRef.current.add(newNode.id);
      onNodesChange([...nodesRef.current, newNode]);
      onSelectNode(newNode.id);
      return;
    }

    if (toolRef.current === 'connect' && node) {
      draggingRef.current = {
        type: 'edge',
        fromNodeId: node.id,
        mouseX: pos.x,
        mouseY: pos.y
      };
      return;
    }

    if (node) {
      draggingRef.current = {
        type: 'node',
        nodeId: node.id,
        startX: pos.x,
        startY: pos.y,
        origX: node.x,
        origY: node.y
      };
      onSelectNode(node.id);
    } else {
      draggingRef.current = {
        type: 'canvas',
        startX: pos.x,
        startY: pos.y,
        origOffsetX: offsetRef.current.x,
        origOffsetY: offsetRef.current.y
      };
      onSelectNode(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    const world = screenToWorld(pos.x, pos.y);

    const hov = getNodeAt(world.x, world.y);
    hoveredNodeRef.current = hov ? hov.id : null;

    const d = draggingRef.current;
    if (d.type === 'node' && d.nodeId) {
      const dx = (pos.x - (d.startX || 0)) / scaleRef.current;
      const dy = (pos.y - (d.startY || 0)) / scaleRef.current;
      let newX = snapToGrid((d.origX || 0) + dx);
      let newY = snapToGrid((d.origY || 0) + dy);
      onNodesChange(nodesRef.current.map(n => n.id === d.nodeId ? { ...n, x: newX, y: newY, updatedAt: Date.now() } : n));
    } else if (d.type === 'canvas') {
      offsetRef.current.x = (d.origOffsetX || 0) + (pos.x - (d.startX || 0));
      offsetRef.current.y = (d.origOffsetY || 0) + (pos.y - (d.startY || 0));
      forceRender(v => v + 1);
    } else if (d.type === 'edge') {
      d.mouseX = pos.x;
      d.mouseY = pos.y;
    }

    if (toolRef.current === 'addNode' || toolRef.current === 'connect' || toolRef.current === 'delete') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.style.cursor = toolRef.current === 'addNode' ? 'crosshair' : toolRef.current === 'connect' ? 'copy' : 'not-allowed';
    } else if (hov) {
      const canvas = canvasRef.current;
      if (canvas) canvas.style.cursor = 'pointer';
    } else {
      const canvas = canvasRef.current;
      if (canvas) canvas.style.cursor = d.type === 'canvas' ? 'grabbing' : 'grab';
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    const world = screenToWorld(pos.x, pos.y);
    const d = draggingRef.current;

    if (d.type === 'edge' && d.fromNodeId) {
      const target = getNodeAt(world.x, world.y);
      if (target && target.id !== d.fromNodeId) {
        saveHistory();
        const exists = edgesRef.current.some(ed =>
          (ed.source === d.fromNodeId && ed.target === target.id) ||
          (ed.source === target.id && ed.target === d.fromNodeId)
        );
        if (!exists) {
          onEdgesChange([...edgesRef.current, {
            id: uuidv4(),
            source: d.fromNodeId,
            target: target.id,
            type: 'derived',
            createdAt: Date.now()
          }]);
        }
      }
    }
    if (d.type === 'node') {
      saveHistory();
    }
    draggingRef.current = { type: null };
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.2, Math.min(3, scaleRef.current * delta));
    const worldX = (mx - offsetRef.current.x) / scaleRef.current;
    const worldY = (my - offsetRef.current.y) / scaleRef.current;
    scaleRef.current = newScale;
    offsetRef.current.x = mx - worldX * newScale;
    offsetRef.current.y = my - worldY * newScale;
    forceRender(v => v + 1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <canvas ref={canvasRef} style={{ display: 'block', cursor: 'grab', userSelect: 'none' }} />
    </div>
  );
};

export default GraphCanvas;
