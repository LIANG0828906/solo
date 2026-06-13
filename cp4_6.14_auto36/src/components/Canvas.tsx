import { useRef, useEffect, useCallback, useState, useMemo, memo } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
} from 'd3-force';
import type { SimulationNodeDatum, Simulation, SimulationLinkDatum } from 'd3-force';
import { useAppStore, getNodeSize } from '@/store/useAppStore';
import type { WireframeNode, WireframeEdge } from '@/data/sampleData';

interface SimNode extends SimulationNodeDatum {
  id: string;
  index?: number;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  source: string | SimNode;
  target: string | SimNode;
}

interface NodePositions {
  [id: string]: { x: number; y: number };
}

interface NodeProps {
  node: WireframeNode;
  x: number;
  y: number;
  size: number;
  isSelected: boolean;
  isHovered: boolean;
  onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onDoubleClick: (nodeId: string) => void;
  onMouseEnter: (nodeId: string, e: React.MouseEvent) => void;
  onMouseLeave: () => void;
  onClick: (nodeId: string) => void;
}

const GraphNode = memo(function GraphNode({
  node,
  x,
  y,
  size,
  isSelected,
  isHovered,
  onMouseDown,
  onDoubleClick,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: NodeProps) {
  const scale = isHovered ? 1.15 : 1;

  return (
    <g
      data-node-id={node.id}
      transform={`translate(${x}, ${y}) scale(${scale})`}
      onMouseDown={(e) => onMouseDown(e, node.id)}
      onDoubleClick={() => onDoubleClick(node.id)}
      onMouseEnter={(e) => onMouseEnter(node.id, e)}
      onMouseLeave={onMouseLeave}
      onClick={() => onClick(node.id)}
      style={{
        cursor: 'grab',
        transition: 'transform 0.3s ease-out',
      }}
    >
      <circle
        r={size / 2}
        fill="white"
        stroke={isSelected ? '#F59E0B' : node.color}
        strokeWidth={isSelected ? 3 : 2}
        className={isSelected ? 'node-breathe' : ''}
        style={{
          filter: isHovered
            ? 'drop-shadow(0 6px 16px rgba(0,0,0,0.25))'
            : isSelected
            ? 'drop-shadow(0 0 10px rgba(245,158,11,0.6))'
            : 'drop-shadow(0 2px 6px rgba(0,0,0,0.08))',
        }}
      />
      <defs>
        <clipPath id={`clip-${node.id}`}>
          <circle r={size / 2 - 3} />
        </clipPath>
      </defs>
      <image
        href={node.thumbnail}
        x={-size / 2 + 3}
        y={-size / 2 + 3}
        width={size - 6}
        height={size - 6}
        clipPath={`url(#clip-${node.id})`}
        preserveAspectRatio="xMidYMid slice"
        opacity={0.9}
      />
      <text
        y={size / 2 + 16}
        textAnchor="middle"
        fontSize={11}
        fontWeight={500}
        fill="#374151"
        style={{
          fontFamily: "'Noto Sans SC', sans-serif",
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {node.title}
      </text>
    </g>
  );
});

interface EdgeProps {
  sourceId: string;
  targetId: string;
  sourcePos: { x: number; y: number };
  targetPos: { x: number; y: number };
  sourceSize: number;
  targetSize: number;
  sourceColor: string;
  targetColor: string;
  index: number;
}

const GraphEdge = memo(function GraphEdge({
  sourceId,
  targetId,
  sourcePos,
  targetPos,
  sourceSize,
  targetSize,
  sourceColor,
  targetColor,
  index,
}: EdgeProps) {
  const dx = targetPos.x - sourcePos.x;
  const dy = targetPos.y - sourcePos.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 1) return null;

  const nx = dx / dist;
  const ny = dy / dist;

  const startX = sourcePos.x + nx * (sourceSize / 2 + 2);
  const startY = sourcePos.y + ny * (sourceSize / 2 + 2);
  const endX = targetPos.x - nx * (targetSize / 2 + 8);
  const endY = targetPos.y - ny * (targetSize / 2 + 8);

  const arrowSize = 7;
  const arrowLeftX = endX - nx * arrowSize - ny * 4;
  const arrowLeftY = endY - ny * arrowSize + nx * 4;
  const arrowRightX = endX - nx * arrowSize + ny * 4;
  const arrowRightY = endY - ny * arrowSize - nx * 4;

  const gradId = `edge-grad-${sourceId}-${targetId}-${index}`;

  return (
    <g>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={sourceColor} stopOpacity="0.5" />
          <stop offset="100%" stopColor={targetColor} stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <line
        x1={startX}
        y1={startY}
        x2={endX}
        y2={endY}
        stroke={`url(#${gradId})`}
        strokeWidth={2}
      />
      <polygon
        points={`${endX},${endY} ${arrowLeftX},${arrowLeftY} ${arrowRightX},${arrowRightY}`}
        fill={targetColor}
        opacity="0.55"
      />
    </g>
  );
});

export default function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<Simulation<SimNode, SimLink> | null>(null);
  const simNodesRef = useRef<SimNode[]>([]);
  const animFrameRef = useRef<number>(0);
  const isDraggingNodeRef = useRef(false);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const transformStartRef = useRef({ x: 0, y: 0 });
  const initializedRef = useRef(false);

  const nodes = useAppStore((s) => s.nodes);
  const edges = useAppStore((s) => s.edges);
  const selectedNodeId = useAppStore((s) => s.selectedNodeId);
  const selectNode = useAppStore((s) => s.selectNode);
  const openModal = useAppStore((s) => s.openModal);
  const setCanvasTransform = useAppStore((s) => s.setCanvasTransform);
  const canvasTransform = useAppStore((s) => s.canvasTransform);

  const [nodePositions, setNodePositions] = useState<NodePositions>({});
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  const nodeMap = useMemo(() => {
    const map = new Map<string, WireframeNode>();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  const initializeSimulation = useCallback(() => {
    const container = containerRef.current;
    if (!container || initializedRef.current) return;
    initializedRef.current = true;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const simNodes: SimNode[] = nodes.map((n) => {
      const angle = Math.random() * Math.PI * 2;
      const radius = 100 + Math.random() * 180;
      return {
        id: n.id,
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
      };
    });

    simNodesRef.current = simNodes;

    const simLinks: SimLink[] = edges.map((e) => ({
      source: e.source,
      target: e.target,
    }));

    const linkForce = forceLink<SimNode, SimLink>(simLinks)
      .id((d: SimNode) => d.id)
      .distance((d) => {
        const srcNode = nodeMap.get(typeof d.source === 'string' ? d.source : d.source.id);
        const tgtNode = nodeMap.get(typeof d.target === 'string' ? d.target : d.target.id);
        const srcRef = srcNode?.referenceCount ?? 2;
        const tgtRef = tgtNode?.referenceCount ?? 2;
        return 130 + (srcRef + tgtRef) * 8;
      })
      .strength((d) => {
        const srcNode = nodeMap.get(typeof d.source === 'string' ? d.source : d.source.id);
        const tgtNode = nodeMap.get(typeof d.target === 'string' ? d.target : d.target.id);
        const maxRef = Math.max(srcNode?.referenceCount ?? 1, tgtNode?.referenceCount ?? 1);
        return 0.4 + maxRef * 0.05;
      });

    const chargeForce = forceManyBody<SimNode>().strength((d) => {
      const node = nodeMap.get(d.id);
      const refCount = node?.referenceCount ?? 2;
      return -250 - refCount * 60;
    });

    const collideForce = forceCollide<SimNode>().radius((d) => {
      const node = nodeMap.get(d.id);
      const refCount = node?.referenceCount ?? 1;
      return getNodeSize(refCount) / 2 + 15;
    }).strength(0.8);

    const centerForce = forceCenter(width / 2, height / 2).strength(0.08);

    const simulation = forceSimulation<SimNode>(simNodes)
      .force('link', linkForce)
      .force('charge', chargeForce)
      .force('center', centerForce)
      .force('collide', collideForce)
      .alpha(1)
      .alphaDecay(0.025)
      .velocityDecay(0.4)
      .on('tick', () => {
        const positions: NodePositions = {};
        for (let i = 0; i < simNodes.length; i++) {
          const n = simNodes[i];
          positions[n.id] = { x: n.x, y: n.y };
        }
        setNodePositions(positions);
      });

    simulationRef.current = simulation;
    return { simNodes, simulation };
  }, [nodes, edges, nodeMap]);

  useEffect(() => {
    const result = initializeSimulation();
    if (!result) return;

    return () => {
      result.simulation.stop();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      initializedRef.current = false;
    };
  }, [initializeSimulation]);

  const focusNode = useCallback(
    (nodeId: string) => {
      if (!containerRef.current) return;
      const pos = nodePositions[nodeId];
      if (!pos) return;

      const container = containerRef.current;
      const width = container.clientWidth;
      const height = container.clientHeight;

      const targetScale = 1;
      const targetX = width / 2 - pos.x * targetScale;
      const targetY = height / 2 - pos.y * targetScale;

      const startX = canvasTransform.x;
      const startY = canvasTransform.y;
      const startK = canvasTransform.k;
      const startTime = performance.now();
      const duration = 600;

      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        const ease = t < 0.5
          ? 2 * t * t
          : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const newX = startX + (targetX - startX) * ease;
        const newY = startY + (targetY - startY) * ease;
        const newK = startK + (targetScale - startK) * ease;
        setCanvasTransform({ x: newX, y: newY, k: newK });
        if (t < 1) {
          animFrameRef.current = requestAnimationFrame(animate);
        }
      };
      animFrameRef.current = requestAnimationFrame(animate);
    },
    [nodePositions, canvasTransform, setCanvasTransform]
  );

  useEffect(() => {
    if (!selectedNodeId || !simulationRef.current) return;
    const timer = setTimeout(() => focusNode(selectedNodeId), 50);
    return () => clearTimeout(timer);
  }, [selectedNodeId, focusNode]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newK = Math.min(2.0, Math.max(0.3, canvasTransform.k * scaleFactor));

      const ratio = newK / canvasTransform.k;
      const newX = mouseX - (mouseX - canvasTransform.x) * ratio;
      const newY = mouseY - (mouseY - canvasTransform.y) * ratio;

      setCanvasTransform({ x: newX, y: newY, k: newK });
    },
    [canvasTransform, setCanvasTransform]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      const target = e.target as SVGElement;
      if (target.closest('[data-node-id]')) return;
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX, y: e.clientY };
      transformStartRef.current = { x: canvasTransform.x, y: canvasTransform.y };
    },
    [canvasTransform]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanningRef.current) {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        setCanvasTransform({
          x: transformStartRef.current.x + dx,
          y: transformStartRef.current.y + dy,
          k: canvasTransform.k,
        });
      }
      if (hoveredNodeId) {
        const container = containerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        setHoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
    },
    [canvasTransform, setCanvasTransform, hoveredNodeId]
  );

  const handleMouseUp = useCallback(() => {
    isPanningRef.current = false;
  }, []);

  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();
      isDraggingNodeRef.current = true;
      const sim = simulationRef.current;
      if (!sim) return;

      const simNodes = sim.nodes();
      const simNode = simNodes.find((n) => n.id === nodeId);
      if (simNode) {
        simNode.fx = simNode.x;
        simNode.fy = simNode.y;
        sim.alphaTarget(0.3).restart();
      }

      const startX = e.clientX;
      const startY = e.clientY;
      const origX = simNode?.fx ?? 0;
      const origY = simNode?.fy ?? 0;
      const k = canvasTransform.k;

      const onMove = (ev: MouseEvent) => {
        if (!isDraggingNodeRef.current) return;
        if (simNode) {
          simNode.fx = origX + (ev.clientX - startX) / k;
          simNode.fy = origY + (ev.clientY - startY) / k;
        }
      };

      const onUp = () => {
        isDraggingNodeRef.current = false;
        if (simNode) {
          simNode.fx = null;
          simNode.fy = null;
        }
        sim.alphaTarget(0);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [canvasTransform.k]
  );

  const handleNodeDoubleClick = useCallback(
    (nodeId: string) => {
      openModal(nodeId);
    },
    [openModal]
  );

  const handleNodeMouseEnter = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      setHoveredNodeId(nodeId);
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      setHoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    },
    []
  );

  const handleNodeMouseLeave = useCallback(() => {
    setHoveredNodeId(null);
  }, []);

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      selectNode(nodeId);
    },
    [selectNode]
  );

  const { x: tx, y: ty, k } = canvasTransform;

  const renderEdges = useMemo(() => {
    return edges.map((edge, i) => {
      const sourceId = edge.source;
      const targetId = edge.target;
      const sourcePos = nodePositions[sourceId];
      const targetPos = nodePositions[targetId];
      const sourceNode = nodeMap.get(sourceId);
      const targetNode = nodeMap.get(targetId);
      if (!sourcePos || !targetPos || !sourceNode || !targetNode) return null;

      const sourceSize = getNodeSize(sourceNode.referenceCount);
      const targetSize = getNodeSize(targetNode.referenceCount);

      return (
        <GraphEdge
          key={`edge-${sourceId}-${targetId}-${i}`}
          sourceId={sourceId}
          targetId={targetId}
          sourcePos={sourcePos}
          targetPos={targetPos}
          sourceSize={sourceSize}
          targetSize={targetSize}
          sourceColor={sourceNode.color}
          targetColor={targetNode.color}
          index={i}
        />
      );
    });
  }, [edges, nodePositions, nodeMap]);

  const renderNodes = useMemo(() => {
    return nodes.map((node) => {
      const pos = nodePositions[node.id];
      if (!pos) return null;
      const size = getNodeSize(node.referenceCount);
      const isSelected = selectedNodeId === node.id;
      const isHovered = hoveredNodeId === node.id;

      return (
        <GraphNode
          key={node.id}
          node={node}
          x={pos.x}
          y={pos.y}
          size={size}
          isSelected={isSelected}
          isHovered={isHovered}
          onMouseDown={handleNodeMouseDown}
          onDoubleClick={handleNodeDoubleClick}
          onMouseEnter={handleNodeMouseEnter}
          onMouseLeave={handleNodeMouseLeave}
          onClick={handleNodeClick}
        />
      );
    });
  }, [
    nodes,
    nodePositions,
    selectedNodeId,
    hoveredNodeId,
    handleNodeMouseDown,
    handleNodeDoubleClick,
    handleNodeMouseEnter,
    handleNodeMouseLeave,
    handleNodeClick,
  ]);

  const hoveredNode = hoveredNodeId ? nodeMap.get(hoveredNodeId) : null;

  return (
    <div
      ref={containerRef}
      className="relative flex-1 h-full overflow-hidden select-none"
      style={{ background: '#F5F7FA' }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg
        className="w-full h-full"
        style={{ cursor: isPanningRef.current ? 'grabbing' : 'grab' }}
      >
        <g transform={`translate(${tx},${ty}) scale(${k})`}>
          {renderEdges}
          {renderNodes}
        </g>
      </svg>

      {hoveredNode && (
        <div
          className="absolute pointer-events-none z-50"
          style={{
            left: hoverPos.x + 18,
            top: hoverPos.y - 8,
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <div
            className="bg-white text-gray-800 px-3.5 py-2.5 rounded-lg shadow-xl border border-gray-100"
            style={{
              fontSize: 12,
              minWidth: 130,
              fontFamily: "'Noto Sans SC', sans-serif",
            }}
          >
            <div className="font-semibold text-sm">{hoveredNode.title}</div>
            <div className="text-gray-500 text-xs mt-1">
              被引用 {hoveredNode.referenceCount} 次
            </div>
          </div>
        </div>
      )}

      <div className="canvas-edge-mask absolute inset-0 pointer-events-none">
        <div className="canvas-edge-mask-top absolute" />
        <div className="canvas-edge-mask-bottom absolute" />
        <div className="canvas-edge-mask-left absolute" />
        <div className="canvas-edge-mask-right absolute" />
      </div>

      <div
        className="absolute bottom-5 right-5 flex items-center gap-1.5 z-10"
        style={{
          background: 'rgba(255,255,255,0.9)',
          borderRadius: 10,
          padding: '6px 10px',
          fontSize: 11,
          color: '#6B7280',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <span>缩放: {Math.round(k * 100)}%</span>
      </div>
    </div>
  );
}
