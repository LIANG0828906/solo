import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
} from 'd3-force';
import { useAnalysisStore } from '../store/useAnalysisStore';

interface NodeData {
  id: string;
  name: string;
  color: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

interface LinkData {
  source: string;
  target: string;
  type: string;
  description: string;
  thickness: number;
}

const relationColors: Record<string, string> = {
  ally: '#2ECC71',
  enemy: '#E74C3C',
  lover: '#F1C40F',
  stranger: '#95A5A6',
};

const relationLabels: Record<string, string> = {
  ally: '盟友',
  enemy: '敌人',
  lover: '恋人',
  stranger: '陌生人',
};

export const CharacterGraph: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { characters, relations, conflictData } = useAnalysisStore();
  const [dimensions, setDimensions] = useState({ width: 600, height: 500 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [links, setLinks] = useState<LinkData[]>([]);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const simulationRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      const updateSize = () => {
        if (containerRef.current) {
          setDimensions({
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight,
          });
        }
      };
      updateSize();
      const observer = new ResizeObserver(updateSize);
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
  }, []);

  const getConflictCount = useCallback(
    (char1Id: string, char2Id: string): number => {
      const pairKey = [char1Id, char2Id].sort().join('-');
      const data = conflictData.find((c) => c.pairKey === pairKey);
      return data?.totalCount || 0;
    },
    [conflictData]
  );

  useEffect(() => {
    const newNodes: NodeData[] = characters.map((c, i) => ({
      id: c.id,
      name: c.name,
      color: c.avatarColor,
      x: 300 + Math.cos((i / characters.length) * Math.PI * 2) * 100,
      y: 250 + Math.sin((i / characters.length) * Math.PI * 2) * 100,
    }));

    const newLinks: LinkData[] = relations.map((r) => {
      const conflictCount = getConflictCount(r.characterId1, r.characterId2);
      return {
        source: r.characterId1,
        target: r.characterId2,
        type: r.type,
        description: r.description,
        thickness: Math.max(1.5, conflictCount * 0.5 + 1.5),
      };
    });

    setNodes(newNodes);
    setLinks(newLinks);
  }, [characters, relations, getConflictCount]);

  useEffect(() => {
    if (nodes.length === 0 || dimensions.width === 0) return;

    const nodesCopy = nodes.map((n) => ({ ...n }));
    const linksCopy = links.map((l) => ({ ...l }));

    const sim = forceSimulation<NodeData>(nodesCopy)
      .force(
        'link',
        forceLink<NodeData, any>(linksCopy)
          .id((d: any) => d.id)
          .distance(120)
          .strength(0.6)
      )
      .force('charge', forceManyBody().strength(-300))
      .force('center', forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collision', forceCollide().radius(50))
      .alphaDecay(0.02)
      .on('tick', () => {
        setNodes([...sim.nodes()]);
      });

    simulationRef.current = sim;

    return () => {
      sim.stop();
    };
  }, [nodes.length, links.length, dimensions]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.max(0.3, Math.min(3, z * delta)));
  };

