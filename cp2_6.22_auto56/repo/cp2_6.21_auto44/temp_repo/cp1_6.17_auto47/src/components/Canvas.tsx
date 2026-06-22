import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useChartStore } from '@/store/chartStore';
import { drawGrid, drawNode, drawEdge, drawConnectingLine, screenToWorld } from '@/utils/canvas';
import { snapToNearestNode, isPointInNode, isPointNearLine, getBestAnchorPoints, calculateEdgePath } from '@/utils/geometry';
import { CONFIG } from '@/types';

interface CanvasProps {
  isMobile: boolean;
}

const Canvas: React.FC<CanvasProps> = ({ isMobile }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const mousePos = useRef({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const dragStartOffset = useRef({ x: 0, y: 0 });
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [labelInputPos, setLabelInputPos] = useState({ x: 0, y: 0 });

  const {
    nodes,
    edges,
    viewState,
    selectedNodeId,
    selectedEdgeId,
    connectingFromId,
    isDragging,
    dragNodeId,
    snapFlashNodeId,
    updateNode,
    addEdge,
    selectNode,
    selectEdge,
    startConnecting,
    cancelConnecting,
    setDragging,
    setSnapFlash,
    setViewState,
  } = useChartStore();

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { offsetX = 0, offsetY = 0, zoom = 1 } = viewState;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawGrid(ctx, canvas.width, canvas.height, offsetX, offsetY, zoom);

    const sortedEdges = [...edges].sort((a, b) => {
      if (a.id === selectedEdgeId) return 1;
      if (b.id === selectedEdgeId) return -1;
      return 0;
    });

    for (const edge of sortedEdges) {
      drawEdge(
        ctx,
        edge,
        nodes,
        edge.id === selectedEdgeId,
        offsetX,
        offsetY,
        zoom,
        edge.id === editingEdgeId
      );
    }

    const sortedNodes = [...nodes].sort((a, b) => {
      if (a.id === dragNodeId) return 1;
      if (b.id === dragNodeId) return -1;
      return 0;
    });

    for (const node of sortedNodes) {
      drawNode(
        ctx,
        node,
        node.id === selectedNodeId,
        node.id === dragNodeId && isDragging,
        node.id === snapFlashNodeId,
        offsetX,
        offsetY,
        zoom
      );
    }

    if (connectingFromId) {
      const fromNode = nodes.find(n => n.id === connectingFromId);
      if (fromNode) {
        drawConnectingLine(
          ctx,
          fromNode,
          mousePos.current.x,
          mousePos.current.y,
          offsetX,
          offsetY,
          zoom
        );
      }
    }
  }, [nodes, edges, viewState, selectedNodeId, selectedEdgeId, connectingFromId, isDragging, dragNodeId, snapFlashNodeId, editingEdgeId]);

  useEffect(() => {
    const animate = () => {
      render();
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [render]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const findNodeAtPoint = (x: number, y: number) => {
    const { x: worldX, y: worldY } = screenToWorld(x, y, 0, 0, 1);
    const hitScale = isMobile ? 1.5 : 1;

    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      if (isPointInNode(worldX, worldY, node, hitScale)) {
        return node;
      }
    }
    return null;
  };

  const findEdgeAtPoint = (x: number, y: number) => {
    const { x: worldX, y: worldY } = screenToWorld(x, y, 0, 0, 1);

    for (let i = edges.length - 1; i >= 0; i--) {
      const edge = edges[i];
      const fromNode = nodes.find(n => n.id === edge.fromId);
      const toNode = nodes.find(n => n.id === edge.toId);
      if (!fromNode || !toNode) continue;

      const { from, to } = getBestAnchorPoints(fromNode, toNode);
      const { points } = calculateEdgePath(edge.style, from.x, from.y, to.x, to.y);

      for (let j = 0; j < points.length - 1; j++) {
        if (isPointNearLine(worldX, worldY, points[j].x, points[j].y, points[j + 1].x, points[j + 1].y, 10)) {
          return edge;
        }
      }

      if (edge.label) {
        const midPoint = points[Math.floor(points.length / 2)];
        const dist = Math.sqrt((worldX - midPoint.x) ** 2 + (worldY - midPoint.y) ** 2);
        if (dist < 30) {
          return edge;
        }
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    const { x, y } = getCanvasCoords(e);
    mousePos.current = { x, y };

    if (editingEdgeId) {
      setEditingEdgeId(null);
      return;
    }

    const clickedNode = findNodeAtPoint(x, y);
    const clickedEdge = findEdgeAtPoint(x, y);

    if (connectingFromId && clickedNode && clickedNode.id !== connectingFromId) {
      addEdge({
        fromId: connectingFromId,
        toId: clickedNode.id,
      });
      cancelConnecting();
      return;
    }

    if (clickedNode) {
      selectNode(clickedNode.id);
      setDragging(true, clickedNode.id);

      const { x: worldX, y: worldY } = screenToWorld(x, y, 0, 0, 1);
      dragStartOffset.current = {
        x: worldX - clickedNode.x,
        y: worldY - clickedNode.y,
      };
      return;
    }

    if (clickedEdge) {
      selectEdge(clickedEdge.id);
      return;
    }

    selectNode(null);
    selectEdge(null);
    cancelConnecting();

    isPanning.current = true;
    panStart.current = { x, y };
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    const { x, y } = getCanvasCoords(e);
    mousePos.current = { x, y };

    if (isDragging && dragNodeId) {
      const { x: worldX, y: worldY } = screenToWorld(x, y, 0, 0, 1);

      const node = nodes.find(n => n.id === dragNodeId);
      if (!node) return;

      let newX = worldX - dragStartOffset.current.x;
      let newY = worldY - dragStartOffset.current.y;

      const tempNode = { ...node, x: newX, y: newY };
      const { x: snappedX, y: snappedY, snapped } = snapToNearestNode(tempNode, nodes);

      if (snapped) {
        setSnapFlash(dragNodeId);
      }

      updateNode(dragNodeId, {
        x: snapped ? snappedX : newX,
        y: snapped ? snappedY : newY,
      });
      return;
    }

    if (isPanning.current) {
      const dx = x - panStart.current.x;
      const dy = y - panStart.current.y;
      panStart.current = { x, y };

      setViewState({
        offsetX: 0,
        offsetY: 0,
      });
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setDragging(false, null);
    }
    isPanning.current = false;
  };

  const handleDoubleClick = (e: React.MouseEvent | React.TouchEvent) => {
    const { x, y } = getCanvasCoords(e);

    const clickedEdge = findEdgeAtPoint(x, y);
    if (clickedEdge && clickedEdge.label !== undefined) {
      const fromNode = nodes.find(n => n.id === clickedEdge.fromId);
      const toNode = nodes.find(n => n.id === clickedEdge.toId);
      if (fromNode && toNode) {
        const { from, to } = getBestAnchorPoints(fromNode, toNode);
        const { points } = calculateEdgePath(clickedEdge.style, from.x, from.y, to.x, to.y);
        const midPoint = points[Math.floor(points.length / 2)];

        if (midPoint) {
          const labelX = midPoint.x * 1 + 0;
          const labelY = midPoint.y * 1 + 0 - 20;

          setEditingEdgeId(clickedEdge.id);
          setEditingLabel(clickedEdge.label);
          setLabelInputPos({ x: labelX, y: labelY });
        }
      }
    }
  };

  const handleLabelBlur = () => {
    if (editingEdgeId) {
      const store = useChartStore.getState();
      store.updateEdge(editingEdgeId, { label: editingLabel });
      setEditingEdgeId(null);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(CONFIG.MIN_ZOOM, Math.min(CONFIG.MAX_ZOOM, viewState.zoom * delta));
    setViewState({ zoom: newZoom });
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      onWheel={handleWheel}
      onTouchStart={handleMouseDown}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          cursor: connectingFromId ? 'crosshair' : isDragging ? 'grabbing' : 'default',
          touchAction: 'none',
        }}
      />
      {editingEdgeId && (
        <input
          type="text"
          value={editingLabel}
          onChange={(e) => setEditingLabel(e.target.value)}
          onBlur={handleLabelBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleLabelBlur();
            }
          }}
          autoFocus
          style={{
            position: 'absolute',
            left: labelInputPos.x,
            top: labelInputPos.y,
            transform: 'translate(-50%, -50%)',
            fontSize: '14px',
            padding: '4px 8px',
            border: '2px solid #1976D2',
            borderRadius: '4px',
            outline: 'none',
            zIndex: 100,
          }}
        />
      )}
    </div>
  );
};

export default Canvas;
