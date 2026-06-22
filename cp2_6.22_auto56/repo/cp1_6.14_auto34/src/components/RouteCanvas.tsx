import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  drawNode,
  drawArrow,
  drawGrid,
  drawConnectionPreview,
  hitTestNode,
  hitTestConnectionHandle,
  screenToWorld,
  worldToScreen,
  findNearestNode,
  NODE_WIDTH,
  NODE_HEIGHT,
} from '@/utils/canvasHelpers';
import { NodeDragState, ConnectionDragState, DirtyRect } from '@/types';
import { UseRouteStateReturn } from '@/hooks/useRouteState';

const TARGET_FPS = 30;
const FRAME_INTERVAL = 1000 / TARGET_FPS;
const DIRTY_PADDING = 20;

interface RouteCanvasProps {
  routeState: UseRouteStateReturn;
  onNodeDragStart?: (nodeId: string) => void;
}

export const RouteCanvas: React.FC<RouteCanvasProps> = ({
  routeState,
  onNodeDragStart,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);
  const pulsePhaseRef = useRef(0);
  const dirtyRectsRef = useRef<DirtyRect[]>([]);
  const isDirtyRef = useRef(true);

  const stateRef = useRef({
    panX: 0,
    panY: 0,
    scale: 1,
    selectedNodeId: null as string | null,
    hoveredConnectionId: null as string | null,
    nodeDrag: { isDragging: false, nodeId: null as string | null, offsetX: 0, offsetY: 0 },
    connectionDrag: { isDragging: false, fromNodeId: null as string | null, currentX: 0, currentY: 0 },
    isPanning: false,
    lastPanX: 0,
    lastPanY: 0,
  });

  const {
    nodes,
    connections,
    scale,
    panX,
    panY,
    selectedNodeId,
    setScale,
    setPanX,
    setPanY,
    setSelectedNodeId,
    getDayColorForNode,
    updateNodePosition,
    addConnection,
    addNode,
  } = routeState;

  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPos, setLastPanPos] = useState({ x: 0, y: 0 });
  const [nodeDragState, setNodeDragState] = useState<NodeDragState>({
    isDragging: false,
    nodeId: null,
    offsetX: 0,
    offsetY: 0,
  });
  const [connectionDragState, setConnectionDragState] = useState<ConnectionDragState>({
    isDragging: false,
    fromNodeId: null,
    currentX: 0,
    currentY: 0,
  });
  const [hoveredConnectionId, setHoveredConnectionId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addDialogPos, setAddDialogPos] = useState({ x: 0, y: 0 });
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeDesc, setNewNodeDesc] = useState('');

  stateRef.current = {
    panX,
    panY,
    scale,
    selectedNodeId,
    hoveredConnectionId,
    nodeDrag: nodeDragState,
    connectionDrag: connectionDragState,
    isPanning,
    lastPanX: lastPanPos.x,
    lastPanY: lastPanPos.y,
  };

  const markDirty = useCallback((x: number, y: number, w: number, h: number) => {
    dirtyRectsRef.current.push({
      x: Math.max(0, x - DIRTY_PADDING),
      y: Math.max(0, y - DIRTY_PADDING),
      width: w + DIRTY_PADDING * 2,
      height: h + DIRTY_PADDING * 2,
    });
    isDirtyRef.current = true;
  }, []);

  const markFullDirty = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      dirtyRectsRef.current = [{ x: 0, y: 0, width: canvas.width, height: canvas.height }];
    }
    isDirtyRef.current = true;
  }, []);

  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const st = stateRef.current;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#FAF7F2';
    ctx.fillRect(0, 0, width, height);

    drawGrid(ctx, width, height, st.panX, st.panY, st.scale);

    for (const connection of connections) {
      const fromNode = nodes.find((n) => n.id === connection.fromNodeId);
      const toNode = nodes.find((n) => n.id === connection.toNodeId);
      if (!fromNode || !toNode) continue;

      const fromScreen = worldToScreen(fromNode.x, fromNode.y, st.panX, st.panY, st.scale);
      const toScreen = worldToScreen(toNode.x, toNode.y, st.panX, st.panY, st.scale);

      const lineWidth = st.hoveredConnectionId === connection.id ? 3 : 1.5;
      const showDistance = st.hoveredConnectionId === connection.id || connection.isHighlighted;

      drawArrow(
        ctx,
        fromScreen.x,
        fromScreen.y,
        toScreen.x,
        toScreen.y,
        connection.highlightColor || '#6B7F5E',
        lineWidth,
        connection.isHighlighted,
        showDistance,
        connection.distance
      );
    }

    if (st.connectionDrag.isDragging && st.connectionDrag.fromNodeId) {
      const fromNode = nodes.find((n) => n.id === st.connectionDrag.fromNodeId);
      if (fromNode) {
        const fromScreen = worldToScreen(fromNode.x, fromNode.y, st.panX, st.panY, st.scale);
        const nearestNode = findNearestNode(
          st.connectionDrag.currentX,
          st.connectionDrag.currentY,
          nodes,
          st.connectionDrag.fromNodeId,
          st.panX,
          st.panY,
          st.scale
        );
        const snapColor = nearestNode ? getDayColorForNode(nearestNode.id) : undefined;
        drawConnectionPreview(
          ctx,
          fromScreen.x + (NODE_WIDTH * st.scale) / 2,
          fromScreen.y,
          nearestNode
            ? worldToScreen(nearestNode.x, nearestNode.y, st.panX, st.panY, st.scale).x
            : st.connectionDrag.currentX,
          nearestNode
            ? worldToScreen(nearestNode.x, nearestNode.y, st.panX, st.panY, st.scale).y
            : st.connectionDrag.currentY,
          !!nearestNode,
          snapColor
        );
      }
    }

    for (const node of nodes) {
      const dayColor = getDayColorForNode(node.id);
      drawNode(
        ctx,
        node,
        st.panX,
        st.panY,
        st.scale,
        st.selectedNodeId === node.id,
        pulsePhaseRef.current,
        dayColor
      );
    }

    dirtyRectsRef.current = [];
    isDirtyRef.current = false;
  }, [nodes, connections, getDayColorForNode]);

  useEffect(() => {
    const animate = (time: number) => {
      const delta = time - lastFrameTimeRef.current;
      if (delta >= FRAME_INTERVAL) {
        lastFrameTimeRef.current = time - (delta % FRAME_INTERVAL);
        pulsePhaseRef.current += 0.05 * (delta / FRAME_INTERVAL);
        renderFrame();
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [renderFrame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
      markFullDirty();
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [markFullDirty]);

  useEffect(() => {
    markFullDirty();
  }, [nodes, connections, scale, panX, panY, selectedNodeId, hoveredConnectionId, connectionDragState, markFullDirty]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getMousePos(e);

    for (const node of nodes) {
      if (selectedNodeId === node.id && hitTestConnectionHandle(x, y, node, panX, panY, scale)) {
        setConnectionDragState({ isDragging: true, fromNodeId: node.id, currentX: x, currentY: y });
        return;
      }
    }

    for (const node of nodes) {
      if (hitTestNode(x, y, node, panX, panY, scale)) {
        const worldPos = screenToWorld(x, y, panX, panY, scale);
        setNodeDragState({ isDragging: true, nodeId: node.id, offsetX: worldPos.x - node.x, offsetY: worldPos.y - node.y });
        setSelectedNodeId(node.id);
        onNodeDragStart?.(node.id);
        const screenPos = worldToScreen(node.x, node.y, panX, panY, scale);
        markDirty(screenPos.x - NODE_WIDTH * scale, screenPos.y - NODE_HEIGHT * scale, NODE_WIDTH * scale * 2, NODE_HEIGHT * scale * 2);
        return;
      }
    }

    setIsPanning(true);
    setLastPanPos({ x, y });
    setSelectedNodeId(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getMousePos(e);

    if (connectionDragState.isDragging) {
      setConnectionDragState((prev) => ({ ...prev, currentX: x, currentY: y }));
      return;
    }

    if (nodeDragState.isDragging && nodeDragState.nodeId) {
      const worldPos = screenToWorld(x, y, panX, panY, scale);
      const node = nodes.find((n) => n.id === nodeDragState.nodeId);
      if (node) {
        const oldScreen = worldToScreen(node.x, node.y, panX, panY, scale);
        markDirty(oldScreen.x - NODE_WIDTH * scale - 10, oldScreen.y - NODE_HEIGHT * scale - 10, NODE_WIDTH * scale + 20, NODE_HEIGHT * scale + 20);
      }
      updateNodePosition(nodeDragState.nodeId, worldPos.x - nodeDragState.offsetX, worldPos.y - nodeDragState.offsetY);
      if (node) {
        const newScreen = worldToScreen(node.x, node.y, panX, panY, scale);
        markDirty(newScreen.x - NODE_WIDTH * scale - 10, newScreen.y - NODE_HEIGHT * scale - 10, NODE_WIDTH * scale + 20, NODE_HEIGHT * scale + 20);
      }
      return;
    }

    if (isPanning) {
      const dx = x - lastPanPos.x;
      const dy = y - lastPanPos.y;
      setPanX((prev) => prev + dx);
      setPanY((prev) => prev + dy);
      setLastPanPos({ x, y });
      return;
    }

    let foundConnection: string | null = null;
    for (const connection of connections) {
      const fromNode = nodes.find((n) => n.id === connection.fromNodeId);
      const toNode = nodes.find((n) => n.id === connection.toNodeId);
      if (!fromNode || !toNode) continue;

      const fromScreen = worldToScreen(fromNode.x, fromNode.y, panX, panY, scale);
      const toScreen = worldToScreen(toNode.x, toNode.y, panX, panY, scale);

      const lineLength = Math.sqrt(
        Math.pow(toScreen.x - fromScreen.x, 2) + Math.pow(toScreen.y - fromScreen.y, 2)
      );
      if (lineLength === 0) continue;
      const t = Math.max(0, Math.min(1, ((x - fromScreen.x) * (toScreen.x - fromScreen.x) + (y - fromScreen.y) * (toScreen.y - fromScreen.y)) / (lineLength * lineLength)));
      const closestX = fromScreen.x + t * (toScreen.x - fromScreen.x);
      const closestY = fromScreen.y + t * (toScreen.y - fromScreen.y);
      const distance = Math.sqrt(Math.pow(x - closestX, 2) + Math.pow(y - closestY, 2));

      if (distance < 10) {
        foundConnection = connection.id;
        break;
      }
    }
    setHoveredConnectionId(foundConnection);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getMousePos(e);

    if (connectionDragState.isDragging && connectionDragState.fromNodeId) {
      const nearestNode = findNearestNode(x, y, nodes, connectionDragState.fromNodeId, panX, panY, scale);
      if (nearestNode) {
        addConnection(connectionDragState.fromNodeId, nearestNode.id);
      }
    }

    setNodeDragState({ isDragging: false, nodeId: null, offsetX: 0, offsetY: 0 });
    setConnectionDragState({ isDragging: false, fromNodeId: null, currentX: 0, currentY: 0 });
    setIsPanning(false);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getMousePos(e);
    for (const node of nodes) {
      if (hitTestNode(x, y, node, panX, panY, scale)) return;
    }
    const worldPos = screenToWorld(x, y, panX, panY, scale);
    setAddDialogPos({ x, y });
    setShowAddDialog(true);
    setNewNodeName('');
    setNewNodeDesc('');
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { x, y } = getMousePos(e);
    const worldPosBefore = screenToWorld(x, y, panX, panY, scale);
    const newScale = Math.max(0.3, Math.min(3, scale - e.deltaY * 0.001));
    const worldPosAfter = screenToWorld(x, y, panX, panY, newScale);
    setScale(newScale);
    setPanX(panX + (worldPosAfter.x - worldPosBefore.x) * newScale);
    setPanY(panY + (worldPosAfter.y - worldPosBefore.y) * newScale);
  };

  const handleAddNode = () => {
    if (!newNodeName.trim()) return;
    const worldPos = screenToWorld(addDialogPos.x, addDialogPos.y, panX, panY, scale);
    addNode(worldPos.x, worldPos.y, newNodeName.trim(), newNodeDesc.trim());
    setShowAddDialog(false);
    setNewNodeName('');
    setNewNodeDesc('');
  };

  const handleDragStart = (e: React.DragEvent<HTMLCanvasElement>) => {
    if (!selectedNodeId) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('application/travel-node', JSON.stringify({
      type: 'canvas-node',
      nodeId: selectedNodeId,
    }));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      <canvas
        ref={canvasRef}
        className="cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
        onDragStart={handleDragStart}
        draggable={!!selectedNodeId}
      />

      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => setScale((s) => Math.min(3, s + 0.2))}
          className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg text-[#4A3728] hover:bg-white transition-all flex items-center justify-center text-xl font-light border border-[#E8DCC4]"
        >
          +
        </button>
        <button
          onClick={() => setScale((s) => Math.max(0.3, s - 0.2))}
          className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg text-[#4A3728] hover:bg-white transition-all flex items-center justify-center text-xl font-light border border-[#E8DCC4]"
        >
          −
        </button>
        <button
          onClick={() => { setScale(1); setPanX(0); setPanY(0); }}
          className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg text-[#4A3728] hover:bg-white transition-all flex items-center justify-center text-sm font-medium border border-[#E8DCC4]"
        >
          ⟲
        </button>
      </div>

      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2 text-sm text-[#6B7F5E] border border-[#E8DCC4]">
        缩放: {Math.round(scale * 100)}%
      </div>

      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2 text-xs text-[#8B7355] border border-[#E8DCC4] max-w-xs">
        <p className="font-medium text-[#4A3728] mb-1">操作提示</p>
        <p>• 双击画布添加地点</p>
        <p>• 拖拽节点移动位置</p>
        <p>• 选中节点后拖拽右侧圆点连线</p>
        <p>• 滚轮缩放，空白处拖拽平移</p>
        <p>• 选中节点拖拽到右侧时间轴</p>
      </div>

      {showAddDialog && (
        <div
          className="absolute bg-white rounded-xl shadow-2xl p-4 w-64 border border-[#E8DCC4] z-20"
          style={{ left: Math.min(addDialogPos.x, (canvasRef.current?.width || 300) - 280), top: addDialogPos.y }}
        >
          <h3 className="text-[#4A3728] font-semibold mb-3">添加地点</h3>
          <input
            type="text"
            placeholder="地点名称"
            value={newNodeName}
            onChange={(e) => setNewNodeName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddNode(); }}
            className="w-full px-3 py-2 border border-[#E8DCC4] rounded-lg mb-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B7F5E] focus:border-transparent"
            autoFocus
          />
          <textarea
            placeholder="简短描述"
            value={newNodeDesc}
            onChange={(e) => setNewNodeDesc(e.target.value)}
            className="w-full px-3 py-2 border border-[#E8DCC4] rounded-lg mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6B7F5E] focus:border-transparent resize-none"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddNode}
              className="flex-1 bg-[#6B7F5E] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#5a6b4e] transition-colors"
            >
              添加
            </button>
            <button
              onClick={() => setShowAddDialog(false)}
              className="flex-1 bg-[#E8DCC4] text-[#4A3728] py-2 rounded-lg text-sm font-medium hover:bg-[#d4c7ac] transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