  const getSvgPoint = (clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - offset.x) / zoom,
      y: (clientY - rect.top - offset.y) / zoom,
    };
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setDraggingNodeId(nodeId);
    const point = getSvgPoint(e.clientX, e.clientY);

    if (simulationRef.current) {
      simulationRef.current.alphaTarget(0.3).restart();
      const node = simulationRef.current.nodes().find((n: NodeData) => n.id === nodeId);
      if (node) {
        node.fx = point.x;
        node.fy = point.y;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }

    if (draggingNodeId && simulationRef.current) {
      const point = getSvgPoint(e.clientX, e.clientY);
      const node = simulationRef.current
        .nodes()
        .find((n: NodeData) => n.id === draggingNodeId);
      if (node) {
        node.fx = point.x;
        node.fy = point.y;
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);

    if (draggingNodeId && simulationRef.current) {
      const node = simulationRef.current
        .nodes()
        .find((n: NodeData) => n.id === draggingNodeId);
      if (node) {
        node.fx = null;
        node.fy = null;
      }
      simulationRef.current.alphaTarget(0);
      setDraggingNodeId(null);
    }
  };

  const handleSvgMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && e.target === svgRef.current) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleLinkHover = (e: React.MouseEvent, link: LinkData, isEnter: boolean) => {
    if (isEnter) {
      setHoveredLink(`${link.source}-${link.target}`);
      setHoverPos({ x: e.clientX, y: e.clientY });
    } else {
      setHoveredLink(null);
    }
  };

  const hoveredRelation = hoveredLink
    ? relations.find(
        (r) =>
          `${r.characterId1}-${r.characterId2}` === hoveredLink ||
          `${r.characterId2}-${r.characterId1}` === hoveredLink
      )
    : null;

  const nodeMap = useMemo(() => {
    const map = new Map<string, NodeData>();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        position: 'relative',
        backgroundColor: '#ECF0F1',
        backgroundImage:
          'linear-gradient(#BDC3C7 1px, transparent 1px), linear-gradient(90deg, #BDC3C7 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        borderRadius: '12px',
        overflow: 'hidden',
        minHeight: '400px',
      }}
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
        onMouseDown={handleSvgMouseDown}
      >
        <g
          className="graph-content"
          transform={`translate(${offset.x}, ${offset.y}) scale(${zoom})`}
        >
          {links.map((link, i) => {
            const source = nodeMap.get(link.source);
            const target = nodeMap.get(link.target);
            if (!source || !target || source.x === undefined || target.x === undefined)
              return null;
            const isHovered =
              hoveredLink === `${link.source}-${link.target}` ||
              hoveredLink === `${link.target}-${link.source}`;
            return (
              <line
                key={`link-${i}`}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke={relationColors[link.type]}
                strokeWidth={isHovered ? link.thickness + 2 : link.thickness}
                strokeLinecap="round"
                style={{ cursor: 'pointer', opacity: isHovered ? 1 : 0.8 }}
                onMouseEnter={(e) => handleLinkHover(e, link, true)}
                onMouseLeave={(e) => handleLinkHover(e, link, false)}
              />
            );
          })}
          {nodes.map((node) => (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              style={{ cursor: draggingNodeId === node.id ? 'grabbing' : 'grab' }}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
            >
              <circle r={20} fill={node.color} stroke="#2C3E50" strokeWidth={2} />
              <text
                textAnchor="middle"
                dy={35}
                fontSize={12}
                fill="#2C3E50"
                fontWeight={500}
                style={{ pointerEvents: 'none' }}
              >
                {node.name}
              </text>
            </g>
          ))}
        </g>
      </svg>

      {hoveredRelation && (
        <div
          style={{
            position: 'fixed',
            left: hoverPos.x + 12,
            top: hoverPos.y + 12,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            color: 'white',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '12px',
            pointerEvents: 'none',
            zIndex: 100,
            maxWidth: '200px',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>
            {relationLabels[hoveredRelation.type]}
          </div>
          <div style={{ color: '#BDC3C7', fontSize: '11px' }}>
            {hoveredRelation.description}
          </div>
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          right: '16px',
          top: '16px',
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: '#2C3E50' }}
        >
          图例
        </div>
        {Object.entries(relationLabels).map(([type, label]) => (
          <div
            key={type}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}
          >
            <div
              style={{
                width: '20px',
                height: '3px',
                backgroundColor: relationColors[type],
                borderRadius: '2px',
              }}
            />
            <span style={{ fontSize: '11px', color: '#7F8C8D' }}>{label}</span>
          </div>
        ))}
        <div style={{ marginTop: '8px', fontSize: '10px', color: '#95A5A6' }}>
          滚轮缩放 · 拖拽移动
        </div>
      </div>
    </div>
  );
};
