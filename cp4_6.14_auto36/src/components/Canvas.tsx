import { useRef, useEffect, useCallback, useState } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
} from 'd3-force';
import type { SimulationLinkDatum } from 'd3-force';
import { useAppStore, getNodeSize } from '@/store/useAppStore';
import type { WireframeEdge, SimNode } from '@/data/sampleData';

interface NodePositions {
  [id: string]: { x: number; y: number };
}

export default function Canvas() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<ReturnType<typeof forceSimulation<SimNode>> | null>(null);
  const animFrameRef = useRef<number>(0);
  const isDraggingNodeRef = useRef(false);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const transformStartRef = useRef({ x: 0, y: 0 });

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

  const initializeSimulation = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const simNodes: SimNode[] = nodes.map((n, i) => ({
      id: n.id,
      title: n.title,
      thumbnail: n.thumbnail,
      referenceCount: n.referenceCount,
      color: n.color,
      x: width / 2 + (Math.random() - 0.5) * 300,
      y: height / 2 + (Math.random() - 0.5) * 300,
    }));

    const simLinks = edges.map((e) => ({
      source: e.source,
      target: e.target,
    }));

    const simulation = forceSimulation<SimNode>(simNodes)
      .force(
        'link',
        forceLink<SimNode, SimulationLinkDatum<SimNode>>(simLinks)
          .id((d) => d.id)
          .distance(160)
      )
      .force('charge', forceManyBody().strength(-400))
      .force('center', forceCenter(width / 2, height / 2))
      .force('collide', forceCollide<SimNode>().radius((d) => getNodeSize(d.referenceCount) / 2 + 20))
      .alphaDecay(0.02)
      .on('tick', () => {
        const positions: NodePositions = {};
        simNodes.forEach((n) => {
          positions[n.id] = { x: n.x, y: n.y };
        });
        setNodePositions(positions);
      });

    simulationRef.current = simulation;
    return { simNodes, simulation };
  }, [nodes, edges]);

  useEffect(() => {
    const result = initializeSimulation();
    if (!result) return;
    const { simulation } = result;

    return () => {
      simulation.stop();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [initializeSimulation]);

  useEffect(() => {
    if (!selectedNodeId || !containerRef.current || !simulationRef.current) return;
    const node = nodes.find((n) => n.id === selectedNodeId);
    if (!node) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    const pos = nodePositions[selectedNodeId];
    if (!pos) return;

    const k = canvasTransform.k;
    const targetX = width / 2 - pos.x * k;
    const targetY = height / 2 - pos.y * k;

    const startX = canvasTransform.x;
    const startY = canvasTransform.y;
    const startTime = performance.now();
    const duration = 600;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      const newX = startX + (targetX - startX) * ease;
      const newY = startY + (targetY - startY) * ease;
      setCanvasTransform({ x: newX, y: newY, k });
      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };
    animFrameRef.current = requestAnimationFrame(animate);
  }, [selectedNodeId]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const scaleFactor = e.deltaY > 0 ? 0.92 : 1.08;
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

      const simNodes = sim.nodes() as SimNode[];
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

      const onMove = (ev: MouseEvent) => {
        if (!isDraggingNodeRef.current) return;
        const k = canvasTransform.k;
        if (simNode) {
          simNode.fx = origX + (ev.clientX - startX) / k;
          simNode.fy = origY + (ev.clientY - startY) / k;
          setNodePositions((prev) => ({
            ...prev,
            [nodeId]: { x: simNode.fx!, y: simNode.fy! },
          }));
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

  const { x: tx, y: ty, k } = canvasTransform;

  const renderEdges = () => {
    return edges.map((edge, i) => {
      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source;
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target;
      const sourcePos = nodePositions[sourceId];
      const targetPos = nodePositions[targetId];
      if (!sourcePos || !targetPos) return null;

      const sourceNode = nodes.find((n) => n.id === sourceId);
      const targetNode = nodes.find((n) => n.id === targetId);
      if (!sourceNode || !targetNode) return null;

      const sourceSize = getNodeSize(sourceNode.referenceCount) / 2;
      const targetSize = getNodeSize(targetNode.referenceCount) / 2;

      const dx = targetPos.x - sourcePos.x;
      const dy = targetPos.y - sourcePos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist === 0) return null;

      const nx = dx / dist;
      const ny = dy / dist;

      const startX = sourcePos.x + nx * (sourceSize + 4);
      const startY = sourcePos.y + ny * (sourceSize + 4);
      const endX = targetPos.x - nx * (targetSize + 8);
      const endY = targetPos.y - ny * (targetSize + 8);

      const gradId = `grad-${sourceId}-${targetId}-${i}`;

      return (
        <g key={`edge-${i}`}>
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={sourceNode.color} stopOpacity="0.6" />
              <stop offset="100%" stopColor={targetNode.color} stopOpacity="0.6" />
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
            points={`${endX},${endY} ${endX - nx * 8 - ny * 5},${endY - ny * 8 + nx * 5} ${endX - nx * 8 + ny * 5},${endY - ny * 8 - nx * 5}`}
            fill={targetNode.color}
            opacity="0.6"
          />
        </g>
      );
    });
  };

  const renderNodes = () => {
    return nodes.map((node) => {
      const pos = nodePositions[node.id];
      if (!pos) return null;
      const size = getNodeSize(node.referenceCount);
      const isSelected = selectedNodeId === node.id;
      const isHovered = hoveredNodeId === node.id;

      return (
        <g
          key={node.id}
          data-node-id={node.id}
          transform={`translate(${pos.x}, ${pos.y})`}
          onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
          onDoubleClick={() => handleNodeDoubleClick(node.id)}
          onMouseEnter={(e) => handleNodeMouseEnter(node.id, e)}
          onMouseLeave={handleNodeMouseLeave}
          onClick={() => selectNode(node.id)}
          style={{
            cursor: 'grab',
            transition: isDraggingNodeRef.current ? 'none' : 'transform 0.3s ease-out, filter 0.3s ease-out',
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
                ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))'
                : isSelected
                ? 'drop-shadow(0 0 8px rgba(245,158,11,0.5))'
                : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
            }}
          />
          <clipPath id={`clip-${node.id}`}>
            <circle r={size / 2 - 3} />
          </clipPath>
          <image
            href={node.thumbnail}
            x={-size / 2 + 3}
            y={-size / 2 + 3}
            width={size - 6}
            height={size - 6}
            clipPath={`url(#clip-${node.id})`}
            preserveAspectRatio="xMidYMid slice"
            opacity={0.85}
          />
          <text
            y={size / 2 + 14}
            textAnchor="middle"
            fontSize={11}
            fontWeight={500}
            fill="#374151"
            style={{ fontFamily: "'Noto Sans SC', sans-serif", pointerEvents: 'none' }}
          >
            {node.title}
          </text>
        </g>
      );
    });
  };

  const hoveredNode = hoveredNodeId ? nodes.find((n) => n.id === hoveredNodeId) : null;

  return (
    <div
      ref={containerRef}
      className="relative flex-1 h-full overflow-hidden"
      style={{ background: '#F5F7FA' }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ cursor: isPanningRef.current ? 'grabbing' : 'grab' }}
      >
        <g transform={`translate(${tx},${ty}) scale(${k})`}>
          {renderEdges()}
          {renderNodes()}
        </g>
      </svg>

      {hoveredNode && (
        <div
          className="absolute pointer-events-none z-50"
          style={{
            left: hoverPos.x + 16,
            top: hoverPos.y - 10,
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <div
            className="bg-white text-gray-800 px-3 py-2 rounded-lg shadow-lg border border-gray-100"
            style={{
              fontSize: 12,
              minWidth: 120,
              fontFamily: "'Noto Sans SC', sans-serif",
            }}
          >
            <div className="font-semibold text-sm">{hoveredNode.title}</div>
            <div className="text-gray-500 text-xs mt-0.5">
              被引用 {hoveredNode.referenceCount} 次
            </div>
          </div>
        </div>
      )}

      <div className="canvas-edge-mask">
        <div className="canvas-edge-mask-top absolute" />
        <div className="canvas-edge-mask-bottom absolute" />
        <div className="canvas-edge-mask-left absolute" />
        <div className="canvas-edge-mask-right absolute" />
      </div>
    </div>
  );
}
