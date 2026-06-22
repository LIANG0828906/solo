import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useEditorStore } from '@/store';
import wsService from '@/services/websocket';
import type { StoryEdge, CollaboratorCursor } from '@/types';
import { NodeCard, NODE_WIDTH, NODE_HEIGHT } from './NodeCard';

export interface EditorCanvasProps {
  wsConnected: boolean;
  onNodeClick: (nodeId: string) => void;
}

const EditorCanvas: React.FC<EditorCanvasProps> = ({ onNodeClick }) => {
  const store = useEditorStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connecting, setConnecting] = useState<{
    sourceId: string;
    mouseX: number;
    mouseY: number;
  } | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);

  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: clientX - rect.left + (canvasRef.current.scrollLeft || 0),
      y: clientY - rect.top + (canvasRef.current.scrollTop || 0),
    };
  }, []);

  const handleStartDrag = useCallback((e: React.MouseEvent, nodeId: string) => {
    const node = store.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const coords = getCanvasCoords(e.clientX, e.clientY);
    setDraggingNodeId(nodeId);
    setDragOffset({
      x: coords.x - node.position.x,
      y: coords.y - node.position.y,
    });
  }, [store.nodes, getCanvasCoords]);

  const handleStartConnect = useCallback((e: React.MouseEvent, nodeId: string) => {
    const coords = getCanvasCoords(e.clientX, e.clientY);
    setConnecting({
      sourceId: nodeId,
      mouseX: coords.x,
      mouseY: coords.y,
    });
  }, [getCanvasCoords]);

  useEffect(() => {
    if (!draggingNodeId && !connecting) return;

    const handleMouseMove = (e: MouseEvent) => {
      const coords = getCanvasCoords(e.clientX, e.clientY);

      if (draggingNodeId) {
        const newX = Math.max(0, coords.x - dragOffset.x);
        const newY = Math.max(0, coords.y - dragOffset.y);
        store.updateNodePosition(draggingNodeId, newX, newY);
      }

      if (connecting) {
        setConnecting({
          ...connecting,
          mouseX: coords.x,
          mouseY: coords.y,
        });
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (connecting) {
        const coords = getCanvasCoords(e.clientX, e.clientY);
        const targetNode = store.nodes.find((n) => {
          const left = n.position.x;
          const right = n.position.x + NODE_WIDTH;
          const top = n.position.y;
          const bottom = n.position.y + NODE_HEIGHT;
          return (
            coords.x >= left && coords.x <= right &&
            coords.y >= top && coords.y <= bottom &&
            n.id !== connecting.sourceId
          );
        });

        if (targetNode) {
          store.addEdge(connecting.sourceId, targetNode.id);
        }
        setConnecting(null);
      }

      if (draggingNodeId) {
        setDraggingNodeId(null);
        store.saveHistory();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingNodeId, connecting, dragOffset, store, getCanvasCoords]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;

    let animationId: number;
    const simulateCursorMovement = () => {
      const collaborators = store.collaborators;
      if (collaborators.length > 0) {
        const now = Date.now();
        collaborators.forEach((c, i) => {
          const baseX = 200 + i * 200 + Math.sin(now / 2000 + i) * 80;
          const baseY = 150 + i * 100 + Math.cos(now / 2500 + i) * 60;
          store.updateCollaborator({
            ...c,
            x: baseX,
            y: baseY,
          });
        });
        forceUpdate((n) => n + 1);
      }
      animationId = requestAnimationFrame(simulateCursorMovement);
    };

    if (store.collaborators.length > 0) {
      animationId = requestAnimationFrame(simulateCursorMovement);
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [store, store.collaborators.length]);

  const handleCanvasClick = useCallback(() => {
    store.setSelectedNode(null);
    store.setSelectedEdge(null);
  }, [store]);

  const handleCanvasDoubleClick = useCallback((e: React.MouseEvent) => {
    const coords = getCanvasCoords(e.clientX, e.clientY);
    store.addNode({
      x: coords.x - NODE_WIDTH / 2,
      y: coords.y - NODE_HEIGHT / 2,
    });
  }, [store, getCanvasCoords]);

  const renderEdge = (edge: StoryEdge, index: number) => {
    const sourceNode = store.nodes.find((n) => n.id === edge.sourceId);
    const targetNode = store.nodes.find((n) => n.id === edge.targetId);
    if (!sourceNode || !targetNode) return null;

    const sx = sourceNode.position.x + NODE_WIDTH;
    const sy = sourceNode.position.y + NODE_HEIGHT / 2;
    const tx = targetNode.position.x;
    const ty = targetNode.position.y + NODE_HEIGHT / 2;

    const dx = tx - sx;
    const controlOffset = Math.min(Math.abs(dx) * 0.5, 100);
    const path = `M ${sx} ${sy} C ${sx + controlOffset} ${sy}, ${tx - controlOffset} ${ty}, ${tx} ${ty}`;

    const isInPath = store.simulationPath.includes(edge.sourceId) &&
      store.simulationPath[store.simulationPath.indexOf(edge.sourceId) + 1] === edge.targetId;

    const isAdded = store.versionDiff?.addedEdges.includes(edge.id);
    const isRemoved = store.versionDiff?.removedEdges.includes(edge.id);
    const isHovered = hoveredEdgeId === edge.id;
    const isSelected = store.selectedEdgeId === edge.id;

    let strokeColor = '#0f3460';
    if (isInPath && !store.simulationRunning && store.simulationResult) {
      strokeColor = '#4ade80';
    } else if (isAdded) {
      strokeColor = '#4ade80';
    } else if (isRemoved) {
      strokeColor = '#f87171';
    } else if (isHovered || isSelected) {
      strokeColor = '#e94560';
    }

    const strokeWidth = isInPath || isSelected || isHovered ? 3 : 2;
    const strokeDasharray = (isAdded || isRemoved) ? '8,4' : undefined;
    const opacity = isRemoved ? 0.4 : 1;

    const midX = (sx + tx) / 2;
    const midY = (sy + ty) / 2;

    return (
      <g key={edge.id} style={{ cursor: 'pointer' }}>
        <path
          d={path}
          fill="none"
          stroke="transparent"
          strokeWidth={16}
          onClick={() => store.setSelectedEdge(edge.id)}
          onMouseEnter={() => setHoveredEdgeId(edge.id)}
          onMouseLeave={() => setHoveredEdgeId(null)}
        />
        <path
          d={path}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          opacity={opacity}
          markerEnd={isInPath && !store.simulationRunning && store.simulationResult ? 'url(#arrow-green)' : 'url(#arrow)'}
          className="transition-all duration-300"
        />
        {(isHovered || isSelected) && (
          <foreignObject x={midX - 70} y={midY - 14} width={140} height={28}>
            <div
              className="bg-[#16213e] border border-[#e94560]/50 rounded px-2 py-1 text-[10px] text-white flex items-center justify-center shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              {edge.condition.type === 'has_item'
                ? `📦 持有: ${edge.condition.itemName || '道具'}`
                : `📖 条件: 已阅读前序`}
            </div>
          </foreignObject>
        )}
      </g>
    );
  };

  const renderConnectingLine = () => {
    if (!connecting) return null;
    const sourceNode = store.nodes.find((n) => n.id === connecting.sourceId);
    if (!sourceNode) return null;

    const sx = sourceNode.position.x + NODE_WIDTH;
    const sy = sourceNode.position.y + NODE_HEIGHT / 2;
    const dx = connecting.mouseX - sx;
    const controlOffset = Math.min(Math.abs(dx) * 0.5, 100);
    const path = `M ${sx} ${sy} C ${sx + controlOffset} ${sy}, ${connecting.mouseX - controlOffset} ${connecting.mouseY}, ${connecting.mouseX} ${connecting.mouseY}`;

    return (
      <path
        d={path}
        fill="none"
        stroke="#e94560"
        strokeWidth={2}
        strokeDasharray="6,4"
        className="pointer-events-none"
        opacity={0.8}
      />
    );
  };

  const getNodeDiffType = (nodeId: string) => {
    if (store.versionDiff?.addedNodes.includes(nodeId)) return 'added';
    if (store.versionDiff?.removedNodes.includes(nodeId)) return 'removed';
    if (store.versionDiff?.modifiedNodes.includes(nodeId)) return 'modified';
    return null;
  };

  return (
    <div
      ref={canvasRef}
      className="relative flex-1 overflow-auto grid-bg"
      onClick={handleCanvasClick}
      onDoubleClick={handleCanvasDoubleClick}
    >
      <div className="relative" style={{ minWidth: '3000px', minHeight: '2000px' }}>
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 5 }}
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#0f3460" />
            </marker>
            <marker
              id="arrow-green"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#4ade80" />
            </marker>
          </defs>
          <g className="pointer-events-auto">
            {store.edges.map(renderEdge)}
            {renderConnectingLine()}
          </g>
        </svg>

        {store.nodes.map((node) => (
          <NodeCard
            key={node.id}
            node={node}
            isSelected={store.selectedNodeId === node.id}
            isSimActive={store.simulationCurrentNodeId === node.id}
            isInPath={store.simulationPath.includes(node.id)}
            isSimulating={store.simulationRunning || store.simulationPath.length > 0}
            diffType={getNodeDiffType(node.id)}
            onStartDrag={handleStartDrag}
            onStartConnect={handleStartConnect}
            onClick={onNodeClick}
            onDelete={store.deleteNode}
            onSimClick={store.advanceSimulation}
          />
        ))}

        {store.collaborators.map((c) => (
          <div
            key={c.userId}
            className="absolute pointer-events-none z-50 transition-all duration-150"
            style={{
              left: c.x,
              top: c.y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div
              className="w-3 h-3 rounded-full shadow-lg animate-pulse"
              style={{
                backgroundColor: c.color,
                boxShadow: `0 0 8px ${c.color}`,
              }}
            />
            <div
              className="absolute left-4 top-0 px-2 py-0.5 rounded text-[10px] whitespace-nowrap text-white font-medium"
              style={{ backgroundColor: c.color }}
            >
              {c.userName}
            </div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-4 left-4 text-[11px] text-slate-500 bg-[#16213e]/80 px-3 py-2 rounded border border-white/5">
        💡 双击空白处创建节点 · 拖拽右侧圆点创建连线 · 拖动节点调整位置
      </div>
    </div>
  );
};

export default EditorCanvas;
