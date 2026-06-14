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
import { LocationNode, Connection, NodeDragState, ConnectionDragState } from '@/types';
import { UseRouteStateReturn } from '@/hooks/useRouteState';

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
  const pulsePhaseRef = useRef(0);

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

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#FAF7F2';
    ctx.fillRect(0, 0, width, height);

    drawGrid(ctx, width, height, panX, panY, scale);

    for (const connection of connections) {
      const fromNode = nodes.find((n) => n.id === connection.fromNodeId);
      const toNode = nodes.find((n) => n.id === connection.toNodeId);

      if (!fromNode || !toNode) continue;

      const fromScreen = worldToScreen(fromNode.x, fromNode.y, panX, panY, scale);
      const toScreen = worldToScreen(toNode.x, toNode.y, panX, panY, scale);

      const lineWidth = hoveredConnectionId === connection.id ? 3 : 1.5;
      const showDistance = hoveredConnectionId === connection.id || connection.isHighlighted;

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

    if (connectionDragState.isDragging && connectionDragState.fromNodeId) {
      const fromNode = nodes.find((n) => n.id === connectionDragState.fromNodeId);
      if (fromNode) {
        const fromScreen = worldToScreen(fromNode.x, fromNode.y, panX, panY, scale);
        const nearestNode = findNearestNode(
          connectionDragState.currentX,
          connectionDragState.currentY,
          nodes,
          connectionDragState.fromNodeId,
          panX,
          panY,
          scale
        );

        const snapColor = nearestNode ? getDayColorForNode(nearestNode.id) : undefined;
        drawConnectionPreview(
          ctx,
          fromScreen.x + (NODE_WIDTH * scale) / 2,
          fromScreen.y,
          nearestNode
            ? worldToScreen(nearestNode.x, nearestNode.y, panX, panY, scale).x
            : connectionDragState.currentX,
          nearestNode
            ? worldToScreen(nearestNode.x, nearestNode.y, panX, panY, scale).y
            : connectionDragState.currentY,
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
        panX,
        panY,
        scale,
        selectedNodeId === node.id,
        pulsePhaseRef.current,
        dayColor
      );
    }
  }, [
    nodes,
    connections,
    panX,
    panY,
    scale,
    selectedNodeId,
    hoveredConnectionId,
    connectionDragState,
    getDayColorForNode,
  ]);

  useEffect(() => {
    let lastTime = 0;
    const animate = (time: number) => {
      const delta = time - lastTime;
      if (delta >= 33) {
        pulsePhaseRef.current += 0.05;
        render();
        lastTime = time;
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [render]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      render();
    };

    resize();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [render]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getMousePos(e);

    for (const node of nodes) {
      if (selectedNodeId === node.id && hitTestConnectionHandle(x, y, node, panX, panY, scale)) {
        setConnectionDragState({
          isDragging: true,
          fromNodeId: node.id,
          currentX: x,
          currentY: y,
        });
        return;
      }
    }

    for (const node of nodes) {
      if (hitTestNode(x, y, node, panX, panY, scale)) {
        const worldPos = screenToWorld(x, y, panX, panY, scale);
        setNodeDragState({
          isDragging: true,
          nodeId: node.id,
          offsetX: worldPos.x - node.x,
          offsetY: worldPos.y - node.y,
        });
        setSelectedNodeId(node.id);
        onNodeDragStart?.(node.id);
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
      setConnectionDragState((prev) => ({
        ...prev,
        currentX: x,
        currentY: y,
      }));
      return;
    }

    if (nodeDragState.isDragging && nodeDragState.nodeId) {
      const worldPos = screenToWorld(x, y, panX, panY, scale);
      updateNodePosition(
        nodeDragState.nodeId,
        worldPos.x - nodeDragState.offsetX,
        worldPos.y - nodeDragState.offsetY
      );
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
      const t = Math.max(
        0,
        Math.min(
          1,
          ((x - fromScreen.x) * (toScreen.x - fromScreen.x) +
            (y - fromScreen.y) * (toScreen.y - fromScreen.y)) /
            (lineLength * lineLength)
        )
      );

      const closestX = fromScreen.x + t * (toScreen.x - fromScreen.x);
      const closestY = fromScreen.y + t * (toScreen.y - fromScreen.y);
      const distance = Math.sqrt(
        Math.pow(x - closestX, 2) + Math.pow(y - closestY, 2)
      );

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
      const nearestNode = findNearestNode(
        x,
        y,
        nodes,
        connectionDragState.fromNodeId,
        panX,
        panY,
        scale
      );

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
      if (hitTestNode(x, y, node, panX, panY, scale)) {
        return;
      }
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

    const newPanX = panX + (worldPosAfter.x - worldPosBefore.x) * newScale;
    const newPanY = panY + (worldPosAfter.y - worldPosBefore.y) * newScale;

    setScale(newScale);
    setPanX(newPanX);
    setPanY(newPanY);
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
    e.dataTransfer.setData('nodeId', selectedNodeId);
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
          onClick={() => {
            setScale(1);
            setPanX(0);
            setPanY(0);
          }}
          className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg text-[#4A3728] hover:bg-white transition-all flex items-center justify-center text-sm font-medium border border-[#E8DCC4]"
        >
          ⟲
        </button>
      </div>

      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2 text-sm text-[#6B7F5E] border border-[#E8DCC4]">
        缩放: {Math.round(scale * 100)}%
      </div>

      {showAddDialog && (
        <div
          className="absolute bg-white rounded-xl shadow-2xl p-4 w-64 border border-[#E8DCC4]"