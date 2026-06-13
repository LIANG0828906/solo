import React, { useRef, useEffect, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { FlowNode, FlowEdge, NodeType } from '../../types';
import { NODE_DEFAULTS, COLOR_PALETTE } from '../../types';
import { useFlowStore } from '../store/useFlowStore';
import { wsClient } from '../utils/websocket';

interface CanvasProps {
  readOnly?: boolean;
}

interface DragState {
  isDragging: boolean;
  nodeId: string | null;
  startX: number;
  startY: number;
  nodeStartX: number;
  nodeStartY: number;
}

interface ConnectState {
  isConnecting: boolean;
  sourceId: string | null;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

interface PendingEdge {
  sourceId: string;
  targetId: string;
}

const getNodePort = (node: FlowNode, type: 'output' | 'input') => {
  const centerX = node.x + node.width / 2;
  const centerY = node.y + node.height / 2;
  if (type === 'output') {
    return { x: node.x + node.width, y: centerY };
  }
  return { x: node.x, y: centerY };
};

const getBezierPath = (x1: number, y1: number, x2: number, y2: number) => {
  const dx = Math.abs(x2 - x1);
  const controlOffset = Math.max(50, dx * 0.5);
  return `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`;
};

const getInitialLetter = (name: string) => {
  return name.charAt(0).toUpperCase();
};

export const Canvas: React.FC<CanvasProps> = ({ readOnly = false }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    nodeId: null,
    startX: 0,
    startY: 0,
    nodeStartX: 0,
    nodeStartY: 0,
  });
  const [connectState, setConnectState] = useState<ConnectState>({
    isConnecting: false,
    sourceId: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });
  const [pendingEdge, setPendingEdge] = useState<PendingEdge | null>(null);
  const [animatingNodes, setAnimatingNodes] = useState<Set<string>>(new Set());
  const rafRef = useRef<number | null>(null);
  const cursorUpdateRef = useRef<number | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const dragStateRef = useRef<DragState>({
    isDragging: false,
    nodeId: null,
    startX: 0,
    startY: 0,
    nodeStartX: 0,
    nodeStartY: 0,
  });
  const connectStateRef = useRef<ConnectState>({
    isConnecting: false,
    sourceId: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });
  const pendingEdgeRef = useRef<PendingEdge | null>(null);

  const {
    nodes,
    edges,
    users,
    cursors,
    selectedNodeId,
    selectedEdgeId,
    viewport,
    isRestoreAnimating,
    isReadOnly: storeReadOnly,
    selectNode,
    selectEdge,
    updateNode,
  } = useFlowStore();

  const effectiveReadOnly = readOnly || storeReadOnly;

  useEffect(() => {
    if (!isMountedRef.current) return;
    nodes.forEach((node) => {
      if (!animatingNodes.has(node.id)) {
        setAnimatingNodes((prev) => new Set(prev).add(node.id));
      }
    });
  }, [nodes.length]);

  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (screenX - rect.left - viewport.x) / viewport.scale,
      y: (screenY - rect.top - viewport.y) / viewport.scale,
    };
  }, [viewport]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isMountedRef.current) return;
    const worldPos = screenToWorld(e.clientX, e.clientY);

    if (cursorUpdateRef.current) {
      cancelAnimationFrame(cursorUpdateRef.current);
    }
    cursorUpdateRef.current = requestAnimationFrame(() => {
      if (isMountedRef.current && !effectiveReadOnly && wsClient.isConnected()) {
        wsClient.updateCursor(worldPos.x, worldPos.y);
      }
    });

    const currentDragState = dragStateRef.current;
    if (currentDragState.isDragging && currentDragState.nodeId && !effectiveReadOnly) {
      const dx = (e.clientX - currentDragState.startX) / viewport.scale;
      const dy = (e.clientY - currentDragState.startY) / viewport.scale;
      const newX = currentDragState.nodeStartX + dx;
      const newY = currentDragState.nodeStartY + dy;

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => {
        if (!isMountedRef.current) return;
        updateNode(currentDragState.nodeId!, { x: newX, y: newY });
        if (wsClient.isConnected()) {
          wsClient.updateNode(currentDragState.nodeId!, { x: newX, y: newY });
        }
      });
    }

    if (connectStateRef.current.isConnecting) {
      connectStateRef.current.currentX = worldPos.x;
      connectStateRef.current.currentY = worldPos.y;
      if (isMountedRef.current) {
        setConnectState((prev) => ({
          ...prev,
          currentX: worldPos.x,
          currentY: worldPos.y,
        }));
      }
    }
  }, [viewport, effectiveReadOnly, screenToWorld, updateNode]);

  const handleMouseUp = useCallback(() => {
    if (!isMountedRef.current) return;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (cursorUpdateRef.current) {
      cancelAnimationFrame(cursorUpdateRef.current);
      cursorUpdateRef.current = null;
    }

    const resetDragState: DragState = {
      isDragging: false,
      nodeId: null,
      startX: 0,
      startY: 0,
      nodeStartX: 0,
      nodeStartY: 0,
    };
    dragStateRef.current = resetDragState;
    setDragState(resetDragState);

    const currentConnectState = connectStateRef.current;
    const currentPendingEdge = pendingEdgeRef.current;
    if (currentConnectState.isConnecting && currentPendingEdge) {
      const newEdge: FlowEdge = {
        id: uuidv4(),
        sourceId: currentPendingEdge.sourceId,
        targetId: currentPendingEdge.targetId,
        createdAt: Date.now(),
        version: 0,
      };
      if (wsClient.isConnected()) {
        wsClient.addEdge(newEdge);
      }
    }

    const resetConnectState: ConnectState = {
      isConnecting: false,
      sourceId: null,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
    };
    connectStateRef.current = resetConnectState;
    setConnectState(resetConnectState);

    pendingEdgeRef.current = null;
    setPendingEdge(null);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    const handleBeforeUnload = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (cursorUpdateRef.current) {
        cancelAnimationFrame(cursorUpdateRef.current);
        cursorUpdateRef.current = null;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      isMountedRef.current = false;

      try {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      } catch (_) { /* no-op */ }
      try {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      } catch (_) { /* no-op */ }
      try {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      } catch (_) { /* no-op */ }

      if (rafRef.current !== null) {
        try { cancelAnimationFrame(rafRef.current); } catch (_) { /* no-op */ }
        rafRef.current = null;
      }
      if (cursorUpdateRef.current !== null) {
        try { cancelAnimationFrame(cursorUpdateRef.current); } catch (_) { /* no-op */ }
        cursorUpdateRef.current = null;
      }

      dragStateRef.current = {
        isDragging: false, nodeId: null, startX: 0, startY: 0, nodeStartX: 0, nodeStartY: 0,
      };
      connectStateRef.current = {
        isConnecting: false, sourceId: null, startX: 0, startY: 0, currentX: 0, currentY: 0,
      };
      pendingEdgeRef.current = null;
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (effectiveReadOnly) return;
    e.stopPropagation();
    selectNode(nodeId);

    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const newDragState: DragState = {
      isDragging: true,
      nodeId,
      startX: e.clientX,
      startY: e.clientY,
      nodeStartX: node.x,
      nodeStartY: node.y,
    };
    dragStateRef.current = newDragState;
    setDragState(newDragState);
  };

  const handlePortMouseDown = (e: React.MouseEvent, nodeId: string, portType: 'output' | 'input') => {
    if (effectiveReadOnly || portType !== 'output') return;
    e.stopPropagation();

    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const port = getNodePort(node, portType);
    const newConnectState: ConnectState = {
      isConnecting: true,
      sourceId: nodeId,
      startX: port.x,
      startY: port.y,
      currentX: port.x,
      currentY: port.y,
    };
    connectStateRef.current = newConnectState;
    setConnectState(newConnectState);
  };

  const handlePortMouseEnter = (nodeId: string, portType: 'output' | 'input') => {
    if (connectStateRef.current.isConnecting && portType === 'input' && connectStateRef.current.sourceId !== nodeId) {
      const newPendingEdge: PendingEdge = {
        sourceId: connectStateRef.current.sourceId!,
        targetId: nodeId,
      };
      pendingEdgeRef.current = newPendingEdge;
      setPendingEdge(newPendingEdge);
    }
  };

  const handlePortMouseLeave = () => {
    pendingEdgeRef.current = null;
    setPendingEdge(null);
  };

  const handleCanvasClick = () => {
    selectNode(null);
    selectEdge(null);
  };

  const handleEdgeDoubleClick = (e: React.MouseEvent, edgeId: string) => {
    if (effectiveReadOnly) return;
    e.stopPropagation();
    const newLabel = prompt('输入连线标签:');
    if (newLabel !== null) {
      if (wsClient.isConnected()) {
        wsClient.updateEdge(edgeId, { label: newLabel });
      }
    }
  };

  const handleEdgeClick = (e: React.MouseEvent, edgeId: string) => {
    if (effectiveReadOnly) return;
    e.stopPropagation();
    selectEdge(edgeId);
  };

  const handleDeleteEdge = (edgeId: string) => {
    if (effectiveReadOnly) return;
    if (wsClient.isConnected()) {
      wsClient.deleteEdge(edgeId);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (effectiveReadOnly) return;
    e.preventDefault();
    const nodeType = e.dataTransfer.getData('nodeType') as NodeType;
    if (!nodeType) return;

    const worldPos = screenToWorld(e.clientX, e.clientY);
    const defaults = NODE_DEFAULTS[nodeType];

    const newNode: FlowNode = {
      id: uuidv4(),
      type: nodeType,
      x: worldPos.x - defaults.width / 2,
      y: worldPos.y - defaults.height / 2,
      width: defaults.width,
      height: defaults.height,
      title: '',
      description: '',
      color: COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)],
      createdAt: Date.now(),
      version: 0,
    };

    if (wsClient.isConnected()) {
      wsClient.addNode(newNode);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const renderNode = (node: FlowNode) => {
    const isSelected = selectedNodeId === node.id;
    const shouldAnimate = animatingNodes.has(node.id);

    const commonProps = {
      className: `absolute cursor-move ${shouldAnimate ? 'animate-bounce-in' : ''} ${
        isRestoreAnimating ? 'animate-fade-in' : ''
      }`,
      style: {
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        transformOrigin: 'center center',
      },
      onMouseDown: (e: React.MouseEvent) => handleNodeMouseDown(e, node.id),
    };

    const renderShape = () => {
      switch (node.type) {
        case 'rectangle':
          return (
            <div
              className={`w-full h-full rounded-lg flex flex-col items-center justify-center text-white text-sm font-medium border-2 transition-colors ${
                isSelected ? 'border-accent-blue' : 'border-transparent'
              }`}
              style={{ backgroundColor: node.color }}
            >
              <div className="text-center px-2 font-bold truncate w-full">{node.title || '矩形'}</div>
              {node.description && (
                <div className="text-xs opacity-80 px-2 truncate w-full text-center">{node.description}</div>
              )}
            </div>
          );
        case 'diamond':
          return (
            <div
              className={`w-full h-full flex items-center justify-center border-2 transition-colors ${
                isSelected ? 'border-accent-blue' : 'border-transparent'
              }`}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <polygon
                  points="50,2 98,50 50,98 2,50"
                  fill={node.color}
                  stroke={isSelected ? '#6c8cff' : 'transparent'}
                  strokeWidth="3"
                />
                <text
                  x="50"
                  y="45"
                  textAnchor="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight="bold"
                  dominantBaseline="middle"
                >
                  {node.title || '菱形'}
                </text>
                {node.description && (
                  <text
                    x="50"
                    y="60"
                    textAnchor="middle"
                    fill="white"
                    fontSize="9"
                    opacity="0.8"
                    dominantBaseline="middle"
                  >
                    {node.description.slice(0, 10)}
                  </text>
                )}
              </svg>
            </div>
          );
        case 'circle':
          return (
            <div
              className={`w-full h-full rounded-full flex flex-col items-center justify-center text-white text-sm font-medium border-2 transition-colors ${
                isSelected ? 'border-accent-blue' : 'border-transparent'
              }`}
              style={{ backgroundColor: node.color }}
            >
              <div className="text-center px-2 font-bold truncate w-full">{node.title || '圆形'}</div>
              {node.description && (
                <div className="text-xs opacity-80 px-2 truncate w-full text-center">{node.description.slice(0, 8)}</div>
              )}
            </div>
          );
        case 'text':
          return (
            <div
              className={`w-full h-full flex flex-col items-center justify-center text-white text-sm font-medium rounded border-2 transition-colors ${
                isSelected ? 'border-accent-blue' : 'border-transparent'
              }`}
              style={{ backgroundColor: node.color }}
            >
              <div className="text-center px-2 font-bold truncate w-full">{node.title || '文本'}</div>
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <div key={node.id} {...commonProps}>
        {renderShape()}
        {!effectiveReadOnly && (
          <>
            <div
              className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-gray-600 cursor-crosshair hover:bg-accent-blue transition-colors z-10"
              onMouseEnter={() => handlePortMouseEnter(node.id, 'input')}
              onMouseLeave={handlePortMouseLeave}
            />
            <div
              className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-gray-600 cursor-crosshair hover:bg-accent-blue transition-colors z-10"
              onMouseDown={(e) => handlePortMouseDown(e, node.id, 'output')}
            />
          </>
        )}
      </div>
    );
  };

  const renderEdge = (edge: FlowEdge) => {
    const sourceNode = nodes.find((n) => n.id === edge.sourceId);
    const targetNode = nodes.find((n) => n.id === edge.targetId);
    if (!sourceNode || !targetNode) return null;

    const sourcePort = getNodePort(sourceNode, 'output');
    const targetPort = getNodePort(targetNode, 'input');
    const path = getBezierPath(sourcePort.x, sourcePort.y, targetPort.x, targetPort.y);
    const isSelected = selectedEdgeId === edge.id;

    const midX = (sourcePort.x + targetPort.x) / 2;
    const midY = (sourcePort.y + targetPort.y) / 2;

    return (
      <g key={edge.id}>
        <path
          d={path}
          fill="none"
          stroke="transparent"
          strokeWidth="15"
          style={{ cursor: effectiveReadOnly ? 'default' : 'pointer' }}
          onClick={(e) => handleEdgeClick(e, edge.id)}
          onDoubleClick={(e) => handleEdgeDoubleClick(e, edge.id)}
        />
        <path
          d={path}
          fill="none"
          stroke={isSelected ? '#6c8cff' : '#888'}
          strokeWidth={isSelected ? 3 : 2}
          strokeDasharray={isSelected ? 'none' : 'none'}
          className="transition-all pointer-events-none"
        />
        <polygon
          points={`${targetPort.x},${targetPort.y} ${targetPort.x - 8},${targetPort.y - 4} ${targetPort.x - 8},${targetPort.y + 4}`}
          fill={isSelected ? '#6c8cff' : '#888'}
          className="pointer-events-none"
        />
        {edge.label && (
          <foreignObject x={midX - 30} y={midY - 12} width="60" height="24">
            <div className="bg-bg-tertiary text-white text-xs text-center rounded px-2 py-1 border border-gray-600">
              {edge.label}
            </div>
          </foreignObject>
        )}
        {isSelected && !effectiveReadOnly && (
          <g>
            <circle
              cx={midX}
              cy={midY}
              r="12"
              fill="#ef4444"
              className="cursor-pointer hover:fill-red-600 transition-colors"
              onClick={() => handleDeleteEdge(edge.id)}
            />
            <text
              x={midX}
              y={midY + 4}
              textAnchor="middle"
              fill="white"
              fontSize="14"
              fontWeight="bold"
              className="pointer-events-none"
            >
              ×
            </text>
          </g>
        )}
      </g>
    );
  };

  const renderCursors = () => {
    return Array.from(cursors.values()).map((cursor) => {
      const user = users.find((u) => u.id === cursor.userId);
      if (!user) return null;

      return (
        <g key={cursor.userId} className="pointer-events-none">
          <circle
            cx={cursor.x}
            cy={cursor.y}
            r="12"
            fill={user.color}
            className="animate-pulse"
          />
          <text
            x={cursor.x}
            y={cursor.y + 4}
            textAnchor="middle"
            fill="white"
            fontSize="10"
            fontWeight="bold"
          >
            {getInitialLetter(user.name)}
          </text>
          <text
            x={cursor.x + 16}
            y={cursor.y + 4}
            fill={user.color}
            fontSize="12"
            fontWeight="bold"
          >
            {user.name}
          </text>
        </g>
      );
    });
  };

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full overflow-hidden bg-bg-secondary"
      onClick={handleCanvasClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: `${20 * viewport.scale}px ${20 * viewport.scale}px`,
          backgroundPosition: `${viewport.x}px ${viewport.y}px`,
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
          transformOrigin: '0 0',
        }}
      >
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ overflow: 'visible', minWidth: '2000px', minHeight: '2000px' }}
        >
          <g className="pointer-events-auto">{edges.map(renderEdge)}</g>
          
          {connectState.isConnecting && (
            <path
              d={getBezierPath(
                connectState.startX,
                connectState.startY,
                connectState.currentX,
                connectState.currentY
              )}
              fill="none"
              stroke="#6c8cff"
              strokeWidth="2"
              strokeDasharray="5,5"
              className="pointer-events-none"
            />
          )}

          {renderCursors()}
        </svg>

        <div className="absolute" style={{ minWidth: '2000px', minHeight: '2000px' }}>
          {nodes.map(renderNode)}
        </div>
      </div>

      {effectiveReadOnly && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          只读模式 - 仅可查看
        </div>
      )}
    </div>
  );
};
