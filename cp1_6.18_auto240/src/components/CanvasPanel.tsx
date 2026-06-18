import React, { useRef, useEffect, useState, useCallback, MutableRefObject } from 'react';
import { Socket } from 'socket.io-client';
import { useIdeaStore } from '../stores/ideaStore';
import { IdeaNode, NODE_RADIUS, MAGNETIC_DISTANCE } from '../types';
import axios from 'axios';

interface CanvasPanelProps {
  onNodeDoubleClick: (node: IdeaNode) => void;
  userId: string;
  socketRef: MutableRefObject<Socket | null>;
}

interface DragState {
  isDragging: boolean;
  nodeId: string | null;
  startX: number;
  startY: number;
  nodeStartX: number;
  nodeStartY: number;
}

interface PanState {
  isPanning: boolean;
  startX: number;
  startY: number;
  offsetStartX: number;
  offsetStartY: number;
}

interface SelectState {
  isSelecting: boolean;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

const CanvasPanel: React.FC<CanvasPanelProps> = ({ onNodeDoubleClick, userId, socketRef }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const flowOffsetRef = useRef<number>(0);
  const pulsePhaseRef = useRef<number>(0);

  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    nodeId: null,
    startX: 0,
    startY: 0,
    nodeStartX: 0,
    nodeStartY: 0
  });

  const [panState, setPanState] = useState<PanState>({
    isPanning: false,
    startX: 0,
    startY: 0,
    offsetStartX: 0,
    offsetStartY: 0
  });

  const [selectState, setSelectState] = useState<SelectState>({
    isSelecting: false,
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0
  });

  const [spacePressed, setSpacePressed] = useState(false);
  const [shiftPressed, setShiftPressed] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [tooltipNode, setTooltipNode] = useState<IdeaNode | null>(null);
  const [magneticTargetId, setMagneticTargetId] = useState<string | null>(null);

  const {
    nodes,
    canvas,
    setCanvas,
    updateNode,
    connectNodes,
    selectedNodeIds,
    setSelectedNodeIds,
    editingNodes,
    searchQuery,
    groupNodes,
    toggleCollapse
  } = useIdeaStore();

  const screenToWorld = useCallback(
    (sx: number, sy: number) => {
      return {
        x: (sx - canvas.offsetX) / canvas.scale,
        y: (sy - 60 - canvas.offsetY) / canvas.scale
      };
    },
    [canvas]
  );

  const getNodeAt = useCallback(
    (wx: number, wy: number): IdeaNode | null => {
      const visibleNodes = nodes.filter((n) => {
        if (n.parentGroupId) {
          const parent = nodes.find((p) => p.id === n.parentGroupId);
          return !parent || !parent.isCollapsed;
        }
        return true;
      });

      for (let i = visibleNodes.length - 1; i >= 0; i--) {
        const node = visibleNodes[i];
        const r = node.isGroup ? NODE_RADIUS * 1.5 : NODE_RADIUS;
        const dx = wx - node.x;
        const dy = wy - node.y;
        if (dx * dx + dy * dy <= r * r) {
          return node;
        }
      }
      return null;
    },
    [nodes]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpacePressed(true);
      if (e.shiftKey) setShiftPressed(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpacePressed(false);
      if (!e.shiftKey) setShiftPressed(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      if (spacePressed) {
        setPanState({
          isPanning: true,
          startX: sx,
          startY: sy,
          offsetStartX: canvas.offsetX,
          offsetStartY: canvas.offsetY
        });
        return;
      }

      const world = screenToWorld(sx, sy);
      const node = getNodeAt(world.x, world.y);

      if (node) {
        setDragState({
          isDragging: true,
          nodeId: node.id,
          startX: sx,
          startY: sy,
          nodeStartX: node.x,
          nodeStartY: node.y
        });
      } else if (shiftPressed) {
        setSelectState({
          isSelecting: true,
          startX: sx,
          startY: sy,
          endX: sx,
          endY: sy
        });
        setSelectedNodeIds([]);
      } else {
        setSelectedNodeIds([]);
      }
    },
    [spacePressed, shiftPressed, canvas, screenToWorld, getNodeAt, setSelectedNodeIds]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;

      if (panState.isPanning) {
        const dx = sx - panState.startX;
        const dy = sy - panState.startY;
        setCanvas({
          offsetX: panState.offsetStartX + dx,
          offsetY: panState.offsetStartY + dy
        });
        return;
      }

      if (selectState.isSelecting) {
        setSelectState((prev) => ({ ...prev, endX: sx, endY: sy }));
        const minX = Math.min(selectState.startX, sx);
        const maxX = Math.max(selectState.startX, sx);
        const minY = Math.min(selectState.startY, sy);
        const maxY = Math.max(selectState.startY, sy);

        const w1 = screenToWorld(minX, minY);
        const w2 = screenToWorld(maxX, maxY);

        const selected = nodes
          .filter((n) => !n.isGroup && !n.parentGroupId)
          .filter((n) => n.x >= w1.x && n.x <= w2.x && n.y >= w1.y && n.y <= w2.y)
          .map((n) => n.id);
        setSelectedNodeIds(selected);
        return;
      }

      if (dragState.isDragging && dragState.nodeId) {
        const world = screenToWorld(sx, sy);
        const startWorld = screenToWorld(dragState.startX, dragState.startY);
        const newX = dragState.nodeStartX + (world.x - startWorld.x);
        const newY = dragState.nodeStartY + (world.y - startWorld.y);

        updateNode(dragState.nodeId, { x: newX, y: newY });
        socketRef.current?.emit('node:update', dragState.nodeId, { x: newX, y: newY });

        let nearestTarget: IdeaNode | null = null;
        let nearestDist = Infinity;
        nodes.forEach((n) => {
          if (n.id !== dragState.nodeId && !n.parentGroupId) {
            const dx = n.x - newX;
            const dy = n.y - newY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < MAGNETIC_DISTANCE && dist < nearestDist) {
              nearestDist = dist;
              nearestTarget = n;
            }
          }
        });
        setMagneticTargetId(nearestTarget?.id || null);
        return;
      }

      const world = screenToWorld(sx, sy);
      const hovered = getNodeAt(world.x, world.y);
      setHoveredNodeId(hovered?.id || null);
    },
    [
      panState,
      selectState,
      dragState,
      canvas,
      screenToWorld,
      getNodeAt,
      nodes,
      updateNode,
      setSelectedNodeIds,
      socketRef
    ]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (panState.isPanning) {
        setPanState({ ...panState, isPanning: false });
      }

      if (selectState.isSelecting) {
        setSelectState({ ...selectState, isSelecting: false });
      }

      if (dragState.isDragging && dragState.nodeId) {
        if (magneticTargetId) {
          connectNodes(dragState.nodeId, magneticTargetId);
          socketRef.current?.emit('nodes:connect', dragState.nodeId, magneticTargetId);
        }
        const node = nodes.find((n) => n.id === dragState.nodeId);
        if (node) {
          axios.put(`/api/ideas/${node.id}`, { x: node.x, y: node.y });
        }
        setDragState({ ...dragState, isDragging: false, nodeId: null });
        setMagneticTargetId(null);
      }
    },
    [panState, selectState, dragState, magneticTargetId, nodes, connectNodes, socketRef]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const world = screenToWorld(sx, sy);
      const node = getNodeAt(world.x, world.y);
      if (node) {
        if (node.isGroup) {
          toggleCollapse(node.id);
          socketRef.current?.emit('node:update', node.id, { isCollapsed: !node.isCollapsed });
        } else {
          onNodeDoubleClick(node);
        }
      }
    },
    [screenToWorld, getNodeAt, onNodeDoubleClick, toggleCollapse, socketRef]
  );

  const handleMouseEnter = useCallback(
    (node: IdeaNode) => {
      const timer = setTimeout(() => {
        if (node.description) {
          setTooltipNode(node);
        }
      }, 500);
      return () => clearTimeout(timer);
    },
    []
  );

  const handleMouseLeaveNode = useCallback(() => {
    setTooltipNode(null);
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      const newScale = Math.max(0.5, Math.min(2, canvas.scale + delta));
      setCanvas({ scale: newScale });
    },
    [canvas.scale, setCanvas]
  );

  const handleGroup = useCallback(() => {
    if (selectedNodeIds.length >= 2) {
      const groupId = 'group_' + Date.now();
      groupNodes(selectedNodeIds, groupId);
      socketRef.current?.emit('node:create', {
        id: groupId,
        title: '分组',
        description: '',
        color: '#6C63FF',
        tags: [],
        x: 0,
        y: 0,
        connectedIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isGroup: true,
        groupNodeIds: selectedNodeIds,
        isCollapsed: false
      });
      axios.post('/api/ideas', {
        id: groupId,
        title: '分组',
        description: '',
        color: '#6C63FF',
        tags: [],
        x: 0,
        y: 0,
        connectedIds: [],
        isGroup: true,
        groupNodeIds: selectedNodeIds,
        isCollapsed: false
      });
    }
  }, [selectedNodeIds, groupNodes, socketRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight - 60;
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      flowOffsetRef.current = (flowOffsetRef.current + 0.02) % 1;
      pulsePhaseRef.current = (pulsePhaseRef.current + 0.05) % (Math.PI * 2);
      draw();
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { scale, offsetX, offsetY } = useIdeaStore.getState().canvas;
    const currentNodes = useIdeaStore.getState().nodes;
    const state = useIdeaStore.getState();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    currentNodes.forEach((node) => {
      node.connectedIds.forEach((targetId) => {
        const target = currentNodes.find((n) => n.id === targetId);
        if (!target) return;

        let source = node;
        let sourcePos = { x: node.x, y: node.y };
        let targetPos = { x: target.x, y: target.y };

        if (node.parentGroupId) {
          const parent = currentNodes.find((p) => p.id === node.parentGroupId);
          if (parent?.isCollapsed) {
            sourcePos = { x: parent.x, y: parent.y };
            source = parent;
          }
        }
        if (target.parentGroupId) {
          const parent = currentNodes.find((p) => p.id === target.parentGroupId);
          if (parent?.isCollapsed) {
            targetPos = { x: parent.x, y: parent.y };
          }
        }

        const midX = (sourcePos.x + targetPos.x) / 2;
        const midY = (sourcePos.y + targetPos.y) / 2 - 30;

        ctx.beginPath();
        ctx.strokeStyle = '#95A5A6';
        ctx.lineWidth = 2;
        ctx.moveTo(sourcePos.x, sourcePos.y);
        ctx.quadraticCurveTo(midX, midY, targetPos.x, targetPos.y);
        ctx.stroke();

        const t = flowOffsetRef.current;
        const dotT = t;
        const ox = (1 - dotT) * (1 - dotT) * sourcePos.x + 2 * (1 - dotT) * dotT * midX + dotT * dotT * targetPos.x;
        const oy = (1 - dotT) * (1 - dotT) * sourcePos.y + 2 * (1 - dotT) * dotT * midY + dotT * dotT * targetPos.y;

        ctx.beginPath();
        ctx.fillStyle = '#95A5A6';
        ctx.arc(ox, oy, 4, 0, Math.PI * 2);
        ctx.fill();

        const arrowT = 0.5;
        const ax = (1 - arrowT) * (1 - arrowT) * sourcePos.x + 2 * (1 - arrowT) * arrowT * midX + arrowT * arrowT * targetPos.x;
        const ay = (1 - arrowT) * (1 - arrowT) * sourcePos.y + 2 * (1 - arrowT) * arrowT * midY + arrowT * arrowT * targetPos.y;

        const dx = targetPos.x - sourcePos.x;
        const dy = targetPos.y - sourcePos.y;
        const angle = Math.atan2(dy, dx);

        ctx.save();
        ctx.translate(ax, ay);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.fillStyle = '#95A5A6';
        ctx.moveTo(8, 0);
        ctx.lineTo(-4, -5);
        ctx.lineTo(-4, 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });
    });

    const isSearching = state.searchQuery.trim() !== '';
    const query = state.searchQuery.toLowerCase();
    const matches = (n: IdeaNode) =>
      n.title.toLowerCase().includes(query) || n.tags.some((t) => t.toLowerCase().includes(query));

    currentNodes.forEach((node) => {
      if (node.parentGroupId) {
        const parent = currentNodes.find((p) => p.id === node.parentGroupId);
        if (parent?.isCollapsed) return;
      }

      const isEditing = state.editingNodes.some((e) => e.nodeId === node.id);
      const isSelected = state.selectedNodeIds.includes(node.id);
      const isHovered = hoveredNodeId === node.id;
      const isDragging = dragState.nodeId === node.id;
      const isMagnetic = magneticTargetId === node.id;
      const isMatch = !isSearching || matches(node);

      const opacity = isSearching && !isMatch ? 0.3 : 1;
      const scale = isDragging ? 1.1 : node.isGroup && node.isCollapsed ? 1.5 : node.parentGroupId ? 0.6 : 1;
      const radius = NODE_RADIUS * scale;

      ctx.globalAlpha = isDragging ? 0.85 : opacity;

      if (isEditing) {
        const pulse = 0.6 + 0.4 * Math.sin(pulsePhaseRef.current);
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 193, 7, ${0.6 * pulse})`;
        ctx.lineWidth = 3;
        ctx.arc(node.x, node.y, radius + 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (isSearching && isMatch) {
        ctx.beginPath();
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 15;
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 4;
        ctx.arc(node.x, node.y, radius + 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      if (isMagnetic) {
        const pulseR = 40 + 5 * Math.sin(pulsePhaseRef.current * 2);
        ctx.beginPath();
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(pulsePhaseRef.current * 3));
        ctx.arc(node.x, node.y, pulseR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = isDragging ? 0.85 : opacity;
      }

      if (node.isGroup) {
        ctx.beginPath();
        ctx.fillStyle = node.color + '40';
        ctx.arc(node.x, node.y, radius + 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.strokeStyle = '#6C63FF';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.arc(node.x, node.y, radius + 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.beginPath();
      ctx.shadowColor = node.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = node.color;
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (isSelected) {
        ctx.beginPath();
        ctx.strokeStyle = '#4FC3F7';
        ctx.lineWidth = 2;
        ctx.arc(node.x, node.y, radius + 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (!node.isGroup || !node.isCollapsed) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const displayTitle = node.title.length > 6 ? node.title.slice(0, 6) + '...' : node.title;
        ctx.fillText(displayTitle, node.x, node.y);
      }

      if (!node.parentGroupId && !node.isGroup) {
        ctx.fillStyle = '#E0E0E0';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        const title = node.title;
        const maxChars = 10;
        if (title.length > maxChars) {
          ctx.fillText(title.slice(0, maxChars) + '...', node.x, node.y - radius - 10);
          ctx.fillText(title.slice(maxChars, maxChars * 2) + (title.length > maxChars * 2 ? '...' : ''), node.x, node.y - radius - 24);
        } else {
          ctx.fillText(title, node.x, node.y - radius - 10);
        }
      }

      if (node.isGroup) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.isCollapsed ? '展开' : '折叠', node.x, node.y + radius + 16);
      }

      ctx.globalAlpha = 1;
    });

    if (selectState.isSelecting) {
      const minX = Math.min(selectState.startX, selectState.endX);
      const maxX = Math.max(selectState.startX, selectState.endX);
      const minY = Math.min(selectState.startY, selectState.endY);
      const maxY = Math.max(selectState.startY, selectState.endY);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = 'rgba(79, 195, 247, 0.3)';
      ctx.strokeStyle = 'rgba(79, 195, 247, 0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(minX, minY, maxX - minX, maxY - minY, 4);
      } else {
        ctx.rect(minX, minY, maxX - minX, maxY - minY);
      }
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }, [hoveredNodeId, dragState, magneticTargetId, selectState]);

  useEffect(() => {
    let tooltipTimer: ReturnType<typeof setTimeout>;
    if (hoveredNodeId) {
      const node = nodes.find((n) => n.id === hoveredNodeId);
      if (node && node.description) {
        tooltipTimer = setTimeout(() => setTooltipNode(node), 600);
      }
    } else {
      setTooltipNode(null);
    }
    return () => clearTimeout(tooltipTimer);
  }, [hoveredNodeId, nodes]);

  return (
    <div className="canvas-container" style={{ cursor: spacePressed ? 'grab' : 'default' }}>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
      />

      {tooltipNode && (
        <div
          className="node-tooltip"
          style={{
            left: tooltipNode.x * canvas.scale + canvas.offsetX + 50,
            top: tooltipNode.y * canvas.scale + canvas.offsetY,
            backgroundColor: tooltipNode.color + '99',
            borderColor: tooltipNode.color
          }}
        >
          <div className="tooltip-title">{tooltipNode.title}</div>
          <div className="tooltip-desc">{tooltipNode.description}</div>
        </div>
      )}

      <div className="bottom-bar">
        <div className="canvas-info">
          缩放: {Math.round(canvas.scale * 100)}%
        </div>
        {selectedNodeIds.length >= 2 && (
          <button className="group-btn" onClick={handleGroup}>
            分组 ({selectedNodeIds.length})
          </button>
        )}
        <div className="canvas-hint">
          按住空格键拖拽平移 · 滚轮缩放 · Shift+拖拽多选
        </div>
      </div>
    </div>
  );
};

export default CanvasPanel;
