import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useBrainstormStore } from '@/stores/useBrainstormStore';
import type { BrainstormNode } from '@/types';
import Node from './Node';
import Toolbar from './Toolbar';
import UserPresence from './UserPresence';
import Cursors from './Cursors';
import {
  getBezierPath,
  screenToCanvas,
  generateId,
  getNodeCenter,
  checkCollision,
  resolveCollision,
} from '@/utils/canvasUtils';

interface CanvasProps {
  onExport: () => void;
  onImport: () => void;
  onClear: () => void;
  onSemanticGroup: () => void;
  isProcessing: boolean;
}

interface DraggingConnection {
  fromNodeId: string;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

const DEFAULT_NODE_WIDTH = 180;
const DEFAULT_NODE_HEIGHT = 80;
const MIN_SCALE = 0.1;
const MAX_SCALE = 3;

export default function Canvas({
  onExport,
  onImport,
  onClear,
  onSemanticGroup,
  isProcessing,
}: CanvasProps) {
  const {
    nodes,
    connections,
    groups,
    users,
    selectedNodeId,
    selectedConnectionId,
    currentUserId,
    viewScale,
    viewOffset,
    isPanning,
    setViewScale,
    setViewOffset,
    setPanning,
    selectNode,
    selectConnection,
    addNode,
    updateNode,
    moveNode,
    addConnection,
    removeConnection,
    updateUserCursor,
    setRoomState,
  } = useBrainstormStore();

  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingConnection, setDraggingConnection] = useState<DraggingConnection | null>(null);
  const [spacePressed, setSpacePressed] = useState(false);
  const [isPanningActive, setIsPanningActive] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const [showNodeInput, setShowNodeInput] = useState(false);
  const [newNodeInput, setNewNodeInput] = useState('');
  const [newNodePosition, setNewNodePosition] = useState({ x: 0, y: 0 });
  const newNodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showNodeInput && newNodeInputRef.current) {
      newNodeInputRef.current.focus();
    }
  }, [showNodeInput]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !spacePressed) {
        setSpacePressed(true);
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        if (selectedNodeId) {
          const node = nodes.find((n) => n.id === selectedNodeId);
          if (node) {
            useBrainstormStore.getState().deleteNode(selectedNodeId);
          }
        }
        if (selectedConnectionId) {
          removeConnection(selectedConnectionId);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
        setIsPanningActive(false);
        setPanning(false);
        panStartRef.current = null;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [spacePressed, selectedNodeId, selectedConnectionId, nodes, removeConnection, setPanning]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();

      const svg = svgRef.current;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.min(Math.max(viewScale * delta, MIN_SCALE), MAX_SCALE);

      const scaleRatio = newScale / viewScale;
      const newOffsetX = mouseX - (mouseX - viewOffset.x) * scaleRatio;
      const newOffsetY = mouseY - (mouseY - viewOffset.y) * scaleRatio;

      setViewScale(newScale);
      setViewOffset(newOffsetX, newOffsetY);
    };

    const svg = svgRef.current;
    if (svg) {
      svg.addEventListener('wheel', handleWheel, { passive: false });
      return () => svg.removeEventListener('wheel', handleWheel);
    }
  }, [viewScale, viewOffset, setViewScale, setViewOffset]);

  const getCanvasPoint = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      const screenX = clientX - rect.left;
      const screenY = clientY - rect.top;
      return screenToCanvas(screenX, screenY, viewOffset, viewScale);
    },
    [viewOffset, viewScale]
  );

  const handleSvgMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const state = useBrainstormStore.getState();
      if (state.currentUserId) {
        const point = getCanvasPoint(e.clientX, e.clientY);
        useBrainstormStore.getState().emitAction?.('cursorUpdate', {
          userId: state.currentUserId,
          x: point.x,
          y: point.y,
        });
        updateUserCursor(state.currentUserId, point.x, point.y);
      }

      if (draggingConnection) {
        const point = getCanvasPoint(e.clientX, e.clientY);
        setDraggingConnection({
          ...draggingConnection,
          currentX: point.x,
          currentY: point.y,
        });
      }

      if (isPanningActive && panStartRef.current) {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        setViewOffset(panStartRef.current.offsetX + dx, panStartRef.current.offsetY + dy);
      }
    },
    [draggingConnection, isPanningActive, getCanvasPoint, updateUserCursor, setViewOffset]
  );

  const handleSvgMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (spacePressed) {
        setIsPanningActive(true);
        setPanning(true);
        panStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          offsetX: viewOffset.x,
          offsetY: viewOffset.y,
        };
        return;
      }

      selectNode(null);
      selectConnection(null);
    },
    [spacePressed, viewOffset, selectNode, selectConnection, setPanning]
  );

  const handleSvgMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (draggingConnection) {
        const point = getCanvasPoint(e.clientX, e.clientY);
        const targetNode = nodes.find(
          (n) =>
            n.id !== draggingConnection.fromNodeId &&
            point.x >= n.x &&
            point.x <= n.x + n.width &&
            point.y >= n.y &&
            point.y <= n.y + n.height
        );

        if (targetNode) {
          const exists = connections.some(
            (c) =>
              (c.fromNodeId === draggingConnection.fromNodeId && c.toNodeId === targetNode.id) ||
              (c.fromNodeId === targetNode.id && c.toNodeId === draggingConnection.fromNodeId)
          );

          if (!exists) {
            const roomId = useBrainstormStore.getState().roomId;
            if (roomId) {
              addConnection({
                id: generateId(),
                roomId,
                fromNodeId: draggingConnection.fromNodeId,
                toNodeId: targetNode.id,
                createdAt: new Date().toISOString(),
              });
            }
          }
        }

        setDraggingConnection(null);
      }

      if (isPanningActive) {
        setIsPanningActive(false);
        setPanning(false);
        panStartRef.current = null;
      }
    },
    [draggingConnection, isPanningActive, nodes, connections, getCanvasPoint, addConnection, setPanning]
  );

  const handleSvgDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target !== svgRef.current) return;
      const point = getCanvasPoint(e.clientX, e.clientY);
      setNewNodePosition({ x: point.x - DEFAULT_NODE_WIDTH / 2, y: point.y - DEFAULT_NODE_HEIGHT / 2 });
      setNewNodeInput('');
      setShowNodeInput(true);
    },
    [getCanvasPoint]
  );

  const handleCreateNode = useCallback(() => {
    const title = newNodeInput.trim();
    if (!title) {
      setShowNodeInput(false);
      return;
    }

    const roomId = useBrainstormStore.getState().roomId;
    if (!roomId) return;

    let { x, y } = newNodePosition;
    const tempNode: BrainstormNode = {
      id: generateId(),
      roomId,
      title,
      note: '',
      tags: [],
      x,
      y,
      width: DEFAULT_NODE_WIDTH,
      height: DEFAULT_NODE_HEIGHT,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const collided = checkCollision(tempNode, nodes);
    if (collided) {
      const resolved = resolveCollision(tempNode, nodes);
      x = resolved.x;
      y = resolved.y;
    }

    addNode({
      ...tempNode,
      x,
      y,
    });

    setShowNodeInput(false);
    setNewNodeInput('');
  }, [newNodeInput, newNodePosition, nodes, addNode]);

  const handleNodeSelect = useCallback((id: string) => {
    selectNode(id);
  }, [selectNode]);

  const handleNodeMove = useCallback((id: string, x: number, y: number) => {
    moveNode(id, x, y);
  }, [moveNode]);

  const handleNodeUpdate = useCallback((id: string, updates: Partial<BrainstormNode>) => {
    updateNode({ id, ...updates });
  }, [updateNode]);

  const handleStartDragConnection = useCallback(
    (nodeId: string, startX: number, startY: number) => {
      setDraggingConnection({
        fromNodeId: nodeId,
        startX,
        startY,
        currentX: startX,
        currentY: startY,
      });
    },
    []
  );

  const handleNodeDoubleClick = useCallback(() => {}, []);

  const handleZoomIn = useCallback(() => {
    setViewScale(Math.min(viewScale * 1.2, MAX_SCALE));
  }, [viewScale, setViewScale]);

  const handleZoomOut = useCallback(() => {
    setViewScale(Math.max(viewScale / 1.2, MIN_SCALE));
  }, [viewScale, setViewScale]);

  const handleFitView = useCallback(() => {
    if (nodes.length === 0) {
      setViewScale(1);
      setViewOffset(0, 0);
      return;
    }

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    nodes.forEach((node) => {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + node.width);
      maxY = Math.max(maxY, node.y + node.height);
    });

    const padding = 100;
    const contentWidth = maxX - minX + padding * 2;
    const contentHeight = maxY - minY + padding * 2;

    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const scaleX = rect.width / contentWidth;
    const scaleY = rect.height / contentHeight;
    const scale = Math.min(Math.min(scaleX, scaleY), 1.5);

    const offsetX = rect.width / 2 - ((minX + maxX) / 2) * scale;
    const offsetY = rect.height / 2 - ((minY + maxY) / 2) * scale;

    setViewScale(scale);
    setViewOffset(offsetX, offsetY);
  }, [nodes, setViewScale, setViewOffset]);

  const handleConnectionClick = useCallback(
    (e: React.MouseEvent, connectionId: string) => {
      e.stopPropagation();
      selectConnection(connectionId);
    },
    [selectConnection]
  );

  const renderConnections = () => {
    return connections.map((conn) => {
      const fromNode = nodes.find((n) => n.id === conn.fromNodeId);
      const toNode = nodes.find((n) => n.id === conn.toNodeId);
      if (!fromNode || !toNode) return null;

      const from = getNodeCenter(fromNode);
      const to = getNodeCenter(toNode);
      const path = getBezierPath(from.x, from.y, to.x, to.y);
      const isSelected = selectedConnectionId === conn.id;

      return (
        <g key={conn.id} onClick={(e) => handleConnectionClick(e, conn.id)}>
          <path
            d={path}
            fill="none"
            stroke="transparent"
            strokeWidth={20}
            style={{ cursor: 'pointer' }}
          />
          <path
            d={path}
            fill="none"
            stroke={isSelected ? '#1565C0' : '#90A4AE'}
            strokeWidth={isSelected ? 3 : 2}
            strokeLinecap="round"
            style={{
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              pointerEvents: 'none',
            }}
          />
        </g>
      );
    });
  };

  const renderGroups = () => {
    const groupColors = [
      { fill: 'rgba(239, 68, 68, 0.08)', stroke: 'rgba(239, 68, 68, 0.3)' },
      { fill: 'rgba(34, 197, 94, 0.08)', stroke: 'rgba(34, 197, 94, 0.3)' },
      { fill: 'rgba(59, 130, 246, 0.08)', stroke: 'rgba(59, 130, 246, 0.3)' },
      { fill: 'rgba(168, 85, 247, 0.08)', stroke: 'rgba(168, 85, 247, 0.3)' },
      { fill: 'rgba(236, 72, 153, 0.08)', stroke: 'rgba(236, 72, 153, 0.3)' },
      { fill: 'rgba(20, 184, 166, 0.08)', stroke: 'rgba(20, 184, 166, 0.3)' },
    ];

    return groups.map((group, index) => {
      const colors = groupColors[index % groupColors.length];
      return (
        <g key={group.id}>
          <rect
            x={group.x}
            y={group.y}
            width={group.width}
            height={group.height}
            rx={16}
            ry={16}
            fill={colors.fill}
            stroke={colors.stroke}
            strokeWidth={2}
            strokeDasharray="8 4"
            style={{ transition: 'all 0.3s ease' }}
          />
          <foreignObject
            x={group.x + 16}
            y={group.y - 14}
            width={200}
            height={28}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 12px',
                backgroundColor: '#FFFFFF',
                border: `1px solid ${colors.stroke}`,
                borderRadius: '14px',
                fontSize: '13px',
                fontWeight: 500,
                color: '#374151',
                fontFamily: "'Roboto', sans-serif",
                whiteSpace: 'nowrap',
              }}
            >
              {group.keyword}
            </div>
          </foreignObject>
        </g>
      );
    });
  };

  const cursor = isPanningActive ? 'grabbing' : spacePressed ? 'grab' : 'default';

  return (
    <div className="w-full h-full relative overflow-hidden bg-gray-50">
      <div
        className="absolute bottom-4 left-4 z-20 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 text-xs text-gray-500 shadow-sm"
      >
        {Math.round(viewScale * 100)}% · 空格+拖拽平移 · Ctrl+滚轮缩放 · 双击新建
      </div>

      <Toolbar
        onExport={onExport}
        onImport={onImport}
        onClear={onClear}
        onSemanticGroup={onSemanticGroup}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitView={handleFitView}
        isProcessing={isProcessing}
      />

      <UserPresence users={users} currentUserId={currentUserId} />

      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ cursor, minWidth: '800px', minHeight: '100%' }}
        onMouseDown={handleSvgMouseDown}
        onMouseMove={handleSvgMouseMove}
        onMouseUp={handleSvgMouseUp}
        onMouseLeave={handleSvgMouseUp}
        onDoubleClick={handleSvgDoubleClick}
      >
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#E5E7EB" />
          </pattern>
        </defs>
        <g
          style={{
            transform: `translate(${viewOffset.x}px, ${viewOffset.y}px) scale(${viewScale})`,
            transformOrigin: '0 0',
          }}
        >
          <rect x="-10000" y="-10000" width="20000" height="20000" fill="url(#grid)" />

          {renderGroups()}
          {renderConnections()}

          {draggingConnection && (
            <path
              d={getBezierPath(
                draggingConnection.startX,
                draggingConnection.startY,
                draggingConnection.currentX,
                draggingConnection.currentY
              )}
              fill="none"
              stroke="#2196F3"
              strokeWidth={2}
              strokeDasharray="8 4"
              strokeLinecap="round"
              style={{ opacity: 0.7 }}
            />
          )}

          {nodes.map((node) => (
            <Node
              key={node.id}
              node={node}
              isSelected={selectedNodeId === node.id}
              scale={viewScale}
              onSelect={handleNodeSelect}
              onMove={handleNodeMove}
              onStartDragConnection={handleStartDragConnection}
              onDoubleClick={handleNodeDoubleClick}
              onUpdate={handleNodeUpdate}
            />
          ))}

          <Cursors users={users} currentUserId={currentUserId} viewScale={viewScale} />
        </g>
      </svg>

      {showNodeInput && (
        <div
          className="absolute z-30 bg-white rounded-xl shadow-xl border border-gray-200 p-3"
          style={{
            left: newNodePosition.x * viewScale + viewOffset.x,
            top: newNodePosition.y * viewScale + viewOffset.y,
            width: DEFAULT_NODE_WIDTH * viewScale,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            ref={newNodeInputRef}
            type="text"
            value={newNodeInput}
            onChange={(e) => setNewNodeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateNode();
              if (e.key === 'Escape') {
                setShowNodeInput(false);
                setNewNodeInput('');
              }
            }}
            onBlur={handleCreateNode}
            placeholder="输入节点标题..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            style={{ fontSize: `${14 * viewScale}px` }}
          />
        </div>
      )}
    </div>
  );
}
